@echo off
color 0A
echo ========================================
echo   SIMPLE AI AUTOMATION SYSTEM
echo   Starting with Database Integration
echo ========================================
echo.

echo [1/3] Starting Backend with Database...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 5 >nul

echo [2/3] Opening Dashboard...
start "" "frontend\dashboard.html"
timeout /t 2 >nul

echo [3/3] Opening Admin Panel...
start "" "frontend\admin.html"
timeout /t 2 >nul

echo.
echo ========================================
echo   SYSTEM STARTED!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Dashboard: Opened in browser
echo Admin Panel: Opened in browser
echo.
echo Press any key to exit...
pause >nul
