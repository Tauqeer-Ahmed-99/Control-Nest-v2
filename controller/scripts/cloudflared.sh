#!/usr/bin/env bash
set -e

# Get the current user and cloudflared executable path
USER_NAME="$(whoami)"
CLOUDFLARED_PATH="$(command -v cloudflared)"

if [ -z "$CLOUDFLARED_PATH" ]; then
    echo "Error: cloudflared is not installed."
    exit 1
fi

# Create sudoers rule
echo "$USER_NAME ALL=(root) NOPASSWD: $CLOUDFLARED_PATH service install *" \
    | sudo tee /etc/sudoers.d/cloudflared > /dev/null

# Validate sudoers configuration
sudo chmod 440 /etc/sudoers.d/cloudflared
sudo visudo -cf /etc/sudoers.d/cloudflared

echo "Success: $USER_NAME can install the Cloudflare Tunnel service without a password."