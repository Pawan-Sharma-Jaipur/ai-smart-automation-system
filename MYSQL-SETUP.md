# 🚀 MySQL Setup Guide

## Quick Start (3 Steps)

### Step 1: Setup MySQL Database
```sql
-- Open MySQL Command Line or phpMyAdmin
-- Run this command:
source C:/Users/pawan/OneDrive/Desktop/BitAce/projects/ai-smart-automation-system/database/mysql-schema.sql
```

OR manually:
1. Open phpMyAdmin
2. Create database: `ai_automation`
3. Import file: `database/mysql-schema.sql`

### Step 2: Configure Database
Edit `backend/.env.mysql`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=ai_automation
```

### Step 3: Start System
```bash
START-MYSQL.bat
```

## Test Users
- admin / admin123
- user1 / user123
- manager / manager123
- demo / demo123

## API Endpoints
- POST /api/auth/login
- POST /api/ai/predict
- GET /api/users
- GET /api/logs
- GET /api/admin/dashboard

## Troubleshooting

### MySQL Not Running?
```bash
# Start XAMPP/WAMP
# OR
net start MySQL80
```

### Connection Error?
Check:
1. MySQL is running
2. Database `ai_automation` exists
3. Username/password in .env.mysql is correct

### Port 3000 Already in Use?
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
