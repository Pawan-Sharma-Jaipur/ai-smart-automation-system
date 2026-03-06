@echo off
color 0A
echo.
echo ========================================
echo   AI AUTOMATION ENTERPRISE SYSTEM
echo   Complete Microservices Startup
echo ========================================
echo.

echo [1/6] Starting AI Service (Port 3002)...
start "AI Service" cmd /k "cd services\ai-service && npm start"
timeout /t 3 >nul

echo [2/6] Starting User Service (Port 3003)...
cd services\user-service
if not exist node_modules (npm install >nul 2>&1)
start "User Service" cmd /k "npm start"
cd ..\..
timeout /t 3 >nul

echo [3/6] Starting Blockchain Service (Port 3004)...
cd services\blockchain-service
if not exist node_modules (npm install >nul 2>&1)
start "Blockchain Service" cmd /k "npm start"
cd ..\..
timeout /t 3 >nul

echo [4/6] Starting API Gateway (Port 3000)...
start "API Gateway" cmd /k "cd services\api-gateway && npm start"
timeout /t 5 >nul

echo [5/6] Opening Main Dashboard...
start "" "frontend\dashboard.html"
timeout /t 2 >nul

echo [6/6] Opening Admin Panel...
start "" "frontend\admin.html"
timeout /t 2 >nul

echo.
echo ========================================
echo   SYSTEM STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Services Running:
echo   [*] API Gateway     : http://localhost:3000
echo   [*] AI Service      : http://localhost:3002
echo   [*] User Service    : http://localhost:3003
echo   [*] Blockchain      : http://localhost:3004
echo.
echo Dashboards Opened:
echo   [*] Main Dashboard
echo   [*] Admin Panel
echo.
echo Health Check: http://localhost:3000/health
echo.
echo Press any key to open health check...
pause >nul
start http://localhost:3000/health
