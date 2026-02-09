import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiAPI, blockchainAPI, adminAPI } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    setUser(JSON.parse(userData));
  };

  const handleAIPrediction = async () => {
    setLoading(true);
    setPrediction(null);
    try {
      const hour = new Date().getHours();
      const usageCount = Math.floor(Math.random() * 30) + 1;
      const context = hour >= 9 && hour <= 17 ? 1 : 0;

      const response = await aiAPI.predict({ hour, usageCount, context });
      setPrediction(response.data);

      await logToBlockchain('AI_AUTOMATION_TRIGGERED');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'AI prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const logToBlockchain = async (action) => {
    try {
      const response = await blockchainAPI.logAction({ action });
      setTxHash(response.data.transactionHash);
    } catch (error) {
      console.log('Blockchain logging error:', error.response?.data?.error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const navigateToAdmin = () => {
    navigation.navigate('Admin');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.welcome}>Welcome, {user?.username}</Text>
        <Text style={styles.role}>Role: {user?.role}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Automation</Text>
        <Text style={styles.cardDesc}>Predict smartphone automation mode</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleAIPrediction}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Predicting...' : 'Trigger AI Prediction'}
          </Text>
        </TouchableOpacity>

        {prediction && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Prediction Result:</Text>
            <Text style={styles.resultText}>Action: {prediction.prediction}</Text>
            <Text style={styles.resultText}>Confidence: {prediction.confidence}%</Text>
            <Text style={styles.resultDesc}>{prediction.explanation}</Text>
          </View>
        )}

        {txHash && (
          <View style={styles.blockchain}>
            <Text style={styles.blockchainTitle}>✓ Logged to Blockchain</Text>
            <Text style={styles.txHash}>TX: {txHash.substring(0, 20)}...</Text>
          </View>
        )}
      </View>

      {user?.role === 'Admin' && (
        <TouchableOpacity style={styles.adminButton} onPress={navigateToAdmin}>
          <Text style={styles.buttonText}>Admin Panel</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcome: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
  },
  role: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
  },
  resultDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  blockchain: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  blockchainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f57c00',
  },
  txHash: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  adminButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
});
