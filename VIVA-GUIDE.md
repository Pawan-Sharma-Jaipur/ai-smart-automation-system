# VIVA PREPARATION GUIDE

## Questions & Answers for B.Tech Final Year Viva

---

### 1. PROJECT OVERVIEW

**Q: What is your project about?**
A: This is an AI-enabled smartphone automation system with role-based access control and blockchain logging. It predicts smartphone modes (Silent/Vibrate/Normal) based on user behavior and logs all actions immutably on blockchain.

**Q: What problem does it solve?**
A: It automates smartphone settings based on context, reduces manual intervention, ensures secure access control through RBAC, and maintains tamper-proof audit logs using blockchain.

---

### 2. ARCHITECTURE

**Q: Explain your system architecture.**
A: 
- Frontend: React Native mobile app for user interaction
- Backend: Node.js + Express REST API with JWT authentication
- Database: MySQL for storing users, roles, and activity logs
- AI Engine: Python with scikit-learn Decision Tree model
- Blockchain: Ethereum smart contract on Ganache for immutable logging

**Q: Why this tech stack?**
A: 
- React Native: Cross-platform mobile development
- Node.js: Fast, scalable backend with JavaScript
- MySQL: Reliable relational database for structured data
- Python: Best for AI/ML with scikit-learn
- Ethereum: Industry-standard blockchain for immutable records

---

### 3. AUTHENTICATION & SECURITY

**Q: How does authentication work?**
A: 
1. User registers with username, email, password
2. Password hashed using bcrypt (10 salt rounds)
3. On login, credentials verified against database
4. JWT token generated with user ID, username, role
5. Token sent to client, stored securely
6. All protected APIs require valid JWT in Authorization header

**Q: What is JWT?**
A: JSON Web Token - a secure way to transmit information between parties. Contains header, payload (user data), and signature. Stateless authentication.

**Q: How do you prevent SQL injection?**
A: Using parameterized queries with mysql2 library. All user inputs are sanitized.

---

### 4. ROLE-BASED ACCESS CONTROL (RBAC)

**Q: Explain RBAC implementation.**
A: 
- 5 roles defined: Admin, User, Guest, Child, Employee
- Role stored in user table
- RBAC middleware checks user role before allowing access
- Admin-only routes: assign-role, view all logs, view all users
- Non-admin users get 403 Forbidden error

**Q: Demonstrate RBAC.**
A: 
1. Login as regular user → Try admin panel → Access denied
2. Login as admin → Access admin panel → Success
3. Show middleware code that checks allowedRoles array

**Q: Why is RBAC important?**
A: Ensures principle of least privilege, prevents unauthorized access, maintains data security, enables hierarchical permissions.

---

### 5. AI/ML COMPONENT

**Q: Which ML algorithm did you use?**
A: Decision Tree Classifier from scikit-learn.

**Q: Why Decision Tree?**
A: 
- Explainable and interpretable
- Works well with categorical outputs
- Fast prediction
- No need for feature scaling
- Suitable for academic demonstration

**Q: How does the AI model work?**
A: 
Input features:
- hour (0-23): Time of day
- usageCount (0-50): Phone usage frequency
- context (0=home, 1=work, 2=travel): Location context

Output: Silent / Vibrate / Normal

Training data: 20 samples with labeled patterns
Model learns decision rules based on these patterns

**Q: Show the training process.**
A: 
```python
# Load training data
X = features (hour, usageCount, context)
y = labels (Silent/Vibrate/Normal)

# Train model
model = DecisionTreeClassifier(max_depth=5)
model.fit(X, y)

# Save model
pickle.dump(model, file)
```

**Q: How does backend call Python?**
A: Using Node.js child_process.exec() to run predict.py with arguments, capture JSON output.

---

### 6. BLOCKCHAIN

**Q: Why blockchain in this project?**
A: To create immutable, tamper-proof audit logs. Once logged, actions cannot be modified or deleted, ensuring accountability.

**Q: Explain your smart contract.**
A: 
- Written in Solidity
- Stores logs in array of structs
- Each log has: userRole, action, timestamp
- logAction() function adds new log
- getLogCount() returns total logs
- logs[] public array for reading

**Q: What is Ganache?**
A: Local Ethereum blockchain for development. Provides 10 test accounts with 100 ETH each, instant mining, GUI for viewing transactions.

