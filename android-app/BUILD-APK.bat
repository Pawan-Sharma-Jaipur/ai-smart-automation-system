@echo off
echo ========================================
echo Building Android APK
echo ========================================

cd android

echo.
echo [1/3] Cleaning previous builds...
call gradlew.bat clean

echo.
echo [2/3] Building Debug APK...
call gradlew.bat assembleDebug

echo.
echo [3/3] Build Complete!
echo.
echo APK Location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo ========================================
echo Install APK on your phone:
echo 1. Copy APK to phone
echo 2. Enable "Install from Unknown Sources"
echo 3. Open APK and install
echo ========================================

pause
