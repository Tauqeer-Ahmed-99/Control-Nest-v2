#!/usr/bin/env bash
set -e

chmod +x scripts/clock.sh
./scripts/clock.sh

chmod +x scripts/packages.sh
./scripts/packages.sh

chmod +x scripts/stores.sh
./scripts/stores.sh

chmod +x scripts/cloudflared.sh
./scripts/cloudflared.sh

chmod +x scripts/service.sh
./scripts/service.sh

echo "Setup completed successfully."