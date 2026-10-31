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
