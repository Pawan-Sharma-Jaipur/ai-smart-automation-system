@echo off
color 0B
echo.
echo ========================================
echo   INSTALLING ALL DEPENDENCIES
echo ========================================
echo.

echo [1/5] Installing Shared Dependencies...
cd services\shared
call npm install
cd ..\..

echo [2/5] Installing API Gateway...
cd services\api-gateway
call npm install
cd ..\..

echo [3/5] Installing AI Service...
cd services\ai-service
call npm install
cd ..\..

echo [4/5] Installing User Service...
cd services\user-service
call npm install
cd ..\..

echo [5/5] Installing Blockchain Service...
cd services\blockchain-service
call npm install
cd ..\..

echo.
echo ========================================
echo   ALL DEPENDENCIES INSTALLED!
echo ========================================
echo.
echo Next Steps:
echo 1. Setup database: Run mysql-schema-simple.sql in phpMyAdmin
echo 2. Start system: Run START-ALL.bat
echo.
pause
