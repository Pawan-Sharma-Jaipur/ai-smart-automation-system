# VIVA DAY EXECUTION GUIDE

## Step-by-Step Instructions for Live Demonstration

---

## ⏰ BEFORE VIVA (30 minutes before)

### 1. Open Required Applications
- [ ] VS Code
- [ ] XAMPP Control Panel
- [ ] Ganache
- [ ] Command Prompt (4 windows)
- [ ] Web Browser (for phpMyAdmin)
- [ ] Postman (optional, for backup testing)

### 2. Start XAMPP
```
1. Open XAMPP Control Panel
2. Click "Start" for Apache
3. Click "Start" for MySQL
4. Wait for green status
5. Click "Admin" next to MySQL → Opens phpMyAdmin
6. Verify database "ai_automation_db" exists
```

### 3. Start Ganache
```
1. Open Ganache application
2. Click "Quickstart Ethereum"
3. Note RPC Server: http://127.0.0.1:7545
4. Note first account address (for .env)
5. Keep Ganache open
```

---

## 🚀 EXECUTION SEQUENCE

### STEP 1: Train AI Model (2 minutes)

**Command Prompt Window 1:**
```bash
cd c:\Users\pawan\OneDrive\Desktop\BitAce\projects\ai-smart-automation-system\ai-engine
python train.py
```

**Expected Output:**
```
✓ AI model trained and saved successfully
✓ Model accuracy: 95.00%
```

**Verify:**
- File `automation_model.pkl` created in ai-engine folder

---

### STEP 2: Deploy Smart Contract (2 minutes)

**Command Prompt Window 2:**
```bash
cd c:\Users\pawan\OneDrive\Desktop\BitAce\projects\ai-smart-automation-system\blockchain
node deploy.js
```

**Expected Output:**
```
Deploying contract from account: 0x...
✓ Contract deployed successfully!
Contract Address: 0x...
```

**Action Required:**
1. Copy the Contract Address (0x...)
2. Open `backend\.env` in VS Code
3. Update: `CONTRACT_ADDRESS=0x...` (paste copied address)
4. Update: `ADMIN_ACCOUNT=0x...` (first account from Ganache)
5. Save .env file

---

### STEP 3: Start Backend Server (1 minute)

**Command Prompt Window 3:**
```bash
cd c:\Users\pawan\OneDrive\Desktop\BitAce\projects\ai-smart-automation-system\backend
npm start
```

**Expected Output:**
```
✓ Database tables initialized
✓ Server running on port 5000
```

**Verify:**
- Open browser: http://localhost:5000
- Should see: {"message": "AI Smartphone Automation Backend API"}

**Keep this window running!**

---

### STEP 4: Start Mobile App (2 minutes)

**Command Prompt Window 4:**
```bash
cd c:\Users\pawan\OneDrive\Desktop\BitAce\projects\ai-smart-automation-system\mobile-app
npm start
```

**Expected Output:**
```
Metro waiting on exp://...
› Press a │ open Android
› Press w │ open web
```

**Action:**
- Press `w` for web browser (easiest for demo)
- Or press `a` for Android emulator
- Wait for app to load

**Keep this window running!**

---

## 🎬 DEMONSTRATION SCRIPT

### DEMO 1: User Registration (2 minutes)

**In Mobile App:**
1. Click "Don't have an account? Register"
2. Enter:
   - Username: `vivauser`
   - Email: `viva@example.com`
   - Password: `viva123`
3. Click "Register"
4. See success message
5. Click "OK" → Redirects to Login

**Show in phpMyAdmin:**
- Open phpMyAdmin
- Select `ai_automation_db` database
- Click `users` table
- Show new user with role "User"

---

### DEMO 2: User Login & JWT (2 minutes)

**In Mobile App:**
1. Enter:
   - Username: `vivauser`
   - Password: `viva123`
2. Click "Login"
3. Redirected to Dashboard

**Explain:**
- Backend verified credentials
- Generated JWT token
- Token stored in AsyncStorage
- Token sent with all future requests

