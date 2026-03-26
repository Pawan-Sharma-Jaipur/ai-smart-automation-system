@echo off
echo ========================================
echo EXPO APK BUILD - Step by Step
echo ========================================

echo.
echo Step 1: Login to Expo
echo ----------------------
call eas login

echo.
echo Step 2: Configure Project
echo -------------------------
call eas build:configure

echo.
echo Step 3: Build APK (Cloud - Free!)
echo ----------------------------------
call eas build -p android --profile preview

echo.
echo ========================================
echo BUILD STARTED!
echo.
echo Expo will build APK on their servers.
echo You'll get download link in 5-10 minutes.
echo.
echo Download APK and install on phone!
echo ========================================

pause
