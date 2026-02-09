# TROUBLESHOOTING GUIDE

## Common Issues and Solutions

---

## 1. BACKEND ISSUES

### Issue: "Cannot connect to database"
**Symptoms:** Backend crashes on startup, database connection error

**Solutions:**
1. Check if MySQL is running in XAMPP
2. Verify database name in .env matches created database
3. Check DB_USER and DB_PASSWORD in .env
4. Ensure database `ai_automation_db` exists
5. Test connection in phpMyAdmin

**Commands:**
```bash
# Check MySQL status in XAMPP
# Open XAMPP Control Panel → MySQL should be green
```

---

### Issue: "Port 5000 already in use"
**Symptoms:** Backend won't start, EADDRINUSE error

**Solutions:**
1. Change PORT in .env to 5001 or another free port
2. Kill process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Update mobile-app/services/api.js with new port
```

---

### Issue: "JWT token invalid"
**Symptoms:** 401 Unauthorized on protected routes

**Solutions:**
1. Check if token is being sent in Authorization header
2. Verify JWT_SECRET in .env is set
3. Check token expiration (24 hours)
4. Re-login to get fresh token
5. Clear AsyncStorage in mobile app

---

### Issue: "Module not found"
**Symptoms:** Cannot find module error

**Solutions:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 2. AI ENGINE ISSUES

### Issue: "Model not trained"
**Symptoms:** AI prediction fails, model file not found

**Solutions:**
```bash
cd ai-engine
python train.py
# Verify automation_model.pkl is created
```

---

### Issue: "Python not found"
**Symptoms:** Backend can't execute Python script

**Solutions:**
1. Check Python is installed: `python --version`
2. Add Python to PATH environment variable
3. Try `python3` instead of `python` in aiController.js
4. Install Python from https://python.org

---

### Issue: "Module 'sklearn' not found"
**Symptoms:** Python import error

**Solutions:**
```bash
pip install scikit-learn pandas
# Or
pip install -r requirements.txt
```

---

### Issue: "AI prediction returns error"
**Symptoms:** Invalid JSON output from Python

**Solutions:**
1. Test Python script directly:
```bash
cd ai-engine
python predict.py 14 25 1
# Should output JSON
```
2. Check for print statements in predict.py (remove them)
3. Verify model file exists

---

## 3. BLOCKCHAIN ISSUES

### Issue: "Ganache not running"
**Symptoms:** Blockchain logging fails, connection refused

**Solutions:**
1. Open Ganache application
2. Click "Quickstart Ethereum"
3. Verify RPC Server: http://127.0.0.1:7545
4. Update BLOCKCHAIN_URL in .env if different

---

### Issue: "Contract not deployed"
**Symptoms:** CONTRACT_ADDRESS not set error

**Solutions:**
```bash
cd blockchain
npm install
node deploy.js
# Copy CONTRACT_ADDRESS from output
# Update backend/.env
# Restart backend
```

---

### Issue: "Transaction failed"
**Symptoms:** Blockchain logging returns error

**Solutions:**
1. Check Ganache is running
2. Verify contract address is correct
3. Check account has enough ETH (Ganache provides 100 ETH)
4. Increase gas limit in blockchainController.js

---

### Issue: "Solidity compilation error"
**Symptoms:** Contract deployment fails

**Solutions:**
```bash
cd blockchain
npm install solc@0.8.20
node deploy.js
```

---

## 4. MOBILE APP ISSUES

### Issue: "Cannot connect to backend"
**Symptoms:** Network request failed, timeout

**Solutions:**
1. Check backend is running on port 5000
2. Update API_URL in services/api.js:
   - Android Emulator: `http://10.0.2.2:5000/api`
   - iOS Simulator: `http://localhost:5000/api`
   - Physical Device: `http://YOUR_COMPUTER_IP:5000/api`
3. Check firewall settings
4. Ensure phone and computer on same network

**Find your IP:**
```bash
# Windows
ipconfig
# Look for IPv4 Address

# Mac/Linux
ifconfig
# Look for inet address
```

---

### Issue: "Expo won't start"
**Symptoms:** Metro bundler error

