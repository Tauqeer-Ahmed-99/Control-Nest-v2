# Control Nest website and API

This Next.js project serves the Control Nest website and the existing
`/api/v1/*` serverless API together on Vercel (`server` is the project root).
Control Nest is the mobile app; AutoPiHub is the Raspberry Pi controller service.
Built by NMT Solutions OPC Pvt Ltd.

The repository root is linked to the existing [control-nest-v2 Vercel project](https://vercel.com/tauqeerahmed99s-projects/control-nest-v2). Its Vercel Root Directory is `server`; run Vercel CLI commands from the repository root. The existing production API origin is `https://controlnest-v2.nmt-solutions.in`. Local `.vercel` metadata and generated environment files are ignored by Git.

## Website

- `/` introduces the app with an interactive sample home, AutoPiHub overview,
  setup entry points, and FAQs. The preview uses browser state and makes no
  device-control requests.
- `/guide` covers using the shared service: Raspberry Pi installation, the
  relay connection reference, app pairing, devices, schedules, and updates.
  Customers use the shared API and Cloudflare tunnels managed by NMT Solutions.
- `/dashboard` provides house creation, multiple controllers per house, one-time API keys, replacement/revocation, and pairing instructions. Website account actions redirect through Clerk and return here after registration or sign-in.
- App store downloads are not advertised until published destinations exist.

## Development

Configure the existing required server variables in a private `server/.env`
(see `src/env/vars.ts` and the repository root README), then run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` or `http://localhost:3000/guide`. Verify changes with:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Every build environment must include the variables required by `src/env/vars.ts`,
including `WEATHER_API_URL` and server-only `WEATHER_API_KEY`. Next.js evaluates
this shared configuration while collecting API route data, so missing weather
configuration can fail a firmware-route build as well. Both weather variables
are provisioned in Vercel Preview; its API key is stored as a Secret. Configure
them separately in any other Vercel environment before deploying this branch
there. Environment changes require a new deployment to take effect.

Provider secrets stay on the server; only the public API origin, Clerk
publishable key and OTA verification configuration belong in the mobile build.
The public guide contains no server deployment or credential configuration steps.
Server environment and database instructions below are for service maintainers.

## OTA releases and policy

From `server`, run `npm run db-push` against the database selected by `DB_ENV` before deploying OTA support. Review the proposed changes first with `npm run db-push -- --explain`; pushing applies the declarative schema directly without generating migration files. The four OTA tables, three foreign keys and two indexes were applied this way on 2026-11-02. Configure server-only `OTA_JOB_KEY_ID`, `OTA_JOB_PRIVATE_KEY`, and the public PEM map `OTA_RELEASE_PUBLIC_KEYS` in private server configuration. No private signing key belongs on mobile or a controller. The catalog is empty and no upgrade floor is active until a maintainer registers verified published artifacts and a signed policy.

`npm run ota:catalog -- register <catalog.json>`, `policy <signed-policy.json> [--controllers <private-rollout.json>]`, and `revoke <version>` manage publication eligibility separately from installation. Raising a minimum requires `--activate-minimums`. Public discovery omits rollout controller IDs. New-job/rollback/recovery issuance requires a current active house admin; ordered events require the paired controller's own API key/installation identity. See [OTA operations](../docs/ota-operations.md) for key rotation, rollout, migration, native build requirements, artifact generation and recovery.

Signing configuration is provisioned in the linked Vercel project's development, preview and production environments: job key `jobs-2026-11-02` is a Secret; its ID and the public release-key map are Config values. The release signer stays outside Vercel. See [public key identities](../docs/ota-key-identities.json) for fingerprints. Existing deployments need a subsequent deployment to receive these environment values.

## Styling, components, and brand assets

Tailwind CSS v4 uses `@tailwindcss/postcss` through `postcss.config.mjs` for both
development and production. `src/app/globals.css` maps shadcn semantic tokens to
the exact mobile light/dark palette and follows system appearance. Floating
navigation uses glass; reading and content surfaces stay opaque. Reduced motion,
reduced transparency, higher contrast, keyboard focus, and skip navigation are
supported. Primary buttons are 48px or larger and switches have 44px hit areas.

shadcn/ui is configured in `components.json`. Radix-based components live in
`src/components/ui`, website components in `src/components/site`. Add more with
`npx shadcn@latest add <component>` from `server/`. Use `@/lib/utils` for the `cn`
helper, retain semantic colors, and preserve Radix keyboard/ARIA behavior.

`public/brand/` contains unmodified copies of the mobile app icon and NMT logo.
Lexend Regular, Medium, and Semibold are bundled in `src/app/fonts/` from the
mobile font package, including its SIL Open Font License. No Google Fonts
request is required to build or render. Sync these files when mobile branding
changes.

The guide's `public/brand/connection-diagram.jpeg` is the original
`mobile/assets/designs/Circuit Diagram.jpeg`, recovered unchanged from commit
`0f4b4cc` after its removal from the current mobile assets. It is a reference,
not a complete electrical installation plan.

`SiteMotion` adds one brief reveal as sections enter the viewport. It leaves
content visible without JavaScript and disables animation for reduced motion.

## Existing database pin migration

Before deploying this schema to an existing database, run
`src/database/migrations/convert-device-pin-number-to-header-pin.sql` once
against that database. It moves each stored BCM GPIO value into `gpioPinNumber`
and converts `pinNumber` to the physical Raspberry Pi header position. New,
empty databases can use `npm run db-push` as usual.

## Request observability migration

Before deploying request history to an existing database, run
`src/database/migrations/add-observability-logs.sql` once against that database.
New, empty databases can use `npm run db-push` to create the table from the
Drizzle schema.

API requests carry an `X-Request-ID` UUID from the mobile app through the server
and controller. The server stores structured request, response, and error
records in `observability_logs`; the controller also appends local JSONL records
under its persistent `stores` directory. `Authorization`, cookies, passwords,
tokens, credentials, and API keys are redacted before storage. Signed-in users
can inspect traces for their own requests and controllers in **Settings →
Request history** in the mobile app.

## Device control attribution

Manual switches carry the authenticated user's ID to the controller. After the
hardware changes state, the controller sends that ID as `userId` in its existing
control-log callback; the server stores it in `createdBy`. Scheduled transitions
use `scheduledBy`. Older callbacks and system actions without a user retain the
`CD-<controllerId>` fallback. Existing logs are unchanged.

Authenticated clients can fetch `GET /api/v1/user?userId=<Clerk user ID>` for
`id`, `fullName`, `firstName`, `lastName`, `username`, and `imageUrl`. The mobile
`useUserById` hook caches these profiles and the control-log list displays the
full name and profile image, with a user icon if the image is unavailable and a
controller icon for `CD-` entries. Provider credentials
and private Clerk metadata are not returned. Deploy the server before updating
controllers and the mobile app; full attribution requires the updated controller.

Run attribution checks with `node --test tests/control-log-attribution.test.mjs`
from `server` and `python -m unittest discover -s tests -v` from `controller`.

## Clerk email-only registration

In the Clerk Dashboard for the instance shared by the website and mobile app:

1. Enable email sign-up/sign-in and email verification. Enable password authentication (the mobile email flow supports it).
2. Require first and last name. Disable username and phone registration unless intentionally needed later.
3. Disable **all social/enterprise connections**, including Google and Apple. Hosted Clerk pages use the instance settings; application code cannot enforce the fields or connection buttons on Clerk-hosted pages. Do this before exposing registration.
4. Allow the deployed website origin and mobile redirect URLs in Clerk. Account actions use Clerk redirects; both sign-in and sign-up force a return to `/dashboard`. Keep the default hosted Account Portal URLs configured in Clerk. Do not point them back to `/dashboard` as the sign-in page.

The website wraps all pages in `ClerkProvider`. The dashboard checks the session server-side, and every management API authenticates a Clerk bearer token and verifies house membership/admin permissions. A profile completion form collects first and last name for existing accounts that lack them.

## Controller keys and multiple controllers

Apply `src/database/migrations/add-controller-api-keys.sql` to an existing database before deploying this version. It adds hashed keys and installation identities, assigns each existing device to its house's only controller, and creates a unique GPIO pin index per controller. The migration refuses to guess for houses with zero or multiple controllers. For those houses, first add the nullable column with `ALTER TABLE devices ADD COLUMN IF NOT EXISTS "controllerDeviceId" uuid REFERENCES controller_devices(id);`, assign each device to the correct controller manually, then rerun the migration. Resolve any duplicate pin assignments on a controller before migration. Empty databases may use `npm run db-push`.

House admins generate one key per controller at My houses. Keys contain 256 random bits, are shown once, and are hashed with SHA-256 in PostgreSQL. The last four characters are safe to show in the UI. Replace key immediately invalidates the old key while retaining the Pi's installation binding; paste the replacement on that same Pi. Revoke blocks controller requests until a replacement is installed. Add another controller entry to connect another Pi.

Retire `CONTROLLER_USERNAME` and `CONTROLLER_PASSWORD`. Controller provisioning uses per-device keys; OTA adds the separate signing configuration described above. The server continues to own Cloudflare, database, weather, Clerk and job-signing secrets. The Pi owns its generated API key and tunnel token. Mobile receives public connection details and narrowly scoped recovery authorizations.

Management APIs: `GET /api/v1/houses`, `POST /api/v1/house`, and `GET/POST/PATCH /api/v1/house/controllers`. Controllers enroll with `POST /api/v1/controller-device/init`; all subsequent controller calls use `Authorization: Bearer <controller-api-key>` and `X-Controller-Installation-ID`. Request bodies and query strings cannot override the identity derived from the key. Device fetches and control logs are restricted to that controller's explicitly assigned devices. The `/controller-device/access` endpoint verifies a user session against the controller's house for inbound Pi requests, including public tunnel access.

Deploy the API/schema, mobile app, and controller update together: the retired shared credentials and password-based setup are intentionally not accepted. Existing houses/memberships are retained. Generate keys for existing controller entries before pairing again.

Run the controller security regression suite with `node --test tests/controller-security.test.mjs` from `server/`. It uses the real services and routes with isolated database/provider adapters; it does not provision cloud resources. Controller persistence tests run with `python -m unittest discover -s controller/tests -v` from the repository root and replace hardware/network adapters. Live Clerk, PostgreSQL migration, Cloudflare, LAN discovery, and GPIO verification require the deployment and a Pi.
