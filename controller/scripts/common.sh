#!/usr/bin/env bash

# Shared controller repository settings and download helpers.
CN_REPOSITORY="Tauqeer-Ahmed-99/Control-Nest-v2"
CN_BRANCH="main"
CN_REPOSITORY_NAME="${CN_REPOSITORY##*/}"
CN_ARCHIVE_URL="https://github.com/${CN_REPOSITORY}/archive/refs/heads/${CN_BRANCH}.tar.gz"
CN_INSTALL_DIR="${CONTROL_NEST_INSTALL_DIR:-${HOME}/Control-Nest-v2}"
CN_SERVICE_NAME="autopihub"
CN_SOURCE_DIR=""

cn_require_download_tools() {
    if ! command -v curl >/dev/null 2>&1 || ! command -v tar >/dev/null 2>&1; then
        echo "curl and tar are required to download and unpack the Control Nest repository." >&2
        return 1
    fi
}

cn_download_repository() {
    local work_dir="${1:?A temporary working directory is required}"
    local archive_path="${work_dir}/control-nest.tar.gz"
    local extract_dir="${work_dir}/extracted"

    cn_require_download_tools
    mkdir -p "${extract_dir}"

    echo "Downloading Control Nest from GitHub..." >&2
    curl --fail --location --silent --show-error "${CN_ARCHIVE_URL}" --output "${archive_path}"
    tar -xzf "${archive_path}" -C "${extract_dir}"

    CN_SOURCE_DIR="${extract_dir}/${CN_REPOSITORY_NAME}-${CN_BRANCH}"
    if [[ ! -d "${CN_SOURCE_DIR}" ]]; then
        echo "The downloaded archive does not contain the expected repository directory." >&2
        return 1
    fi
}
