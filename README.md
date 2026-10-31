# Control Nest V2

Control Nest is the mobile app and cloud service for managing AutoPi Hub home controllers. Sign in to manage a home, discover and pair a controller, then control devices and schedules from the app.

> Raspberry Pi controller install and update commands are available below. Hosted API and mobile deployment still require their own environment configuration.

## How it works

The system has three parts:

- **Mobile app (`mobile/`)** — an Expo and React Native app. It uses Clerk for user accounts, discovers controllers on the local network, and provides home, room, device, schedule, energy, and house-member screens.
- **Hosted API (`server/`)** — a Next.js service with API routes, PostgreSQL storage through Drizzle, Clerk authentication, and Cloudflare integration for creating controller tunnels.
- **Home controller (`controller/`)** — a Python FastAPI service intended for a Raspberry Pi. It manages GPIO devices and schedules, advertises itself for local discovery, and runs `cloudflared` for remote access.

### Pairing and connections

1. Register on the website through Clerk using email, first name, and last name. Verify your email.
2. Open **My houses**, create a house, and add a named controller. Save its API key; it is shown once.
3. In the mobile app, sign in with the same email and open **Houses & controllers**. Select the Pi on the same trusted Wi-Fi and paste its API key. Alternatively, run `bash ~/Control-Nest-v2/controller/scripts/setup.sh` on the Pi and paste the key at its hidden prompt.
4. The server binds the controller to this installation and provisions its remote tunnel. The Pi persists its key and tunnel configuration through `JsonStore`; the phone stores only public connection details.
5. Open your house in the app, add rooms, and choose a controller when adding each device. Repeat Add controller for each additional Pi in the same house. House members use their Clerk accounts; no shared house password is needed.


## Internet access and security

Configured controllers are reachable from the public Internet through their Cloudflare Tunnel hostname. The tunnel avoids configuring inbound port forwarding on the home router, but the controller is no longer local-network-only. The controller API validates Clerk session tokens and checks house membership with the hosted API. Every controller-to-server request uses its own revocable API key and installation identity; keys cannot read another controller?s devices or write its logs. Keep tunnel tokens, Clerk secret keys, database credentials, and other private deployment credentials out of documentation. The tracked `controller/.env` is the controller configuration used by this repository; review it before reusing or distributing the project.

Mobile build variables prefixed with `EXPO_PUBLIC_` are included in the client app and must not contain secret credentials. Use them only for values intended to be public, such as the API URL and Clerk publishable key.

## Raspberry Pi controller installation and updates

Run the installer on Raspberry Pi OS as a normal user with `sudo` access, `curl` and `tar` installed, and an internet connection:

```bash
curl -o- https://raw.githubusercontent.com/Tauqeer-Ahmed-99/Control-Nest-v2/main/controller/scripts/install.sh | bash
```

The installer downloads the repository archive without Git, places the project under `~/Control-Nest-v2`, and sets up the Python environment, required packages, and the `autopihub` systemd service. It uses the tracked `controller/.env` configuration included in the archive.

To update an installed controller, run:

```bash
curl -o- https://raw.githubusercontent.com/Tauqeer-Ahmed-99/Control-Nest-v2/main/controller/scripts/update.sh | bash
```

The updater downloads the latest `main` archive, updates the controller's Python dependencies and files, then restarts and checks the `autopihub` service. If that service is not installed, it prints a warning and exits; run the installer first. Both commands run as the normal Pi user and use `sudo` for system operations. The scripts share repository settings and archive-download logic through `controller/scripts/common.sh`.

The source expects the following environment variable names. Controller values are supplied by the tracked `controller/.env`; configure hosted API values in the server's private environment. Do not add credentials to this README.

### Hosted API (`server/`)

- `DB_ENV` (`development` or `production`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DEV_DATABASE_URL` and `PROD_DATABASE_URL`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCOUNT_API_TOKEN`, and `CLOUDFLARE_ZONE_ID`
- `WEATHER_API_URL` and `WEATHER_API_KEY`

### Mobile app (`mobile/`)

- `EXPO_PUBLIC_SERVER_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Home controller (`controller/`)

- `SERVER_URL`
- `CLERK_JWT_KEY` (the PEM public key used to verify Clerk session tokens; the controller does not need `CLERK_SECRET_KEY`)
- `APP_PERSISTENT_STORAGE_PATH`

The shared controller Basic credentials (`CONTROLLER_USERNAME` / `CONTROLLER_PASSWORD` on the server and `API_USERNAME` / `API_PASSWORD` on the Pi) are retired. Remove them from deployment settings. API keys are generated per controller and stored as SHA-256 hashes on the server; raw keys are stored only in owner-readable controller JSON, never in mobile build variables.

For email-only registration, configure the Clerk instance as described in [server setup](server/README.md#clerk-email-only-registration). Existing databases must run [the controller migration](server/src/database/migrations/add-controller-api-keys.sql) before using this version. Existing controllers keep their IDs: generate a key in My houses, update their code, and pair them again on the same Pi.

## Development entry points

The hosted API and mobile app are separate projects with their own dependency manifests. Their package scripts are defined in `server/package.json` and `mobile/package.json`. Configure the required environment variables before starting either app. For Raspberry Pi controller installation and updates, use the commands above or see [`controller/README.md`](controller/README.md).

## Repository layout

```text
controller/  Raspberry Pi controller service and setup scripts
mobile/      Expo and React Native app
server/      Next.js API and database integration
```

## Hardware and electrical work

The controller is designed for Raspberry Pi GPIO hardware. Review the [circuit diagram](mobile/assets/designs/Circuit%20Diagram.jpeg) as a project reference. Mains-voltage wiring can cause serious injury, fire, or equipment damage; have it designed and installed by a qualified electrician.

## Contributing

1. Fork the repository and create a branch for your change.
2. Keep changes within the relevant component directory and follow its existing conventions.
3. Open a pull request describing the change and how it was checked.