**Show in Backend Console:**
- Look for login activity logs

---

### DEMO 3: AI Automation Prediction (3 minutes)

**In Mobile App (Dashboard):**
1. Click "Trigger AI Prediction" button
2. Wait 1-2 seconds
3. See prediction result:
   - Action: Silent / Vibrate / Normal
   - Confidence: XX%
   - Explanation: "..."

**Explain:**
- Backend received request with JWT
- Called Python predict.py script
- Python loaded trained model
- Made prediction based on current time
- Returned JSON result
- Stored in database

**Show in phpMyAdmin:**
- Refresh `activity_logs` table
- Show new entry with AI prediction

**Show in Backend Console:**
- Look for AI prediction logs

---

### DEMO 4: Blockchain Logging (3 minutes)

**In Mobile App:**
- After AI prediction, scroll down
- See "✓ Logged to Blockchain"
- See transaction hash (TX: 0x...)

**Show in Ganache:**
1. Switch to Ganache window
2. Click "Transactions" tab
3. Show latest transaction
4. Click on transaction
5. Show details:
   - TX Hash (matches app)
   - From Address
   - To Address (contract)
   - Gas Used
   - Block Number

**Explain:**
- Action logged to smart contract
- Immutable record on blockchain
- Cannot be modified or deleted
- Transparent and verifiable

---

### DEMO 5: RBAC - Access Denied (3 minutes)

**In Mobile App (logged in as vivauser):**
1. Look for "Admin Panel" button
2. **It should NOT be visible** (because vivauser is not Admin)

**Alternative Test:**
1. Use Postman
2. GET http://localhost:5000/api/admin/users
3. Headers: Authorization: Bearer <vivauser_token>
4. Send request
5. **Response: 403 Forbidden**
6. **Message: "Access denied. Insufficient permissions."**

**Explain:**
- RBAC middleware checked user role
- vivauser has role "User"
- Admin APIs require role "Admin"
- Access denied

---

### DEMO 6: RBAC - Admin Access (4 minutes)

**In Mobile App:**
1. Logout (click Logout button)
2. Login as admin:
   - Username: `admin`
   - Password: `admin123`
3. See Dashboard
4. **Admin Panel button is now visible**
5. Click "Admin Panel"

**In Admin Panel:**
1. See "Assign Role" section
2. See list of all users
3. See activity logs

**Assign Role:**
1. Enter User ID: (get from users list, e.g., 3)
2. Select Role: "Admin"
3. Click "Assign Role"
4. See success message

**Show in phpMyAdmin:**
- Refresh `users` table
- Show updated role for that user

**Explain:**
- Only Admin role can access admin APIs
- Admin can view all users
- Admin can view all logs
- Admin can assign roles

---

### DEMO 7: View All Logs (2 minutes)

**In Admin Panel:**
- Scroll to "Activity Logs" section
- See all system activities:
  - User logins
  - AI predictions
  - Role assignments
- Show username, role, action, timestamp

**Explain:**
- Complete audit trail
- All user actions logged
- Both in database and blockchain
- Database for quick queries
- Blockchain for immutability

---

## 🎤 EXPLAINING THE CODE

### Show Backend Code (3 minutes)

**Open in VS Code:**

1. **server.js**
   - Express setup
   - CORS middleware
   - Route mounting
   - Database initialization

2. **middleware/auth.js**
   - JWT verification
   - Token extraction from header
   - User object attachment to request

3. **middleware/rbac.js**
   - Role checking
   - allowedRoles array
   - 403 response for unauthorized

4. **controllers/authController.js**
   - bcrypt password hashing
   - JWT token generation
   - Login logic

5. **controllers/aiController.js**
   - child_process.exec()
   - Python script execution
   - JSON parsing

6. **controllers/blockchainController.js**
   - Web3 initialization
   - Contract interaction
   - Transaction sending

---

### Show AI Code (2 minutes)

**Open in VS Code:**

1. **train.py**
   - Training data
   - DecisionTreeClassifier
   - Model saving with pickle

