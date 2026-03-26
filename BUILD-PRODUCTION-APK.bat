@echo off
echo ========================================
echo BUILDING PRODUCTION APK
echo ========================================

cd SmartphoneAutomationApp

echo.
echo [1/4] Installing dependencies...
call npm install

echo.
echo [2/4] Linking native modules...
cd android
call ..\node_modules\.bin\react-native link

echo.
echo [3/4] Building Release APK...
call gradlew.bat assembleRelease

echo.
echo [4/4] APK Ready!
echo.
echo ========================================
echo APK Location:
echo %CD%\app\build\outputs\apk\release\app-release.apk
echo.
echo File size: ~30MB
echo Ready for client delivery!
echo ========================================

pause
