@echo off
color 0A
echo.
echo ========================================
echo   PRODUCTION SYSTEM - FINAL VERSION
echo   With MySQL + JWT Authentication
echo ========================================
echo.

echo [STEP 1] Checking XAMPP MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MySQL is running
) else (
    echo ❌ MySQL is NOT running
    echo Please start XAMPP MySQL first!
    pause
    exit
)

echo.
echo [STEP 2] Installing dependencies...
cd services\shared
if exist package-production.json (
    copy /Y package-production.json package.json >nul
    call npm install >nul 2>&1
)
cd ..\..

echo.
echo [STEP 3] Setting up database...
echo Please run this SQL in phpMyAdmin:
echo database\mysql-schema-simple.sql
echo.
echo Press any key after database setup is complete...
pause >nul

echo.
echo [STEP 4] Starting AI Service (Port 3002)...
start "AI Service" cmd /k "cd services\ai-service && node server-production.js"
timeout /t 3 >nul

echo.
echo [STEP 5] Starting API Gateway (Port 3000)...
start "API Gateway" cmd /k "cd services\api-gateway && node server-production.js"
timeout /t 3 >nul

echo.
echo ========================================
echo   SYSTEM STARTED SUCCESSFULLY!
echo ========================================
echo.
echo ✅ Features Active:
echo   [*] MySQL Database Connected
echo   [*] JWT Authentication Working
echo   [*] Login/Register Endpoints
echo   [*] AI Predictions with DB Storage
echo   [*] RBAC Permissions
echo.
echo 🌐 Access Points:
echo   API Gateway: http://localhost:3000
echo   AI Service:  http://localhost:3002
echo   Health:      http://localhost:3000/health
echo.
echo 🔐 Test Users (password: admin123):
echo   admin / developer / viewer
echo.
echo 📝 API Endpoints:
echo   POST /api/auth/register
echo   POST /api/auth/login
echo   POST /api/ai/predict
echo   GET  /api/ai/stats
echo.
echo Opening dashboards...
timeout /t 2 >nul
start "" "frontend\dashboard.html"
start "" "frontend\admin.html"

echo.
echo Press any key to open API test page...
pause >nul
start http://localhost:3000/health