2. **predict.py**
   - Model loading
   - Command line arguments
   - JSON output

---

### Show Smart Contract (2 minutes)

**Open in VS Code:**

1. **AutomationLogger.sol**
   - Struct definition
   - Array storage
   - logAction function
   - getLogCount function

---

### Show Mobile App Code (2 minutes)

**Open in VS Code:**

1. **services/api.js**
   - Axios setup
   - JWT interceptor
   - API functions

2. **screens/DashboardScreen.js**
   - AI prediction handler
   - Blockchain logging
   - Role-based UI

3. **screens/AdminScreen.js**
   - Role assignment
   - User list
   - Activity logs

---

## 📊 SHOW DATABASE

**In phpMyAdmin:**

1. **users table**
   - Show structure
   - Show data
   - Explain role enum

2. **activity_logs table**
   - Show structure
   - Show data
   - Explain foreign key

3. **Run SQL Query:**
```sql
SELECT u.username, u.role, al.action, al.ai_prediction, al.timestamp
FROM activity_logs al
JOIN users u ON al.user_id = u.id
ORDER BY al.timestamp DESC
LIMIT 10;
```

---

## ❓ ANSWER QUESTIONS

Use **VIVA-GUIDE.md** for detailed Q&A

**Common Questions:**
1. Why this tech stack?
2. How does JWT work?
3. Explain RBAC implementation
4. Which ML algorithm and why?
5. Why blockchain?
6. How do you prevent SQL injection?
7. Future enhancements?

---

## 🛑 IF SOMETHING GOES WRONG

### Backend won't start:
```bash
# Check MySQL is running
# Verify .env configuration
# Check port 5000 is free
```

### AI prediction fails:
```bash
# Verify automation_model.pkl exists
# Test: python predict.py 14 25 1
```

### Blockchain logging fails:
```bash
# Check Ganache is running
# Verify CONTRACT_ADDRESS in .env
# Restart backend
```

### Mobile app can't connect:
```bash
# Check backend is running
# Verify API_URL in services/api.js
# Try: http://localhost:5000/api
```

---

## ✅ POST-DEMO CHECKLIST

After demonstration:
- [ ] Showed working registration
- [ ] Showed working login
- [ ] Showed AI prediction
- [ ] Showed blockchain transaction
- [ ] Showed RBAC access denial
- [ ] Showed admin access
- [ ] Showed role assignment
- [ ] Explained code
- [ ] Showed database
- [ ] Answered questions

---

## 🎯 KEY POINTS TO EMPHASIZE

1. **Everything is REAL and WORKING**
   - Not simulated or mocked
   - Actual AI model
   - Real blockchain
   - Live database

2. **Security is IMPLEMENTED**
   - Password hashing
   - JWT authentication
   - RBAC authorization
   - Immutable logs

3. **Professional Code Quality**
   - Modular structure
   - Error handling
   - Clean separation
   - Well documented

4. **Complete Integration**
   - All components connected
   - End-to-end data flow
   - Real-time updates

---

## 💪 CONFIDENCE STATEMENTS

**When asked "Does it work?"**
→ "Yes, let me demonstrate it live right now."

**When asked "Is the AI real?"**
→ "Yes, it's a trained Decision Tree model. Let me show you the training script and prediction."

**When asked "Is the blockchain real?"**
→ "Yes, it's deployed on Ganache. Let me show you the transaction in Ganache."

**When asked "Can you show RBAC?"**
→ "Yes, let me show you access denied for regular user and access granted for admin."

---

## 🏆 FINAL TIPS

1. **Stay Calm** - Everything works, you've tested it
2. **Be Confident** - You built a complete system
3. **Explain Clearly** - Use simple terms
4. **Show, Don't Just Tell** - Demonstrate live
5. **Know Your Code** - You understand every line
6. **Handle Errors Gracefully** - Use troubleshooting guide
7. **Emphasize Learning** - Talk about what you learned

---

**You've got this! Your project is excellent! 🚀**

**Good luck with your viva! 🎉**
