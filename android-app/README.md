# 📱 React Native Android App - Setup Guide

## 🚀 Quick Start

### Prerequisites
```bash
# Install Node.js (already installed)
# Install Android Studio
# Install JDK 11 or higher
```

### Step 1: Install Dependencies
```bash
cd android-app
npm install
```

### Step 2: Configure Backend URL
Edit `App.js` line 12:
```javascript
const API_URL = 'http://YOUR_SERVER_IP:3001/api/auth';
```
Replace `YOUR_SERVER_IP` with your actual server IP.

### Step 3: Run on Android
```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android
```

---

## 📋 Features Implemented

### ✅ Face Unlock
- Front camera face detection
- Real-time face recognition
- Automatic authentication with backend

### ✅ Role-Based Access
- 5 roles: SYSTEM_ADMIN, ORG_ADMIN, TEAM_LEAD, DEVELOPER, VIEWER
- Dynamic permissions display
- Restricted apps list

### ✅ Secure Storage
- JWT token storage
- Persistent login
- Secure logout

---

## 🔧 App Structure

```
android-app/
├── App.js              # Main app component
├── package.json        # Dependencies
├── AndroidManifest.xml # Permissions
└── README.md          # This file
```

---

## 📱 How It Works

### 1. Face Unlock Screen
```
User opens app → Camera starts → Face detected → 
Send to backend → Role received → Unlock
```

### 2. Role-Based UI
```
SYSTEM_ADMIN → Full access (all apps)
DEVELOPER → Limited access (basic apps)
VIEWER → Restricted (kids mode)
```

### 3. Backend Integration
```javascript
POST /api/auth/face-login
Body: { faceDescriptor: [...], confidence: 85 }
Response: { success: true, token: "...", user: {...} }
```

---

## 🎯 Permissions by Role

### SYSTEM_ADMIN (Owner)
✅ All Apps
✅ Settings
✅ Banking
✅ Admin Controls

### ORG_ADMIN (Secondary Admin)
✅ Most Apps
✅ Settings (Limited)
✅ User Management
❌ Banking Apps

### TEAM_LEAD (Trusted User)
✅ Work Apps
✅ Communication
✅ Productivity
❌ Settings
❌ Banking

### DEVELOPER (Regular User)
✅ Basic Apps
✅ Camera
✅ Gallery
✅ Social Media
❌ Settings
❌ Banking

### VIEWER (Guest/Child)
✅ YouTube Kids
✅ Educational Apps
✅ Games (Limited)
❌ Social Media
❌ Browser
❌ Settings

---

## 🔐 Security Features

- Face data encrypted
- JWT token authentication
- Secure local storage
- Backend validation
- Role verification

---

## 🚀 Production Deployment

### Build APK
```bash
cd android
./gradlew assembleRelease
```

### APK Location
```
android/app/build/outputs/apk/release/app-release.apk
```

### Install on Device
```bash
adb install app-release.apk
```

---

## 📊 Testing

### Test Users (from database)
- Username: `testface`, Password: `password`, Role: DEVELOPER
- Username: `admin`, Password: `password`, Role: SYSTEM_ADMIN

### Test Flow
1. Open app
2. Allow camera permission
3. Show face to camera
4. Wait for authentication
5. See role-based dashboard

---

## 🎉 Done!

App is ready for production use. Just:
1. Update API_URL with production server
2. Build release APK
3. Deploy to Play Store or distribute directly

**Backend already running! Just connect the app! 🚀**
