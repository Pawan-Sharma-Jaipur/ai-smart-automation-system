# 🚀 QUICK START - AI/ML PREDICTION SERVICE

## ⚡ Run in 3 Steps

### Step 1: Navigate to AI Service
```bash
cd services/ai-service
```

### Step 2: Start the Service
```bash
npm start
```

You should see:
```
🤖 AI/ML Service running on port 3002
🏥 Health: http://localhost:3002/health
🎯 Predict: POST http://localhost:3002/api/ai/predict
📊 Stats: http://localhost:3002/api/ai/stats
📚 Model Info: http://localhost:3002/api/ai/model/info
```

### Step 3: Test the Service

**Option A: Use the Web Interface**
1. Open `test-client.html` in your browser
2. Fill in the form
3. Click "Get AI Prediction"

**Option B: Use curl**
```bash
curl -X POST http://localhost:3002/api/ai/predict \
  -H "Content-Type: application/json" \
  -d "{\"hour\":14,\"usageCount\":25,\"context\":1,\"batteryLevel\":75}"
```

**Option C: Use Postman**
- URL: `POST http://localhost:3002/api/ai/predict`
- Body (JSON):
```json
{
  "hour": 14,
  "usageCount": 25,
  "context": 1,
  "batteryLevel": 75
}
```

---

## 📊 Expected Response

```json
{
  "success": true,
  "prediction": "Vibrate",
  "confidence": 87.5,
  "probabilities": {
    "Silent": 20,
    "Vibrate": 87,
    "Normal": 13
  },
  "explanation": {
    "summary": "Based on It's work hours (09:00-17:00), You're in a work environment, High phone usage detected, vibrate mode balances notifications with discretion",
    "factors": [
      "It's work hours (09:00-17:00)",
      "You're in a work environment",
      "High phone usage detected"
    ],
    "confidence": "87% confident"
  },
  "modelVersion": "2.0.0",
  "predictionId": "pred_1234567890_abc123",
  "processingTime": "12ms",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🎯 Test Scenarios

### Scenario 1: Night Time (Should predict Silent)
```json
{
  "hour": 23,
  "usageCount": 5,
  "context": 0,
  "batteryLevel": 30
}
```

### Scenario 2: Work Hours (Should predict Vibrate/Normal)
```json
{
  "hour": 14,
  "usageCount": 25,
  "context": 1,
  "batteryLevel": 75
}
```

### Scenario 3: Public Place (Should predict Vibrate)
```json
{
  "hour": 18,
  "usageCount": 15,
  "context": 2,
  "batteryLevel": 60
}
```

### Scenario 4: Low Battery (Should predict Silent)
```json
{
  "hour": 12,
  "usageCount": 20,
  "context": 1,
  "batteryLevel": 15
}
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Change port in .env file
PORT=3003
```

### Service Not Starting
```bash
# Reinstall dependencies
npm install

# Check Node version (needs 18+)
node --version
```

### CORS Errors
```bash
# Add your frontend URL to .env
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

---

## 📈 For Viva Demonstration

1. **Start Service**: `npm start`
2. **Show Health**: Open http://localhost:3002/health in browser
3. **Open Test Client**: Open `test-client.html` in browser
4. **Make Predictions**: Try different scenarios
5. **Explain Logic**: 
   - Night time → Silent
   - Work hours + high usage → Vibrate
   - Public place → Vibrate
   - Low battery → Silent
6. **Show Stats**: Refresh to see prediction count increase
7. **Show Batch**: Use Postman to send batch predictions

---

## ✅ Success Checklist

- [ ] Service starts without errors
- [ ] Health endpoint returns "healthy"
- [ ] Single prediction works
- [ ] Batch prediction works
- [ ] Test client loads and works
- [ ] Different scenarios give different predictions
- [ ] Explanations are clear and accurate

---

**🎉 Your AI/ML Service is now running and ready for demonstration!**