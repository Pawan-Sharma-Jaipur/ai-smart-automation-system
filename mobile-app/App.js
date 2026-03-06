import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';

const API_URL = 'http://localhost:3000';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  
  const [hour, setHour] = useState('14');
  const [usage, setUsage] = useState('25');
  const [context, setContext] = useState(0);
  const [battery, setBattery] = useState('75');
  const [prediction, setPrediction] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setScreen('dashboard');
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Backend not running! Start with START-PRODUCTION.bat');
    } finally {
      setLoading(false);
    }
  };

  const makePrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hour: parseInt(hour),
          usageCount: parseInt(usage),
          context: parseInt(context),
          batteryLevel: parseInt(battery),
          userId: user.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setPrediction(data);
        Alert.alert('Success', `Prediction: ${data.prediction}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🤖</Text>
          <Text style={styles.title}>AI Automation</Text>
          <Text style={styles.subtitle}>Smart Phone Management</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.testUsers}>
            <Text style={styles.testTitle}>Test Users:</Text>
            <Text style={styles.testUser}>admin / admin123</Text>
            <Text style={styles.testUser}>user1 / user123</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.dashHeader}>
        <View>
          <Text style={styles.welcome}>Welcome, {user?.username}!</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>
        <TouchableOpacity onPress={() => setScreen('login')}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AI Prediction</Text>
        
        <Text style={styles.label}>Hour (0-23)</Text>
        <TextInput
          style={styles.input}
          value={hour}
          onChangeText={setHour}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Usage Count</Text>
        <TextInput
          style={styles.input}
          value={usage}
          onChangeText={setUsage}
          keyboardType="numeric"
        />

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

        <Text style={styles.label}>Battery Level (%)</Text>
        <TextInput
          style={styles.input}
          value={battery}
          onChangeText={setBattery}
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={styles.button} 
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
    padding: 40,
    paddingTop: 80,
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  form: {
    padding: 30,
  },
  input: {
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testUsers: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f7fafc',
    borderRadius: 10,
  },
  testTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  testUser: {
    color: '#666',
    fontSize: 14,
  },
  dashHeader: {
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
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  contextButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
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
});
