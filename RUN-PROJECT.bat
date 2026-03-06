@echo off
color 0A
cls
echo.
echo ========================================
echo   AI AUTOMATION SYSTEM - QUICK START
echo ========================================
echo.

cd backend

echo [Step 1/4] Installing dependencies...
if not exist node_modules (
    copy package-simple.json package.json >nul 2>&1
    call npm install --silent
    echo ✓ Dependencies installed
) else (
    echo ✓ Dependencies already installed
)

echo.
echo [Step 2/4] Starting Backend Server...
start "AI Automation Backend" cmd /k "node server-simple.js"
timeout /t 3 >nul

cd ..

echo.
echo [Step 3/4] Opening Main Dashboard...
start "" "frontend\dashboard.html"
timeout /t 2 >nul

echo.
echo [Step 4/4] Opening Admin Panel...
start "" "frontend\admin.html"
timeout /t 2 >nul

echo.
echo ========================================
echo   ✓ SYSTEM STARTED SUCCESSFULLY!
echo ========================================
echo.
echo 📡 Backend API: http://localhost:3000
echo 🏥 Health Check: http://localhost:3000/health
echo 📊 Dashboard: Opened in browser
echo 👨‍💼 Admin Panel: Opened in browser
echo.
echo 👥 Test Login:
echo    Username: admin
echo    Password: admin123
echo.
echo ========================================
echo.
echo Press any key to open health check...
pause >nul
start http://localhost:3000/health
