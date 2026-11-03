#!/usr/bin/env bash
set -euo pipefail
controller_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ ${EUID} -eq 0 || ! -x "${controller_dir}/.venv/bin/python" ]]; then
    echo "Run as the installation owner after installing the prerequisites and virtual environment." >&2
    exit 1
fi
sudo -v
# Normalize dotenv without root. Private settings travel only through stdin.
"${controller_dir}/.venv/bin/python" -c 'import json,sys; from dotenv import dotenv_values; json.dump(dict(dotenv_values(sys.argv[1])),sys.stdout)' "${controller_dir}/.env" \
    | sudo -n python3 "${controller_dir}/bootstrap/install.py" "${controller_dir}"
