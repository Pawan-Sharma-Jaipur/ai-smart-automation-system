# AI-Enabled Smartphone Automation with Role-Based Access Control using Blockchain

## B.Tech Final Year Project

A complete, functional system demonstrating AI-based smartphone automation with blockchain logging and role-based access control.

---

## 🎯 Project Overview

This system integrates:
- **React Native Mobile App** - User interface
- **Node.js + Express Backend** - Business logic & APIs
- **MySQL Database** - Data persistence
- **Python AI Engine** - Decision Tree automation prediction
- **Ethereum Blockchain** - Immutable logging via Ganache

---

## 📋 Prerequisites

Install the following software:

1. **Node.js** (v16 or higher) - https://nodejs.org/
2. **Python** (v3.8 or higher) - https://www.python.org/
3. **MySQL** (XAMPP recommended) - https://www.apachefriends.org/
4. **Ganache** (Local Blockchain) - https://trufflesuite.com/ganache/
5. **Expo CLI** - `npm install -g expo-cli`
6. **VS Code** - https://code.visualstudio.com/

---

## 🚀 Setup Instructions

### Step 1: Database Setup (MySQL)

1. Start XAMPP and run MySQL
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create database:
   ```sql
   CREATE DATABASE ai_automation_db;
   ```
4. Or import `database-setup.sql` file

### Step 2: Backend Setup

```bash
cd backend
npm install
```

**Configure `.env` file:**
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ai_automation_db
JWT_SECRET=your_jwt_secret_key_change_in_production
BLOCKCHAIN_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS_AFTER_DEPLOYMENT
ADMIN_ACCOUNT=YOUR_GANACHE_ACCOUNT_ADDRESS
```

**Start backend:**
```bash
npm start
```

Backend will run on: http://localhost:5000

### Step 3: AI Engine Setup

```bash
cd ai-engine
pip install -r requirements.txt
python train.py
```

This trains the AI model and creates `automation_model.pkl`

### Step 4: Blockchain Setup

1. **Start Ganache:**
   - Open Ganache application
   - Create new workspace (Quickstart)
   - Note the RPC Server URL (usually http://127.0.0.1:7545)

2. **Deploy Smart Contract:**
```bash
cd blockchain
npm install
node deploy.js
```

3. **Copy contract address** from output and update `backend/.env`:
   ```
   CONTRACT_ADDRESS=0x... (from deployment output)
   ADMIN_ACCOUNT=0x... (first account from Ganache)
   ```

4. **Restart backend** after updating .env

### Step 5: Mobile App Setup

```bash
cd mobile-app
npm install
```

**Update API URL in `services/api.js`:**
- For Android Emulator: `http://10.0.2.2:5000/api`
- For iOS Simulator: `http://localhost:5000/api`
- For Physical Device: `http://YOUR_COMPUTER_IP:5000/api`

**Start mobile app:**
```bash
npm start
```

Press:
- `a` for Android
- `i` for iOS
- `w` for Web

---

## 👤 Test Users

### Admin Account
- Username: `admin`
- Password: `admin123`
- Role: Admin

### Regular User
- Username: `testuser`
- Password: `user123`
- Role: User

Or register new users via the mobile app.

---

## 🔧 System Features

### 1. Authentication (JWT)
- User registration with bcrypt password hashing
- Login with JWT token generation
- Token-based API authentication

### 2. Role-Based Access Control (RBAC)
- 5 Roles: Admin, User, Guest, Child, Employee
- Middleware-based permission checking
- Admin-only APIs for role assignment and logs

### 3. AI Automation
- Decision Tree model trained on usage patterns
- Predicts: Silent / Vibrate / Normal mode
- Input: hour, usage_count, context
- Returns: prediction, confidence, explanation

### 4. Blockchain Logging
- Solidity smart contract on Ganache
- Immutable action logging
- Transaction hash as proof
- Logs: user role, action, timestamp

