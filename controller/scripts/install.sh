#!/usr/bin/env bash
set -euo pipefail

SOURCE_PATH="${BASH_SOURCE[0]:-}"
if [[ -n "${SOURCE_PATH}" && -f "$(dirname -- "${SOURCE_PATH}")/common.sh" ]]; then
    SCRIPT_DIR="$(cd -- "$(dirname -- "${SOURCE_PATH}")" && pwd)"
    source "${SCRIPT_DIR}/common.sh"
else
    # A curl-piped installer has no adjacent helper file, so fetch the shared
    # settings and repository downloader before bootstrapping the full archive.
    if [[ "${EUID}" -eq 0 ]]; then
        echo "Run this installer as your normal Raspberry Pi user; it uses sudo when needed." >&2
        exit 1
    fi

    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is required to download the Control Nest installer helper." >&2
        exit 1
    fi

    TEMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TEMP_DIR"' EXIT
    COMMON_URL="https://raw.githubusercontent.com/Tauqeer-Ahmed-99/Control-Nest-v2/main/controller/scripts/common.sh"
    curl --fail --location --silent --show-error "${COMMON_URL}" --output "${TEMP_DIR}/common.sh"
    source "${TEMP_DIR}/common.sh"

    cn_download_repository "${TEMP_DIR}"
    if [[ ! -f "${CN_SOURCE_DIR}/controller/scripts/install.sh" ]]; then
        echo "The downloaded archive does not contain the controller installer." >&2
        exit 1
    fi

    mkdir -p "${CN_INSTALL_DIR}"
    if [[ -f "${CN_INSTALL_DIR}/controller/.env" ]]; then
        cp -p -- "${CN_INSTALL_DIR}/controller/.env" "${TEMP_DIR}/existing-controller.env"
    fi
    cp -a "${CN_SOURCE_DIR}/." "${CN_INSTALL_DIR}/"
    if [[ -f "${TEMP_DIR}/existing-controller.env" ]]; then
        cp -p -- "${TEMP_DIR}/existing-controller.env" "${CN_INSTALL_DIR}/controller/.env"
    fi

    echo "Repository downloaded to ${CN_INSTALL_DIR}. Starting controller installation..."
    bash "${CN_INSTALL_DIR}/controller/scripts/install.sh"
    exit $?
fi

# Running from an installed copy: resolve paths relative to this script rather
# than depending on the caller's working directory.
CONTROLLER_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${CONTROLLER_DIR}"

if [[ ! -f .env ]]; then
    echo "Missing ${CONTROLLER_DIR}/.env. Add the controller environment settings and run install again." >&2
    exit 1
fi

for script in clock.sh packages.sh stores.sh cloudflared.sh provision-ota-keys.sh service.sh; do
    chmod +x "scripts/${script}"
    "scripts/${script}"
done

echo "Installation completed. Create your house and controller on the website, then pair in the app."
echo "Or run: bash ${CONTROLLER_DIR}/scripts/setup.sh"
