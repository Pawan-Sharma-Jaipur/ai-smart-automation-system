@echo off
echo ========================================
echo Android SDK Setup and APK Build
echo ========================================

set SDK_DIR=%LOCALAPPDATA%\Android\Sdk

echo.
echo Checking for Android SDK...

if exist "%SDK_DIR%" (
    echo [OK] Android SDK found at: %SDK_DIR%
    goto BUILD
)

echo.
echo [!] Android SDK not found
echo.
echo OPTION 1 - Install Android Studio (Recommended):
echo 1. Download: https://developer.android.com/studio
echo 2. Install Android Studio
echo 3. Run this script again
echo.
echo OPTION 2 - Install SDK Command Line Tools Only:
echo 1. Download: https://developer.android.com/studio#command-tools
echo 2. Extract to: %SDK_DIR%\cmdline-tools\latest
echo 3. Run this script again
echo.
pause
exit /b 1

:BUILD
echo.
echo Creating local.properties...
(
echo sdk.dir=%SDK_DIR:\=\\%
) > android\local.properties

echo.
echo [1/3] Cleaning previous builds...
cd android
call gradlew.bat clean

echo.
echo [2/3] Building Debug APK...
call gradlew.bat assembleDebug

echo.
echo [3/3] Build Complete!
echo.
echo ========================================
echo APK Created:
echo %CD%\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To Install on Phone:
echo 1. Copy APK to phone via USB/Email/Drive
echo 2. Enable "Install Unknown Apps" in Settings
echo 3. Open APK and tap Install
echo ========================================
echo.

cd ..
pause
