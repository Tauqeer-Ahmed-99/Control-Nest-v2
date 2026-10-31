# Raspberry Pi controller

The controller is a Python FastAPI service for the Control Nest Raspberry Pi. The scripts under `scripts/` install it and update its code without requiring Git.

## Install

On Raspberry Pi OS, run this as your normal user with `sudo` access, `curl` and `tar` installed, and an internet connection:

```bash
curl -o- https://raw.githubusercontent.com/Tauqeer-Ahmed-99/Control-Nest-v2/main/controller/scripts/install.sh | bash
```

The installer downloads the repository archive to `~/Control-Nest-v2`, prepares the Python environment and system packages, then registers and starts the `autopihub` systemd service. The archive includes the tracked `controller/.env` configuration.

## Update

To download the latest controller code and restart the service:

```bash
curl -o- https://raw.githubusercontent.com/Tauqeer-Ahmed-99/Control-Nest-v2/main/controller/scripts/update.sh | bash
```

The updater checks for the installed `autopihub` service first. If it is missing, the updater warns and exits; install the controller before updating. Otherwise, it downloads the latest `main` archive, updates Python dependencies and controller files, restarts the service, and checks that it is active.

## Script roles

- `install.sh` downloads and installs the repository, then runs the controller setup steps.
- `update.sh` updates the installed controller and restarts its systemd service.
- `common.sh` contains the repository settings and shared archive download helper used by both scripts.

Both commands should run as the normal Pi user. The scripts use `sudo` for system package and service operations.

## Request observability

The controller adds an `X-Request-ID` response header to each HTTP request and
preserves that ID when it calls the cloud server. It appends structured request,
response, and error records to
`$APP_PERSISTENT_STORAGE_PATH/stores/observability.jsonl`, then sends each event
to the server for the mobile Request history view. The controller file remains
available when the cloud server cannot be reached. Credentials, cookies,
passwords, tokens, and API keys are redacted before the event is stored.

## Pair this Pi

Create an email account on the website, then open **My houses**, create your house, and add a controller (for example, Ground floor). Copy its one-time API key.

Use either setup method:

- In the mobile app, sign in with the same email. Open **Settings / Houses & controllers**, select this Pi on the same trusted Wi-Fi, paste its key, and tap **Connect controller**.
- On the Pi, run `bash ~/Control-Nest-v2/controller/scripts/setup.sh`. Paste the API key at the hidden prompt. The script uses the installed `.venv`, stops AutoPiHub during setup, and restarts it afterward. The key is never a command-line argument.

Every Pi needs a separate controller entry/key. Add multiple controllers to the same house; choose the appropriate controller when adding each device. Pairing is retryable, reuses its tunnel, and binds the key to one persistent installation identity.

The controller uses the existing `JsonStore` service in `services/json_store.py`. Private configuration is stored at `$APP_PERSISTENT_STORAGE_PATH/stores/controller_metadata.json`, including `apiKey` and the tunnel token. `installation.json` holds the stable installation UUID. JSON writes are atomic and files use permissions `0600`. Keep the persistent storage directory across updates and protect it with the installer permissions. Mobile responses exclude these secrets. Discovery names include the installation suffix so several new Pis can be found on the same network.

`API_USERNAME` and `API_PASSWORD` are no longer used. The controller still needs `SERVER_URL`, `APP_PERSISTENT_STORAGE_PATH`, and `CLERK_JWT_KEY` (Clerk public PEM verification key). Keep provider secret keys on the server.

To replace a lost key, use **Replace key** on the website and rerun either setup method on the same Pi. Revocation blocks cloud calls and user requests to the Pi; use setup to reconnect with the new key. After updating an existing controller, generate a key for its existing entry and pair again without deleting its persistent metadata. Do not copy installation metadata to another Pi.
