import tensorflow as tf
import numpy as np
import pandas as pd
import pickle
import json
import logging
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionAIModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = ['hour', 'day_of_week', 'usage_count', 'context', 'battery_level', 'location_type']
        self.classes = ['Silent', 'Vibrate', 'Normal']
        
    def generate_training_data(self, n_samples=10000):
        """Generate realistic training data"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)  # 0=Monday, 6=Sunday
            usage_count = np.random.poisson(15)  # Average 15 uses per hour
            context = np.random.choice([0, 1, 2])  # 0=home, 1=work, 2=public
            battery_level = np.random.randint(10, 101)
            location_type = np.random.choice([0, 1, 2])  # 0=indoor, 1=outdoor, 2=vehicle
            
            # Generate realistic labels based on rules
            if hour >= 22 or hour <= 6:  # Night time
                label = 'Silent'
            elif hour >= 9 and hour <= 17 and context == 1:  # Work hours at work
                if usage_count > 20:
                    label = 'Vibrate'
                else:
                    label = 'Normal'
            elif context == 2:  # Public places
                label = 'Vibrate'
            elif battery_level < 20:  # Low battery
                label = 'Silent'
            else:
                label = np.random.choice(['Silent', 'Vibrate', 'Normal'], p=[0.3, 0.4, 0.3])
            
            data.append([hour, day_of_week, usage_count, context, battery_level, location_type, label])
        
        df = pd.DataFrame(data, columns=self.feature_names + ['label'])
        return df
    
    def build_model(self):
        """Build TensorFlow neural network model"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(len(self.feature_names),)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(len(self.classes), activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self):
        """Train the model with generated data"""
        logger.info("Generating training data...")
        df = self.generate_training_data()
        
        # Prepare features and labels
        X = df[self.feature_names].values
        y = df['label'].values
        
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        logger.info("Building model...")
        self.model = self.build_model()
        
        # Train model
        logger.info("Training model...")
        history = self.model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_split=0.2,
            verbose=1,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
                tf.keras.callbacks.ReduceLROnPlateau(patience=5, factor=0.5)
            ]
        )
        
        # Evaluate model
        logger.info("Evaluating model...")
        y_pred = self.model.predict(X_test)
        y_pred_classes = np.argmax(y_pred, axis=1)
        
        accuracy = accuracy_score(y_test, y_pred_classes)
        logger.info(f"Model accuracy: {accuracy:.4f}")
        
        # Print classification report
        report = classification_report(y_test, y_pred_classes, target_names=self.classes)
        logger.info(f"Classification Report:\n{report}")
        
        return history, accuracy
    
    def predict(self, features):
        """Make prediction with confidence scores"""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Ensure features is 2D array
        if len(features.shape) == 1:
            features = features.reshape(1, -1)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Get predictions
        predictions = self.model.predict(features_scaled, verbose=0)
        
        results = []
        for pred in predictions:
            predicted_class_idx = np.argmax(pred)
            predicted_class = self.label_encoder.inverse_transform([predicted_class_idx])[0]
            confidence = float(pred[predicted_class_idx] * 100)
            
            # Generate explanation
            explanation = self._generate_explanation(features[0], predicted_class, confidence)
            
            results.append({
                'prediction': predicted_class,
                'confidence': round(confidence, 2),
                'explanation': explanation,
                'probabilities': {
                    class_name: round(float(prob * 100), 2) 
                    for class_name, prob in zip(self.classes, pred)
                }
            })
        
        return results[0] if len(results) == 1 else results
    
    def _generate_explanation(self, features, prediction, confidence):
        """Generate human-readable explanation"""
        hour, day_of_week, usage_count, context, battery_level, location_type = features
        
        explanations = []
        
        # Time-based explanations
        if hour >= 22 or hour <= 6:
            explanations.append("It's night time")
        elif hour >= 9 and hour <= 17:
            explanations.append("It's work hours")
        
        # Context-based explanations
        context_names = ['home', 'work', 'public']
        if context < len(context_names):
            explanations.append(f"You're at {context_names[int(context)]}")
        
        # Usage-based explanations
        if usage_count > 25:
            explanations.append("High phone usage detected")
        elif usage_count < 5:
            explanations.append("Low phone usage")
        
        # Battery-based explanations
        if battery_level < 20:
            explanations.append("Low battery level")
        
        base_explanation = f"Based on {', '.join(explanations)}, "
        
        if prediction == 'Silent':
            return base_explanation + "silent mode is recommended to minimize distractions."
        elif prediction == 'Vibrate':
            return base_explanation + "vibrate mode balances notifications with discretion."
        else:
            return base_explanation + "normal mode is suitable for full notifications."
    
    def save_model(self, filepath='production_ai_model.pkl'):
        """Save the trained model"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names,
            'classes': self.classes,
            'version': '2.0.0',
            'trained_at': datetime.now().isoformat()
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath='production_ai_model.pkl'):
        """Load a trained model"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoder = model_data['label_encoder']
            self.feature_names = model_data['feature_names']
            self.classes = model_data['classes']
            
            logger.info(f"Model loaded from {filepath}")
            logger.info(f"Model version: {model_data.get('version', 'Unknown')}")
            logger.info(f"Trained at: {model_data.get('trained_at', 'Unknown')}")
            
        except FileNotFoundError:
            logger.error(f"Model file {filepath} not found. Please train the model first.")
            raise

def main():
    """Main training script"""
    logger.info("Starting AI model training...")
    
    # Create and train model
    ai_model = ProductionAIModel()
    history, accuracy = ai_model.train()
    
    # Save model
    ai_model.save_model()
    
    # Test prediction
    logger.info("Testing prediction...")
    test_features = np.array([[14, 2, 20, 1, 75, 0]])  # 2 PM, Tuesday, 20 uses, work, 75% battery, indoor
    result = ai_model.predict(test_features)
    
    logger.info(f"Test prediction: {result}")
    logger.info("Model training completed successfully!")

if __name__ == "__main__":
    main()