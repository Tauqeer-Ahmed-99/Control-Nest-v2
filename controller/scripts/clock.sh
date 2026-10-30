#!/usr/bin/env bash

set -e

echo "Enabling clock autoupdate using ntp..."

# Enable clock auto update
sudo timedatectl set-ntp true