**Q: Show blockchain transaction.**
A: 
1. Trigger action in mobile app
2. Open Ganache
3. Show new block created
4. Show transaction details: from, to, gas used
5. Show transaction hash in app matches Ganache

**Q: Difference between blockchain and database?**
A: 
- Blockchain: Immutable, decentralized, transparent, slower
- Database: Mutable, centralized, faster, can be modified

---

### 7. DATABASE

**Q: Why MySQL?**
A: Relational data (users have roles, logs belong to users), ACID properties, widely used, easy to demonstrate with phpMyAdmin.

**Q: Explain your database schema.**
A: 
users table:
- id (PK), username, email, password (hashed), role, created_at

activity_logs table:
- id (PK), user_id (FK), action, ai_prediction, blockchain_tx, timestamp

**Q: Show database records.**
A: Open phpMyAdmin, show tables, show sample data, explain foreign key relationship.

---

### 8. API DESIGN

**Q: What is REST API?**
A: Representational State Transfer - architectural style using HTTP methods (GET, POST, PUT, DELETE) for CRUD operations.

**Q: List your API endpoints.**
A: 
- POST /api/auth/register - Register user
- POST /api/auth/login - Login
- POST /api/ai/predict - AI prediction (protected)
- POST /api/admin/assign-role - Assign role (admin only)
- GET /api/admin/users - Get users (admin only)
- GET /api/admin/logs - Get logs (admin only)
- POST /api/blockchain/log - Log to blockchain (protected)
- GET /api/blockchain/logs - Get blockchain logs (protected)

**Q: How do you test APIs?**
A: Using Postman. Import provided collection, set JWT token, test all endpoints.

---

### 9. MOBILE APP

**Q: Why React Native?**
A: Cross-platform (iOS + Android from single codebase), JavaScript-based, large community, fast development.

**Q: Explain app screens.**
A: 
1. Login - JWT authentication
2. Register - New user creation
3. Dashboard - AI prediction, blockchain logging, role-based UI
4. Admin Panel - Role assignment, view users/logs (admin only)

**Q: How does app communicate with backend?**
A: Using Axios HTTP client. API service layer with interceptors for JWT token injection.

---

### 10. DEMONSTRATION

**Q: Demonstrate the complete flow.**
A: 
1. Show all services running (MySQL, Backend, Ganache, Mobile app)
2. Register new user
3. Login → Get JWT token
4. Trigger AI prediction → Show result
5. Check database → New log entry
6. Check Ganache → New transaction
7. Try admin panel as user → Access denied
8. Login as admin → Access granted
9. Assign role to user
10. Show updated role in database

---

### 11. CHALLENGES & SOLUTIONS

**Q: What challenges did you face?**
A: 
1. Integrating Python with Node.js → Solved using child_process
2. Blockchain deployment → Used Ganache for local testing
3. JWT token management → Used AsyncStorage in React Native
4. RBAC implementation → Created middleware with role checking

---

### 12. FUTURE ENHANCEMENTS

**Q: How can you improve this project?**
A: 
- Deploy on real Ethereum testnet (Sepolia/Goerli)
- Use more advanced ML models (Random Forest, Neural Networks)
- Add real-time notifications
- Implement actual smartphone automation using device APIs
- Add more granular permissions
- Deploy backend on cloud (AWS/Azure)
- Add data analytics dashboard

---

### 13. TECHNICAL CONCEPTS

**Q: What is middleware?**
A: Functions that execute between request and response. Used for authentication, logging, error handling.

**Q: What is hashing vs encryption?**
A: 
- Hashing: One-way (bcrypt for passwords)
- Encryption: Two-way (can decrypt)

**Q: Explain async/await.**
A: JavaScript syntax for handling promises. Makes asynchronous code look synchronous.

---

## DEMO CHECKLIST

Before viva:
- [ ] All services running
- [ ] Test users created
- [ ] AI model trained
- [ ] Contract deployed
- [ ] Mobile app connected
- [ ] Postman collection ready
- [ ] Database visible in phpMyAdmin
- [ ] Ganache showing transactions
- [ ] Code well-commented
- [ ] README printed

---

## CONFIDENCE BOOSTERS

✅ Your project is COMPLETE and FUNCTIONAL
✅ All components are CONNECTED
✅ You can DEMONSTRATE everything LIVE
✅ Code is CLEAN and COMMENTED
✅ You understand EVERY line of code
✅ You can explain WHY you chose each technology

**You've got this! 🚀**
