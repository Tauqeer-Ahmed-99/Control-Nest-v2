# OTA deployment and recovery

The implementation follows [the OTA design](ota-updates-and-recovery.md). Project linking and update-channel setup are recorded below; they do not publish a release, deploy server changes, or install anything on a Pi. Start with optional updates on representative hardware. Run the design's manual acceptance and power interruption exercises before production rollout.

## Linked cloud projects

- Mobile is linked to [@tauqeerahmed/cnm](https://expo.dev/accounts/tauqeerahmed/projects/cnm), EAS project `301bd0a5-25cf-4959-a60e-58d733e30624`. The public project ID and owner are recorded in `mobile/app.json`; `app.config.ts` derives its update URL and rejects a conflicting environment project ID.
- The existing [control-nest-v2 Vercel project](https://vercel.com/tauqeerahmed99s-projects/control-nest-v2), ID `prj_QelYCfPQQ7Ahv4jnAWLb5m108E68`, is linked at the repository root. Its existing Vercel Root Directory remains `server`. Run Vercel CLI commands from the repository root so it resolves the configured server subdirectory. The existing production domain is `https://controlnest-v2.nmt-solutions.in`.
- EAS channels `development`, `preview`, and `production` point to separate branches with the same names. All three EAS environments contain `EXPO_PUBLIC_EAS_PROJECT_ID`, the existing `EXPO_PUBLIC_SERVER_URL`, and the existing `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` as public configuration. Preview/development currently use the same API origin as the existing mobile configuration.
- Local Vercel link metadata and its generated OIDC environment file are ignored by Git. New checkouts can link to the existing project with `npx vercel@latest link --yes --scope tauqeerahmed99s-projects --project prj_QelYCfPQQ7Ahv4jnAWLb5m108E68` from the repository root. Do not create a second Vercel project.

The release and job signing keys have now been provisioned as recorded below. Project/key provisioning does not activate a policy, migrate a database, publish an OTA bundle, or produce the first OTA-enabled native binary. Complete the corresponding steps below before rollout.

## Provisioned OTA trust roots

The active key identifiers are `release-2026-11-02` and `jobs-2026-11-02`. Their public fingerprints and bootstrap asset paths are recorded in [ota-key-identities.json](ota-key-identities.json). Public keys ship in `controller/.env` as `OTA_RELEASE_PUBLIC_KEYS` and `OTA_JOB_PUBLIC_KEYS`, with public PEM fallback assets in `controller/bootstrap/trusted-release-keys/` and `trusted-job-keys/`. Private signing keys are never bundled.

Vercel development, preview and production have `OTA_JOB_PRIVATE_KEY` stored as a Secret, with `OTA_JOB_KEY_ID` and `OTA_RELEASE_PUBLIC_KEYS` as Config values. EAS development, preview and production have the matching raw release public key in `EXPO_PUBLIC_OTA_POLICY_KEYS`. Local mobile configuration is in ignored `mobile/.env.local`; the local server's ignored environment contains the release public-key map for catalog/policy verification. The release private key remains outside Vercel and EAS.

The owner's Windows key storage is `%LOCALAPPDATA%\ControlNest\ota-signing`, outside the repository, restricted to the current Windows account and SYSTEM. It contains separate `<keyId>.private.pem` files, public exports and metadata. `key-backup.dpapi` is encrypted to that Windows user; it is not a portable backup for another computer/account. The directory's README describes custody and signing use. Preserve private material in the owner's encrypted backup/secret storage before retiring this machine; never commit it or copy it onto the Pi.

On 2026-11-02, public trust roots were installed and their fingerprints/root ownership/permissions verified on `wafa@rpi.local`, discovered at `192.168.1.109` using the saved SSH host key. The Pi was running its existing controller service from `/home/wafa/Control-Nest-v2/controller`; the protected OTA bootstrap was absent. Key provisioning preserved the service, application, pairing and relay state. The DHCP address can change; `rpi.local` remains the intended SSH identity.

Initial installation and fresh controller bootstrap read the public-key maps from `controller/.env` and provision them automatically. The configuration uses one-line, single-quoted JSON maps of key IDs to public PEM strings with JSON `\n` escapes. Bundled public PEM files remain a fallback for older local `.env` files without either map. For an existing Pi, install only the trust roots from an owner-trusted checkout:

```sh
bash controller/scripts/provision-ota-keys.sh
```

This command requires authenticated SSH/root access, validates Ed25519 public keys, adds new IDs without replacing different existing keys, and writes the two root-owned trust directories under `/etc/control-nest`. It does not install the application or restart a service. Vercel's new environment values apply to subsequent deployments; the first OTA-enabled mobile binary must include the EAS public-key configuration.

## Supported contracts

The shared release baseline is `1.0.0`. Controller API contract and persistent data schema are independently `1`; updater version is `1.0.0`. This updater deliberately accepts only schema-preserving releases, `snapshot` rollback, Linux `aarch64`/`armv7l`, and an exact Python minor matching the signed package. A schema/API change needs a separately reviewed bootstrap/migration implementation; it is rejected by this updater. Each architecture/Python combination needs its own complete wheel bundle. No OS packages, bootloader, or Raspberry Pi OS upgrades run during OTA.

Legacy `/`, `/controller/configure`, `/device` (POST/PUT/DELETE), and `/device/switch` (POST) keep their request/response bodies, authentication and normal error behavior. New metadata travels in headers. The stable listener forwards the existing body, status and end-to-end headers to loopback port 8001. `/internal/maintenance/*` is token-protected and is never forwarded from the public listener. Only an actual HTTP 404 on the maintenance endpoint means **Bootstrap required**; timeouts and auth failures have separate states.

The local journal owns the installation outcome. Cloud observations include an observation time and job event sequence; terminal outcomes cannot be overwritten by older events. A mobile restart can recover the latest cloud job even if its locally saved request ID was lost. Saved requests use the same idempotency key for uncertain delivery. A retry after a terminal failure creates a new authorization; it never silently reinstalls a failed candidate.

## Credentials and ownership

| Setting/resource | Owner and provisioning |
| --- | --- |
| `OTA_JOB_KEY_ID` | Private server configuration; a stable identifier such as `jobs-2026`. |
| `OTA_JOB_PRIVATE_KEY` | Private server configuration; Ed25519 PKCS#8 PEM (literal newlines or `\n`). Signs short-lived job tickets and device-bound recovery grants. Never a release-signing key. |
| `OTA_RELEASE_PUBLIC_KEYS` | Public JSON map of key IDs to Ed25519 PEMs. Configured on the server and shipped in `controller/.env` for initial trust-root provisioning. Verifies controller manifests and release policies. |
| `OTA_JOB_PUBLIC_KEYS` | Public JSON map shipped in `controller/.env`. Initial installation/bootstrap provisions these job-authorization verification keys on the Pi. Contains no signing private keys. |
| Release/policy signing private key | Offline release infrastructure, outside the repository and release resources. The JSON signing helper accepts a file path. |
| `/etc/control-nest/trusted-release-keys/<keyId>.pem` | Root-owned Ed25519 public keys on each Pi, installed through authenticated SSH/bootstrap. |
| `/etc/control-nest/trusted-job-keys/<keyId>.pem` | Root-owned public counterpart of the server's job key. |
| `/etc/control-nest/controller.env` | Root-owned mode 0600. Bootstrap copies the existing deployment settings here. systemd supplies them to the app/helper. The downloadable `controller/.env` contains only validated public defaults; installed private configuration stays in this protected file and takes precedence. |
| `APP_PERSISTENT_STORAGE_PATH` | Existing Pi-specific storage location is preserved; its `stores/` belongs to `control-nest-app`. The parent and `maintenance/` belong to root. |
| `CONTROL_NEST_SUPERVISED`, `CONTROL_NEST_INTERNAL_TOKEN`, `PYTHONDONTWRITEBYTECODE` | Set by bootstrap in private configuration. The random internal token protects loopback readiness/quiesce/resume. Never put it in a phone/build configuration. |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Public EAS project UUID, configured in all three EAS environments. `mobile/app.json` also records the linked ID, so local builds resolve it without an environment override. A conflicting override is rejected. Dynamic config sets `updates.url`. |
| `EXPO_PUBLIC_OTA_POLICY_KEYS` | Public JSON mapping release key IDs to base64 **raw 32-byte Ed25519 public keys**, bundled into mobile JS. Used to verify persisted offline policies. |
| Existing mobile variables | `EXPO_PUBLIC_SERVER_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` remain public. No provider, GitHub, or release credentials belong on the phone. |
| Recovery grants | Short-lived authorization credentials issued only to a current house admin. Saved in Expo SecureStore, bound to one controller/installation/working release and a single restore nonce. Expire after 24 hours. |

Generate separate release and job keys in private infrastructure, e.g. `openssl genpkey -algorithm ED25519 -out <private-key-file>` and `openssl pkey -in <private-key-file> -pubout -out <public-key-file>`. For mobile's raw public format, export the Ed25519 public key as DER and base64-encode its final 32 bytes. Keep old public verification keys installed while any supported artifact, policy, accepted job or unexpired grant uses them. Install the new public keys on server, Pi and mobile before changing signer IDs. Remove a retired public key only after its entire support window ends. Bootstrap updates and trust-root replacement require authenticated owner maintenance; application archives cannot replace installed trust roots. Public defaults carried in a new release never overwrite the protected deployment configuration or installed verification keys.

## Deploy the server first

1. Back up the database. Apply `server/src/database/migrations/add-firmware-updates.sql` after the existing controller-key migration. This is additive; it does not rewrite existing devices or houses. Empty installations may use the repository's schema setup; both it and the migration define the partial unique active-job index.
2. Configure the three `OTA_*` server variables and deploy compatible server code. Public policy discovery works before sign-in. Firmware discovery/progress require active house membership; new updates, manual rollback and recovery grants require an active house admin and paired, non-revoked controller.
3. Keep the catalog empty until a verified GitHub Release is published. No newest-tag or `main` lookup determines eligibility. Catalog commands run only from trusted maintainer infrastructure with database access.

```sh
cd server
npm run ota:catalog -- register /secure/release/catalog.json
npm run ota:catalog -- policy /secure/release/signed-policy.json --controllers /secure/private-rollout.json
npm run ota:catalog -- revoke 1.1.0
```

Registration verifies manifest signatures, actual archive byte counts/digests, the published GitHub Release, and its exact tag commit. It inserts an immutable release identity. Public GitHub/artifact delivery is supported by this CLI; private repositories/artifacts need an authenticated maintainer delivery arrangement before registration. No GitHub token is installed on a Pi. Revocation blocks new authorizations/acceptances while an accepted local transaction can finish or restore without cloud access.

Copy [the policy example](ota-policy.example.json) outside the checkout. Set `latest` to a registered release, real installation links and supported runtimes/builds. Keep rollout controller IDs in a separate private JSON array passed with `--controllers`; an empty array or omitted flag means all controllers. Use a small explicit list for initial rollout. Controller IDs never appear in public policy discovery. Sign the policy's exact bytes:

```sh
python scripts/sign-ota-json.py --key /secure/release-key.pem --key-id release-2026 \
  --input /secure/policy.json --output /secure/signed-policy.json
```

Each policy revision must increase. Set an ISO effective time and sign before activation. Increasing either minimum also requires `npm run ota:catalog -- policy <file> --activate-minimums`. Verify installation and restoration paths before using that flag. Floors gate normal cloud/controller operations while leaving policy, sign-in, membership, maintenance, status and recovery available. Gates do not stop autonomous schedules or change relay state. Legacy clients without metadata remain supported at baseline `1.0.0`; an explicit higher floor produces `UPDATE_REQUIRED` in `errors.code`. Offline clients retain the last signature-verified minimum and its age.

## Bootstrap an existing Pi

Use an authenticated SSH maintenance window. Keep the old trusted source, environment and a separate encrypted backup; do not reset or re-pair an existing identity. Review the configured storage path and ensure no symlinks exist in stores. Prerequisites are supported Raspberry Pi OS/Python, systemd, OpenSSL with Ed25519 support, python3-venv, the `gpio` group, cloudflared, a synchronized trusted clock, and space for separate environments plus snapshots. The initial bootstrap is an owner-trusted installation; verify the source commit before running it.

From the trusted controller checkout, with its existing `.env` and `.venv`:

```sh
bash scripts/bootstrap.sh
```

Bootstrap retains `APP_PERSISTENT_STORAGE_PATH`, all stores, controller ID and installation ID; copies private configuration to `/etc/control-nest/controller.env`; and creates `/opt/control-nest/releases/1.0.0/controller/.venv` in its final path. Dependencies are installed as `control-nest-build`, without private environment settings. Final releases and bootstrap code become root-owned. No HTTP process has sudo access. The app runs as `control-nest-app`; the stable listener/discovery runs as `control-nest-front`. Only a protected Unix socket reaches the helper's fixed maintenance operations. Existing owner sudo grants are not inherited by either account.

The installer provisions `.env` public-key maps in the two root-owned trusted-key directories. Check `autopihub`, `autopihub-manager` and `autopihub-app` service state without printing private environment files or full tunnel arguments. The stable address and mDNS installation suffix stay the same; tunnel traffic stays on port 8000. The app binds only to 127.0.0.1:8001. Bootstrap preserves the current tunnel credentials, migrates the token into `/etc/cloudflared/token`, and enables/restarts a fixed token-file service. Future pairing reconciles that service through the protected helper. An unpaired installation receives an identity before the listener starts so it remains discoverable for setup.

Verify setup and switching with the original mobile app, then obtain `GET /controller/firmware` with a valid member session. Exercise a successful update and restoration with the new app before expanding eligibility. The owner-trusted bootstrap baseline supports automatic snapshot restoration; cloud-initiated manual rollback additionally requires a registered signed manifest matching a locally verified release. Use the recorded SSH restore for a baseline that has not yet been packaged/registered.

Bootstrap failures stop with the original source retained. Inspect incomplete `/opt/control-nest` directories and service/configuration state before retrying; the installer refuses to overwrite an existing bootstrap. Do not use the old source-overlay updater. `scripts/update.sh` now directs admins to **Settings > Firmware updates**. No timer, cron task or periodic release lookup is installed. Startup reconciles interrupted work; active-job probes are bounded, and app crashes have systemd restart limits.

## Build the OTA-enabled mobile binary once

The EAS project is already linked as recorded above. From `mobile`, verify it with `npx eas-cli@latest project:info`; do not create a replacement project. The public project/API/Clerk variables and three channels are configured; provision the policy verification keys in the relevant local/EAS environments before rollout. Configuration is in `app.config.ts`; do not overwrite it with `update:configure`. The manual runtime is `cn-native-1`, independent of the shared release version. Change it for native/SDK/permission/dependency compatibility changes; publish backports for each still-supported runtime. Channels are `development`, `preview`, and `production`. The supported production artifact currently remains Android APK; configure iOS signing/bundle identity before offering an iOS installation link.

```sh
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest update --channel preview --environment preview --message "Control Nest 1.0.0"
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest update --channel production --environment production --message "Control Nest 1.0.0"
```

The installed older binary cannot gain `expo-updates` through JS. Distribute the new native build first. Preserve signing identity and increase platform build numbers. Launch/foreground checks download compatible updates; the user restarts at a safe point. Expo's embedded bundle and default error recovery remain enabled. Validate applying an update, republishing a known-good compatible bundle and rolling back to embedded on each supported runtime. For optional end-to-end Expo signing, configure its certificate/private-key lifecycle in EAS before building; it is separate from the policy/controller signatures implemented here. See [Expo setup](https://docs.expo.dev/eas-update/getting-started/), [SDK 57 Updates](https://docs.expo.dev/versions/v57.0.0/sdk/updates/) and [runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/).

## Prepare signed release resources

Follow [the repository release workflow](../AGENTS.md#release-workflow) and [release ledger](releases.md); the commands here do not tag or publish. Build native APK/IPA resources and bundle exports from the exact release commit. Prepare a fully resolved `requirements.lock` on the target Python/architecture and create wheels for **all** pinned transitive dependencies (`pip wheel -r requirements.lock --wheel-dir <directory>` on an isolated matching build machine). GPIO packages may require target-built wheels. Verify installation with `--no-index --only-binary=:all:` before signing. Do not resolve or build dependencies as root on the target Pi during an update.

In a clean release checkout with synchronized versions:

```sh
python scripts/prepare-ota-release.py --wheels /build/wheels --requirements-lock /build/requirements.lock \
  --architecture aarch64 --python 3.13 --key /secure/release-key.pem --key-id release-2026 \
  --archive-url https://approved-artifact-host/control-nest-VERSION-linux-aarch64-py3.13.tar.gz \
  --android-apk /build/control-nest.apk --out /build/release-resources
```

Replace the URL/version/Python with the actual approved distribution target. Repeat for each architecture/Python target in separate output directories and combine their signed manifest envelopes into one catalog record. Include `--ios-ipa` only when iOS is supported. The helper packages committed source, the controller wheel bundle and lock, a server source/deployment archive, native mobile resources, installation notes and `SHA256SUMS`. It includes the committed, public-only `controller/.env` after validating an explicit five-variable allowlist, public PEMs and credential-free server URL. Private environment files, private signing keys, local dependencies and persistent state remain excluded. The controller extractor repeats this public-configuration validation before accepting the file. Upload resources only after target verification; the catalog is registered after GitHub publication. Preview/production EAS publication is a separate step, as is activating a minimum. Keep detailed notes/resources on GitHub and update the single-line ledger only after successful publication.

## LAN repair, backup and reinstall

Admins can prepare a recovery grant while online from a controller's **LAN recovery** panel; update responses also save a grant in SecureStore. On the same Wi-Fi, discovery finds that exact controller and permits grant-authenticated status/restore without Clerk/cloud availability. A grant can only restore the source release and snapshot recorded by the updater. It cannot install an arbitrary target or run a command. Restore consumes its nonce durably. A trustworthy clock is required; an expired grant, unknown identity or unreadable journal requires authenticated SSH/physical owner recovery. Grants cannot be revoked offline before expiry, so their scope and lifetime are bounded.

For owner SSH operations, install `age` separately and keep its backup passphrase off-device. A helper command can inherit the private systemd environment without printing it:

```sh
sudo systemd-run --wait --pty --collect --property=EnvironmentFile=/etc/control-nest/controller.env \
  /usr/bin/python3 /opt/control-nest/bootstrap/recovery.py backup /media/backup/control-nest.age

sudo systemd-run --wait --pty --collect --property=EnvironmentFile=/etc/control-nest/controller.env \
  /usr/bin/python3 /opt/control-nest/bootstrap/recovery.py restore-recorded
```

Backup holds the installation lock, pauses requests/schedules, flushes stores, stops the app, and encrypts a snapshot of stores, maintenance records/snapshots, private deployment settings and public verification keys. It includes integrity/schema/release metadata and resumes the selected app after readiness. Copy the encrypted output off the SD card; retain multiple generations and protect the passphrase separately. No automatic retention task deletes referenced releases or snapshots. Inspect free space; remove obsolete **unreferenced** versions/snapshots only under an owner maintenance lock after restoration is demonstrated.

For SD loss, reinstall supported Raspberry Pi OS, restore prerequisites, and bootstrap the same trusted release as the backup at its final versioned path. Do not move an existing virtual environment. Supply the dedicated persistent storage path and private deployment configuration, then restore over SSH:

```sh
sudo systemd-run --wait --pty --collect --property=EnvironmentFile=/etc/control-nest/controller.env \
  /usr/bin/python3 /opt/control-nest/bootstrap/recovery.py restore /media/backup/control-nest.age
sudo systemctl start autopihub-manager.service autopihub.service
```

Restore stops the listener/helper/app, authenticates/decrypts the backup, verifies every file, and stages it under the maintenance lock. A durable `restore-in-progress.json` marker prevents automatic app startup if power is lost while replacing state. Such a restore requires owner inspection of `.restore`/`.pre-restore` directories and re-running or completing restoration before removing that marker. Never erase an unreadable journal to start fresh. Preserve a copy for diagnosis and restore a known owner backup or use the recorded compatible code/data pair. Start the services only after verifying settings and selection. Retain/recreate signed previous-release resources before enabling further updates.

On **replacement hardware**, first revoke the old controller key and tunnel in the cloud. Add `--replacement --old-credentials-revoked` to the restore command. This discards copied installation identity, controller/tunnel credentials, device binding cache and device-bound jobs/grants. Create and pair a new controller entry; explicitly reassign its physical device records in the cloud before syncing schedules/configuration. Do not run two Pis with a copied identity. Verify schedules, intended GPIO states, local discovery, tunnel, app readiness and a real restore exercise before returning to service.

## Checks before enabling production updates

Run mobile lint/typecheck and server lint/typecheck, compile controller Python, and check shell syntax. Then execute all hardware/runtime acceptance exercises in [the design](ota-updates-and-recovery.md#acceptance-checks): authorization/replay/tampering, old-client contracts, interrupted preparation/activation/rollback, corrupt snapshots, full storage, GPIO/startup failures, bounded rollback, cloud/tunnel loss, phone termination, both broken releases, SD replacement and mandatory-policy exemptions. Desktop static checks cannot prove GPIO behavior, boot durability or Expo rollback on a phone.
