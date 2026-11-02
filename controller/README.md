# Raspberry Pi controller

The controller is a Python FastAPI service for the Control Nest Raspberry Pi. A protected bootstrap installs exact signed application releases and restores the recorded working code/data pair if activation fails.

## Install

On Raspberry Pi OS, run this as your normal user with `sudo` access, `curl` and `tar` installed, and an internet connection:

```bash
curl -o- https://raw.githubusercontent.com/Tauqeer-Ahmed-99/Control-Nest-v2/main/controller/scripts/install.sh | bash
```

The installer downloads the repository archive to `~/Control-Nest-v2`, prepares the Python environment and system packages, then registers and starts the `autopihub` systemd service. The tracked `controller/.env` ships only public defaults, including `OTA_RELEASE_PUBLIC_KEYS` and `OTA_JOB_PUBLIC_KEYS`. Each is a single-line JSON map from key ID to public PEM. Installation provisions these verification keys automatically and preserves an existing local `.env` when downloading into an existing directory.

## Update

Bootstrap an existing trusted installation once over authenticated SSH:

```bash
bash scripts/bootstrap.sh
```

Bootstrap reads both public-key maps from `.env` and installs them in root-owned `/etc/control-nest/trusted-release-keys/` and `trusted-job-keys/`. On an existing installation, `bash scripts/provision-ota-keys.sh` provisions only those keys without replacing the application or restarting services. Bundled public PEM files support older `.env` files without these variables. The active key IDs and public fingerprints are recorded in [the key identities](../docs/ota-key-identities.json); private signing keys stay outside the repository and Pi.

Then a house admin uses **Settings > Firmware updates** in mobile. Updates continue after the phone disconnects. The old source-overlay update path is disabled. Follow [OTA operations](../docs/ota-operations.md) for public-key provisioning, signed artifacts, separate environments, encrypted backup, LAN recovery grants, SSH restoration and SD replacement. Raspberry Pi OS updates remain separate owner maintenance.

## Script roles

- `install.sh` downloads and installs the repository, then runs the controller setup steps.
- `bootstrap.sh` preserves identity/stores, moves private environment ownership to `/etc/control-nest/controller.env`, and installs the protected helper/listener.
- `update.sh` directs admins to the signed mobile update workflow.
- `common.sh` contains repository settings and the initial install downloader; OTA never downloads `main`.

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

`API_USERNAME` and `API_PASSWORD` are no longer used and have been removed from the shipped `.env`. Public configuration consists of `SERVER_URL`, `APP_PERSISTENT_STORAGE_PATH`, `CLERK_JWT_KEY` (Clerk public PEM verification key), `OTA_RELEASE_PUBLIC_KEYS`, and `OTA_JOB_PUBLIC_KEYS`. Private signing keys and device credentials never belong in the downloadable `.env`.

To replace a lost key, use **Replace key** on the website and rerun either setup method on the same Pi. Revocation blocks cloud calls and user requests to the Pi; use setup to reconnect with the new key. After updating an existing controller, generate a key for its existing entry and pair again without deleting its persistent metadata. Do not copy installation metadata to another Pi.
