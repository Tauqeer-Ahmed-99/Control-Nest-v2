#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="https://github.com/Tauqeer-Ahmed-99/Control-Nest-v2"
BRANCH="main"
INSTALL_DIR="${CONTROL_NEST_INSTALL_DIR:-${HOME}/Control-Nest-v2}"

# When this file is piped directly to bash, fetch the repository archive and
# start the copy of this script inside the downloaded repository.
if [[ "${BASH_SOURCE[0]:-}" != "$0" || ! -f "$0" ]]; then
    if [[ "${EUID}" -eq 0 ]]; then
        echo "Run this installer as your normal Raspberry Pi user; it uses sudo when needed." >&2
        exit 1
    fi

    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is required to download the Control Nest repository." >&2
        exit 1
    fi

    if ! command -v tar >/dev/null 2>&1; then
        echo "tar is required to unpack the Control Nest repository." >&2
        exit 1
    fi

    TEMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TEMP_DIR"' EXIT
    ARCHIVE_PATH="${TEMP_DIR}/control-nest.tar.gz"
    ARCHIVE_URL="${REPOSITORY}/archive/refs/heads/${BRANCH}.tar.gz"

    echo "Downloading Control Nest from GitHub (no git installation required)..."
    curl --fail --location --silent --show-error "$ARCHIVE_URL" --output "$ARCHIVE_PATH"
    tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR"

    SOURCE_DIR="${TEMP_DIR}/Control-Nest-v2-${BRANCH}"
    if [[ ! -f "${SOURCE_DIR}/controller/scripts/setup.sh" ]]; then
        echo "The downloaded archive does not contain the controller setup script." >&2
        exit 1
    fi

    mkdir -p "$INSTALL_DIR"
    cp -a "${SOURCE_DIR}/." "${INSTALL_DIR}/"

    echo "Repository downloaded to ${INSTALL_DIR}. Starting controller setup..."
    bash "${INSTALL_DIR}/controller/scripts/setup.sh"
    exit $?
fi

# Running from a local checkout: use this script's location, not the caller's
# working directory, so all setup scripts and requirements resolve correctly.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CONTROLLER_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "$CONTROLLER_DIR"

if [[ ! -f .env ]]; then
    echo "Missing ${CONTROLLER_DIR}/.env. Copy .env.example to .env, fill in the controller settings, and run setup again." >&2
    exit 1
fi

for script in clock.sh packages.sh stores.sh cloudflared.sh service.sh; do
    chmod +x "scripts/${script}"
    "scripts/${script}"
done

echo "Setup completed successfully."
