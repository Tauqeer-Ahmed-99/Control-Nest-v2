#!/usr/bin/env bash
set -euo pipefail

SOURCE_PATH="${BASH_SOURCE[0]:-}"
TEMP_DIR=""

if [[ "${EUID}" -eq 0 ]]; then
    echo "Run the updater as your normal Raspberry Pi user; it uses sudo when needed." >&2
    exit 1
fi

if [[ -n "${SOURCE_PATH}" && -f "$(dirname -- "${SOURCE_PATH}")/common.sh" ]]; then
    SCRIPT_DIR="$(cd -- "$(dirname -- "${SOURCE_PATH}")" && pwd)"
    source "${SCRIPT_DIR}/common.sh"
else
    # A curl-piped updater has no adjacent helper file. Fetch the same helper
    # used by the installed scripts, then continue with the normal update flow.
    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is required to download the controller update helper." >&2
        exit 1
    fi

    TEMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TEMP_DIR"' EXIT
    COMMON_URL="https://raw.githubusercontent.com/Tauqeer-Ahmed-99/Control-Nest-v2/main/controller/scripts/common.sh"
    curl --fail --location --silent --show-error "${COMMON_URL}" --output "${TEMP_DIR}/common.sh"
    source "${TEMP_DIR}/common.sh"
fi

if ! sudo systemctl cat "${CN_SERVICE_NAME}" >/dev/null 2>&1; then
    echo "WARNING: No ${CN_SERVICE_NAME} controller service is installed. Run install.sh first; exiting." >&2
    exit 1
fi

if [[ -z "${TEMP_DIR}" ]]; then
    TEMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TEMP_DIR"' EXIT
fi

CONTROLLER_DIR="$(sudo systemctl show --property=WorkingDirectory --value "${CN_SERVICE_NAME}")"
if [[ -z "${CONTROLLER_DIR}" ]]; then
    echo "WARNING: ${CN_SERVICE_NAME} has no controller working directory. Run install.sh again; exiting." >&2
    exit 1
fi

VENV_PYTHON="${CONTROLLER_DIR}/.venv/bin/python"
if [[ ! -x "${VENV_PYTHON}" ]]; then
    echo "Python virtual environment not found at ${CONTROLLER_DIR}/.venv. Run install.sh first." >&2
    exit 1
fi

if [[ ! -f "${CONTROLLER_DIR}/server.py" ]]; then
    echo "Controller server.py not found at ${CONTROLLER_DIR}." >&2
    exit 1
fi

cn_download_repository "${TEMP_DIR}"
SOURCE_DIR="${CN_SOURCE_DIR}/controller"
if [[ ! -f "${SOURCE_DIR}/server.py" || ! -f "${SOURCE_DIR}/requirements.txt" ]]; then
    echo "The downloaded archive does not contain a complete controller." >&2
    exit 1
fi

echo "Updating Python dependencies..."
"${VENV_PYTHON}" -m pip install -r "${SOURCE_DIR}/requirements.txt"

echo "Updating controller files..."
# Overlay repository files while leaving the installed virtualenv and local
# runtime files that are not part of the archive in place.
cp -a "${SOURCE_DIR}/." "${CONTROLLER_DIR}/"

echo "Restarting ${CN_SERVICE_NAME}..."
sudo systemctl restart "${CN_SERVICE_NAME}"
if ! sudo systemctl is-active --quiet "${CN_SERVICE_NAME}"; then
    echo "${CN_SERVICE_NAME} did not become active after the update." >&2
    sudo systemctl status "${CN_SERVICE_NAME}" --no-pager || true
    exit 1
fi

sudo systemctl status "${CN_SERVICE_NAME}" --no-pager
echo "Controller update completed successfully."
