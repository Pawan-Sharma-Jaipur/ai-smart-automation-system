# Android App - Build Instructions

## Quick Build (No Android Studio Required)

### Option 1: Build APK Directly
```bash
BUILD-APK.bat
```

This will create: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Manual Build
```bash
cd android
gradlew.bat assembleDebug
```

## Install APK on Phone

1. Copy `app-debug.apk` to your phone
2. Enable "Install from Unknown Sources" in Settings
3. Open APK file and install

## If You Get Errors

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### "Gradle not found"
The project includes `gradlew.bat` - use that instead of system gradle.

## Testing Without Phone

Install Android Studio and create an emulator, then:
```bash
npm run android
```

But for production deployment, just build the APK and install on real device.
