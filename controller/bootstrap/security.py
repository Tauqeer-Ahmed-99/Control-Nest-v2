import base64
import hashlib
import json
import re
import subprocess
import tempfile
import time
from pathlib import Path
from key_config import validate_shipped_environment

VERSION = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


class MaintenanceError(Exception):
    def __init__(self, code, status=409):
        self.code, self.status = code, status
        super().__init__(code)


def version(value):
    if not isinstance(value, str) or not VERSION.fullmatch(value):
        raise MaintenanceError("UNSUPPORTED_TARGET")
    return tuple(map(int, value.split(".")))


def verify_envelope(envelope, key_directory):
    try:
        key_id = envelope["keyId"]
        if not re.fullmatch(r"[\w-]{1,64}", key_id, flags=re.ASCII):
            raise ValueError()
        payload = base64.b64decode(envelope["payload"], validate=True)
        signature = base64.b64decode(envelope["signature"], validate=True)
        if len(payload) > 65536 or len(signature) != 64:
            raise ValueError()
        key = Path(key_directory) / f"{key_id}.pem"
        public = subprocess.run(["openssl", "pkey", "-pubin", "-in", str(key), "-outform", "DER"], capture_output=True, timeout=10)
        if public.returncode or len(public.stdout) != 44 or not public.stdout.startswith(bytes.fromhex("302a300506032b6570032100")):
            raise ValueError()
        with tempfile.TemporaryDirectory() as directory:
            data, sig = Path(directory) / "payload", Path(directory) / "signature"
            data.write_bytes(payload)
            sig.write_bytes(signature)
            result = subprocess.run(["openssl", "pkeyutl", "-verify", "-pubin", "-inkey", str(key), "-rawin", "-in", str(data), "-sigfile", str(sig)], capture_output=True, timeout=10)
            if result.returncode:
                raise ValueError()
        return json.loads(payload), hashlib.sha256(payload).hexdigest()
    except (KeyError, ValueError, TypeError, OSError, subprocess.SubprocessError):
        raise MaintenanceError("SIGNATURE_INVALID", 403) from None


def trusted_time():
    # Refuse new authorizations without NTP synchronization. Existing recovery is local.
    result = subprocess.run(["timedatectl", "show", "--property=NTPSynchronized", "--value"], capture_output=True, text=True, timeout=5)
    if result.stdout.strip() != "yes" or time.time() < 1735689600:
        raise MaintenanceError("CLOCK_UNTRUSTED", 503)


def validate_archive(archive, destination, maximum):
    total = 0
    seen = set()
    for member in archive.getmembers():
        path = Path(member.name)
        target = (destination / path).resolve()
        if path.is_absolute() or ".." in path.parts or not target.is_relative_to(destination.resolve()) or member.name in seen:
            raise MaintenanceError("SIGNATURE_INVALID")
        if not (member.isfile() or member.isdir()) or member.name.split("/")[0] not in ("controller", "wheels"):
            raise MaintenanceError("SIGNATURE_INVALID")
        if any((part == ".env" and path.as_posix() != "controller/.env") or part in (".venv", "stores", "maintenance", "__pycache__") or part.startswith(".env.") for part in path.parts):
            raise MaintenanceError("SIGNATURE_INVALID")
        if path.as_posix() == "controller/.env":
            if not member.isfile() or member.size > 65536:
                raise MaintenanceError("SIGNATURE_INVALID")
            try:
                with archive.extractfile(member) as environment_file:
                    validate_shipped_environment(environment_file.read())
            except (TypeError, ValueError, UnicodeError, OSError):
                raise MaintenanceError("SIGNATURE_INVALID") from None
        seen.add(member.name)
        total += member.size
        if total > maximum or len(seen) > 30000:
            raise MaintenanceError("SIGNATURE_INVALID")
    for member in archive.getmembers():
        target = destination / member.name
        if member.isdir():
            target.mkdir(parents=True, exist_ok=True, mode=0o755)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(member) as source, target.open("xb") as output:
                import shutil
                shutil.copyfileobj(source, output)
            target.chmod(0o644)
