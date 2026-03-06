import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function AdminScreen({ route, navigation }) {
  const { user } = route.params;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const data = await api.getDashboard();
        if (data.success) setStats(data.stats);
      } else if (activeTab === 'users') {
        const data = await api.getUsers();
        if (data.success) setUsers(data.users);
      } else if (activeTab === 'logs') {
        const data = await api.getLogs();
        if (data.success) setLogs(data.logs);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      const data = await api.changeRole(userId, newRole);
      if (data.success) {
        Alert.alert('Success', 'Role updated!');
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'logs' && styles.tabActive]}
          onPress={() => setActiveTab('logs')}
        >
          <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>
            Logs
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
          {activeTab === 'users' && <UsersTab users={users} onChangeRole={changeRole} />}
          {activeTab === 'logs' && <LogsTab logs={logs} />}
        </ScrollView>
      )}
    </View>
  );
}

function DashboardTab({ stats }) {
  return (
    <View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalPredictions || 0}</Text>
          <Text style={styles.statLabel}>Predictions</Text>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalLogs || 0}</Text>
          <Text style={styles.statLabel}>Activity Logs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>✓</Text>
          <Text style={styles.statLabel}>System Online</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        {stats.recentActivity?.slice(0, 5).map((log, i) => (
          <View key={i} style={styles.logItem}>
            <Text style={styles.logUser}>{log.username}</Text>
            <Text style={styles.logAction}>{log.action}</Text>
            <Text style={styles.logTime}>
              {new Date(log.created_at).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function UsersTab({ users, onChangeRole }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>User Management</Text>
      {users.map((user) => (
        <View key={user.id} style={styles.userItem}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.username}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          <View style={styles.userRole}>
            <Text style={styles.roleLabel}>Role: {user.role}</Text>
            <View style={styles.roleButtons}>
              {['Admin', 'Manager', 'User', 'Guest'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleButton, user.role === r && styles.roleButtonActive]}
                  onPress={() => onChangeRole(user.id, r)}
                >
                  <Text style={[styles.roleButtonText, user.role === r && styles.roleButtonTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function LogsTab({ logs }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Activity Logs</Text>
      {logs.slice(0, 20).map((log, i) => (
        <View key={i} style={styles.logItem}>
          <Text style={styles.logUser}>{log.username}</Text>
          <Text style={styles.logAction}>{log.action}</Text>
          {log.ai_prediction && (
            <Text style={styles.logPred}>AI: {log.ai_prediction}</Text>
          )}
          <Text style={styles.logTime}>
            {new Date(log.created_at).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
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
  back: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
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
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  logItem: {
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    marginBottom: 10,
  },
  logUser: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  logAction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  logPred: {
    fontSize: 12,
    color: '#667eea',
    marginBottom: 3,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
  },
  userItem: {
    padding: 15,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    marginBottom: 10,
  },
  userInfo: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userRole: {
    marginTop: 10,
  },
  roleLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  roleButtonText: {
    color: '#666',
    fontSize: 12,
  },
  roleButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
