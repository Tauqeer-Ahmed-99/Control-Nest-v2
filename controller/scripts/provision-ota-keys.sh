#!/usr/bin/env bash
set -euo pipefail
controller_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ ${EUID} -eq 0 ]]; then
    python3 "${controller_dir}/bootstrap/provision_keys.py"
else
    sudo python3 "${controller_dir}/bootstrap/provision_keys.py"
fi
