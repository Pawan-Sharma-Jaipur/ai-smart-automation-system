@echo off
setlocal EnableExtensions EnableDelayedExpansion
color 0A
title AI Smart Automation System Launcher
cd /d "%~dp0"

:menu
cls
echo ========================================
echo   AI SMART AUTOMATION SYSTEM
echo ========================================
echo.
echo Choose startup mode:
echo.
echo   [1] Microservices Mode
echo       API Gateway 3000, AI 3002, User 3003, Blockchain 3004
echo.
echo   [2] MySQL Monolith Mode
echo       Backend 3005 with MySQL frontend pages
echo.
echo   [3] Start Both Modes
echo       Microservices + MySQL backend together
echo.
echo   [4] Exit
echo.
set /p MODE=Enter choice (1-4): 

if "%MODE%"=="1" goto micro
if "%MODE%"=="2" goto mysql
if "%MODE%"=="3" goto both
if "%MODE%"=="4" goto end
goto menu

:micro
call :kill_port 3000
call :kill_port 3002
call :kill_port 3003
call :kill_port 3004

call :ensure_node_modules "services\shared"
call :ensure_node_modules "services\ai-service"
call :ensure_node_modules "services\user-service"
call :ensure_node_modules "services\blockchain-service"
call :ensure_node_modules "services\api-gateway"

echo.
echo Starting microservices mode...
start "AI Service :3002" cmd /k "cd /d %CD%\services\ai-service && npm start"
timeout /t 2 >nul
start "User Service :3003" cmd /k "cd /d %CD%\services\user-service && npm start"
timeout /t 2 >nul
start "Blockchain Service :3004" cmd /k "cd /d %CD%\services\blockchain-service && npm start"
timeout /t 2 >nul
start "API Gateway :3000" cmd /k "cd /d %CD%\services\api-gateway && npm start"

call :wait_for_url "http://localhost:3000/health" 20

start "" "%CD%\frontend\face-login.html"

echo.
echo Microservices mode started.
echo Gateway: http://localhost:3000
echo Health:  http://localhost:3000/health
echo Frontend: frontend\face-login.html
pause
goto end

:mysql
call :kill_port 3005
call :prepare_mysql_backend
call :ensure_node_modules "backend"

echo.
echo Starting MySQL mode...
start "MySQL Backend :3005" cmd /k "cd /d %CD%\backend && node server-mysql.js"

call :wait_for_url "http://localhost:3005/health" 25

start "" "http://localhost:3005/face-login-mysql.html"

echo.
echo MySQL mode started.
echo Backend: http://localhost:3005
echo Health:  http://localhost:3005/health
echo Login:   http://localhost:3005/face-login-mysql.html
echo Admin:   http://localhost:3005/admin-mysql.html
echo DB seed: database\mysql-schema-complete.sql
echo Default login: admin / password123
pause
goto end

:both
call :kill_port 3000
call :kill_port 3002
call :kill_port 3003
call :kill_port 3004
call :kill_port 3005

call :ensure_node_modules "services\shared"
call :ensure_node_modules "services\ai-service"
call :ensure_node_modules "services\user-service"
call :ensure_node_modules "services\blockchain-service"
call :ensure_node_modules "services\api-gateway"
call :prepare_mysql_backend
call :ensure_node_modules "backend"

echo.
echo Starting both modes...
start "AI Service :3002" cmd /k "cd /d %CD%\services\ai-service && npm start"
timeout /t 2 >nul
start "User Service :3003" cmd /k "cd /d %CD%\services\user-service && npm start"
timeout /t 2 >nul
start "Blockchain Service :3004" cmd /k "cd /d %CD%\services\blockchain-service && npm start"
timeout /t 2 >nul
start "API Gateway :3000" cmd /k "cd /d %CD%\services\api-gateway && npm start"
timeout /t 2 >nul
start "MySQL Backend :3005" cmd /k "cd /d %CD%\backend && node server-mysql.js"

call :wait_for_url "http://localhost:3000/health" 20
call :wait_for_url "http://localhost:3005/health" 25

start "" "%CD%\frontend\face-login.html"
start "" "http://localhost:3005/face-login-mysql.html"

echo.
echo Both modes started.
echo Gateway health: http://localhost:3000/health
echo MySQL health:   http://localhost:3005/health
echo MySQL login:    http://localhost:3005/face-login-mysql.html
pause
goto end

:prepare_mysql_backend
if exist "backend\package-mysql.json" copy /Y "backend\package-mysql.json" "backend\package.json" >nul
if exist "backend\.env.mysql" copy /Y "backend\.env.mysql" "backend\.env" >nul
goto :eof

:ensure_node_modules
if exist "%~1\node_modules" goto :eof
echo Installing dependencies in %~1 ...
pushd "%~1"
call npm install
popd
goto :eof

:wait_for_url
set "TARGET_URL=%~1"
set "MAX_TRIES=%~2"
if "%MAX_TRIES%"=="" set "MAX_TRIES=20"
set /a TRY_COUNT=0
:wait_loop
set /a TRY_COUNT+=1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing '%TARGET_URL%' -TimeoutSec 3; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :eof
if !TRY_COUNT! geq %MAX_TRIES% (
    echo Warning: %TARGET_URL% did not respond in time.
    goto :eof
)
timeout /t 1 >nul
goto wait_loop

:kill_port
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%~1 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
goto :eof

:end
endlocal
