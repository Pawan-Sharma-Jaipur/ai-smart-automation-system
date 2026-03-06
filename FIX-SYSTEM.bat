@echo off
color 0E
echo.
echo ========================================
echo   SYSTEM DIAGNOSTIC & FIX
echo ========================================
echo.

echo [1] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not installed!
    echo Download from: https://nodejs.org
    pause
    exit
) else (
    echo [OK] Node.js installed
)

echo.
echo [2] Checking if ports are free...
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is busy!
    echo Killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr :3002 >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3002 is busy!
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr :3003 >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3003 is busy!
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr :3004 >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3004 is busy!
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004') do taskkill /PID %%a /F >nul 2>&1
)

echo [OK] All ports are now free

echo.
echo [3] Installing dependencies...
echo Installing shared dependencies...
cd services\shared
call npm install >nul 2>&1
cd ..\..

echo Installing API Gateway...
cd services\api-gateway
call npm install >nul 2>&1
cd ..\..

echo Installing AI Service...
cd services\ai-service
call npm install >nul 2>&1
cd ..\..

echo Installing User Service...
cd services\user-service
call npm install >nul 2>&1
cd ..\..

echo Installing Blockchain Service...
cd services\blockchain-service
call npm install >nul 2>&1
cd ..\..

echo [OK] All dependencies installed

echo.
echo [4] Testing API Gateway startup...
cd services\api-gateway
echo Starting API Gateway (wait 5 seconds)...
start /B node src\server.js > gateway.log 2>&1
timeout /t 5 >nul

echo.
echo [5] Checking if API Gateway started...
curl http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] API Gateway is running!
    echo.
    echo Check: http://localhost:3000/health
) else (
    echo [ERROR] API Gateway failed to start!
    echo.
    echo Check the error log:
    type gateway.log
    echo.
    echo Common issues:
    echo 1. MySQL not running in XAMPP
    echo 2. Database not created
    echo 3. Wrong database credentials
)

cd ..\..
echo.
echo ========================================
echo   DIAGNOSTIC COMPLETE
echo ========================================
echo.
pause
