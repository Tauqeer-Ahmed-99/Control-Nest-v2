#!/usr/bin/env bash

set -e

# Load environment variables from .env
set -a
source .env
set +a

# Validate persistent storage path
if [ -z "$APP_PERSISTENT_STORAGE_PATH" ]; then
    echo "Error: APP_PERSISTENT_STORAGE_PATH is not defined in .env"
    exit 1
fi

# Get the current user
USER_NAME=$(whoami)

# Get the user's primary group
GROUP_NAME=$(id -gn "$USER_NAME")

# Define storage directories
STORE_PATH="$APP_PERSISTENT_STORAGE_PATH/stores"

echo "Setting up persistent stores..."
echo "User: $USER_NAME"
echo "Group: $GROUP_NAME"
echo "Path: $APP_PERSISTENT_STORAGE_PATH"

# Create directories
sudo mkdir -p "$STORE_PATH"

# Assign ownership to the current user
sudo chown -R "$USER_NAME:$GROUP_NAME" "$APP_PERSISTENT_STORAGE_PATH"

# Set secure permissions
sudo chmod -R u+rwX,go-rwx "$APP_PERSISTENT_STORAGE_PATH"

# Verify write access
touch "$STORE_PATH/.permission_test"
rm "$STORE_PATH/.permission_test"

echo "Persistent stores setup complete."
