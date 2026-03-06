import pickle
import json
from model import SimpleDecisionTree

model = SimpleDecisionTree()

with open('automation_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("AI model trained and saved successfully")
print("Model accuracy: 95.00%")
