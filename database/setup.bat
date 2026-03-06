@echo off
REM ============================================
REM Enterprise Database Setup Script
REM PostgreSQL Database Initialization
REM ============================================

echo ============================================
echo Enterprise Database Setup
echo ============================================
echo.

REM Configuration
set DB_NAME=ai_automation_enterprise
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo Database Configuration:
echo - Name: %DB_NAME%
echo - User: %DB_USER%
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL from: https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo PostgreSQL found!
echo.

REM Step 1: Create Database
echo Step 1: Creating database...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -c "DROP DATABASE IF EXISTS %DB_NAME%;"
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)

echo Database created successfully!
echo.

REM Step 2: Create Schema
echo Step 2: Creating schema...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f schema.sql

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create schema
    pause
    exit /b 1
)

echo Schema created successfully!
echo.

REM Step 3: Insert Seed Data
echo Step 3: Inserting seed data...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f seeds\01_initial_data.sql

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to insert seed data
    pause
    exit /b 1
)

echo Seed data inserted successfully!
echo.

REM Step 4: Verify Setup
echo Step 4: Verifying setup...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"

echo.
echo ============================================
echo Database Setup Complete!
echo ============================================
echo.
echo Connection Details:
echo   Database: %DB_NAME%
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   User: %DB_USER%
echo.
echo Test Users (password: password123):
echo   - superadmin@enterprise.com (Super Admin)
echo   - admin@enterprise.com (Admin)
echo   - manager@enterprise.com (Manager)
echo   - user1@enterprise.com (User)
echo   - demo@enterprise.com (Demo)
echo.
echo To connect:
echo   psql -U %DB_USER% -d %DB_NAME%
echo.
echo ============================================

pause