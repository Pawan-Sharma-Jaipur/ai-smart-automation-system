# SYSTEM ARCHITECTURE & FLOW DIAGRAMS

## Visual Guide for Understanding the System

---

## 1. OVERALL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           React Native Mobile Application                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Login   │ │ Register │ │Dashboard │ │  Admin   │    │  │
│  │  │  Screen  │ │  Screen  │ │  Screen  │ │  Panel   │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST API (JWT Token)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Node.js + Express.js                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │   Auth   │ │   RBAC   │ │    AI    │ │Blockchain│    │  │
│  │  │Middleware│ │Middleware│ │Controller│ │Controller│    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────┬─────────────────┬─────────────────┬──────────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────┐
    │  MySQL   │      │  Python  │     │ Ethereum │
    │ Database │      │ AI Engine│     │Blockchain│
    │          │      │          │     │ (Ganache)│
    │ ┌──────┐ │      │ ┌──────┐ │     │ ┌──────┐ │
    │ │Users │ │      │ │Model │ │     │ │Smart │ │
    │ │Logs  │ │      │ │Train │ │     │ │Contract│
    │ └──────┘ │      │ │Predict│     │ │Logs  │ │
    └──────────┘      └──────────┘     └──────────┘
```

---

## 2. AUTHENTICATION FLOW

```
┌──────────┐                                    ┌──────────┐
│  Mobile  │                                    │ Backend  │
│   App    │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. POST /api/auth/register                   │
     │  { username, email, password }                │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          2. Hash password
     │                                          with bcrypt
     │                                                │
     │                                          3. Store in MySQL
     │                                                │
     │  4. { message: "Success", userId }            │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  5. POST /api/auth/login                      │
     │  { username, password }                       │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          6. Verify password
     │                                          with bcrypt
     │                                                │
     │                                          7. Generate JWT
     │                                          (id, username, role)
     │                                                │
     │  8. { token, user }                           │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  9. Store token in AsyncStorage               │
     │                                                │
     │  10. All future requests include:             │
     │  Authorization: Bearer <token>                │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          11. Verify JWT
     │                                          in middleware
     │                                                │
     │  12. Response                                 │
     │◄──────────────────────────────────────────────┤
     │                                                │
```

---

## 3. RBAC (Role-Based Access Control) FLOW

```
┌──────────┐                                    ┌──────────┐
│  User    │                                    │ Backend  │
│ (Role:   │                                    │  Server  │
│  User)   │                                    │          │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. GET /api/admin/users                      │
     │  Authorization: Bearer <user_token>           │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          2. Auth Middleware
     │                                          ✓ Token valid
     │                                          ✓ User: { role: "User" }
     │                                                │
     │                                          3. RBAC Middleware
     │                                          ✗ Required: ["Admin"]
     │                                          ✗ User has: "User"
     │                                                │
     │  4. 403 Forbidden                             │
     │  { error: "Access denied" }                   │
     │◄──────────────────────────────────────────────┤
     │                                                │
     
┌──────────┐                                    ┌──────────┐
│  Admin   │                                    │ Backend  │
│ (Role:   │                                    │  Server  │
│  Admin)  │                                    │          │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. GET /api/admin/users                      │
     │  Authorization: Bearer <admin_token>          │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          2. Auth Middleware
     │                                          ✓ Token valid
     │                                          ✓ User: { role: "Admin" }
     │                                                │
     │                                          3. RBAC Middleware
     │                                          ✓ Required: ["Admin"]
     │                                          ✓ User has: "Admin"
     │                                                │
     │                                          4. Execute controller
     │                                          5. Query database
     │                                                │
     │  6. 200 OK                                    │
     │  { users: [...] }                             │
     │◄──────────────────────────────────────────────┤
     │                                                │
