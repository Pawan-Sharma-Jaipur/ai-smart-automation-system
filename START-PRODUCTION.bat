@echo off
color 0A
echo.
echo ========================================
echo   PRODUCTION-LEVEL SYSTEM STARTUP
echo ========================================
echo.

echo [1/3] Starting Enhanced AI Service (Port 3002)...
start "AI Service Enhanced" cmd /k "cd services\ai-service && node server-improved.js"
timeout /t 3 >nul

echo [2/3] Starting User Service (Port 3003)...
start "User Service" cmd /k "cd services\user-service && npm start"
timeout /t 3 >nul

echo [3/3] Starting Improved API Gateway (Port 3000)...
start "API Gateway Enhanced" cmd /k "cd services\api-gateway && node server-improved.js"
timeout /t 5 >nul

echo.
echo ========================================
echo   PRODUCTION SYSTEM STARTED!
echo ========================================
echo.
echo Enhanced Features:
echo   [*] Structured Logging (Winston)
echo   [*] RBAC with Granular Permissions
echo   [*] Circuit Breaker Protection
echo   [*] Redis Caching (if available)
echo   [*] Input Sanitization
echo   [*] Enhanced AI Predictions
echo.
echo Services:
echo   [*] API Gateway     : http://localhost:3000
echo   [*] AI Service      : http://localhost:3002
echo   [*] User Service    : http://localhost:3003
echo.
echo Health Check: http://localhost:3000/health
echo.
echo Opening dashboards...
timeout /t 2 >nul
start "" "frontend\dashboard.html"
start "" "frontend\admin.html"

echo.
echo Press any key to open health check...
pause >nul
start http://localhost:3000/health
