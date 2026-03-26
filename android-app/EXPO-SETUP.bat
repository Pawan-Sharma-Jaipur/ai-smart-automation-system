@echo off
echo ========================================
echo EXPO SETUP - Easy APK Build
echo ========================================

cd ..

echo.
echo [1/4] Installing Expo CLI...
call npm install -g expo-cli eas-cli

echo.
echo [2/4] Creating Expo project...
call npx create-expo-app@latest SmartphoneAutomationExpo --template blank

echo.
echo [3/4] Installing dependencies...
cd SmartphoneAutomationExpo
call npx expo install expo-camera axios @react-native-async-storage/async-storage

echo.
echo [4/4] Copying App.js...
copy ..\android-app\App.js App.js

echo.
echo ========================================
echo SETUP COMPLETE!
echo.
echo Next Steps:
echo 1. cd SmartphoneAutomationExpo
echo 2. npx expo start
echo 3. Scan QR code with Expo Go app
echo.
echo To build APK:
echo eas build -p android --profile preview
echo ========================================

pause
