# 🚀 Database Setup Guide - 2 Minutes

## Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**

## Step 2: Create Database
1. Open browser: http://localhost/phpmyadmin
2. Click **SQL** tab
3. Copy-paste entire content from `mysql-schema-simple.sql`
4. Click **Go**

## Step 3: Verify Setup
Run this query to check:
```sql
USE ai_automation;
SELECT * FROM users;
```

You should see 3 users: admin, developer, viewer

## Step 4: Test Connection
```bash
cd services/shared
node -e "require('./database').execute('SELECT 1').then(() => console.log('✅ Connected')).catch(e => console.log('❌ Failed:', e.message))"
```

## Default Login Credentials
After running the schema, you need to create a test user:

```sql
-- Run this in phpMyAdmin to create test user with password: admin123
INSERT INTO users (username, email, password, role) VALUES
('testuser', 'test@system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhkO', 'DEVELOPER');
```

**Login with:**
- Username: `testuser`
- Password: `admin123`

## Troubleshooting

### Connection Failed?
Check `.env` file or environment variables:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ai_automation
```

### Tables Not Created?
- Make sure MySQL is running in XAMPP
- Check for SQL errors in phpMyAdmin
- Try running schema line by line

## ✅ Done!
Your database is ready. Run `START-ALL.bat` to start the system.
