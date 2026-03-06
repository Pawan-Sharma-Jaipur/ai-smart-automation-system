# 🚀 DATABASE QUICK START

## Setup in 3 Steps

### Step 1: Install PostgreSQL
Download and install from: https://www.postgresql.org/download/

**During installation:**
- Set password for postgres user: `postgres`
- Port: `5432` (default)
- Remember to add PostgreSQL to PATH

### Step 2: Run Setup Script
```bash
cd database
setup.bat
```

**What it does:**
- Creates database: `ai_automation_enterprise`
- Creates 25+ tables
- Adds indexes and triggers
- Inserts sample data
- Creates test users

### Step 3: Verify Setup
```bash
# Option A: Using psql
psql -U postgres -d ai_automation_enterprise -f verify.sql

# Option B: Using Node.js
npm install pg
node test-connection.js
```

---

## ✅ Expected Output

```
============================================
Database Setup Complete!
============================================

Connection Details:
  Database: ai_automation_enterprise
  Host: localhost
  Port: 5432
  User: postgres

Test Users (password: password123):
  - superadmin@enterprise.com (Super Admin)
  - admin@enterprise.com (Admin)
  - manager@enterprise.com (Manager)
  - user1@enterprise.com (User)
  - demo@enterprise.com (Demo)
```

---

## 🔍 Quick Tests

### Connect to Database
```bash
psql -U postgres -d ai_automation_enterprise
```

### Check Tables
```sql
\dt
```

### View Users
```sql
SELECT username, email, role FROM users;
```

### View Predictions
```sql
SELECT * FROM predictions LIMIT 5;
```

### Check RBAC
```sql
SELECT r.name, COUNT(rp.permission_id) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name;
```

---

## 🎯 For Your Project

### Connection String
```
postgresql://postgres:postgres@localhost:5432/ai_automation_enterprise
```

### Node.js Connection
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ai_automation_enterprise',
  user: 'postgres',
  password: 'postgres'
});

// Use it
const result = await pool.query('SELECT * FROM users LIMIT 1');
```

### Python Connection
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="ai_automation_enterprise",
    user="postgres",
    password="postgres"
)
```

---

## 🔧 Troubleshooting

### "psql: command not found"
Add PostgreSQL to PATH:
```
C:\Program Files\PostgreSQL\15\bin
```

### "database does not exist"
Run setup script:
```bash
cd database
setup.bat
```

### "password authentication failed"
Check PostgreSQL password:
```bash
# Reset if needed
psql -U postgres
\password postgres
```

### Port already in use
Change port in setup.bat:
```
set DB_PORT=5433
```

---

## 📊 What You Get

### Tables (25+)
- ✅ users, sessions
- ✅ roles, permissions
- ✅ ml_models, predictions
- ✅ devices, automation_rules
- ✅ blockchain_transactions
- ✅ audit_logs, security_events
- ✅ notifications
- ✅ organizations, departments

### Sample Data
- ✅ 6 test users
- ✅ 5 roles with permissions
- ✅ 2 ML models
- ✅ 3 sample predictions
- ✅ 2 devices
- ✅ 2 automation rules

### Features
- ✅ Multi-tenant support
- ✅ Complete RBAC
- ✅ AI/ML integration
- ✅ Blockchain logging
- ✅ Audit trail
- ✅ Performance indexes
- ✅ Auto-timestamps

---

## 🎓 For Viva Demo

### Show Database Structure
```sql
-- Show all tables
\dt

-- Show table structure
\d users

-- Show indexes
\di
```

### Show Sample Data
```sql
-- Users
SELECT * FROM users;

-- Roles and Permissions
SELECT * FROM roles;
SELECT * FROM permissions;

-- Predictions
SELECT * FROM predictions;
```

### Show RBAC
```sql
-- User with their roles
SELECT u.username, array_agg(r.name) as roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
GROUP BY u.username;
```

### Show Performance
```sql
-- Explain query plan
EXPLAIN ANALYZE 
SELECT * FROM predictions 
WHERE user_id = (SELECT id FROM users WHERE username = 'user1');
```

---

## 🎉 Success!

Your enterprise database is now:
- ✅ Created and configured
- ✅ Populated with sample data
- ✅ Optimized for performance
- ✅ Ready for integration
- ✅ Production-ready

**Next:** Integrate with your microservices!