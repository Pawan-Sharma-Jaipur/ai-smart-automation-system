@echo off
setlocal enabledelayedexpansion

REM 🚀 AI Automation System - Production Setup Script for Windows
REM This script sets up the complete production-ready system

echo 🚀 Starting AI Automation System Production Setup...
echo ==================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

echo ✅ Python is installed

echo.
echo 📁 Creating necessary directories...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "backend\logs" mkdir "backend\logs"
if not exist "ai-engine\models" mkdir "ai-engine\models"
if not exist "ai-engine\logs" mkdir "ai-engine\logs"
if not exist "ssl" mkdir "ssl"
if not exist "monitoring" mkdir "monitoring"
if not exist "nginx" mkdir "nginx"

echo ✅ Directories created

echo.
echo 🔧 Setting up backend...
cd backend
copy package-production.json package.json >nul
copy server-production.js server.js >nul
copy .env.production .env >nul
call npm install
echo ✅ Backend setup completed
cd ..

echo.
echo 🤖 Setting up AI engine...
cd ai-engine
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements-production.txt
python production_model.py
echo ✅ AI engine setup completed
cd ..

echo.
echo 🌐 Setting up frontend...
cd frontend
call npm install
call npm run build
echo ✅ Frontend setup completed
cd ..

echo.
echo 🔒 Creating SSL certificates...
if not exist "ssl\cert.pem" (
    openssl req -x509 -newkey rsa:4096 -keyout ssl\key.pem -out ssl\cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo ✅ SSL certificates generated
) else (
    echo ✅ SSL certificates already exist
)

echo.
echo 🌐 Creating Nginx configuration...
(
echo events {
echo     worker_connections 1024;
echo }
echo.
echo http {
echo     upstream backend {
echo         server backend:5000;
echo     }
echo.    
echo     upstream frontend {
echo         server frontend:80;
echo     }
echo.    
echo     server {
echo         listen 80;
echo         server_name localhost;
echo.        
echo         location /api/ {
echo             proxy_pass http://backend;
echo             proxy_set_header Host $host;
echo             proxy_set_header X-Real-IP $remote_addr;
echo         }
echo.        
echo         location / {
echo             proxy_pass http://frontend;
echo             proxy_set_header Host $host;
echo             proxy_set_header X-Real-IP $remote_addr;
echo         }
echo     }
echo }
) > nginx\nginx.conf

echo ✅ Nginx configuration created

echo.
echo 🚀 Starting the production system...
docker-compose -f docker-compose.production.yml up --build -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo.
echo 🎉 AI Automation System is now running!
echo ======================================
echo.
echo 🌐 Access URLs:
echo    Frontend:     http://localhost:3000
echo    Backend API:  http://localhost:5000
echo    AI Engine:    http://localhost:8000
echo    Grafana:      http://localhost:3001 (admin/admin123)
echo    Prometheus:   http://localhost:9090
echo.
echo 👤 Default Users:
echo    Admin:  admin / admin123
echo    User:   user / user123
echo    Demo:   demo / demo123
echo.
echo 📊 Health Check:
echo    curl http://localhost:5000/health
echo.
echo 🛑 To stop the system:
echo    docker-compose -f docker-compose.production.yml down
echo.
echo 📝 Logs:
echo    docker-compose -f docker-compose.production.yml logs -f
echo.

pause