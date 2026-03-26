@echo off
echo ========================================
echo REBUILD REACT NATIVE APP - PRODUCTION
echo ========================================

cd ..

echo.
echo [1/5] Removing old android-app...
rmdir /S /Q android-app

echo.
echo [2/5] Creating fresh React Native project...
call npx @react-native-community/cli init SmartphoneAutomation --version 0.72.0

echo.
echo [3/5] Renaming to android-app...
move SmartphoneAutomation android-app

echo.
echo [4/5] Installing dependencies...
cd android-app
call npm install react-native-camera axios @react-native-async-storage/async-storage

echo.
echo [5/5] Copying App.js and native modules...
echo Ready to copy your App.js, AppLockModule.java, etc.

echo.
echo ========================================
echo PROJECT REBUILT!
echo.
echo Next Steps:
echo 1. Copy your App.js
echo 2. Copy native modules (AppLockModule.java, etc.)
echo 3. Update AndroidManifest.xml
echo 4. Build: cd android && gradlew.bat assembleRelease
echo ========================================

pause
