# OTA updates and disaster recovery implementation guide

Implement mobile OTA updates and controller firmware updates around a shared release policy. Mobile delivers compatible JavaScript updates through Expo EAS Update. A house admin starts each controller update from the mobile app. The controller installs an exact signed release and restores its previous working version if installation fails.

This is the design contract. See [OTA operations](ota-operations.md) for the implementation's supported targets/schema, provisioning, rollout, backup and recovery commands. Hardware and native-runtime acceptance must be demonstrated before production activation. In the app, **firmware** means the controller application and its Python dependencies; Raspberry Pi OS, bootloader, and operating system package upgrades require a separate maintenance procedure.

## Required behavior

- Use one release version across `mobile/`, `server/`, and `controller/`, with three numeric parts such as `1.0.0` and a repository tag such as `v1.0.0`.
- Support older installed versions within the published compatibility policy. Installed mobile and controller versions may differ during a rollout.
- Preserve existing controller request and response contracts, including configuration and switching. Change them only when an unavoidable breaking release provides an explicit migration path.
- Check controller update availability when mobile opens Home, returns to the foreground, or the user refreshes. Show an update banner linking to **Settings > Firmware updates**.
- Allow only house admins to start, retry, or manually roll back controller updates. Other members can view availability and progress.
- Start controller installation only through an explicit admin action. Do not install a systemd timer, cron job, or background release checker on the Pi.
- Keep installation running when mobile disconnects or closes. Make progress and the final outcome available after reconnection.
- Provide automatic rollback, recovery after power loss, authenticated repair controls, and a backup and reinstall procedure.
- For mandatory major upgrades, require the affected mobile and controller versions before normal use while keeping authentication, update, status, and recovery paths accessible.

## Existing implementation points

Read the root [agent instructions](../AGENTS.md) and each component's local instructions before implementation.

- Controller installation uses [install.sh](../controller/scripts/install.sh), [service.sh](../controller/scripts/service.sh), and [update.sh](../controller/scripts/update.sh). The current updater downloads `main` using [common.sh](../controller/scripts/common.sh), changes the active virtual environment, overlays files, and restarts `autopihub`. Replace this update path with the transaction described below.
- Controller routes live in [server.py](../controller/server.py). [auth.py](../controller/services/auth.py) validates Clerk sessions and asks the cloud server to authorize house membership. [APIService.authorize_user](../controller/services/api.py) currently reduces that response to a boolean; this is insufficient authorization for an admin-only update.
- [JsonStore](../controller/services/json_store.py) and [ControllerConfigService](../controller/services/controller_config.py) hold installation identity and private configuration. Preserve them across releases. Extend durable-write handling for the maintenance journal, including directory synchronization and exclusive access.
- The server already has `houseMembers.isAdmin` in [houses.ts](../server/src/database/tables/houses.ts) and admin checks in [auth-house.ts](../server/src/services/auth-house.ts). Reuse those checks and require an active membership and controller.
- Mobile already has [Home](../mobile/src/app/(tabs)/home.tsx), [Settings](../mobile/src/app/(tabs)/settings.tsx), shared [query](../mobile/src/hooks/use-api-query.ts) and [mutation](../mobile/src/hooks/use-api-mutation.ts) hooks, [API paths](../mobile/src/routes/routes.ts), and a shared [network layer](../mobile/src/utils/network.ts).
- Mobile uses Expo 57. [eas.json](../mobile/eas.json) currently defines an Android APK production build. [package.json](../mobile/package.json) does not yet include `expo-updates`, and [app.json](../mobile/app.json) has no OTA runtime or update URL configuration.

## Versions and compatibility

Track four separate concepts: the shared release version, the controller API contract version, the controller data schema version, and mobile native runtime compatibility. Increasing the release version alone must not imply that the API contract or native runtime changed.

