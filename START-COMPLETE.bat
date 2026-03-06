@echo off
color 0A
cls
echo.
echo ========================================
echo   AI AUTOMATION - COMPLETE SYSTEM
echo   Backend + Web + Mobile
echo ========================================
echo.

echo What do you want to start?
echo.
echo [1] Backend + Web Dashboards (Production)
echo [2] Mobile App Only
echo [3] Everything (Backend + Web + Mobile)
echo [4] Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto mobile
if "%choice%"=="3" goto all
if "%choice%"=="4" exit

:backend
cls
echo.
echo ========================================
echo   STARTING BACKEND + WEB
echo ========================================
echo.
call START-PRODUCTION.bat
goto end

:mobile
cls
echo.
echo ========================================
echo   STARTING MOBILE APP
echo ========================================
echo.
echo Make sure backend is running first!
echo.
pause
call START-MOBILE.bat
goto end

:all
cls
echo.
echo ========================================
echo   STARTING COMPLETE SYSTEM
echo ========================================
echo.

echo [1/2] Starting Backend + Web...
start "Backend + Web" cmd /c START-PRODUCTION.bat
timeout /t 5 >nul

echo [2/2] Starting Mobile App...
start "Mobile App" cmd /c START-MOBILE.bat

echo.
echo ========================================
echo   ALL SYSTEMS STARTED!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Web Dashboard: Opened in browser
echo Mobile App: Check Expo terminal
echo.
echo ========================================
pause
goto end

:end
