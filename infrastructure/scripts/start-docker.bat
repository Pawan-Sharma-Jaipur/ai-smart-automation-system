@echo off
echo ========================================
echo Starting System with Docker Compose
echo ========================================
echo.

cd infrastructure\docker

echo Building and starting all services...
docker-compose up -d --build

echo.
echo Waiting for services to be ready...
timeout /t 10 >nul

echo.
echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Services:
docker-compose ps

echo.
echo Access Points:
echo   - API Gateway:  http://localhost:3000
echo   - AI Service:   http://localhost:3002
echo   - Auth Service: http://localhost:3001
echo   - Database:     localhost:5432
echo   - Redis:        localhost:6379
echo.
echo Health Check:    http://localhost:3000/health
echo.
echo View Logs:       docker-compose logs -f
echo Stop System:     docker-compose down
echo.
pause
