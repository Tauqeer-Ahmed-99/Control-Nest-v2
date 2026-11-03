"""Explicit SSH bootstrap. Never invoked by an OTA request."""
import json
import os
import pwd
import re
import secrets
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from durable import read_json, sync_directory, sync_tree, write_json
from security import version
from provision_keys import install_bundled_keys


def command(*arguments):
    subprocess.run(arguments, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    if os.geteuid() != 0:
        raise ValueError("Root bootstrap privileges required")
    if sys.version_info < (3, 10):
        raise ValueError("Use supported Raspberry Pi OS with Python 3.10 or newer")
    source = Path(sys.argv[1]).resolve(strict=True)
    settings = json.load(sys.stdin)
    release = (source / "VERSION").read_text().strip()
    version(release)
    storage = Path(settings["APP_PERSISTENT_STORAGE_PATH"]).resolve()
    if not storage.is_absolute() or str(storage) in ("/", "/etc", "/opt", "/var", "/var/lib") or storage.is_relative_to("/opt/control-nest") or re.search(r"\s|%", str(storage)):
        raise ValueError("Use a dedicated persistent storage directory without whitespace")
    if not settings.get("SERVER_URL", "").startswith("https://") or not settings.get("CLERK_JWT_KEY"):
        raise ValueError("Configure HTTPS SERVER_URL and Clerk public verification key first")
    root, config = Path("/opt/control-nest"), Path("/etc/control-nest")
    if (root / "current").exists() or (storage / "maintenance/journal.json").exists():
        raise ValueError("Already bootstrapped; use the recovery procedure")
    for executable in ("openssl", "systemctl", "runuser", "cloudflared"):
        if not shutil.which(executable):
            raise ValueError("Missing prerequisite")
    if any(p.is_symlink() for p in (storage / "stores").rglob("*")):
        raise ValueError("Inspect symlinked persistent stores first")
    command("groupadd", "--force", "control-nest-maintenance")
    for user in ("control-nest-app", "control-nest-front", "control-nest-build"):
        try:
            pwd.getpwnam(user)
        except KeyError:
            command("useradd", "--system", "--user-group", "--no-create-home", "--shell", "/usr/sbin/nologin", user)
    command("usermod", "-aG", "control-nest-maintenance", "control-nest-front")
    command("usermod", "-aG", "control-nest-maintenance,gpio", "control-nest-app")
    target = root / "releases" / release
    if target.exists() or (root / "bootstrap").exists():
        raise ValueError("Inspect the existing incomplete bootstrap first")
    root.mkdir(parents=True, exist_ok=True)
    config.mkdir(mode=0o700, parents=True, exist_ok=True)
    storage.mkdir(mode=0o755, parents=True, exist_ok=True)
    (storage / "stores").mkdir(mode=0o700, exist_ok=True)
    identity = read_json(storage / "stores/installation.json", {})
    if identity.get("id"):
        uuid.UUID(identity["id"])
    else:
        write_json(storage / "stores/installation.json", {"id": str(uuid.uuid4())})
    for folder in ("maintenance", "maintenance/jobs", "maintenance/snapshots", "maintenance/recovery"):
        (storage / folder).mkdir(mode=0o700, exist_ok=True)
    for keys in ("trusted-release-keys", "trusted-job-keys"):
        (config / keys).mkdir(mode=0o700, exist_ok=True)
    install_bundled_keys(source / "bootstrap", config, settings)
    shutil.copytree(source, target / "controller", ignore=shutil.ignore_patterns(".env", ".env.*", ".venv", "__pycache__", ".git", "tests", "stores", "maintenance", "*.pyc"))
    shutil.copytree(source / "bootstrap", root / "bootstrap", ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    builder = pwd.getpwnam("control-nest-build")
    for folder, _, files in os.walk(target):
        os.chown(folder, builder.pw_uid, builder.pw_gid)
        for name in files:
            os.chown(Path(folder) / name, builder.pw_uid, builder.pw_gid)
    # Dependency installation may write only the frontend environment, never root helper code.
    for folder, _, files in os.walk(root / "bootstrap"):
        os.chown(folder, 0, 0)
        os.chmod(folder, 0o755)
        for name in files:
            protected_file = Path(folder) / name
            os.chown(protected_file, 0, 0)
            protected_file.chmod(0o644)
    bootstrap_environment = root / "bootstrap/.venv"
    bootstrap_environment.mkdir(mode=0o755)
    os.chown(bootstrap_environment, builder.pw_uid, builder.pw_gid)
    base = [shutil.which("runuser"), "-u", "control-nest-build", "--"]
    environment = {"PATH": "/usr/bin:/bin", "HOME": "/nonexistent"}
    def build(arguments):
        subprocess.run(base + arguments, env=environment, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    python = str(target / "controller/.venv/bin/python")
    build([sys.executable, "-m", "venv", str(target / "controller/.venv")])
    build([python, "-m", "pip", "install", "-r", str(target / "controller/requirements.txt")])
    build([sys.executable, "-m", "venv", str(root / "bootstrap/.venv")])
    build([str(root / "bootstrap/.venv/bin/python"), "-m", "pip", "install", "zeroconf==0.151.5"])
    for tree in (target, root / "bootstrap"):
        for folder, _, files in os.walk(tree):
            os.chown(folder, 0, 0)
            os.chmod(folder, 0o755)
            for name in files:
                file = Path(folder) / name
                if not file.is_symlink():
                    os.chown(file, 0, 0)
                    file.chmod(0o755 if file.stat().st_mode & 0o111 else 0o644)
    # Stop the old API before transferring persistent stores. Preserve its source and environment.
    subprocess.run(["systemctl", "stop", "autopihub.service"], check=True, capture_output=True)
    app = pwd.getpwnam("control-nest-app")
    for folder, _, files in os.walk(storage / "stores"):
        os.chown(folder, app.pw_uid, app.pw_gid)
        os.chmod(folder, 0o700)
        for name in files:
            file = Path(folder) / name
            os.chown(file, app.pw_uid, app.pw_gid)
            file.chmod(0o600)
    os.chown(storage, 0, 0)
    os.chmod(storage, 0o755)
    settings.update(CONTROL_NEST_SUPERVISED="1", CONTROL_NEST_INTERNAL_TOKEN=secrets.token_urlsafe(48), PYTHONDONTWRITEBYTECODE="1")
    def quoted(value):
        return str(value).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    content = "\n".join(f'{key}="{quoted(value)}"' for key, value in settings.items() if value is not None and re.fullmatch(r"[A-Z][A-Z0-9_]*", key)) + "\n"
    descriptor = os.open(config / "controller.env", os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as output:
        output.write(content)
        output.flush()
        os.fsync(output.fileno())
    sync_tree(target, allow_links=True)
    sync_tree(root / "bootstrap", allow_links=True)
    (root / "current").symlink_to(target)
    sync_directory(root)
    write_json(storage / "maintenance/journal.json", {"selectedRelease": release, "previousConfirmedRelease": None, "phase": "completed", "sequence": 0, "confirmed": True, "runningVersion": release})
    app_unit = f'''[Unit]
Description=Control Nest versioned application
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=3
[Service]
User=control-nest-app
SupplementaryGroups=gpio control-nest-maintenance
WorkingDirectory=/opt/control-nest/current/controller
EnvironmentFile=/etc/control-nest/controller.env
ExecStart=/opt/control-nest/current/controller/.venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8001
Restart=on-failure
RestartSec=3
TimeoutStopSec=30
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths={storage}/stores /run/control-nest
PrivateTmp=true
'''
    manager_unit = '''[Unit]
Description=Control Nest protected installation helper
After=network.target
[Service]
EnvironmentFile=/etc/control-nest/controller.env
RuntimeDirectory=control-nest
RuntimeDirectoryMode=0755
WorkingDirectory=/opt/control-nest/bootstrap
ExecStart=/usr/bin/python3 /opt/control-nest/bootstrap/manager.py
Restart=on-failure
RestartSec=3
TimeoutStopSec=45
[Install]
WantedBy=multi-user.target
'''
    front_unit = '''[Unit]
Description=Control Nest stable listener and discovery
Requires=autopihub-manager.service
After=autopihub-manager.service
[Service]
User=control-nest-front
SupplementaryGroups=control-nest-maintenance
WorkingDirectory=/opt/control-nest/bootstrap
ExecStart=/opt/control-nest/bootstrap/.venv/bin/python /opt/control-nest/bootstrap/frontend.py
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
[Install]
WantedBy=multi-user.target
'''
    tunnel_unit = f'''[Unit]
Description=Control Nest tunnel
After=network-online.target
[Service]
ExecStart={shutil.which("cloudflared")} tunnel --no-autoupdate run --token-file /etc/cloudflared/token
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
'''
    for name, content in {"autopihub-app": app_unit, "autopihub-manager": manager_unit, "autopihub": front_unit, "cloudflared": tunnel_unit}.items():
        Path(f"/etc/systemd/system/{name}.service").write_text(content)
    token = read_json(storage / "stores/controller_metadata.json", {}).get("tunnel", {}).get("token")
    if token:
        if len(token) > 8192 or not re.fullmatch(r"[A-Za-z0-9_=+/-]+", token):
            raise ValueError("Inspect the existing tunnel credential before migration")
        tunnel_directory = Path("/etc/cloudflared")
        tunnel_directory.mkdir(mode=0o700, exist_ok=True)
        descriptor = os.open(tunnel_directory / "token", os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w") as output:
            output.write(token)
            output.flush()
            os.fsync(output.fileno())
        sync_directory(tunnel_directory)
    command("systemctl", "daemon-reload")
    if token:
        command("systemctl", "enable", "cloudflared.service")
        command("systemctl", "restart", "cloudflared.service")
    command("systemctl", "enable", "autopihub-manager.service", "autopihub.service")
    command("systemctl", "start", "autopihub-manager.service", "autopihub.service")
    print("Bootstrap and public verification keys installed. Verify recovery before offering updates.")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("Bootstrap stopped. Inspect service state over SSH; original source and persistent stores are retained.", file=sys.stderr)
        raise SystemExit(1) from None
