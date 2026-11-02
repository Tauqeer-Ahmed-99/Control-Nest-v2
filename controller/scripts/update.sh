#!/usr/bin/env bash
set -euo pipefail
if [[ ! -f /opt/control-nest/bootstrap/manager.py ]]; then
    echo "Bootstrap required. From the trusted controller checkout run: bash scripts/bootstrap.sh" >&2
    exit 1
fi
echo "Open Control Nest > Settings > Firmware updates as a house admin."
echo "Updates install exact signed releases. See docs/ota-operations.md for authenticated SSH recovery."
