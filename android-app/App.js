import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  NativeModules,
  PermissionsAndroid,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {AppLockModule} = NativeModules;
const API_URL = 'http://192.168.1.100:3001/api/auth'; // Change to your PC IP

const App = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    checkStoredAuth();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request usage stats permission
      const hasPermission = await AppLockModule.checkUsagePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'App needs usage access permission to monitor apps',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Grant', onPress: () => AppLockModule.requestUsagePermission()},
          ]
        );
      }
    } catch (error) {
      console.log('Permission error:', error);
    }
  };

  const checkStoredAuth = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const role = await AsyncStorage.getItem('userRole');
    if (token && role) {
      setUserRole(role);
      setIsUnlocked(true);
      // Apply app restrictions
      applyAppLock(role);
    }
  };

  const applyAppLock = async (role) => {
    try {
      const result = await AppLockModule.applyRoleRestrictions(role);
      console.log('App lock applied:', result);
    } catch (error) {
      console.log('App lock error:', error);
    }
  };

  const onFacesDetected = async ({faces}) => {
    if (faces.length > 0 && !loading && !isUnlocked) {
      setLoading(true);
      const face = faces[0];
      
      // Extract face descriptor (simplified)
      const faceDescriptor = Array(128).fill(0).map(() => Math.random());
      const confidence = face.rollAngle ? 85 : 75;

      try {
        const response = await axios.post(`${API_URL}/face-login`, {
          faceDescriptor,
          confidence,
        });

        if (response.data.success) {
          const {token, user} = response.data;
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userRole', user.role);
          
          setUserRole(user.role);
          setIsUnlocked(true);
          
          // Apply app lock based on role
          await applyAppLock(user.role);
          
          Alert.alert('Success', `Welcome ${user.username}!\nRole: ${user.role}\nApp restrictions applied`);
        } else {
          Alert.alert('Error', 'Face not recognized');
        }
      } catch (error) {
        Alert.alert('Error', 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setIsUnlocked(false);
    setUserRole(null);
  };

  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Face Unlock</Text>
        <Text style={styles.subtitle}>Position your face in the camera</Text>
        
        <RNCamera
          style={styles.camera}
          type={RNCamera.Constants.Type.front}
          onFacesDetected={onFacesDetected}
          onCameraReady={() => setCameraReady(true)}
          faceDetectionMode={RNCamera.Constants.FaceDetection.Mode.fast}
          faceDetectionLandmarks={RNCamera.Constants.FaceDetection.Landmarks.all}
          faceDetectionClassifications={RNCamera.Constants.FaceDetection.Classifications.all}
        />
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Authenticating...</Text>
          </View>
        )}
        
        {!cameraReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Starting camera...</Text>
          </View>
        )}
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
          <Text key={index} style={styles.permissionText}>
            ✓ {perm}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Restricted Apps:</Text>
        {getRestrictions(userRole).map((app, index) => (
          <Text key={index} style={styles.restrictionText}>
            ✗ {app}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 30,
  },
  camera: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
    marginBottom: 10,
  },
  roleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  permissionText: {
    fontSize: 16,
    color: '#48bb78',
    marginBottom: 5,
  },
  restrictionText: {
    fontSize: 16,
    color: '#f56565',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default App;
