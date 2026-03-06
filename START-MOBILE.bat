@echo off
color 0A
cls
echo.
echo ========================================
echo   AI AUTOMATION - MOBILE APP SETUP
echo ========================================
echo.

cd mobile-app

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Install from nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js installed

echo.
echo [2/3] Installing dependencies...
if not exist node_modules (
    echo This may take a few minutes...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Installation failed!
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo ✓ Dependencies already installed
)

echo.
echo [3/3] Starting Expo...
echo.
echo ========================================
echo   MOBILE APP STARTING
echo ========================================
echo.
echo Options:
echo   - Press 'a' for Android emulator
echo   - Press 'i' for iOS simulator
echo   - Press 'w' for web browser
echo   - Scan QR code with Expo Go app
echo.
echo Backend must be running on:
echo   http://localhost:3000
echo.
echo ========================================
echo.

call npx expo start

pause
