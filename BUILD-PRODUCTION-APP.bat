@echo off
echo ========================================
echo PRODUCTION MOBILE APP - FLUTTER
echo ========================================

echo.
echo [1/5] Installing Flutter...
echo Download from: https://docs.flutter.dev/get-started/install/windows
echo.
pause

echo.
echo [2/5] Creating Flutter project...
call flutter create smartphone_automation_app
cd smartphone_automation_app

echo.
echo [3/5] Adding dependencies...
(
echo dependencies:
echo   flutter:
echo     sdk: flutter
echo   camera: ^0.10.5
echo   http: ^1.1.0
echo   shared_preferences: ^2.2.2
echo   google_ml_kit: ^0.16.0
) > pubspec.yaml

echo.
echo [4/5] Building APK...
call flutter build apk --release

echo.
echo [5/5] APK Ready!
echo.
echo ========================================
echo APK Location:
echo build\app\outputs\flutter-apk\app-release.apk
echo.
echo Copy this APK to client!
echo ========================================

pause