### 5. Database Operations
- MySQL with proper schemas
- CRUD operations for users and logs
- Foreign key relationships

---

## 📱 Mobile App Screens

1. **Login Screen** - JWT authentication
2. **Register Screen** - New user creation
3. **Dashboard** - AI prediction trigger, blockchain logging
4. **Admin Panel** - Role assignment, view all users/logs (Admin only)

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### AI Automation
- `POST /api/ai/predict` - Get AI prediction (Protected)

### Admin (Admin Role Only)
- `POST /api/admin/assign-role` - Assign role to user
- `GET /api/admin/users` - Get all users
- `GET /api/admin/logs` - Get all activity logs

### Blockchain
- `POST /api/blockchain/log` - Log action to blockchain (Protected)
- `GET /api/blockchain/logs` - Get blockchain logs (Protected)

---

## 🧪 Testing the System

### Test AI Prediction:
1. Login to mobile app
2. Click "Trigger AI Prediction"
3. View predicted action and confidence
4. Check blockchain transaction hash

### Test RBAC:
1. Login as regular user
2. Try accessing Admin Panel (should fail)
3. Login as admin
4. Access Admin Panel successfully
5. Assign roles to users

### Test Blockchain:
1. Trigger any action
2. Check Ganache for new transaction
3. View transaction details in Ganache

---

## 📊 Project Structure

```
ai-smart-automation-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── aiController.js
│   │   ├── adminController.js
│   │   └── blockchainController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rbac.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── ai.js
│   │   ├── admin.js
│   │   └── blockchain.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── mobile-app/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── DashboardScreen.js
│   │   └── AdminScreen.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── app.json
│   └── package.json
├── ai-engine/
│   ├── train.py
│   ├── predict.py
│   ├── requirements.txt
│   └── automation_model.pkl (generated)
├── blockchain/
│   ├── AutomationLogger.sol
│   ├── deploy.js
│   └── package.json
├── database-setup.sql
└── README.md
```

---

## 🎓 Viva Demonstration Points

1. **Show working authentication** - Register and login
2. **Demonstrate RBAC** - Admin vs User access
3. **Trigger AI prediction** - Show real-time results
4. **Show blockchain transaction** - Open Ganache, show TX
5. **Explain AI model** - Decision Tree logic
6. **Show database records** - phpMyAdmin tables
7. **Demonstrate access denial** - Non-admin trying admin APIs

---

## 🛠️ Troubleshooting

### Backend won't start:
- Check MySQL is running in XAMPP
- Verify database exists
- Check .env configuration

### AI prediction fails:
- Run `python train.py` first
- Check Python is in PATH
- Verify model file exists

### Blockchain logging fails:
- Ensure Ganache is running
- Verify contract is deployed
- Check CONTRACT_ADDRESS in .env

### Mobile app can't connect:
- Update API_URL in services/api.js
- Check backend is running
- Verify firewall settings

---

## 📝 Technologies Used

- **Frontend:** React Native, Expo, Axios
- **Backend:** Node.js, Express.js, JWT, bcrypt
- **Database:** MySQL, mysql2
- **AI:** Python, scikit-learn, pandas
- **Blockchain:** Solidity, Web3.js, Ganache
- **Tools:** VS Code, XAMPP, Postman

---

## 👨‍💻 Development Team

B.Tech Final Year Project
Department of Computer Science & Engineering

---

## 📄 License

This is an academic project for educational purposes.

---

## ✅ Checklist Before Viva

- [ ] MySQL database created and running
- [ ] Backend server running on port 5000
- [ ] AI model trained (automation_model.pkl exists)
- [ ] Ganache running with deployed contract
- [ ] Mobile app running on emulator/device
- [ ] Test users created
- [ ] All APIs tested with Postman
- [ ] Blockchain transactions visible in Ganache
- [ ] Screenshots/recordings prepared

---

**Good luck with your viva! 🎉**
