import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {Camera} from 'expo-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api/auth';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {status} = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      checkStoredAuth();
    })();
  }, []);

  const checkStoredAuth = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const role = await AsyncStorage.getItem('userRole');
    if (token && role) {
      setUserRole(role);
      setIsUnlocked(true);
    }
  };

  const handleFaceLogin = async () => {
    setLoading(true);
    try {
      // Simulate face recognition
      const faceDescriptor = Array(128).fill(0).map(() => Math.random());
      
      const response = await axios.post(`${API_URL}/face-login`, {
        faceDescriptor,
        confidence: 85,
      });

      if (response.data.success) {
        const {token, user} = response.data;
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userRole', user.role);
        
        setUserRole(user.role);
        setIsUnlocked(true);
        
        Alert.alert('Success', `Welcome ${user.username}!\nRole: ${user.role}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setIsUnlocked(false);
    setUserRole(null);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No camera access</Text></View>;
  }

  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Face Unlock</Text>
        <Text style={styles.subtitle}>Position your face in the camera</Text>
        
        <Camera style={styles.camera} type={Camera.Constants.Type.front} />
        
        <TouchableOpacity style={styles.button} onPress={handleFaceLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Authenticate</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smartphone Automation</Text>
      <Text style={styles.subtitle}>Role-Based Access Control</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>User Role:</Text>
        <Text style={styles.roleText}>{userRole}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Permissions:</Text>
        {getPermissions(userRole).map((perm, index) => (
          <Text key={index} style={styles.permissionText}>✓ {perm}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Restricted Apps:</Text>
        {getRestrictions(userRole).map((app, index) => (
          <Text key={index} style={styles.restrictionText}>✗ {app}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const getPermissions = role => {
  const permissions = {
    SYSTEM_ADMIN: ['All Apps', 'Settings', 'Banking', 'Admin Controls'],
    ORG_ADMIN: ['Most Apps', 'Settings (Limited)', 'User Management'],
    TEAM_LEAD: ['Work Apps', 'Communication', 'Productivity'],
    DEVELOPER: ['Basic Apps', 'Camera', 'Gallery', 'Social Media'],
    VIEWER: ['YouTube Kids', 'Educational Apps', 'Games (Limited)'],
  };
  return permissions[role] || [];
};

const getRestrictions = role => {
  const restrictions = {
    SYSTEM_ADMIN: [],
    ORG_ADMIN: ['Banking Apps', 'System Settings'],
    TEAM_LEAD: ['Settings', 'Banking', 'Admin Panel'],
    DEVELOPER: ['Settings', 'Banking', 'System Apps'],
    VIEWER: ['Social Media', 'Browser', 'Settings', 'Calls/SMS'],
  };
  return restrictions[role] || [];
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f7fa', padding: 20, justifyContent: 'center'},
  title: {fontSize: 28, fontWeight: 'bold', color: '#2d3748', textAlign: 'center', marginBottom: 10},
  subtitle: {fontSize: 16, color: '#718096', textAlign: 'center', marginBottom: 30},
  camera: {width: '100%', height: 400, borderRadius: 20, marginBottom: 20},
  card: {backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3},
  label: {fontSize: 14, color: '#4a5568', fontWeight: '600', marginBottom: 10},
  roleText: {fontSize: 24, fontWeight: 'bold', color: '#667eea'},
  permissionText: {fontSize: 16, color: '#48bb78', marginBottom: 5},
  restrictionText: {fontSize: 16, color: '#f56565', marginBottom: 5},
  button: {backgroundColor: '#667eea', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20},
  buttonText: {color: '#fff', fontSize: 18, fontWeight: '600'},
});