```

---

## 4. AI PREDICTION FLOW

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile  │     │ Backend  │     │  Python  │     │  MySQL   │
│   App    │     │  Server  │     │ AI Engine│     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │                 │
     │  1. Click "Trigger AI Prediction"                 │
     │                │                 │                 │
     │  2. POST /api/ai/predict                          │
     │  { hour: 14, usageCount: 25, context: 1 }        │
     ├───────────────►│                 │                 │
     │                │                 │                 │
     │                │  3. Verify JWT  │                 │
     │                │  ✓ Authenticated│                 │
     │                │                 │                 │
     │                │  4. Execute:    │                 │
     │                │  python predict.py 14 25 1        │
     │                ├────────────────►│                 │
     │                │                 │                 │
     │                │                 │  5. Load model  │
     │                │                 │  (automation_model.pkl)
     │                │                 │                 │
     │                │                 │  6. Predict:    │
     │                │                 │  DecisionTree.predict()
     │                │                 │                 │
     │                │                 │  7. Calculate   │
     │                │                 │  confidence     │
     │                │                 │                 │
     │                │  8. JSON output:│                 │
     │                │  { action: "Normal",              │
     │                │    confidence: 95.5,              │
     │                │    explanation: "..." }           │
     │                │◄────────────────┤                 │
     │                │                 │                 │
     │                │  9. Parse JSON  │                 │
     │                │                 │                 │
     │                │  10. INSERT INTO activity_logs    │
     │                ├─────────────────────────────────►│
     │                │                 │                 │
     │                │  11. ✓ Saved    │                 │
     │                │◄─────────────────────────────────┤
     │                │                 │                 │
     │  12. Response: │                 │                 │
     │  { prediction: "Normal",                          │
     │    confidence: 95.5,                              │
     │    explanation: "..." }                           │
     │◄───────────────┤                 │                 │
     │                │                 │                 │
     │  13. Display result                               │
     │                │                 │                 │
```

---

## 5. BLOCKCHAIN LOGGING FLOW

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile  │     │ Backend  │     │ Ethereum │     │  MySQL   │
│   App    │     │  Server  │     │Blockchain│     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │                 │
     │  1. POST /api/blockchain/log                      │
     │  { action: "AI_AUTOMATION_TRIGGERED" }            │
     ├───────────────►│                 │                 │
     │                │                 │                 │
     │                │  2. Verify JWT  │                 │
     │                │  ✓ Get user role│                 │
     │                │                 │                 │
     │                │  3. Initialize Web3                │
     │                │  4. Load contract ABI             │
     │                │                 │                 │
     │                │  5. Call smart contract:          │
     │                │  logAction(userRole, action)      │
     │                ├────────────────►│                 │
     │                │                 │                 │
     │                │                 │  6. Execute     │
     │                │                 │  contract       │
     │                │                 │  function       │
     │                │                 │                 │
     │                │                 │  7. Create      │
     │                │                 │  transaction    │
     │                │                 │                 │
     │                │                 │  8. Mine block  │
     │                │                 │  (instant in    │
     │                │                 │   Ganache)      │
     │                │                 │                 │
     │                │  9. Transaction receipt:          │
     │                │  { transactionHash: "0x...",      │
     │                │    blockNumber: 5 }               │
     │                │◄────────────────┤                 │
     │                │                 │                 │
     │                │  10. INSERT INTO activity_logs    │
     │                │  (blockchain_tx = "0x...")        │
     │                ├─────────────────────────────────►│
     │                │                 │                 │
     │                │  11. ✓ Saved    │                 │
     │                │◄─────────────────────────────────┤
     │                │                 │                 │
     │  12. Response: │                 │                 │
     │  { transactionHash: "0x...",                      │
     │    blockNumber: 5 }                               │
     │◄───────────────┤                 │                 │
     │                │                 │                 │
     │  13. Display TX hash                              │
     │                │                 │                 │
```

---

## 6. DATABASE SCHEMA RELATIONSHIPS

```
┌─────────────────────────────────┐
│           users                 │
├─────────────────────────────────┤
│ id (PK) INT AUTO_INCREMENT      │
│ username VARCHAR(50) UNIQUE     │
│ email VARCHAR(100) UNIQUE       │
│ password VARCHAR(255)           │
│ role ENUM('Admin','User',...)   │
│ created_at TIMESTAMP            │
└────────────┬────────────────────┘
             │
             │ 1:N relationship
             │
             ▼
