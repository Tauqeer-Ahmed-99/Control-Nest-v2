"""Install public OTA trust roots from an owner-trusted bootstrap checkout."""
import hashlib
import os
import re
import subprocess
import tempfile
from pathlib import Path

from durable import sync_directory
from key_config import KEY_ENVIRONMENT, environment_key_maps, parse_environment


def install_bundled_keys(source: Path, configuration: Path = Path("/etc/control-nest"), settings=None):
    if os.geteuid() != 0:
        raise ValueError("Public trust roots require authenticated owner/root access")
    if settings is None:
        environment_file = source.parent / ".env"
        settings = parse_environment(environment_file.read_text(), KEY_ENVIRONMENT) if environment_file.exists() else {}
    configured_keys = environment_key_maps(settings)
    key_sets = {}
    for name in KEY_ENVIRONMENT.values():
        origin = source / name
        if configured_keys is not None:
            key_sets[name] = [(key_id, pem.encode("utf-8")) for key_id, pem in configured_keys[name].items()]
        else:
            if origin.is_symlink():
                raise ValueError("Symlinked trust directories are not supported")
            public_keys = sorted(origin.glob("*.pem"))
            if not public_keys:
                raise ValueError("Configure the OTA public keys in .env or bundle public PEM files")
            key_sets[name] = []
            for public_key in public_keys:
                if public_key.is_symlink():
                    raise ValueError("Symlinked public keys are not supported")
                key_sets[name].append((public_key.stem, public_key.read_bytes()))
    if configuration.is_symlink():
        raise ValueError("Inspect the configuration path before provisioning keys")
    configuration.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chown(configuration, 0, 0)
    configuration.chmod(0o700)
    installed = []
    for name, public_keys in key_sets.items():
        destination = configuration / name
        if destination.is_symlink():
            raise ValueError("Symlinked trust directories are not supported")
        destination.mkdir(mode=0o700, exist_ok=True)
        os.chown(destination, 0, 0)
        destination.chmod(0o700)
        for key_id, contents in public_keys:
            if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", key_id):
                raise ValueError("Invalid public key filename")
            if b"PRIVATE KEY" in contents or not contents.startswith(b"-----BEGIN PUBLIC KEY-----"):
                raise ValueError("Only public verification keys may be provisioned")
            result = subprocess.run(["openssl", "pkey", "-pubin", "-outform", "DER"], input=contents, capture_output=True, timeout=10, check=True)
            if len(result.stdout) != 44 or not result.stdout.startswith(bytes.fromhex("302a300506032b6570032100")):
                raise ValueError("An Ed25519 public key is required")
            target = destination / f"{key_id}.pem"
            if target.is_symlink() or (target.exists() and target.read_bytes() != contents):
                raise ValueError("Never replace an existing key ID; provision a new ID for rotation")
            descriptor, temporary = tempfile.mkstemp(dir=destination, prefix=".pending-")
            try:
                os.fchmod(descriptor, 0o644)
                with os.fdopen(descriptor, "wb") as stream:
                    stream.write(contents)
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, target)
                sync_directory(destination)
            finally:
                Path(temporary).unlink(missing_ok=True)
            installed.append((name, key_id, hashlib.sha256(result.stdout).hexdigest()))
    sync_directory(configuration)
    return installed


if __name__ == "__main__":
    for directory, key_id, fingerprint in install_bundled_keys(Path(__file__).resolve().parent):
        print(f"{directory}/{key_id}.pem SHA256 {fingerprint}")
