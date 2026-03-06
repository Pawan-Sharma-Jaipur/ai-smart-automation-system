import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function DashboardScreen({ route, navigation }) {
  const { user } = route.params;
  const [hour, setHour] = useState('14');
  const [usage, setUsage] = useState('25');
  const [context, setContext] = useState(0);
  const [battery, setBattery] = useState('75');
  const [prediction, setPrediction] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [predData, statsData] = await Promise.all([
        api.getPredictions(),
        api.getStats()
      ]);
      if (predData.success) setPredictions(predData.predictions.slice(0, 5));
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.log('Load error:', error);
    }
  };

  const makePrediction = async () => {
    setLoading(true);
    try {
      const data = await api.predict(
        parseInt(hour),
        parseInt(usage),
        parseInt(context),
        parseInt(battery),
        user.id
      );
      if (data.success) {
        setPrediction(data);
        Alert.alert('Success', `Prediction: ${data.prediction}`);
        loadData();
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome, {user.username}!</Text>
          <Text style={styles.role}>{user.role}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalPredictions}</Text>
            <Text style={styles.statLabel}>Predictions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AI Prediction</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hour (0-23)</Text>
          <TextInput
            style={styles.input}
            value={hour}
            onChangeText={setHour}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usage Count</Text>
          <TextInput
            style={styles.input}
            value={usage}
            onChangeText={setUsage}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Context</Text>
          <View style={styles.contextButtons}>
            {[{label: 'Home', value: 0}, {label: 'Work', value: 1}, {label: 'Public', value: 2}].map((ctx) => (
              <TouchableOpacity
                key={ctx.value}
                style={[styles.contextButton, context === ctx.value && styles.contextButtonActive]}
                onPress={() => setContext(ctx.value)}
              >
                <Text style={[styles.contextButtonText, context === ctx.value && styles.contextButtonTextActive]}>
                  {ctx.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Battery Level (%)</Text>
          <TextInput
            style={styles.input}
            value={battery}
            onChangeText={setBattery}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={makePrediction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get Prediction</Text>
          )}
        </TouchableOpacity>

        {prediction && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Result:</Text>
            <Text style={styles.resultValue}>{prediction.prediction}</Text>
            <Text style={styles.resultConfidence}>
              Confidence: {prediction.confidence}%
            </Text>
            <View style={styles.probabilities}>
              <Text style={styles.probText}>
                Silent: {prediction.probabilities.Silent}%
              </Text>
              <Text style={styles.probText}>
                Vibrate: {prediction.probabilities.Vibrate}%
              </Text>
              <Text style={styles.probText}>
                Normal: {prediction.probabilities.Normal}%
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Recent Predictions</Text>
        {predictions.map((pred, i) => (
          <View key={i} style={styles.predItem}>
            <Text style={styles.predValue}>{pred.prediction}</Text>
            <Text style={styles.predDetail}>
              {pred.confidence}% • {new Date(pred.created_at).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </View>

      {user.role === 'Admin' && (
        <TouchableOpacity 
          style={styles.adminButton}
          onPress={() => navigation.navigate('Admin', { user })}
        >
          <Text style={styles.adminButtonText}>🛡️ Admin Panel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  role: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  logout: {
    color: '#fff',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  picker: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  contextButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contextButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contextButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  contextButtonText: {
    color: '#666',
    fontSize: 14,
  },
  contextButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
  },
  resultConfidence: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  probabilities: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  probText: {
    fontSize: 12,
    color: '#666',
  },
  predItem: {
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    marginBottom: 10,
  },
  predValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  predDetail: {
    fontSize: 12,
    color: '#666',
  },
  adminButton: {
    backgroundColor: '#667eea',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
