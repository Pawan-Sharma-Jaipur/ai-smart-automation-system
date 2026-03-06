@echo off
color 0B
echo.
echo ========================================
echo   MANUAL SERVICE STARTER
echo   Start services one by one
echo ========================================
echo.

:menu
echo.
echo Choose a service to start:
echo.
echo 1. API Gateway (Port 3000)
echo 2. AI Service (Port 3002)
echo 3. User Service (Port 3003)
echo 4. Blockchain Service (Port 3004)
echo 5. Start ALL Services
echo 6. Check Service Status
echo 7. Exit
echo.
set /p choice="Enter choice (1-7): "

if "%choice%"=="1" goto gateway
if "%choice%"=="2" goto ai
if "%choice%"=="3" goto user
if "%choice%"=="4" goto blockchain
if "%choice%"=="5" goto all
if "%choice%"=="6" goto status
if "%choice%"=="7" exit
goto menu

:gateway
echo.
echo Starting API Gateway...
cd services\api-gateway
start "API Gateway" cmd /k "npm start"
cd ..\..
echo API Gateway started in new window
timeout /t 2 >nul
goto menu

:ai
echo.
echo Starting AI Service...
cd services\ai-service
start "AI Service" cmd /k "npm start"
cd ..\..
echo AI Service started in new window
timeout /t 2 >nul
goto menu

:user
echo.
echo Starting User Service...
cd services\user-service
start "User Service" cmd /k "npm start"
cd ..\..
echo User Service started in new window
timeout /t 2 >nul
goto menu

:blockchain
echo.
echo Starting Blockchain Service...
cd services\blockchain-service
start "Blockchain Service" cmd /k "npm start"
cd ..\..
echo Blockchain Service started in new window
timeout /t 2 >nul
goto menu

:all
echo.
echo Starting all services...
echo.
echo [1/4] AI Service...
cd services\ai-service
start "AI Service" cmd /k "npm start"
cd ..\..
timeout /t 3 >nul

echo [2/4] User Service...
cd services\user-service
start "User Service" cmd /k "npm start"
cd ..\..
timeout /t 3 >nul

echo [3/4] Blockchain Service...
cd services\blockchain-service
start "Blockchain Service" cmd /k "npm start"
cd ..\..
timeout /t 3 >nul

echo [4/4] API Gateway...
cd services\api-gateway
start "API Gateway" cmd /k "npm start"
cd ..\..
timeout /t 5 >nul

echo.
echo All services started!
echo Wait 10 seconds for services to initialize...
timeout /t 10 >nul
goto status

:status
echo.
echo ========================================
echo   Checking Service Status...
echo ========================================
echo.

echo Testing API Gateway (3000)...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API Gateway is running
) else (
    echo [FAIL] API Gateway is not responding
)

echo Testing AI Service (3002)...
curl -s http://localhost:3002/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] AI Service is running
) else (
    echo [FAIL] AI Service is not responding
)

echo Testing User Service (3003)...
curl -s http://localhost:3003/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] User Service is running
) else (
    echo [FAIL] User Service is not responding
)

echo Testing Blockchain Service (3004)...
curl -s http://localhost:3004/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Blockchain Service is running
) else (
    echo [FAIL] Blockchain Service is not responding
)

echo.
echo ========================================
goto menu
