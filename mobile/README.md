# Control Nest Mobile

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

From the `mobile` directory, run:

```powershell
    npx expo prebuild --platform android
    cd android
    .\gradlew.bat assembleRelease
```

This builds the Android `release` variant using the release signing configuration in the native Gradle project. The APK is written to `android\app\build\outputs\apk\release\app-release.apk`.

## Houses and controller setup

Register on the website with email and create a house. Add one named controller per Pi and copy its one-time API key. In the app, sign in with the same email, open **Houses & controllers**, select the Pi on your trusted Wi-Fi, and paste the key. Alternatively, pair on the Pi using its setup script. Tap **Refresh houses & controllers**, select your house, and choose **Open house**.

**Settings / Houses & controllers** lets you switch houses and pair additional controllers. Adding a device now requires choosing its controller; free GPIO pins are scoped to that controller across every room. Members use Clerk accounts and do not enter a separate house password.

API keys are held only while submitting setup, cleared after pairing, and persisted by the Pi's `JsonStore`. The app stores public house/controller IDs, names, and hostnames. It never stores controller keys or Cloudflare tunnel tokens. Build variables remain `EXPO_PUBLIC_SERVER_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` only.
