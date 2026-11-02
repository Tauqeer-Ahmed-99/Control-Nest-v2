"""Sign exact JSON bytes with a private Ed25519 key kept outside the checkout."""
import argparse
import base64
import json
import re
import subprocess
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--key", type=Path, required=True)
parser.add_argument("--key-id", required=True)
parser.add_argument("--input", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
if not re.fullmatch(r"[\w-]{1,64}", args.key_id, flags=re.ASCII):
    raise ValueError("Invalid key identifier")
payload = args.input.read_bytes()
json.loads(payload)
if len(payload) > 49152:
    raise ValueError("Signed JSON exceeds the supported policy size")
with tempfile.TemporaryDirectory() as work:
    signature = Path(work) / "signature"
    subprocess.run(["openssl", "pkeyutl", "-sign", "-inkey", str(args.key), "-rawin", "-in", str(args.input), "-out", str(signature)], check=True, capture_output=True)
    args.output.write_text(json.dumps({"keyId": args.key_id, "payload": base64.b64encode(payload).decode(), "signature": base64.b64encode(signature.read_bytes()).decode()}, indent=2) + "\n")
