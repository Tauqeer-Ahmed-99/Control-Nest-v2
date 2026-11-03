"""Public controller defaults and OTA trust roots carried in the shipped .env."""
import base64
import json
import re
from pathlib import PurePosixPath
from urllib.parse import urlparse

KEY_ENVIRONMENT = {
    "OTA_RELEASE_PUBLIC_KEYS": "trusted-release-keys",
    "OTA_JOB_PUBLIC_KEYS": "trusted-job-keys",
}
PUBLIC_ENVIRONMENT = {"SERVER_URL", "CLERK_JWT_KEY", "APP_PERSISTENT_STORAGE_PATH", *KEY_ENVIRONMENT}


def parse_environment(contents: str, names=None) -> dict[str, str]:
    """Read single-line public values without executing shell or variable expansions."""
    if len(contents.encode("utf-8")) > 65536:
        raise ValueError("Controller environment configuration is too large")
    values = {}
    decoder = json.JSONDecoder()
    for line in contents.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = re.fullmatch(r"\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=(.*)", line)
        if not match:
            if names is None:
                raise ValueError("Use one-line assignments for shipped public controller defaults")
            continue
        name, value = match.group(1), match.group(2).strip()
        if names is not None and name not in names:
            continue
        if name in values:
            raise ValueError("Duplicate controller environment variable")
        if value.startswith("'"):
            end = value.find("'", 1)
            if end < 0 or (value[end + 1:].strip() and not value[end + 1:].lstrip().startswith("#")):
                raise ValueError("Invalid quoted public controller environment value")
            value = value[1:end]
        elif value.startswith('"'):
            value, end = decoder.raw_decode(value)
            if not isinstance(value, str):
                raise ValueError("Public controller environment values must be strings")
            tail = match.group(2).strip()[end:].strip()
            if tail and not tail.startswith("#"):
                raise ValueError("Invalid quoted public controller environment value")
        else:
            value = re.split(r"\s+#", value, maxsplit=1)[0].strip()
        values[name] = value
    return values


def public_key_der(value: str, ed25519=False) -> bytes:
    if not isinstance(value, str) or len(value) > 16384:
        raise ValueError("A public PEM verification key is required")
    match = re.fullmatch(r"\s*-----BEGIN PUBLIC KEY-----\s*([A-Za-z0-9+/=\s]+?)\s*-----END PUBLIC KEY-----\s*", value)
    if not match:
        raise ValueError("Only public PEM verification keys may be shipped")
    der = base64.b64decode(re.sub(r"\s", "", match.group(1)), validate=True)
    if not der or der[0] != 0x30:
        raise ValueError("Invalid public PEM verification key")
    if ed25519 and (len(der) != 44 or not der.startswith(bytes.fromhex("302a300506032b6570032100"))):
        raise ValueError("OTA verification requires Ed25519 public keys")
    return der


def environment_key_maps(settings) -> dict[str, dict[str, str]] | None:
    present = [name for name in KEY_ENVIRONMENT if name in settings]
    if not present:
        return None  # Older installations can still use the bundled public PEM files.
    if len(present) != len(KEY_ENVIRONMENT):
        raise ValueError("Configure both OTA public-key maps in the controller environment")
    result = {}
    for name, directory in KEY_ENVIRONMENT.items():
        keys = json.loads(settings[name])
        if not isinstance(keys, dict) or not keys or len(keys) > 32:
            raise ValueError("An OTA public-key map must contain at least one key")
        for key_id, public_key in keys.items():
            if not isinstance(key_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", key_id):
                raise ValueError("Invalid OTA public-key identifier")
            public_key_der(public_key, ed25519=True)
        result[directory] = keys
    return result


def validate_shipped_environment(contents: bytes) -> dict[str, str]:
    settings = parse_environment(contents.decode("utf-8"))
    if set(settings) != PUBLIC_ENVIRONMENT:
        raise ValueError("The shipped controller .env may contain only the five public default settings")
    endpoint = urlparse(settings["SERVER_URL"])
    if endpoint.scheme != "https" or not endpoint.hostname or endpoint.username or endpoint.password or endpoint.query or endpoint.fragment:
        raise ValueError("The shipped controller server URL must be credential-free HTTPS")
    storage = settings["APP_PERSISTENT_STORAGE_PATH"]
    if not PurePosixPath(storage).is_absolute() or re.search(r"\s|%", storage):
        raise ValueError("Use an absolute controller persistent storage path")
    public_key_der(settings["CLERK_JWT_KEY"].replace("\\n", "\n"))
    environment_key_maps(settings)
    return settings
