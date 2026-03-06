@echo off
echo ========================================
echo Starting Enterprise Dashboards
echo ========================================
echo.

echo Opening dashboards in browser...
echo.

echo [1/2] Main Dashboard
start "" "dashboard.html"
timeout /t 2 >nul

echo [2/2] Admin Panel
start "" "admin.html"
timeout /t 2 >nul

echo.
echo ========================================
echo Dashboards Opened Successfully!
echo ========================================
echo.
echo Available Dashboards:
echo   - Main Dashboard (System Overview, AI Predictions)
echo   - Admin Panel (User Management, Logs)
echo.
echo Make sure these services are running:
echo   - API Gateway: http://localhost:3000
echo   - AI Service: http://localhost:3002
echo.
echo Check service status:
echo   http://localhost:3000/health
echo.
pause
