#!/usr/bin/env python3
"""
Enterprise AI Model Training Pipeline
Advanced TensorFlow-based training with MLOps best practices
"""

import os
import sys
import json
import logging
import argparse
import numpy as np
import pandas as pd
import tensorflow as tf
from datetime import datetime
from pathlib import Path
import mlflow
import mlflow.tensorflow
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import optuna
from optuna.integration import TFKerasPruningCallback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class EnterpriseModelTrainer:
    """Enterprise-grade model training with advanced features"""
    
    def __init__(self, config_path='config/training_config.json'):
        self.config = self.load_config(config_path)
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = [
            'hour', 'day_of_week', 'usage_count', 'context', 'battery_level',
            'is_weekend', 'is_work_hours', 'is_night_time', 'avg_usage_last_week',
            'location_changes', 'notification_count', 'screen_time'
        ]
        self.class_names = ['Silent', 'Vibrate', 'Normal']
        
        # MLflow setup
        mlflow.set_tracking_uri(self.config.get('mlflow_uri', 'sqlite:///mlflow.db'))
        mlflow.set_experiment(self.config.get('experiment_name', 'smartphone_automation'))
        
    def load_config(self, config_path):
        """Load training configuration"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return self.get_default_config()
    
    def get_default_config(self):
        """Default training configuration"""
        return {
            "model": {
                "architecture": "deep_neural_network",
                "hidden_layers": [256, 128, 64],
                "dropout_rate": 0.3,
                "activation": "relu",
                "output_activation": "softmax"
            },
            "training": {
                "epochs": 100,
                "batch_size": 32,
                "learning_rate": 0.001,
                "validation_split": 0.2,
                "early_stopping_patience": 15,
                "reduce_lr_patience": 8
            },
            "data": {
                "samples": 50000,
                "test_size": 0.2,
                "random_state": 42
            },
            "optimization": {
                "enable_hyperparameter_tuning": True,
                "n_trials": 50,
                "optimization_direction": "maximize"
            }
        }
    
    def generate_enterprise_data(self, n_samples=50000):
        """Generate comprehensive training data with realistic patterns"""
        logger.info(f"Generating {n_samples} training samples...")
        
        np.random.seed(self.config['data']['random_state'])
        
        data = []
        for i in range(n_samples):
            # Base features
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            usage_count = np.random.poisson(15)  # Poisson distribution for usage
            context = np.random.choice([0, 1, 2], p=[0.4, 0.4, 0.2])  # Home, work, public
            battery_level = np.random.beta(2, 2) * 100  # Beta distribution for battery
            
            # Derived features
            is_weekend = 1 if day_of_week >= 5 else 0
            is_work_hours = 1 if (9 <= hour <= 17 and not is_weekend) else 0
            is_night_time = 1 if (hour >= 22 or hour <= 6) else 0
            
            # Advanced features with correlations
            avg_usage_last_week = max(5, usage_count + np.random.normal(0, 5))
            location_changes = np.random.poisson(2) if context == 2 else np.random.poisson(1)
            notification_count = np.random.poisson(usage_count * 0.8)
            screen_time = min(12, max(1, usage_count * 0.3 + np.random.normal(0, 1)))
            
            # Advanced labeling logic with business rules
            label = self._determine_label(
                hour, day_of_week, usage_count, context, battery_level,
                is_weekend, is_work_hours, is_night_time, avg_usage_last_week,
                location_changes, notification_count, screen_time
            )
            
            data.append([
                hour, day_of_week, usage_count, context, battery_level,
                is_weekend, is_work_hours, is_night_time, avg_usage_last_week,
                location_changes, notification_count, screen_time, label
            ])
        
        # Create DataFrame
        columns = self.feature_names + ['label']
        df = pd.DataFrame(data, columns=columns)
        
        logger.info(f"Generated data shape: {df.shape}")
        logger.info(f"Label distribution:\n{df['label'].value_counts()}")
        
        return df
    
    def _determine_label(self, hour, day_of_week, usage_count, context, battery_level,
                        is_weekend, is_work_hours, is_night_time, avg_usage_last_week,
                        location_changes, notification_count, screen_time):
        """Advanced business logic for label determination"""
        
        # Priority rules
        if battery_level < 10:
            return 'Silent'  # Critical battery
        
        if is_night_time and usage_count < 5:
            return 'Silent'  # Night time with low usage
        
        if context == 2 and notification_count > 20:
            return 'Vibrate'  # Public place with many notifications
        
        if is_work_hours and context == 1:
            if usage_count > 25:
                return 'Vibrate'  # Busy work day
            else:
                return 'Normal'   # Normal work day
        
        # Scoring-based decision for complex cases
        silent_score = (
            (is_night_time * 0.4) +
            (battery_level < 20) * 0.3 +
            (usage_count < 5) * 0.2 +
            (context == 0 and is_weekend) * 0.1
        )
        
        vibrate_score = (
            (context == 2) * 0.4 +
            (is_work_hours) * 0.3 +
            (notification_count > 15) * 0.2 +
            (location_changes > 3) * 0.1
        )
        
        normal_score = (
            (context == 0 and not is_night_time) * 0.4 +
            (battery_level > 50) * 0.3 +
            (is_weekend and not is_night_time) * 0.2 +
            (usage_count > 10 and usage_count < 20) * 0.1
        )
        
        scores = {'Silent': silent_score, 'Vibrate': vibrate_score, 'Normal': normal_score}
        return max(scores, key=scores.get)
    
    def create_advanced_model(self, input_shape, trial=None):
        """Create advanced neural network with optional hyperparameter optimization"""
        
        if trial:
            # Hyperparameter optimization
            n_layers = trial.suggest_int('n_layers', 2, 5)
            hidden_units = []
            for i in range(n_layers):
                hidden_units.append(trial.suggest_int(f'n_units_l{i}', 32, 512, step=32))
            
            dropout_rate = trial.suggest_float('dropout_rate', 0.1, 0.5)
            learning_rate = trial.suggest_float('learning_rate', 1e-5, 1e-2, log=True)
            batch_size = trial.suggest_categorical('batch_size', [16, 32, 64, 128])
        else:
            # Use config values
            hidden_units = self.config['model']['hidden_layers']
            dropout_rate = self.config['model']['dropout_rate']
            learning_rate = self.config['training']['learning_rate']
            batch_size = self.config['training']['batch_size']
        
        # Build model
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=input_shape),
            tf.keras.layers.BatchNormalization(name='input_batch_norm')
        ])
        
        # Add hidden layers
        for i, units in enumerate(hidden_units):
            model.add(tf.keras.layers.Dense(
                units,
                activation=self.config['model']['activation'],
                kernel_initializer='he_normal',
                kernel_regularizer=tf.keras.regularizers.l2(0.001),
                name=f'hidden_{i+1}'
            ))
            model.add(tf.keras.layers.BatchNormalization(name=f'batch_norm_{i+1}'))
            model.add(tf.keras.layers.Dropout(dropout_rate, name=f'dropout_{i+1}'))
        
        # Output layer
        model.add(tf.keras.layers.Dense(
            len(self.class_names),
            activation=self.config['model']['output_activation'],
            name='output'
        ))
        
        # Compile model
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
        model.compile(
            optimizer=optimizer,
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        return model, batch_size
    
    def train_model(self, X_train, X_val, y_train, y_val, trial=None):
        """Train model with advanced callbacks and monitoring"""
        
        model, batch_size = self.create_advanced_model(X_train.shape[1:], trial)
        
        # Callbacks
        callbacks = [
            tf.keras.callbacks.EarlyStopping(
                monitor='val_accuracy',
                patience=self.config['training']['early_stopping_patience'],
                restore_best_weights=True,
                verbose=1
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=self.config['training']['reduce_lr_patience'],
                min_lr=1e-7,
                verbose=1
            ),
            tf.keras.callbacks.ModelCheckpoint(
                'best_model.h5',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            )
        ]
        
        # Add Optuna pruning callback if using hyperparameter optimization
        if trial:
            callbacks.append(TFKerasPruningCallback(trial, 'val_accuracy'))
        
        # Train model
        history = model.fit(
            X_train, y_train,
            batch_size=batch_size,
            epochs=self.config['training']['epochs'],
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1
        )
        
        return model, history
    
    def evaluate_model(self, model, X_test, y_test):
        """Comprehensive model evaluation"""
        
        # Predictions
        y_pred_proba = model.predict(X_test)
        y_pred = np.argmax(y_pred_proba, axis=1)
        
        # Metrics
        test_loss, test_accuracy, test_precision, test_recall = model.evaluate(X_test, y_test, verbose=0)
        
        # Classification report
        report = classification_report(y_test, y_pred, target_names=self.class_names, output_dict=True)
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        
        metrics = {
            'test_loss': test_loss,
            'test_accuracy': test_accuracy,
            'test_precision': test_precision,
            'test_recall': test_recall,
            'classification_report': report,
            'confusion_matrix': cm.tolist()
        }
        
        return metrics
    
    def objective(self, trial):
        """Objective function for hyperparameter optimization"""
        
        # Generate data
        df = self.generate_enterprise_data(self.config['data']['samples'])
        
        # Prepare data
        X = df[self.feature_names].values
        y = self.label_encoder.fit_transform(df['label'].values)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.config['data']['test_size'],
            random_state=self.config['data']['random_state'],
            stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Further split for validation
        X_train_final, X_val, y_train_final, y_val = train_test_split(
            X_train_scaled, y_train, test_size=0.2,
            random_state=self.config['data']['random_state'],
            stratify=y_train
        )
        
        # Train model
        model, history = self.train_model(X_train_final, X_val, y_train_final, y_val, trial)
        
        # Evaluate
        metrics = self.evaluate_model(model, X_test_scaled, y_test)
        
        return metrics['test_accuracy']
    
    def run_hyperparameter_optimization(self):
        """Run hyperparameter optimization using Optuna"""
        
        logger.info("Starting hyperparameter optimization...")
        
        study = optuna.create_study(
            direction=self.config['optimization']['optimization_direction'],
            study_name='smartphone_automation_optimization'
        )
        
        study.optimize(
            self.objective,
            n_trials=self.config['optimization']['n_trials'],
            timeout=None
        )
        
        logger.info("Hyperparameter optimization completed!")
        logger.info(f"Best trial: {study.best_trial.number}")
        logger.info(f"Best accuracy: {study.best_value:.4f}")
        logger.info(f"Best parameters: {study.best_params}")
        
        return study.best_params
    
    def train_final_model(self, best_params=None):
        """Train final model with best parameters"""
        
        with mlflow.start_run():
            # Log parameters
            mlflow.log_params(self.config['training'])
            if best_params:
                mlflow.log_params(best_params)
            
            # Generate data
            df = self.generate_enterprise_data(self.config['data']['samples'])
            
            # Prepare data
            X = df[self.feature_names].values
            y = self.label_encoder.fit_transform(df['label'].values)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=self.config['data']['test_size'],
                random_state=self.config['data']['random_state'],
                stratify=y
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Validation split
            X_train_final, X_val, y_train_final, y_val = train_test_split(
                X_train_scaled, y_train, test_size=0.2,
                random_state=self.config['data']['random_state'],
                stratify=y_train
            )
            
            # Update config with best params if available
            if best_params:
                # Update model architecture
                if 'n_layers' in best_params:
                    hidden_units = []
                    for i in range(best_params['n_layers']):
                        hidden_units.append(best_params[f'n_units_l{i}'])
                    self.config['model']['hidden_layers'] = hidden_units
                
                if 'dropout_rate' in best_params:
                    self.config['model']['dropout_rate'] = best_params['dropout_rate']
                
                if 'learning_rate' in best_params:
                    self.config['training']['learning_rate'] = best_params['learning_rate']
                
                if 'batch_size' in best_params:
                    self.config['training']['batch_size'] = best_params['batch_size']
            
            # Train model
            model, history = self.train_model(X_train_final, X_val, y_train_final, y_val)
            
            # Evaluate
            metrics = self.evaluate_model(model, X_test_scaled, y_test)
            
            # Log metrics
            mlflow.log_metrics({
                'final_accuracy': metrics['test_accuracy'],
                'final_precision': metrics['test_precision'],
                'final_recall': metrics['test_recall'],
                'final_loss': metrics['test_loss']
            })
            
            # Log model
            mlflow.tensorflow.log_model(model, "model")
            
            # Save model and artifacts
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_dir = f"models/smartphone_automation_{timestamp}"
            os.makedirs(model_dir, exist_ok=True)
            
            # Save TensorFlow model
            model.save(f"{model_dir}/model.h5")
            
            # Save preprocessing objects
            import joblib
            joblib.dump(self.scaler, f"{model_dir}/scaler.pkl")
            joblib.dump(self.label_encoder, f"{model_dir}/label_encoder.pkl")
            
            # Save metadata
            metadata = {
                'model_version': timestamp,
                'feature_names': self.feature_names,
                'class_names': self.class_names,
                'metrics': metrics,
                'config': self.config,
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
            with open(f"{model_dir}/metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
            
            logger.info(f"Model saved to {model_dir}")
            logger.info(f"Final accuracy: {metrics['test_accuracy']:.4f}")
            
            return model, metrics, model_dir

def main():
    parser = argparse.ArgumentParser(description='Enterprise AI Model Training')
    parser.add_argument('--config', default='config/training_config.json',
                       help='Path to training configuration file')
    parser.add_argument('--optimize', action='store_true',
                       help='Run hyperparameter optimization')
    parser.add_argument('--samples', type=int, default=50000,
                       help='Number of training samples to generate')
    
    args = parser.parse_args()
    
    # Initialize trainer
    trainer = EnterpriseModelTrainer(args.config)
    
    if args.samples:
        trainer.config['data']['samples'] = args.samples
    
    try:
        if args.optimize and trainer.config['optimization']['enable_hyperparameter_tuning']:
            # Run hyperparameter optimization
            best_params = trainer.run_hyperparameter_optimization()
            
            # Train final model with best parameters
            model, metrics, model_dir = trainer.train_final_model(best_params)
        else:
            # Train with default/config parameters
            model, metrics, model_dir = trainer.train_final_model()
        
        logger.info("Training completed successfully!")
        logger.info(f"Model directory: {model_dir}")
        logger.info(f"Final metrics: {metrics}")
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()