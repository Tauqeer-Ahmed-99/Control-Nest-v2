# Control Nest V2

Control Nest is the mobile app and cloud service for managing AutoPi Hub home controllers. Sign in to manage a home, discover and pair a controller, then control devices and schedules from the app.

> **Setup guide in progress:** the controller installation and production deployment steps are being revised. This README describes the current architecture and pairing flow; it does not yet provide a complete, copy-and-paste deployment guide.

## How it works

The system has three parts:

- **Mobile app (`mobile/`)** — an Expo and React Native app. It uses Clerk for user accounts, discovers controllers on the local network, and provides home, room, device, schedule, energy, and house-member screens.
- **Hosted API (`server/`)** — a Next.js service with API routes, PostgreSQL storage through Drizzle, Clerk authentication, and Cloudflare integration for creating controller tunnels.
- **Home controller (`controller/`)** — a Python FastAPI service intended for a Raspberry Pi. It manages GPIO devices and schedules, advertises itself for local discovery, and runs `cloudflared` for remote access.

### Pairing and connections

1. Sign in to Control Nest and connect your phone to the same local network as the controller.
2. The app discovers the controller using the `_autopihub._tcp.local.` service and sends an authenticated setup request over the local network.
3. The hosted API registers the controller and provisions a Cloudflare Tunnel with a controller hostname.
4. Complete the controller-password step in the app. The app stores the controller configuration for later use.
5. The controller connects out through its tunnel. The app can then reach it at its HTTPS hostname when the phone is away from home.

## Internet access and security

Configured controllers are reachable from the public Internet through their Cloudflare Tunnel hostname. The tunnel avoids configuring inbound port forwarding on the home router, but the controller is no longer local-network-only. The controller API currently validates Clerk session tokens, and the hosted API checks user and house access. Treat tunnel tokens, Clerk secret keys, database credentials, and controller credentials as secrets; never commit them to the repository.

Mobile build variables prefixed with `EXPO_PUBLIC_` are included in the client app and must not contain secret credentials. Use them only for values intended to be public, such as the API URL and Clerk publishable key.

## Installation and deployment status

The previous local-only installation procedure is obsolete. The new flow depends on a configured hosted API, Clerk, PostgreSQL, and Cloudflare, as well as the controller's local-network discovery and tunnel setup. Exact installation, environment provisioning, and release steps are still being finalized; follow the deployment instructions when they are added here rather than relying on the old commands.

The source currently expects the following environment variable names. Supply values through the appropriate private environment configuration for each component; do not add real credentials to this README.

### Hosted API (`server/`)

- `DB_ENV` (`development` or `production`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DEV_DATABASE_URL` and `PROD_DATABASE_URL`
- `CONTROLLER_USERNAME` and `CONTROLLER_PASSWORD`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCOUNT_API_TOKEN`, and `CLOUDFLARE_ZONE_ID`

### Mobile app (`mobile/`)

- `EXPO_PUBLIC_SERVER_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_WEATHER_API_URL` and `EXPO_PUBLIC_WEATHER_API_KEY` for the weather integration

### Home controller (`controller/`)

- `SERVER_URL`
- `API_USERNAME` and `API_PASSWORD`
- `CLERK_SECRET_KEY`
- `APP_PERSISTENT_STORAGE_PATH`

## Development entry points

The hosted API and mobile app are separate projects with their own dependency manifests. Their package scripts are defined in `server/package.json` and `mobile/package.json`. Configure the required environment variables before starting either app. Controller installation and service registration instructions will be added after that process is finalized.

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
