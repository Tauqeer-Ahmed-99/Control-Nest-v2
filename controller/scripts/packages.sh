#!/usr/bin/env bash

set -e

echo "Updating packages..."
sudo apt-get update -y

echo "Upgrading packages..."
sudo apt-get upgrade -y

echo "Installing system dependencies..."
sudo apt-get install -y ca-certificates curl python3 python3-pip python3-venv

echo "Installing cloudflared..."

sudo mkdir -p --mode=0755 /usr/share/keyrings

curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list >/dev/null

sudo apt-get update
sudo apt-get install -y cloudflared

cloudflared --version

echo "Creating venv..."
python3 -m venv .venv
source .venv/bin/activate

echo ".venv activated"
echo "Installing Python dependencies..."
echo "Installing requirements.txt..."
python -m pip install -r requirements.txt
