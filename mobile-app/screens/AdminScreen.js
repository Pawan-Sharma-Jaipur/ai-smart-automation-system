import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { adminAPI } from '../services/api';

export default function AdminScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('User');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'Admin privileges required');
        navigation.goBack();
      }
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await adminAPI.getAllLogs();
      setLogs(response.data.logs);
    } catch (error) {
      console.log('Failed to fetch logs');
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserId) {
      Alert.alert('Error', 'Please enter user ID');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.assignRole({ userId: selectedUserId, role: selectedRole });
      Alert.alert('Success', 'Role assigned successfully');
      fetchUsers();
      setSelectedUserId('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Role assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Assign Role</Text>
        
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={selectedUserId}
          onChangeText={setSelectedUserId}
          keyboardType="numeric"
        />

        <View style={styles.roleButtons}>
          {['Admin', 'User', 'Guest', 'Child', 'Employee'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.roleButtonText, selectedRole === role && styles.roleButtonTextActive]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleAssignRole}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Assigning...' : 'Assign Role'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>All Users ({users.length})</Text>
        {users.map((user) => (
          <View key={user.id} style={styles.userItem}>
            <Text style={styles.userName}>ID: {user.id} - {user.username}</Text>
            <Text style={styles.userRole}>{user.role}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activity Logs ({logs.length})</Text>
        {logs.slice(0, 10).map((log) => (
          <View key={log.id} style={styles.logItem}>
            <Text style={styles.logText}>{log.username} ({log.role})</Text>
            <Text style={styles.logAction}>{log.action}</Text>
            <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF9500',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  roleButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 10,
    marginBottom: 10,
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    color: '#007AFF',
  },
  roleButtonTextActive: {
    color: '#fff',
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
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 14,
  },
  userRole: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  logItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logAction: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
});
