import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import pickle

# Training data: hour, usage_count, context (0=home, 1=work, 2=travel)
data = {
    'hour': [8, 9, 10, 14, 15, 18, 22, 23, 1, 2, 9, 10, 14, 18, 22, 8, 14, 18, 22, 23],
    'usage_count': [5, 10, 15, 20, 25, 30, 5, 3, 1, 0, 12, 18, 22, 28, 6, 8, 19, 32, 4, 2],
    'context': [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0],
    'action': ['Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Silent', 'Silent', 'Silent', 'Silent',
               'Normal', 'Normal', 'Normal', 'Normal', 'Silent', 'Vibrate', 'Normal', 'Normal', 'Silent', 'Silent']
}

df = pd.DataFrame(data)

X = df[['hour', 'usage_count', 'context']]
y = df['action']

model = DecisionTreeClassifier(max_depth=5, random_state=42)
model.fit(X, y)

with open('automation_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("✓ AI model trained and saved successfully")
print(f"✓ Model accuracy: {model.score(X, y) * 100:.2f}%")