Before tagging a release, synchronize version metadata exactly as required by [AGENTS.md](../AGENTS.md#releases), including `controller/VERSION`, which must be created during implementation. Include an explicit effective release version in the mobile JavaScript bundle. A phone can run a newer OTA bundle inside an older installed binary, so the installed binary version alone cannot identify the running release.

Keep existing controller paths, required inputs, response fields, types, and error behavior stable. Introduce separate update endpoints instead of extending the configuration or switching contracts. A legacy controller without those endpoints is **Bootstrap required**, rather than assumed to have the latest version. Feature detection must not turn a timeout or authorization failure into a claim that the controller lacks support.

Within a major version, maintain support for previously supported mobile and controller releases. New features must check capabilities before use. Use compatible database migrations on the cloud server and controller so old clients continue working. If a contract must break, introduce a new API version and retain the previous version during migration; do not replace the old response format in place.

Define an explicit minimum supported release for mobile and controller. Major release publication prepares a new minimum; activating that minimum is a separate rollout step after installation paths are verified. Any exception that retires an older patch for a critical defect must be explicit in release policy and notes.

## Release catalog and policy

Add server models, services, and database migrations for the following records. These are proposed additions, not existing tables.

- **Releases:** shared version, exact Git commit, GitHub Release URL, publication state, revoked state, controller manifest identity, supported hardware targets, and mobile OTA or binary distribution references.
- **Policy:** revision, latest eligible release, minimum supported mobile and controller releases, effective time, rollout eligibility, supported API contracts, required mobile runtimes or native builds, and platform-specific installation links.
- **Controller status:** installed release, API contract, data schema, updater version, observed time, and last update outcome. Obtain these through app-triggered queries, controller startup reporting, and active job events; do not add a periodic controller update checker. Mark old observations as stale.
- **Update jobs:** job ID, idempotency key, controller and installation IDs, requesting admin, source and target releases, manifest digest, phase, progress sequence, timestamps, outcome, and sanitized failure code.

Resolve release eligibility on the server from published, verified, non-revoked artifacts. Never treat the newest Git tag or the head of `main` as an installation decision. Store controller artifact size, SHA-256 digest, signature, target OS/architecture, supported Python version, minimum updater version, and migration/rollback requirements in a signed manifest. A checksum detects corruption; a trusted signature establishes artifact authenticity.

Sign the exact manifest bytes with a release key held in private release infrastructure. Install verification keys with the bootstrap updater. Define key identifiers and a rotation process before deployment. Keep job-authorization keys separate from release-signing keys. Avoid placing a GitHub access token on a phone or Pi; serve approved private artifacts through authenticated server delivery or short-lived download URLs if needed.

Use the existing API response envelope. For update-specific failures, put machine-readable codes such as `UPDATE_REQUIRED`, `UPDATE_IN_PROGRESS`, `UNSUPPORTED_TARGET`, or `RECOVERY_REQUIRED` inside `errors`. Mobile must preserve that structured information instead of converting every failure into an unstructured message.

## Proposed update APIs and authorization

Implement new server routes under `server/src/app/api/v1/`. Use `NextRequest`, route-level `try`/`catch`, `APIResponse.fromData`/`fromError`, input schemas in `server/src/models/`, and services with `tryCatch`. Consult the installed Next.js documentation before writing handlers.

Proposed server routes:

- `GET /api/v1/releases/policy`: sanitized policy and installation links, available before sign-in so a required mobile update cannot block its own discovery. Include no private controller details or credentials. Use a signed, revisioned policy if cached decisions are used offline.
- `GET /api/v1/controller-device/firmware`: house-member-authorized availability and fresh or explicitly stale controller version information.
- `POST /api/v1/controller-device/firmware/jobs`: authenticate the Clerk user, resolve the controller's house, call `authorizeHouseByControllerDevice` with `checkAdmin: true`, validate target eligibility, and create an idempotent job.
- `GET /api/v1/controller-device/firmware/jobs/[jobId]`: return sanitized progress only to members of that controller's house.
- `POST /api/v1/controller-device/firmware/jobs/[jobId]/events`: accept ordered job events authenticated with the controller's API key and installation identity. Prevent updates to another controller's job and protect terminal outcomes from stale events.

Proposed controller maintenance routes:

- `GET /controller/firmware`: installed release, API/data contracts, updater version, capabilities, and latest local job outcome.
- `POST /controller/firmware/jobs`: accept a server-signed authorization for an exact approved job. Return the existing job on a retry and `202` when newly accepted; do not wait for installation inside the HTTP request.
- `GET /controller/firmware/jobs/{jobId}`: durable progress, phase, actual running version, and outcome.
- `POST /controller/firmware/rollback`: admin-authorized restoration of an eligible verified release. Apply the same job, signature, and data-compatibility checks as an update.

For a start or rollback authorization, bind the signed ticket to the job, requesting user, controller, installation identity, operation, target manifest digest, permitted fallback, nonce, and expiry. Verify its signature, scope, validity, and replay state on the controller before starting work. Never accept an arbitrary URL, archive path, command, or user-supplied admin flag as authorization. Check current admin membership when issuing and accepting a new job; persist acceptance before returning success.

Keep accepted work independent of the requesting Clerk token's later expiry. Automatic rollback is part of that already-authorized transaction and must not require a new cloud round trip. A new manual update or retry requires fresh authorization.

Normal membership checks currently depend on the cloud. Define a separate, narrowly scoped offline recovery authorization for the maintenance component; do not globally bypass `require_auth`. A preissued device-bound recovery grant may permit local status and restoration of the recorded working release for a bounded period. Without a valid grant or fresh cloud authorization, require authenticated SSH or physical owner recovery. Local Wi-Fi access alone grants no update permission.

## Controller installation and supervision

Separate the update/recovery component from the versioned application. Install a protected bootstrap launcher and maintenance front end that retain the controller's discovery identity and external address when the application fails. One implementation is a stable listener on the existing controller port forwarding ordinary API requests unchanged to the active application on loopback, while serving maintenance routes itself. Preserve HTTP bodies, status codes, authentication headers, and existing API behavior through that forwarding layer.

The existing `autopihub` systemd service can launch this supervisor. An admin request starts a one-off worker that survives the application child process restarting. At service startup, the supervisor reconciles an unfinished transaction. Readiness probes and deadlines run only for startup or an active update; none of these components periodically look for new releases. Boot recovery restores an interrupted transaction rather than deciding to install a new release.

Use an installation layout such as:

```text
/opt/control-nest/
  bootstrap/                    stable supervisor and recovery code
  releases/1.0.0/controller/     application and its own .venv
  releases/1.1.0/controller/     candidate application and its own .venv
  current                       symlink to the selected release
/etc/control-nest/
  controller.env                private deployment configuration
  trusted-release-keys/         public verification keys
$APP_PERSISTENT_STORAGE_PATH/
  stores/                       existing JsonStore data
  maintenance/                  protected journal, jobs, and snapshots
```

These paths are a target layout to implement during bootstrap. Preserve the configured persistent storage path and existing installation identity. Migrate the current controller environment file to protected configuration outside release archives; update setup documentation when that ownership changes. Release packages may include only the validated public-default `controller/.env`, containing the API origin, Clerk public verification key, storage path and the two OTA public-key maps. Exclude private environment files, signing private keys, API keys, tunnel tokens, installation metadata, and persistent data. Installed private settings remain outside releases and are never replaced by these public defaults.

Protect the bootstrap, release selection, verification keys, and transaction journal from writes by the normal API process. Use a narrow privileged helper for controlled filesystem operations and service management. Download and prepare Python dependencies without root privileges. Do not give the HTTP process unrestricted `sudo` or shell execution.

Prepare each virtual environment in its final versioned path; moving an already-created virtual environment can invalidate executable paths. Supply pinned dependencies and, where needed, a verified wheel bundle for each supported Pi architecture and Python version. Never modify the active environment or run an operating system upgrade as part of an application update.

### Installation transaction

1. Acquire an exclusive installation lock. Validate authorization, target compatibility, trusted clock, available space for candidate plus backup, storage writeability, and minimum updater version. Reject unsupported Pi or Python targets before touching the working installation.
2. Persist the accepted job and source release. Download into staging with bounded retries and size limits. Verify the manifest signature and archive digest before extraction or execution. Validate archive paths and link targets to prevent writes outside staging.
3. Prepare the candidate release and dependencies. Check imports and configuration parsing without claiming live GPIO resources. A preparation failure leaves the working release running.
4. Enter a maintenance window. Quiesce configuration writes and schedules that could race the switch, flush durable data, and take a consistent pre-migration snapshot. Record the source data schema and approved rollback procedure. Mark device control temporarily unavailable while switching.
5. Durably record the source path, candidate path, snapshot, and pending activation. Stop the old application and release its GPIO resources. Switch `current` using a same-filesystem atomic rename, synchronizing the relevant directories, before starting the candidate.
6. Run the candidate's approved migration and start it under the stable supervisor. Give readiness a bounded deadline and retry budget. Check the actual release, API readiness, configuration, data schema, schedule initialization, and GPIO initialization without toggling physical outputs. Keep normal writes and schedule execution paused until confirmation. Cloud availability is not a condition for declaring the local installation healthy.
7. Confirm the candidate only after successful readiness and a bounded probation period. Persist the confirmed release before reporting completion. Resume normal operations, retain the previous eligible release and snapshot, and send the cloud its final job event when reachable. Clean up obsolete artifacts only after confirmation, and never delete a release or snapshot referenced by an unfinished transaction.
8. If activation or probation fails, restore the recorded release and its compatible data state. Verify recovery, then report `rolled_back`; if recovery also fails, enter `recovery_required`. Never retry the failed candidate indefinitely.

Keep the journal outside both releases. Use atomic writes, file and directory synchronization, a monotonic event sequence, and an exclusive writer. Record `jobId`, source/target releases, current phase, selected release, previous confirmed release, snapshot identity, activation attempts, confirmation status, and sanitized failure details. Treat an unreadable journal as a recovery condition, not a fresh installation.

Use phases such as `queued`, `downloading`, `verifying`, `preparing`, `backing_up`, `switching`, `restarting`, `checking`, and `completed`. Terminal failure outcomes are `failed` before activation, `rolled_back` after successful restoration, and `recovery_required` if restoration fails. Persist `rolling_back` while restoration is in progress. Report byte progress where measurable and phase labels elsewhere; do not invent a completion percentage for a restart. Allow cancellation only before the activation transaction begins.

### Power loss and application failure

On every startup, inspect the journal before selecting an application. Resume safe preparation or discard an incomplete candidate while retaining the working release. If activation was pending or the candidate was not confirmed, conservatively restore the previous confirmed release and its recorded data state. Make every recovery step repeatable if power is lost again during restoration.

For a crash loop during probation, the independent supervisor owns the failure counter and rollback decision. The candidate must not be able to mark itself healthy merely by writing its version into a file. If the last confirmed release later fails too, start maintenance recovery mode instead of repeatedly restarting a broken application. Provide an explicit admin repair action for failures outside the automatic probation window.

Do not rely on code rollback alone after a data migration. Prefer reversible, backward-compatible migrations. If restoring a snapshot is necessary, block normal writes until confirmation or use a documented replay mechanism; never silently erase changes accepted after the snapshot. A manual rollback after normal use resumes requires the old release to read the current data schema or a lossless reverse migration; the pre-update snapshot alone is insufficient. Reject an OTA release that cannot provide a valid rollback strategy.

Define the hardware behavior during stop, boot, and rollback for every supported relay/device type. Do not promise unchanged outputs across process or Pi restarts. Apply the approved safe state and reconcile actual state afterward. Decide how missed schedules are handled so recovery cannot replay an unsafe sequence of actions.

### Recovery mode and backups

Keep maintenance authentication, trusted keys, local discovery, durable status, and approved restoration available when the candidate cannot import or the cloud/tunnel is unavailable. The maintenance component must not import the candidate's modules or depend on its virtual environment. The normal application update must not replace the bootstrap or tunnel configuration. Upgrade the bootstrap only through a separately recoverable procedure.

Offer an authenticated LAN recovery path and an SSH/physical procedure when remote access fails. Never expose an unauthenticated repair endpoint or serve private snapshots through public status routes. A mobile network timeout during restart means **Reconnecting**, not proof of an installation failure. Reconcile with the same job ID after reconnecting.

Keep a verified local snapshot plus an optional encrypted off-device backup with retention and a restore procedure. Protect keys separately from backups. Include persistent stores, necessary private deployment settings, schema versions, and integrity metadata. A backup on the same SD card cannot recover from card loss. Monitor free space and retain enough reserved capacity to write failure and recovery state.

For a bootable Pi, restoration selects the last verified compatible release and restores data under the maintenance lock. For a failed SD card or unbootable OS, reinstall a supported image and bootstrap, then restore the owner's data. Restoring to replacement hardware must revoke the old controller credentials and re-pair the replacement; do not run two Pis with a copied installation identity or tunnel token. Verify recovery through an actual restore exercise before enabling production updates.

## Mobile screens and progress

Follow [UI-DESIGN-STANDARDS.md](../mobile/UI-DESIGN-STANDARDS.md). Add the firmware route to `Routes` and the server/controller endpoints to `ApiRoutes`. Use the shared query/mutation hooks and response types; extend the query hook with an explicit public-request mode for pre-login policy checks while retaining its authenticated default.

On Home entry, foreground return, or manual refresh, query release policy and the selected house's controller versions. Cache availability, show the observation time when stale, and distinguish **Offline**, **Bootstrap required**, **Up to date**, **Update available**, **Update required**, and **Recovery required**. Do not claim the Pi itself is checking on a schedule.

The Home banner opens **Settings > Firmware updates** scoped to the current house. List every controller separately with installed/available versions, release notes linked to GitHub, connection state, and last outcome. Admins get the update action; other members get an explanation that a house admin must update it. Verify admin membership again when starting work. Default to updating one controller at a time, not the whole house at once.

Before starting, explain the brief interruption and obtain the admin's update action. Store the job ID locally so navigation or app termination does not lose the operation. Poll progress only while following an active job, with backoff during restart; alternatively use an authenticated event stream with reconnection. The controller journal is authoritative and the cloud holds a synchronized copy with a freshness timestamp.

Show the current stage, actual running version, retryable error, rollback result, and the next available action. Prevent duplicate submissions while reconciling uncertain requests. Treat leaving the screen as leaving progress monitoring, not cancelling installation. Keep details readable with large text and announce progress stages without relying on color alone.

## Mobile OTA delivery

Set up an Expo project and preview/production update channels. From `mobile/`, use the repository's package-manager convention to install and configure OTA support:

```sh
npx expo install expo-updates
npx eas-cli@latest update:configure
```

Configure `updates.url`, the EAS project identity, and the corresponding channels in the app configuration and `eas.json`. Build and distribute a new native application once to include OTA support. Future compatible JavaScript and asset updates can use EAS; native dependency, permission, and SDK changes require another binary. Follow the [EAS Update setup guide](https://docs.expo.dev/eas-update/getting-started/) and [Expo 57 Updates reference](https://docs.expo.dev/versions/v57.0.0/sdk/updates/).

Choose and verify native runtime compatibility independently of the shared release version. An explicitly managed runtime is suitable when the release process checks native changes; change it whenever native compatibility changes. Expo also provides a fingerprint policy, but verify its actual result for every release, including version/configuration changes. Do not automatically derive runtime from every shared release bump and assume an older binary can receive that update. Publish compatible backports separately for every native runtime still supported. See [runtime versions](https://docs.expo.dev/eas-update/runtime-versions/).

Record the effective JavaScript release in bundled metadata for API compatibility checks. Also record the installed binary version/build, runtime, and OTA update ID. A newer bundle cannot change the binary's native version or make an incompatible runtime acceptable. Use native build requirements when a mandatory upgrade requires native capabilities.

For a configured production channel, a release command is:

```sh
npx eas-cli@latest update --channel production --environment production --message "Control Nest <VERSION>"
```

Replace `<VERSION>` with the shared release version. Validate on a preview build first. Check for mobile updates on launch/foreground, then download and apply them at a suitable restart point without losing an in-progress user action. For a native update, show the approved store or signed APK installation link; the user completes the OS/store installation flow. Preserve Android signing identity and increasing platform build numbers for replacement binaries.

Keep a working embedded bundle, retain Expo's update recovery protections, and prepare a rollback/republish procedure for each supported runtime. Application data changes must also permit the fallback bundle to run. If end-to-end OTA signing is required, configure the certificate and private-key lifecycle before building; check the account requirements in [Expo code signing](https://docs.expo.dev/eas-update/code-signing/). Never bundle signing keys or release-service credentials into the mobile app.

## Mandatory upgrades

For a hypothetical required `2.0.0` rollout, set the mobile and controller minimum supported releases to `2.0.0` only after their installation paths work for the affected users. Check semver numerically, not as strings. Preserve earlier versions until policy activation and retain a supported migration path for users several releases behind.

Apply a mobile-wide gate when the running mobile release or native runtime/build is unsupported. Show the version required and an action to apply a compatible OTA update or install the new binary. Apply a controller-specific gate to incompatible operations for each outdated controller; other supported controllers and house administration should remain usable.

Enforce the compatibility decision on both cloud and controller paths. New mobile versions send effective release and contract metadata through shared networking, but that metadata is not an authorization credential. Keep missing metadata compatible for known legacy clients during migration; once a major floor is active, return an actionable update-required response rather than silently treating missing versions as current. Existing controllers need bootstrap before they can enforce their side of this policy.

Never let the gate block policy discovery, sign-in, membership verification, update authorization, job status, or recovery. An automatic fallback may temporarily run below the required floor: permit recovery/status, explain any remaining normal-operation restrictions, and offer a corrected release. Do not reinstall the failed target automatically or globally lower the compatibility floor for one failed device.

Cache the last verified policy with its revision and freshness. When disconnected, retain the last established minimum and show its age and connection state. A failed refresh alone must not raise the minimum or block a previously allowed release. An expired authorization cannot start a new update; accepted transactions can still complete or restore locally. Mandatory policy alone must not switch relays off or terminate autonomous schedules; hardware behavior follows the controller's safe-state design.

## Release publication and activation

Follow [AGENTS.md](../AGENTS.md#release-workflow) for exact tagging and `gh` commands. Keep [releases.md](releases.md) as one linked line per published release; put detailed changelogs and resources on GitHub Releases.

1. Prepare the shared version, signed controller manifest, architecture-specific packages and dependencies, server archive, mobile OTA/binary artifacts, checksums, and migration/recovery instructions from one exact commit. Build from a clean checkout and exclude private environment files and controller state.
2. Deploy compatible server support and additive database migrations first. Preserve the old controller and mobile paths. Prepare any intermediate updater or data migrations before offering the final target.
3. Create and push the annotated version tag. Use `gh release create` to create a draft, review its changelog, and use `gh release upload` to attach verified resources. Publish only after all required resources and rollback procedures are ready.
4. Distribute the mobile OTA update or native binary to its intended audience. Register the published controller manifest in the server catalog and offer it to a small eligible group. Controller installation still requires a house admin to tap Update.
5. Observe successful updates, failures, restorations, and stale reports before widening eligibility. Revoke a faulty target to stop new authorizations while allowing accepted jobs to recover. Retain a corrected release and mobile rollback path.
6. Activate mandatory major-version floors only after distribution, compatibility, and recovery have been verified. Record the published release's actual GitHub URL in the single-line ledger. Release publication, server deployment, update availability, and device installation are separate states.

Keep release-signing keys, job-signing keys, Expo credentials, and GitHub credentials in private infrastructure. Define any new server environment variables in `server/src/env/vars.ts`. Pi configuration contains public verification keys and its own private identity only; `EXPO_PUBLIC_` configuration contains public values only. Document names, ownership, provisioning, and rotation without recording secret values.

## Implementation sequence

1. **Contracts and policy:** document existing controller contracts; define release, manifest, job, policy, progress, and recovery schemas. Add the shared version metadata and server storage/services/routes. Decide supported Pi targets, safe GPIO states, migration rules, and minimum native builds.
2. **Controller bootstrap and recovery:** implement the protected supervisor, journal, signed artifact verification, separate environments, snapshots, activation, readiness, rollback, LAN recovery authorization, and manual restore procedure. Prove restoration before enabling updates in mobile.
3. **Bootstrap existing installations:** provide an explicit installer/SSH maintenance step that preserves identity, private configuration, persistent stores, and the old working copy. Configure narrowly scoped noninteractive installation privileges and stable discovery/tunnel routing. Install the new OTA-enabled mobile binary. Do not publish a mandatory floor that existing installations have no way to satisfy.
4. **Mobile controller workflow:** add availability queries, the Home banner, Firmware updates settings, admin actions, progress reconciliation, and recovery actions. Keep existing configuration/switch requests unchanged.
5. **Mobile OTA and mandatory gates:** configure EAS channels/runtimes, effective release metadata, native installation links, cached policy behavior, compatibility error handling, and recovery exemptions.
6. **Release operations:** automate artifact generation, signing, checksums, `gh` publication, catalog activation, observability, and rollback runbooks. Start with optional admin-initiated updates on a small set of controllers before mandatory upgrades.

## Acceptance checks

Perform these checks on development builds and representative Pi hardware. Do not write tests unless the user requests them; these are manual acceptance and recovery exercises. When mobile code changes, run its required lint and typecheck commands. Run appropriate existing server/controller checks for their implementation changes.

- Verify a supported older mobile and controller can still configure and switch devices with a newer server; verify a new mobile works with an older supported controller and recognizes a pre-bootstrap controller correctly.
- Verify a non-admin, an admin from another house, a revoked controller, an expired/replayed ticket, and a tampered target cannot start an update. Verify a repeated legitimate request returns the same job.
- Verify the Home banner, per-controller Settings information, progress accessibility, and reconnection after app termination, network loss, and tunnel interruption. Verify stale cloud status cannot overwrite a terminal local result.
- Interrupt download, exhaust staging space, corrupt an archive/signature, and fail dependency preparation. Confirm the old installation remains usable and no private configuration is replaced.
- Trigger migration failure, startup failure, GPIO initialization failure, readiness timeout, and repeated candidate crashes. Confirm bounded automatic rollback and an accurate mobile outcome.
- Cut power during snapshot creation, release selection, migration, readiness, rollback, and final confirmation. Confirm each startup selects or restores a consistent code/data pair without a retry loop. Use a hardware setup where interrupting power is safe.
- Break both application releases and disable cloud access. Confirm authenticated LAN recovery or the documented SSH/physical procedure still works, and ordinary LAN users cannot access repair controls.
- Restore an encrypted off-device backup onto replacement storage and exercise replacement-hardware re-pairing without duplicating the old controller identity. Verify schedules, configuration, and intended GPIO state after recovery.
- Apply and revert a mobile OTA update on every supported native runtime. Verify native changes use a new binary and fallback bundles can still read application data.
- Activate a hypothetical mandatory major policy. Confirm old normal operations are gated, upgrade/recovery paths remain usable, an admin can complete the update, and a member receives a clear admin-required message. Verify behavior for offline devices and unsupported native builds.

Release readiness requires demonstrated restoration and preserved API compatibility, not just a successful installation.
