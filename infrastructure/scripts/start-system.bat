@echo off
echo ========================================
echo AI Automation Enterprise System Startup
echo ========================================
echo.

echo [1/5] Starting PostgreSQL Database...
cd database
call setup.bat
cd ..
timeout /t 3 >nul

echo.
echo [2/5] Installing API Gateway Dependencies...
cd services\api-gateway
if not exist node_modules (
    call npm install
)
cd ..\..

echo.
echo [3/5] Installing AI Service Dependencies...
cd services\ai-service
if not exist node_modules (
    call npm install
)
cd ..\..

echo.
echo [4/5] Starting AI Service (Port 3002)...
start "AI Service" cmd /k "cd services\ai-service && npm start"
timeout /t 5 >nul

echo.
echo [5/5] Starting API Gateway (Port 3000)...
start "API Gateway" cmd /k "cd services\api-gateway && npm start"
timeout /t 3 >nul

echo.
echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Services Running:
echo   - API Gateway:  http://localhost:3000
echo   - AI Service:   http://localhost:3002
echo   - Database:     localhost:5432
echo.
echo Health Check:    http://localhost:3000/health
echo.
echo Test Users:
echo   - superadmin / password123 (System Admin)
echo   - admin / password123 (Org Admin)
echo   - user1 / password123 (Regular User)
echo.
echo Press any key to open health check...
pause >nul
start http://localhost:3000/health
