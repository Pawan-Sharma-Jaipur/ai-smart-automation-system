# PROJECT DOCUMENTATION

## AI-Enabled Smartphone Automation with RBAC using Blockchain

---

## 1. INTRODUCTION

### 1.1 Project Title
AI-Enabled Smartphone Automation with Role-Based Access Control using Blockchain

### 1.2 Objective
To develop an intelligent smartphone automation system that:
- Predicts optimal phone modes using AI
- Implements secure role-based access control
- Maintains immutable audit logs on blockchain
- Provides cross-platform mobile interface

### 1.3 Scope
- User authentication and authorization
- AI-based automation prediction
- Blockchain-based logging
- Role-based permission management
- Mobile application interface

---

## 2. SYSTEM REQUIREMENTS

### 2.1 Hardware Requirements
- Processor: Intel Core i3 or higher
- RAM: 4GB minimum, 8GB recommended
- Storage: 10GB free space
- Network: Internet connection for package installation

### 2.2 Software Requirements
- Operating System: Windows 10/11, macOS, or Linux
- Node.js v16+
- Python 3.8+
- MySQL 5.7+
- Ganache (Ethereum local blockchain)
- VS Code or any code editor
- Android Studio / Xcode (for mobile testing)

---

## 3. SYSTEM ARCHITECTURE

### 3.1 Architecture Diagram
```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐      ┌──────────────┐
│  Backend API    │◄────►│   MySQL DB   │
│  (Node.js)      │      └──────────────┘
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Python │ │ Ethereum │
│   AI   │ │Blockchain│
└────────┘ └──────────┘
```

### 3.2 Component Description

**Frontend (Mobile App)**
- Technology: React Native with Expo
- Purpose: User interface for all interactions
- Features: Login, Registration, Dashboard, Admin Panel

**Backend (API Server)**
- Technology: Node.js + Express.js
- Purpose: Business logic and API endpoints
- Features: Authentication, RBAC, API routing

**Database (MySQL)**
- Purpose: Persistent data storage
- Tables: users, activity_logs
- Features: Relational data, ACID compliance

**AI Engine (Python)**
- Technology: scikit-learn Decision Tree
- Purpose: Intelligent automation prediction
- Features: Training, prediction, model persistence

**Blockchain (Ethereum)**
- Technology: Solidity smart contract on Ganache
- Purpose: Immutable audit logging
- Features: Tamper-proof records, transparency

---

## 4. FUNCTIONAL MODULES

### 4.1 Authentication Module
- User registration with validation
- Password hashing using bcrypt
- JWT token generation
- Token-based authentication
- Secure session management

### 4.2 Authorization Module (RBAC)
- Role definition: Admin, User, Guest, Child, Employee
- Middleware-based permission checking
- Role assignment (admin only)
- Access control enforcement

### 4.3 AI Prediction Module
- Decision Tree model training
- Real-time prediction
- Context-aware automation
- Confidence scoring
- Explainable results

### 4.4 Blockchain Logging Module
- Smart contract deployment
- Action logging
- Transaction hash generation
- Immutable record keeping
- Log retrieval

### 4.5 Admin Module
- User management
- Role assignment
- Activity log viewing
- System monitoring

---

## 5. DATABASE DESIGN

