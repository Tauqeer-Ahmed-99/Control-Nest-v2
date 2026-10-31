#!/usr/bin/env bash
set -euo pipefail
CONTROLLER_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${CONTROLLER_DIR}"
if [[ ! -x .venv/bin/python ]]; then
    echo "Install AutoPiHub first, then run this setup script again." >&2
    exit 1
fi
# Stop the service while replacing credentials and installation metadata.
sudo systemctl stop autopihub.service
trap 'sudo systemctl start autopihub.service' EXIT
.venv/bin/python setup.py </dev/tty
