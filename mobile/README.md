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