### 5.1 Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'User', 'Guest', 'Child', 'Employee'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 Activity Logs Table
```sql
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  ai_prediction VARCHAR(50),
  blockchain_tx VARCHAR(100),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 5.3 ER Diagram
```
┌─────────┐         ┌──────────────┐
│  Users  │1      N │Activity Logs │
│─────────│◄────────│──────────────│
│ id (PK) │         │ id (PK)      │
│username │         │ user_id (FK) │
│ email   │         │ action       │
│password │         │ ai_prediction│
│  role   │         │blockchain_tx │
│created_at│        │ timestamp    │
└─────────┘         └──────────────┘
```

---

## 6. AI MODEL DETAILS

### 6.1 Algorithm
Decision Tree Classifier

### 6.2 Features
- hour (0-23): Time of day
- usageCount (0-50): Phone usage frequency
- context (0/1/2): Location context

### 6.3 Output Classes
- Silent: Low activity periods
- Vibrate: Moderate activity
- Normal: High activity periods

### 6.4 Training Data
20 labeled samples covering various scenarios

### 6.5 Model Evaluation
- Accuracy: ~95% on training data
- Explainability: High (decision tree rules)

---

## 7. BLOCKCHAIN IMPLEMENTATION

### 7.1 Smart Contract
```solidity
contract AutomationLogger {
    struct Log {
        string userRole;
        string action;
        uint256 timestamp;
    }
    
    Log[] public logs;
    
    function logAction(string memory _userRole, string memory _action) public {
        logs.push(Log(_userRole, _action, block.timestamp));
    }
}
```

### 7.2 Deployment
- Platform: Ganache (local Ethereum)
- Network: HTTP://127.0.0.1:7545
- Gas Limit: 3,000,000
- Accounts: 10 test accounts with 100 ETH each

---

## 8. API DOCUMENTATION

### 8.1 Authentication APIs

**POST /api/auth/register**
- Body: { username, email, password }
- Response: { message, userId }

**POST /api/auth/login**
- Body: { username, password }
- Response: { token, user }

### 8.2 AI APIs

**POST /api/ai/predict** (Protected)
- Headers: Authorization: Bearer <token>
- Body: { hour, usageCount, context }
- Response: { prediction, confidence, explanation }

### 8.3 Admin APIs

**POST /api/admin/assign-role** (Admin Only)
- Headers: Authorization: Bearer <token>
- Body: { userId, role }
- Response: { message }

**GET /api/admin/users** (Admin Only)
- Headers: Authorization: Bearer <token>
- Response: { users: [] }

**GET /api/admin/logs** (Admin Only)
- Headers: Authorization: Bearer <token>
- Response: { logs: [] }

### 8.4 Blockchain APIs

**POST /api/blockchain/log** (Protected)
- Headers: Authorization: Bearer <token>
- Body: { action }
- Response: { transactionHash, blockNumber }

**GET /api/blockchain/logs** (Protected)
- Headers: Authorization: Bearer <token>
- Response: { logs: [] }

---

## 9. SECURITY FEATURES

### 9.1 Password Security
- Bcrypt hashing with 10 salt rounds
- No plain text storage
- Secure comparison

### 9.2 Authentication Security
- JWT with expiration (24 hours)
- Token verification on each request
- Secure token storage (AsyncStorage)

### 9.3 Authorization Security
- Role-based middleware
- Permission checking before execution
- 403 Forbidden for unauthorized access

### 9.4 API Security
- CORS enabled
- Input validation
- SQL injection prevention (parameterized queries)

### 9.5 Blockchain Security
- Immutable records
- Cryptographic hashing
- Transparent audit trail

---

## 10. TESTING

### 10.1 Unit Testing
- Individual function testing
- Mock data usage
- Edge case handling

### 10.2 Integration Testing
- API endpoint testing with Postman
- Database connectivity testing
- Blockchain interaction testing

### 10.3 System Testing
- End-to-end workflow testing
- Mobile app functionality testing
- RBAC enforcement testing

### 10.4 User Acceptance Testing
- Login/logout flows
- AI prediction accuracy
- Admin panel access control
- Blockchain transaction verification

---

## 11. RESULTS & SCREENSHOTS

### 11.1 Expected Results
✓ Successful user registration and login
✓ JWT token generation and validation
✓ AI prediction with 90%+ confidence
✓ Blockchain transaction confirmation
✓ RBAC enforcement (access denied for non-admin)
✓ Admin panel functionality
✓ Database record creation
✓ Mobile app responsiveness

### 11.2 Performance Metrics
- API response time: < 200ms
- AI prediction time: < 1 second
- Blockchain logging: < 3 seconds
- Database query time: < 50ms

---

## 12. CONCLUSION

### 12.1 Achievements
- Complete functional system with all components integrated
- Working AI prediction with explainable results
- Secure authentication and authorization
- Immutable blockchain logging
- Cross-platform mobile application
- Clean, modular, maintainable code

### 12.2 Learning Outcomes
- Full-stack development skills
- AI/ML integration in web applications
- Blockchain technology implementation
- Mobile app development
- API design and security
- Database design and management

### 12.3 Future Scope
- Deploy on cloud platforms (AWS/Azure)
- Use real Ethereum testnet
- Implement advanced ML models
- Add real-time notifications
- Integrate with actual smartphone APIs
- Add data analytics dashboard
- Implement microservices architecture

---

## 13. REFERENCES

1. Node.js Documentation - https://nodejs.org/docs
2. React Native Documentation - https://reactnative.dev
3. scikit-learn Documentation - https://scikit-learn.org
4. Solidity Documentation - https://docs.soliditylang.org
5. Web3.js Documentation - https://web3js.readthedocs.io
6. MySQL Documentation - https://dev.mysql.com/doc
7. JWT Introduction - https://jwt.io
8. Bcrypt Documentation - https://www.npmjs.com/package/bcrypt

---

## 14. APPENDIX

### A. Installation Commands
```bash
# Backend
cd backend && npm install

# AI Engine
cd ai-engine && pip install -r requirements.txt

# Blockchain
cd blockchain && npm install

# Mobile App
cd mobile-app && npm install
```

### B. Running Commands
```bash
# Backend
cd backend && npm start

# AI Training
cd ai-engine && python train.py

# Contract Deployment
cd blockchain && node deploy.js

# Mobile App
cd mobile-app && npm start
```

### C. Test Credentials
- Admin: admin / admin123
- User: testuser / user123

---

**Project Completed Successfully ✓**