**Solutions:**
```bash
cd mobile-app
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

---

### Issue: "Module resolution failed"
**Symptoms:** Can't resolve module error

**Solutions:**
```bash
cd mobile-app
npm install @react-navigation/native @react-navigation/stack
npm install react-native-gesture-handler react-native-reanimated
```

---

### Issue: "AsyncStorage not working"
**Symptoms:** Token not persisting

**Solutions:**
```bash
npm install @react-native-async-storage/async-storage
# Restart Expo
```

---

### Issue: "App crashes on login"
**Symptoms:** App closes after login

**Solutions:**
1. Check backend is responding
2. Verify API response format
3. Check console for errors
4. Test API with Postman first

---

## 5. DATABASE ISSUES

### Issue: "Table doesn't exist"
**Symptoms:** SQL error about missing table

**Solutions:**
1. Backend creates tables automatically on startup
2. Or manually create:
```sql
USE ai_automation_db;
-- Run SQL from database-setup.sql
```

---

### Issue: "Foreign key constraint fails"
**Symptoms:** Cannot insert into activity_logs

**Solutions:**
1. Ensure user exists before logging activity
2. Check user_id is valid
3. Verify foreign key relationship

---

### Issue: "Duplicate entry error"
**Symptoms:** Username or email already exists

**Solutions:**
1. Use different username/email
2. Or delete existing user:
```sql
DELETE FROM users WHERE username = 'testuser';
```

---

## 6. GENERAL ISSUES

### Issue: "npm install fails"
**Symptoms:** Package installation errors

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try with --legacy-peer-deps
npm install --legacy-peer-deps
```

---

### Issue: "CORS error"
**Symptoms:** Browser blocks request

**Solutions:**
1. Verify cors is installed in backend
2. Check cors() middleware is used in server.js
3. Mobile apps don't have CORS issues

---

### Issue: "Permission denied"
**Symptoms:** Cannot write file, access denied

**Solutions:**
```bash
# Windows: Run as Administrator
# Mac/Linux: Use sudo
sudo npm install
```

---

## 7. TESTING CHECKLIST

Before viva, verify:

**Backend:**
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] All routes respond correctly
- [ ] JWT authentication works
- [ ] RBAC middleware blocks non-admin

**AI Engine:**
- [ ] Model file exists (automation_model.pkl)
- [ ] Python script runs directly
- [ ] Backend can call Python
- [ ] Prediction returns valid JSON

**Blockchain:**
- [ ] Ganache is running
- [ ] Contract is deployed
- [ ] CONTRACT_ADDRESS in .env
- [ ] Transactions appear in Ganache

**Mobile App:**
- [ ] App starts without errors
- [ ] Can connect to backend
- [ ] Login works
- [ ] AI prediction works
- [ ] Admin panel accessible (admin only)

**Database:**
- [ ] MySQL running
- [ ] Database exists
- [ ] Tables created
- [ ] Sample users exist

---

## 8. QUICK FIXES

### Reset Everything:
```bash
# Stop all services
# Delete node_modules in all folders
# Delete automation_model.pkl
# Drop and recreate database
# Restart Ganache
# Run setup.bat again
```

### Fresh Start:
```bash
# Backend
cd backend
rm -rf node_modules
npm install
npm start

# AI
cd ai-engine
python train.py

# Blockchain
cd blockchain
rm -rf node_modules
npm install
node deploy.js

# Mobile
cd mobile-app
rm -rf node_modules
npm install
npm start
```

---

## 9. GETTING HELP

### Check Logs:
1. Backend console for API errors
2. Mobile app console (Expo DevTools)
3. Ganache logs for blockchain errors
4. MySQL error log in XAMPP

### Debug Mode:
Add console.log statements:
```javascript
console.log('Request received:', req.body);
console.log('User:', req.user);
console.log('Response:', response.data);
```

### Test Individually:
1. Test backend APIs with Postman
2. Test Python script directly
3. Test database queries in phpMyAdmin
4. Test blockchain in Ganache console

---

## 10. EMERGENCY CONTACTS

If nothing works:
1. Check README.md for setup steps
2. Review QUICK-START.md
3. Verify all prerequisites installed
4. Check system requirements
5. Try on different computer

---

**Remember: Most issues are due to:**
- Services not running (MySQL, Ganache, Backend)
- Wrong configuration (.env file)
- Missing dependencies (npm install)
- Port conflicts
- Network connectivity

**Always check these first! ✓**
