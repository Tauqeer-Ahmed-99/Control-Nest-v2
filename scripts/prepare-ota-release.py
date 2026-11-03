"""Prepare signed OTA artifacts from a clean, exact commit; never publishes."""
import argparse
import base64
import hashlib
import io
import json
import re
import shutil
import subprocess
import tarfile
import tempfile
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "controller/bootstrap"))
from key_config import validate_shipped_environment


def git(*arguments):
    return subprocess.check_output(["git", *arguments])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wheels", type=Path, required=True)
    parser.add_argument("--requirements-lock", type=Path, required=True)
    parser.add_argument("--architecture", choices=["aarch64", "armv7l"], required=True)
    parser.add_argument("--python", required=True, help="Exact Python minor, for example 3.13")
    parser.add_argument("--archive-url", required=True)
    parser.add_argument("--key", type=Path, required=True, help="Private Ed25519 key file outside the checkout")
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--android-apk", type=Path, required=True)
    parser.add_argument("--ios-ipa", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    repository = Path(git("rev-parse", "--show-toplevel").decode().strip()).resolve()
    if git("status", "--porcelain").strip():
        raise ValueError("Build release artifacts from a clean checkout")
    if args.out.resolve().is_relative_to(repository) or args.key.resolve().is_relative_to(repository):
        raise ValueError("Keep outputs and signing keys outside the checkout")
    version = git("show", "HEAD:controller/VERSION").decode().strip()
    if not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", version) or not re.fullmatch(r"3\.\d+", args.python) or not re.fullmatch(r"[\w-]{1,64}", args.key_id):
        raise ValueError("Invalid release metadata")
    for component in ("server", "mobile"):
        package = json.loads(git("show", f"HEAD:{component}/package.json"))
        lock = json.loads(git("show", f"HEAD:{component}/package-lock.json"))
        if package["version"] != version or lock["version"] != version or lock["packages"][""]["version"] != version:
            raise ValueError("Synchronize all release versions first")
    if json.loads(git("show", "HEAD:mobile/app.json"))["expo"]["version"] != version:
        raise ValueError("Synchronize Expo release metadata")
    from urllib.parse import urlparse
    url = urlparse(args.archive_url)
    if url.scheme != "https" or url.username or url.password:
        raise ValueError("Artifact URL must be credential-free HTTPS")
    requirements = args.requirements_lock.read_text()
    if not requirements.strip() or any(not re.fullmatch(r"[\w.-]+==[\w.+!-]+", line.strip()) for line in requirements.splitlines() if line.strip() and not line.startswith("#")):
        raise ValueError("Supply a fully pinned, target-resolved requirements.lock without URLs")
    wheels = list(args.wheels.glob("*.whl"))
    if not wheels or any(path.is_symlink() for path in wheels):
        raise ValueError("Supply the complete target-specific wheel bundle")
    args.out.mkdir(parents=True, exist_ok=False)
    commit = git("rev-parse", "HEAD").decode().strip()
    name = f"control-nest-{version}-linux-{args.architecture}-py{args.python}"
    archive = args.out / f"{name}.tar.gz"
    files = git("ls-tree", "-r", "--name-only", "HEAD").decode().splitlines()
    def safe(path):
        if path == "controller/.env":
            return True
        parts = Path(path).parts
        public_trust_root = len(parts) == 4 and parts[:3] in (("controller", "bootstrap", "trusted-release-keys"), ("controller", "bootstrap", "trusted-job-keys"))
        return not any(part in (".env", ".venv", "node_modules", "stores", "maintenance", "tests", "__pycache__") or part.startswith(".env.") or part.endswith((".key", ".pyc")) or (part.endswith(".pem") and not public_trust_root) for part in parts)
    total = 0
    def add(package, name, contents):
        nonlocal total
        if name == "controller/.env":
            validate_shipped_environment(contents)
        if name.endswith(".pem") and (not contents.startswith(b"-----BEGIN PUBLIC KEY-----") or b"PRIVATE KEY" in contents):
            raise ValueError("Only public trust roots may be included in release resources")
        member = tarfile.TarInfo(name)
        member.size, member.mode, member.mtime = len(contents), 0o644, 0
        package.addfile(member, io.BytesIO(contents))
        total += len(contents)
    with tarfile.open(archive, "w:gz") as package:
        for path in files:
            if path.startswith("controller/") and path != "controller/requirements.lock" and safe(path):
                add(package, path, git("show", f"HEAD:{path}"))
        add(package, "controller/requirements.lock", requirements.encode())
        for path in wheels:
            add(package, "wheels/" + path.name, path.read_bytes())
    manifest = {"version": version, "commit": commit, "archiveUrl": args.archive_url, "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "size": archive.stat().st_size,
                "unpackedSize": total, "os": "linux", "architecture": args.architecture, "python": args.python, "minUpdater": "1.0.0", "apiContract": 1, "dataSchema": 1, "rollback": "snapshot", "dependencies": "bundled-wheels"}
    payload = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
    with tempfile.TemporaryDirectory() as work:
        data, signature = Path(work) / "manifest", Path(work) / "signature"
        data.write_bytes(payload)
        subprocess.run(["openssl", "pkeyutl", "-sign", "-inkey", str(args.key), "-rawin", "-in", str(data), "-out", str(signature)], check=True, capture_output=True)
        envelope = {"keyId": args.key_id, "payload": base64.b64encode(payload).decode(), "signature": base64.b64encode(signature.read_bytes()).decode()}
    (args.out / f"{name}.manifest.json").write_text(json.dumps(envelope, indent=2) + "\n")
    catalog = {"version": version, "commit": commit, "githubUrl": f"https://github.com/Tauqeer-Ahmed-99/Control-Nest-v2/releases/tag/v{version}", "manifests": [envelope], "mobile": {}}
    for target, source in (("android", args.android_apk), ("ios", args.ios_ipa)):
        if source:
            destination = args.out / f"control-nest-{version}-{target}{source.suffix}"
            shutil.copyfile(source, destination)
            catalog["mobile"][target] = destination.name
    (args.out / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n")
    with tarfile.open(args.out / f"control-nest-{version}-server.tar.gz", "w:gz") as package:
        for path in files:
            if (path.startswith("server/") or path in ("docs/ota-operations.md", "docs/ota-updates-and-recovery.md")) and safe(path):
                add(package, path, git("show", f"HEAD:{path}"))
    (args.out / "INSTALL-AND-RECOVERY.md").write_bytes(git("show", "HEAD:docs/ota-operations.md"))
    (args.out / "SHA256SUMS").write_text("".join(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n" for path in sorted(args.out.iterdir()) if path.is_file()))
    print(f"Prepared {version} from {commit}. Verify on target hardware before publication.")


if __name__ == "__main__":
    main()