┌─────────────────────────────────┐
│       activity_logs             │
├─────────────────────────────────┤
│ id (PK) INT AUTO_INCREMENT      │
│ user_id (FK) INT                │───┐
│ action VARCHAR(100)             │   │
│ ai_prediction VARCHAR(50)       │   │ References
│ blockchain_tx VARCHAR(100)      │   │ users.id
│ timestamp TIMESTAMP             │   │
└─────────────────────────────────┘   │
             ▲                        │
             └────────────────────────┘
```

---

## 7. COMPONENT INTERACTION DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APPLICATION                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Screens   │  │  Services  │  │   Storage  │            │
│  │            │  │            │  │            │            │
│  │ - Login    │─►│ - api.js   │  │ AsyncStorage│           │
│  │ - Register │  │ - Axios    │◄─┤ - JWT Token│            │
│  │ - Dashboard│  │ - Interceptor│ │ - User Data│           │
│  │ - Admin    │  │            │  │            │            │
│  └────────────┘  └──────┬─────┘  └────────────┘            │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP Requests
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Routes   │  │ Middleware │  │Controllers │            │
│  │            │  │            │  │            │            │
│  │ - auth.js  │─►│ - auth.js  │─►│ - authCtrl │            │
│  │ - ai.js    │  │ - rbac.js  │  │ - aiCtrl   │            │
│  │ - admin.js │  │            │  │ - adminCtrl│            │
│  │ - blockchain│  │            │  │ - blockCtrl│            │
│  └────────────┘  └────────────┘  └──────┬─────┘            │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────┐
                    │                     │                 │
                    ▼                     ▼                 ▼
            ┌──────────────┐      ┌──────────────┐  ┌──────────────┐
            │    MySQL     │      │   Python     │  │  Ethereum    │
            │   Database   │      │  AI Engine   │  │  Blockchain  │
            │              │      │              │  │              │
            │ - users      │      │ - train.py   │  │ - Contract   │
            │ - activity_  │      │ - predict.py │  │ - Logs       │
            │   logs       │      │ - model.pkl  │  │ - Transactions│
            └──────────────┘      └──────────────┘  └──────────────┘
```

---

## 8. SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────┐
│                      REQUEST FLOW                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  1. CORS Check   │
                    │  ✓ Origin allowed│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 2. JWT Validation│
                    │ ✓ Token valid    │
                    │ ✓ Not expired    │
                    │ ✓ Signature OK   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 3. RBAC Check    │
                    │ ✓ Role matches   │
                    │ ✓ Permission OK  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 4. Input Valid.  │
                    │ ✓ Sanitized      │
                    │ ✓ Type checked   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 5. Execute Logic │
                    │ ✓ Process request│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 6. Response      │
                    │ ✓ Send data      │
                    └──────────────────┘
```

---

## 9. DATA FLOW SUMMARY

```
User Action → Mobile App → Backend API → Middleware → Controller
                                                          │
                                    ┌─────────────────────┼─────────────┐
                                    │                     │             │
                                    ▼                     ▼             ▼
                                Database              Python AI     Blockchain
                                (MySQL)               (scikit)      (Ethereum)
                                    │                     │             │
                                    └─────────────────────┴─────────────┘
                                                          │
                                                          ▼
                                                    Response to App
                                                          │
                                                          ▼
                                                    Display to User
```

---

## 10. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT SETUP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   XAMPP      │  │   Ganache    │  │   VS Code    │     │
│  │              │  │              │  │              │     │
│  │ - Apache     │  │ - Ethereum   │  │ - Backend    │     │
│  │ - MySQL      │  │ - 10 Accounts│  │ - Mobile App │     │
│  │ - phpMyAdmin │  │ - Instant    │  │ - AI Engine  │     │
│  │              │  │   Mining     │  │ - Blockchain │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  All running on: localhost / 127.0.0.1                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Use these diagrams during viva to explain system architecture! 📊**
