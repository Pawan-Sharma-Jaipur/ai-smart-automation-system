# QUICK START GUIDE

## Run the Complete System in 5 Steps

### Step 1: Start MySQL (XAMPP)
1. Open XAMPP Control Panel
2. Start Apache and MySQL
3. Open phpMyAdmin: http://localhost/phpmyadmin
4. Create database: `ai_automation_db`

### Step 2: Start Backend
```bash
cd backend
npm install
npm start
```
✓ Backend running on http://localhost:5000

### Step 3: Train AI Model
```bash
cd ai-engine
pip install -r requirements.txt
python train.py
```
✓ Model trained: automation_model.pkl created

### Step 4: Deploy Blockchain Contract
1. Open Ganache (Quickstart Ethereum)
2. Deploy contract:
```bash
cd blockchain
npm install
node deploy.js
```
3. Copy CONTRACT_ADDRESS from output
4. Update backend/.env with CONTRACT_ADDRESS
5. Restart backend

### Step 5: Start Mobile App
```bash
cd mobile-app
npm install
npm start
```
Press 'a' for Android or 'w' for Web

---

## Test the System

### Login Credentials:
- Admin: `admin` / `admin123`
- User: `testuser` / `user123`

### Test Flow:
1. Login to mobile app
2. Click "Trigger AI Prediction"
3. View prediction result
4. Check blockchain transaction in Ganache
5. Login as admin → Access Admin Panel
6. View all users and logs

---

## Verify Everything Works:

✅ Backend API responds at http://localhost:5000
✅ MySQL database has users and activity_logs tables
✅ AI model file exists: ai-engine/automation_model.pkl
✅ Ganache shows deployed contract
✅ Mobile app connects to backend
✅ AI prediction returns result
✅ Blockchain transaction appears in Ganache
✅ Admin can access admin panel
✅ Regular user cannot access admin panel

---

## Common Issues:

**"Cannot connect to backend"**
→ Update API_URL in mobile-app/services/api.js to your computer's IP

**"AI prediction failed"**
→ Run `python train.py` in ai-engine folder

**"Blockchain logging failed"**
→ Check Ganache is running and CONTRACT_ADDRESS is set in .env

**"Access denied to admin panel"**
→ This is correct! Only admin role can access. Login as admin user.

---

Ready for viva! 🎉
