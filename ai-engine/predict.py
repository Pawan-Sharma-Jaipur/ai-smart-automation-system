import sys
import pickle
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'automation_model.pkl')

if not os.path.exists(model_path):
    print(json.dumps({"error": "Model not trained. Run train.py first"}))
    sys.exit(1)

with open(model_path, 'rb') as f:
    model = pickle.load(f)

hour = int(sys.argv[1])
usage_count = int(sys.argv[2])
context = int(sys.argv[3])

prediction = model.predict([[hour, usage_count, context]])[0]
probabilities = model.predict_proba([[hour, usage_count, context]])[0]
confidence = max(probabilities) * 100

explanations = {
    'Silent': 'Low activity detected. Silent mode recommended.',
    'Vibrate': 'Moderate activity. Vibrate mode suggested.',
    'Normal': 'High activity period. Normal mode recommended.'
}

result = {
    "action": prediction,
    "confidence": round(confidence, 2),
    "explanation": explanations.get(prediction, "Automation applied")
}

print(json.dumps(result))
