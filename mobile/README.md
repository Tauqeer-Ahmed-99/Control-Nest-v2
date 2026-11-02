# Control Nest Mobile

## Install dependencies

Run `npm ci` from `mobile`. The committed `.npmrc` enables `legacy-peer-deps`
for local installs. Each build profile in `eas.json` also sets
`NPM_CONFIG_LEGACY_PEER_DEPS=true` for EAS Build's `npm ci --include=dev`, avoiding
the current React peer dependency conflict in `@rneui/base`'s testing dependencies.

## Run Android Development Build

From the `mobile` directory, run:

```powershell
npm run android
```

This runs the Android `debug` variant, installs it on a connected device or emulator, and starts Metro. It does not build the production `release` variant.

After changing Expo config or config plugins, sync the native project before running the command:

```powershell
npx expo prebuild --platform android
npm run android
```

## Build Production APK

Build the signed production APK with EAS from `mobile`:

```powershell
npx eas-cli@latest build --profile production --platform android
```

EAS uses the existing linked project, remote Android signing credentials, production environment and update channel. It manages increasing Android build numbers remotely; the shared app version stays explicitly set in `app.json`. The repository-root `.easignore` excludes server/controller files, private local environment files, dependencies and generated native output so EAS regenerates the native project from configuration.

For a local build instead:

From the `mobile` directory, run:

```powershell
    npx expo prebuild --platform android
    cd android
    .\gradlew.bat assembleRelease
```

This builds the Android `release` variant using the release signing configuration in the native Gradle project. The APK is written to `android\app\build\outputs\apk\release\app-release.apk`.

## Houses and controller setup

Sign in with your website account, choose a house, then tap **Open house**. Each account can access several houses; each house can contain several controllers. The app remembers the chosen house for that account on this phone. Switch houses from the house name on Home or **Settings > Your house**.

To connect a Pi:

1. Open **Settings > Controllers > Connect a controller** (or **Add > Controller**).
2. Keep the phone and Pi on the same trusted Wi-Fi. Choose the Pi from **Nearby controllers**. Local network permission is requested here.
3. Paste its controller API key. The app identifies the named controller and checks that it belongs to the selected house before submitting.
4. If you need a key, tap **Get a controller key** to add a named controller on the website. Return to the app, refresh controller entries, and paste the key.
5. Tap **Connect controller**, then **Done**. Repeat for additional Pis. Choose **Open house** when ready.

A house and each controller entry are created on the website. Alternatively, connect a Pi using its setup script. Members use their account email and do not need a separate house password or controller key for everyday control.

**Add** always offers Room, Device, and Controller. Device creation first asks for a name and room, then a controller and free header pin. Power rating is optional. Available GPIO pins are scoped to the selected controller across all rooms.

API keys are held only while submitting setup, cleared after pairing, and persisted by the Pi's `JsonStore`. The app stores public house/controller IDs, names, and hostnames. It never stores controller keys or Cloudflare tunnel tokens. OTA also uses the public `EXPO_PUBLIC_EAS_PROJECT_ID` and `EXPO_PUBLIC_OTA_POLICY_KEYS`; device-bound recovery grants are stored in SecureStore.

## OTA updates

**Settings > App updates** checks/downloads compatible EAS updates and offers a restart. **Settings > Firmware updates** lists every controller, its observed version, admin actions, durable job progress and LAN recovery. Home checks on entry, foreground return and pull-to-refresh. Members can follow updates; a current house admin must start an update or restore. Pending request IDs survive navigation/app termination, and uncertain delivery reuses its original idempotency key.

`expo-updates` requires a new native binary once. This app is linked to [@tauqeerahmed/cnm](https://expo.dev/accounts/tauqeerahmed/projects/cnm); the project UUID and owner are recorded in `app.json`. Development, preview and production EAS channels/environments are configured with the existing public API and Clerk settings and the `release-2026-11-02` policy verification key. Local public-key configuration is in ignored `.env.local`; no signing private key belongs in mobile. `app.config.ts` manages the independent `cn-native-1` runtime; native compatibility changes need a new runtime/binary. See [OTA operations](../docs/ota-operations.md) for setup, publication, runtime backports, policy floors and rollback acceptance.

## UI verification

Run `npm run lint`, `npx tsc --noEmit`, and `node --test tests/*.test.mjs` from `mobile` (the tests use Node's built-in TypeScript support on Node 22.18 or later).

The `/` entry route waits for Clerk and the saved house selection before redirecting
to sign-in, house selection, or Home. The splash uses the same readiness state so
startup cannot fall through to the not-found page while restoring local settings.
Unknown links show a safe-area-aware recovery screen with a button back to `/`.

Switch-hosting screens use React Native's `ScrollView` to keep controls mounted
through optimistic updates and form edits. The virtualized scroll wrapper's inline
header remounts its children on each parent render, which interrupts switch motion.
The shared switch runs its spring on the native animation driver, preserves an
in-flight spring when the parent acknowledges a tap, and retargets on external
changes or rollbacks. Reduce Motion uses an immediate state change.

Device walkthrough:

- Sign in; create an account; verify email; reset a password; use any enabled second factor. Confirm the keyboard leaves the current action reachable, and Back returns one step.
- Select two different houses and check that their rooms, controllers, and available pins change. Reopen the app and confirm it restores the last house for the same account.
- Connect two different Pis to one house. Confirm discovery, permission denial/recovery, no-results help, key refresh after returning from the website, a wrong-house key, and successful setup.
- Use Add from Home, Devices, Activity, and Settings. Add a room, then a device; change controller and confirm the pin belongs to the new one.
- Check device settings, schedule times, room shortcut, inline save feedback, and recent activity.
- Check light/dark appearance, large system text, Reduce Motion, Reduce Transparency (iOS), and increased contrast. iOS glass and time selection require an iOS device; an Android device cannot validate those paths.
