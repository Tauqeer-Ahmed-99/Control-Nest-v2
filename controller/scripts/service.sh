#!/usr/bin/env bash
set -euo pipefail

# Register and start AutoPi-Hub systemd service

if [[ -f /opt/control-nest/bootstrap/manager.py ]]; then
    sudo systemctl restart autopihub.service
    exit 0
fi

SERVICE_NAME="autopihub"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

USER_NAME=$(whoami)
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${PROJECT_DIR}/.venv"

# Validate project environment
if [[ ! -x "${VENV_DIR}/bin/fastapi" ]]; then
    echo "Error: FastAPI executable not found at ${VENV_DIR}/bin/fastapi"
    exit 1
fi

if [[ ! -f "${PROJECT_DIR}/server.py" ]]; then
    echo "Error: server.py not found"
    exit 1
fi

# Create systemd service
sudo tee "${SERVICE_FILE}" > /dev/null <<EOF
[Unit]
Description=AutoPi Hub Home Automation System
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${PROJECT_DIR}
ExecStart=${VENV_DIR}/bin/fastapi run server.py --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service on boot
sudo systemctl enable "${SERVICE_NAME}"

# Restart service with updated configuration
sudo systemctl restart "${SERVICE_NAME}"

# Display service status
sudo systemctl status "${SERVICE_NAME}" --no-pager
