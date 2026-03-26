@echo off
color 0A
echo ========================================
echo   AI AUTOMATION SYSTEM - MySQL
echo ========================================
echo.

echo Step 1: Installing dependencies...
cd backend
if not exist node_modules (
    echo Installing npm packages...
    copy package-mysql.json package.json
    copy .env.mysql .env
    call npm install
    echo.
)

echo Step 2: Starting Backend Server...
start "Backend Server" cmd /k "node server-mysql.js"
timeout /t 3 >nul

echo Step 3: Opening Dashboard...
cd ..
start "" "http://localhost:3005/face-login-mysql.html"
timeout /t 2 >nul

echo Step 4: Opening Admin Panel...
start "" "http://localhost:3005/admin-mysql.html"

echo.
echo ========================================
echo   SYSTEM STARTED!
echo ========================================
echo.
echo Backend: http://localhost:3005
echo Health: http://localhost:3005/health
echo.
echo IMPORTANT: Make sure MySQL is running!
echo Database: ai_automation
echo.
echo Run this SQL file first:
echo   database\mysql-schema-complete.sql
echo.
echo ========================================
pause
