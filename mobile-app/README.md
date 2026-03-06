# 📱 AI Automation Mobile App

## Complete React Native App with Backend Integration

---

## ✅ FEATURES

✅ **User Authentication** - Login & Register  
✅ **AI Predictions** - Make predictions from phone  
✅ **Dashboard** - View stats and history  
✅ **Admin Panel** - Manage users and view logs  
✅ **Real-time Data** - Connected to MySQL backend  
✅ **Beautiful UI** - Modern design with animations  

---

## 🚀 QUICK START

### Step 1: Start Backend
```bash
# In main project folder
START-PRODUCTION.bat
```

### Step 2: Start Mobile App
```bash
# In main project folder
START-MOBILE.bat
```

### Step 3: Run on Device

**Option A: Android Emulator**
- Press `a` in terminal

**Option B: Physical Device**
1. Install "Expo Go" app from Play Store/App Store
2. Scan QR code shown in terminal

**Option C: Web Browser**
- Press `w` in terminal

---

## 📱 SCREENS

### 1. Login Screen
- Username & password
- Test users provided
- Navigate to register

### 2. Register Screen
- Create new account
- Select role
- Email validation

### 3. Dashboard Screen
- Welcome message
- System statistics
- AI prediction form
- Recent predictions
- Admin panel button (for admins)

### 4. Admin Screen
- Dashboard tab (stats)
- Users tab (manage roles)
- Logs tab (activity history)

---

## 🔌 API INTEGRATION

All screens connect to backend:
```
http://localhost:3000
```

### Endpoints Used:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/ai/predict`
- `GET /api/ai/predictions`
- `GET /api/ai/stats`
- `GET /api/users`
- `PUT /api/users/:id/role`
- `GET /api/logs`
- `GET /api/admin/dashboard`

---

## 👥 TEST USERS

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| user1 | user123 | User |
| manager | manager123 | Manager |

---

## 🛠️ DEVELOPMENT

### Install Dependencies
```bash
cd mobile-app
npm install
```

### Start Development Server
```bash
npm start
```

### Run on Android
```bash
npm run android
```

### Run on iOS
```bash
npm run ios
```

### Run on Web
```bash
npm run web
```

---

## 📁 PROJECT STRUCTURE

```
mobile-app/
│
├── App.js                    → Main navigation
├── package.json              → Dependencies
│
├── screens/
│   ├── LoginScreen.js        → Login page
│   ├── RegisterScreen.js     → Registration
│   ├── DashboardScreen.js    → Main dashboard
│   └── AdminScreen.js        → Admin panel
│
└── services/
    └── api.js                → Backend API calls
```

---

## 🎨 UI FEATURES

✅ Modern gradient design  
✅ Smooth animations  
✅ Loading indicators  
✅ Error handling  
✅ Form validation  
✅ Responsive layout  
✅ Touch-friendly buttons  

---

## 🔧 CONFIGURATION

### Change Backend URL

Edit `mobile-app/services/api.js`:
```javascript
const API_URL = 'http://YOUR_IP:3000';
```

For physical device, use your computer's IP:
```javascript
const API_URL = 'http://192.168.1.100:3000';
```

---

## 🐛 TROUBLESHOOTING

### Backend Connection Failed
```
Error: Backend not running!
```
**Solution:** Start backend with `START-PRODUCTION.bat`

### Can't Connect from Phone
**Solution:** 
1. Find your computer's IP: `ipconfig`
2. Update API_URL in `services/api.js`
3. Make sure phone and PC on same WiFi

### Expo Not Starting
```bash
npm install -g expo-cli
npx expo start
```

### Dependencies Error
```bash
cd mobile-app
rm -rf node_modules
npm install
```

---

## 📊 FEATURES DEMO

### Make AI Prediction
1. Login with test user
2. Fill prediction form:
   - Hour: 14
   - Usage: 25
   - Context: Work
   - Battery: 75
3. Click "Get Prediction"
4. View result with confidence

### Admin Functions
1. Login as admin
2. Click "Admin Panel"
3. View dashboard stats
4. Manage user roles
5. View activity logs

---

## 🚀 DEPLOYMENT

### Build APK (Android)
```bash
cd mobile-app
eas build --platform android
```

### Build IPA (iOS)
```bash
cd mobile-app
eas build --platform ios
```

### Publish Update
```bash
cd mobile-app
expo publish
```

---

## ✅ TESTING CHECKLIST

- [ ] Login with test user
- [ ] Register new user
- [ ] Make AI prediction
- [ ] View prediction history
- [ ] Check statistics
- [ ] Admin: View users
- [ ] Admin: Change user role
- [ ] Admin: View logs
- [ ] Logout and login again

---

## 🎓 VIVA DEMONSTRATION

### Show Mobile App (5 min)

1. **Start App**
   ```bash
   START-MOBILE.bat
   ```

2. **Login Demo**
   - Show login screen
   - Login with admin/admin123

3. **Dashboard Demo**
   - Show statistics
   - Make AI prediction
   - Show result with confidence

4. **Admin Demo**
   - Open admin panel
   - Show user management
   - Change a user's role
   - View activity logs

5. **Code Walkthrough**
   - Show API integration
   - Explain navigation
   - Show state management

---

## 📱 SCREENSHOTS

### Login Screen
- Beautiful gradient header
- Username/password fields
- Test users displayed

### Dashboard
- Welcome message with user info
- Statistics cards
- AI prediction form
- Recent predictions list

### Admin Panel
- Three tabs (Dashboard, Users, Logs)
- User management with role picker
- Activity logs with timestamps

---

## 🎉 COMPLETE MOBILE APP!

### What You Have:

✅ **Full-Featured Mobile App**
- 4 complete screens
- Backend integration
- Real-time data
- Beautiful UI

✅ **Production Ready**
- Error handling
- Loading states
- Form validation
- API integration

✅ **Ready For:**
- B.Tech Demo ✓
- Viva Presentation ✓
- Portfolio ✓
- App Store ✓

---

**🚀 Run START-MOBILE.bat and test on your phone!**
