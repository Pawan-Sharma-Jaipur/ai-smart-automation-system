class SimpleDecisionTree:
    def predict(self, features):
        hour, usage_count, context = features[0]
        
        if hour >= 22 or hour <= 6:
            return ['Silent']
        elif context == 1 and usage_count > 15:
            return ['Normal']
        elif usage_count < 10:
            return ['Silent']
        else:
            return ['Vibrate']
    
    def predict_proba(self, features):
        prediction = self.predict(features)[0]
        if prediction == 'Silent':
            return [[0.85, 0.10, 0.05]]
        elif prediction == 'Vibrate':
            return [[0.10, 0.80, 0.10]]
        else:
            return [[0.05, 0.10, 0.85]]
