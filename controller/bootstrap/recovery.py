"""Authenticated SSH backup/restore. Requires age (AEAD) and owner privileges."""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path
from durable import exclusive, read_json, sync_directory, sync_tree, write_json
from engine import CONFIG, ROOT, RUNTIME, Engine


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=["backup", "restore", "restore-recorded"])
    parser.add_argument("file", nargs="?", type=Path)
    parser.add_argument("--replacement", action="store_true")
    parser.add_argument("--old-credentials-revoked", action="store_true")
    args = parser.parse_args()
    if os.geteuid() != 0 or not shutil.which("age"):
        raise ValueError("Run over authenticated SSH as root with age installed")
    engine = Engine()
    if args.operation == "restore-recorded":
        if engine.corrupt or not engine.record.get("snapshot"):
            raise ValueError("Restore a verified backup or repair the journal from a known owner backup first")
        subprocess.run(["systemctl", "stop", "autopihub.service", "autopihub-manager.service"], check=True)
        RUNTIME.mkdir(mode=0o755, parents=True, exist_ok=True)
        with exclusive(engine.state / "installation.lock"):
            engine.rollback("INTERRUPTED")
        if engine.record.get("phase") != "rolled_back":
            raise ValueError("Recorded restoration failed; maintenance remains available")
        subprocess.run(["systemctl", "start", "autopihub-manager.service", "autopihub.service"], check=True)
        return
    if not args.file:
        raise ValueError("An encrypted backup path is required")
    if args.file.resolve().is_relative_to(engine.storage) or args.file.resolve().is_relative_to(CONFIG) or args.file.resolve().is_relative_to(ROOT):
        raise ValueError("Keep encrypted backup files outside the installation and persistent storage")
    if args.operation == "backup":
        with exclusive(engine.state / "installation.lock"):
            if engine.corrupt or engine.record.get("phase") not in ("completed", "failed", "rolled_back"):
                raise ValueError("Complete or restore the current transaction before backing up")
            (RUNTIME / "paused").touch(mode=0o644)
            stopped = False
            try:
                engine.internal("POST", "/internal/maintenance/quiesce")
                engine.service("stop")
                stopped = True
                paths = [(engine.storage / "stores", "stores"), (engine.state, "maintenance"), (CONFIG, "config")]
                files = []
                for directory, prefix in paths:
                    for path in directory.rglob("*"):
                        if path.is_symlink():
                            raise ValueError("Symlinks are not permitted in backups")
                        if path.is_file() and path.name != "installation.lock":
                            files.append((path, f"{prefix}/{path.relative_to(directory).as_posix()}"))
                integrity = {name: hashlib.sha256(path.read_bytes()).hexdigest() for path, name in files}
                descriptor = os.open(args.file, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                with os.fdopen(descriptor, "wb") as output:
                    encrypt = subprocess.Popen(["age", "-p"], stdin=subprocess.PIPE, stdout=output)
                    try:
                        with tarfile.open(fileobj=encrypt.stdin, mode="w|gz") as archive:
                            for path, name in files:
                                archive.add(path, arcname=name, recursive=False)
                            import io
                            contents = json.dumps({"dataSchema": 1, "release": engine.record["selectedRelease"], "files": integrity}).encode()
                            member = tarfile.TarInfo("integrity.json")
                            member.size, member.mode = len(contents), 0o600
                            archive.addfile(member, io.BytesIO(contents))
                    finally:
                        encrypt.stdin.close()
                    if encrypt.wait() != 0:
                        raise ValueError("Encryption failed")
                    output.flush()
                    os.fsync(output.fileno())
                sync_directory(args.file.resolve().parent)
            finally:
                if stopped:
                    engine.service("start")
                    engine.readiness(engine.record["selectedRelease"], probation=5)
                engine.internal("POST", "/internal/maintenance/resume")
                (RUNTIME / "paused").unlink(missing_ok=True)
        print("Encrypted backup created. Copy it off-device and keep the passphrase separately.")
        return
    if args.replacement and not args.old_credentials_revoked:
        raise ValueError("Revoke the old controller key and tunnel before replacement restore")
    # Stop the helper before acquiring its lock. Restore occurs only under authenticated owner access.
    subprocess.run(["systemctl", "stop", "autopihub.service", "autopihub-manager.service", "autopihub-app.service"], check=True)
    with exclusive(engine.state / "installation.lock"), tempfile.TemporaryDirectory(dir=engine.state) as work:
        staged = Path(work)
        decrypt = subprocess.Popen(["age", "-d", str(args.file.resolve())], stdout=subprocess.PIPE)
        try:
            with tarfile.open(fileobj=decrypt.stdout, mode="r|gz") as archive:
                total, names = 0, set()
                for member in archive:
                    path = Path(member.name)
                    if path.is_absolute() or ".." in path.parts or member.name in names or not member.isfile() or path.parts[0] not in ("stores", "maintenance", "config", "integrity.json"):
                        raise ValueError("Invalid backup archive")
                    names.add(member.name)
                    total += member.size
                    if total > 20 * 1024 ** 3 or len(names) > 100000:
                        raise ValueError("Backup exceeds restore limits")
                    target = staged / path
                    target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
                    with archive.extractfile(member) as source, target.open("xb") as output:
                        shutil.copyfileobj(source, output)
                    target.chmod(0o600)
        finally:
            decrypt.stdout.close()
        if decrypt.wait() != 0:
            raise ValueError("Backup authentication failed")
        integrity = read_json(staged / "integrity.json")
        actual = {path.relative_to(staged).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in staged.rglob("*") if path.is_file() and path != staged / "integrity.json"}
        if not integrity or integrity["dataSchema"] != 1 or actual != integrity["files"]:
            raise ValueError("Backup integrity check failed")
        # Require the same release in its final location; never restore or move a virtual environment.
        if not (engine.release_path(integrity["release"]) / "controller/.venv/bin/python").exists():
            raise ValueError("Bootstrap the backed-up release at its final versioned path first")
        if args.replacement:
            for name in ("controller_metadata.json", "installation.json", "devices.json"):
                (staged / "stores" / name).unlink(missing_ok=True)
            write_json(staged / "maintenance/journal.json", {"selectedRelease": integrity["release"], "previousConfirmedRelease": None, "phase": "completed", "sequence": 0, "confirmed": True})
            # Device-bound history, cached policy and nonces cannot authorize the replacement.
            for name in ("jobs", "recovery", "snapshots"):
                shutil.rmtree(staged / "maintenance" / name)
                (staged / "maintenance" / name).mkdir(mode=0o700)
            (staged / "maintenance/policy.json").unlink(missing_ok=True)
        import pwd
        app = pwd.getpwnam("control-nest-app")
        for folder, _, files in os.walk(staged / "stores"):
            os.chown(folder, app.pw_uid, app.pw_gid)
            for name in files:
                os.chown(Path(folder) / name, app.pw_uid, app.pw_gid)
        write_json(engine.state / "restore-in-progress.json", {"release": integrity["release"]})
        # Boot recovery refuses to select an application until this restore is durable.
        for prefix, destination in (("stores", engine.storage / "stores"), ("config", CONFIG)):
            pending, previous = destination.with_name(destination.name + ".restore"), destination.with_name(destination.name + ".pre-restore")
            if pending.exists() or previous.exists():
                raise ValueError("An earlier restore needs owner inspection before retrying")
            shutil.copytree(staged / prefix, pending)
            if prefix == "stores":
                for folder, _, files in os.walk(pending):
                    os.chown(folder, app.pw_uid, app.pw_gid)
                    for name in files:
                        os.chown(Path(folder) / name, app.pw_uid, app.pw_gid)
            sync_tree(pending)
            os.replace(destination, previous)
            os.replace(pending, destination)
            sync_directory(destination.parent)
        # Keep the locked maintenance directory itself in place, including its open lock inode.
        for path in (staged / "maintenance").iterdir():
            destination = engine.state / path.name
            if path.is_dir():
                if destination.exists():
                    shutil.rmtree(destination)
                shutil.copytree(path, destination)
            elif path.name != "installation.lock":
                shutil.copyfile(path, destination)
                destination.chmod(0o600)
        sync_tree(engine.state)
        (engine.state / "restore-in-progress.json").unlink()
        sync_directory(engine.state)
    print("Restore staged. Inspect private configuration, then start autopihub-manager and autopihub. Replacement hardware must be paired with a new controller key.")


if __name__ == "__main__":
    main()
