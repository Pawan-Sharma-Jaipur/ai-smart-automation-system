@echo off
echo ========================================
echo AI Automation System - Setup Script
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed
    pause
    exit /b 1
)
cd ..
echo ✓ Backend dependencies installed
echo.

echo [2/4] Installing AI Engine Dependencies...
cd ai-engine
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: AI engine installation failed
    pause
    exit /b 1
)
echo ✓ AI engine dependencies installed
echo.

echo [3/4] Installing Blockchain Dependencies...
cd ..\blockchain
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Blockchain installation failed
    pause
    exit /b 1
)
cd ..
echo ✓ Blockchain dependencies installed
echo.

echo [4/4] Installing Mobile App Dependencies...
cd mobile-app
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Mobile app installation failed
    pause
    exit /b 1
)
cd ..
echo ✓ Mobile app dependencies installed
echo.

echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Start MySQL in XAMPP
echo 2. Create database: ai_automation_db
echo 3. Train AI model: cd ai-engine ^&^& python train.py
echo 4. Start Ganache
echo 5. Deploy contract: cd blockchain ^&^& node deploy.js
echo 6. Update backend/.env with CONTRACT_ADDRESS
echo 7. Start backend: cd backend ^&^& npm start
echo 8. Start mobile app: cd mobile-app ^&^& npm start
echo.
pause
