import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, SafeAreaView } from 'react-native';

const API_URL = 'http://172.20.10.3:5000';

const ROLE_CONFIG = {
  SYSTEM_ADMIN: {
    color: '#e53e3e',
    allowed: ['All Apps', 'Settings', 'Banking', 'Social Media', 'Admin Panel'],
    blocked: [],
  },
  ORG_ADMIN: {
    color: '#dd6b20',
    allowed: ['Most Apps', 'Settings (Limited)', 'Social Media', 'User Management'],
    blocked: ['Banking Apps', 'System Config'],
  },
  TEAM_LEAD: {
    color: '#d69e2e',
    allowed: ['Work Apps', 'Communication', 'Productivity', 'Camera'],
    blocked: ['Settings', 'Banking', 'Admin Panel'],
  },
  DEVELOPER: {
    color: '#38a169',
    allowed: ['Basic Apps', 'Camera', 'Gallery', 'Social Media'],
    blocked: ['Settings', 'Banking', 'System Apps', 'Play Store'],
  },
  VIEWER: {
    color: '#3182ce',
    allowed: ['YouTube Kids', 'Educational Apps', 'Games (Limited)'],
    blocked: ['Social Media', 'Browser', 'Settings', 'Calls/SMS', 'Banking', 'Camera'],
  },
};

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hour, setHour] = useState('14');
  const [usage, setUsage] = useState('25');
  const [context, setContext] = useState(0);
  const [prediction, setPrediction] = useState(null);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setScreen('dashboard');
      } else {
        Alert.alert('Error', data.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Cannot connect to server.\nMake sure backend is running on port 5000');
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
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) setPrediction(data);
    } catch (error) {
      Alert.alert('Error', 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loginContainer}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginLogo}>🤖</Text>
            <Text style={styles.loginTitle}>AI Automation</Text>
            <Text style={styles.loginSubtitle}>Role-Based Access Control</Text>
          </View>

          <View style={styles.loginForm}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#a0aec0"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#a0aec0"
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>

            <View style={styles.testUsers}>
              <Text style={styles.testTitle}>Test Credentials:</Text>
              <Text style={styles.testUser}>superadmin / password123 → SYSTEM_ADMIN</Text>
              <Text style={styles.testUser}>admin / password123 → ORG_ADMIN</Text>
              <Text style={styles.testUser}>manager / password123 → TEAM_LEAD</Text>
              <Text style={styles.testUser}>user1 / password123 → DEVELOPER</Text>
              <Text style={styles.testUser}>demo / password123 → VIEWER</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.VIEWER;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: roleConfig.color }]}>
          <View>
            <Text style={styles.welcome}>Welcome, {user?.username}!</Text>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
          <TouchableOpacity onPress={() => { setUser(null); setScreen('login'); setPrediction(null); }}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Role Access Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔐 Access Control</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color }]}>
            <Text style={styles.roleBadgeText}>{user?.role}</Text>
          </View>

          <Text style={styles.sectionLabel}>✅ Allowed Apps:</Text>
          {roleConfig.allowed.map((app, i) => (
            <Text key={i} style={styles.allowedItem}>✓ {app}</Text>
          ))}

          {roleConfig.blocked.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>🚫 Blocked Apps:</Text>
              {roleConfig.blocked.map((app, i) => (
                <Text key={i} style={styles.blockedItem}>✗ {app}</Text>
              ))}
            </>
          )}
        </View>

        {/* AI Prediction Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI Prediction</Text>

          <Text style={styles.label}>Hour (0-23)</Text>
          <TextInput style={styles.input} value={hour} onChangeText={setHour} keyboardType="numeric" placeholderTextColor="#a0aec0" />

          <Text style={styles.label}>Usage Count</Text>
          <TextInput style={styles.input} value={usage} onChangeText={setUsage} keyboardType="numeric" placeholderTextColor="#a0aec0" />

          <Text style={styles.label}>Context</Text>
          <View style={styles.contextRow}>
            {[{ label: 'Home', value: 0 }, { label: 'Work', value: 1 }, { label: 'Public', value: 2 }].map((ctx) => (
              <TouchableOpacity
                key={ctx.value}
                style={[styles.contextBtn, context === ctx.value && { backgroundColor: roleConfig.color, borderColor: roleConfig.color }]}
                onPress={() => setContext(ctx.value)}
              >
                <Text style={[styles.contextBtnText, context === ctx.value && { color: '#fff' }]}>{ctx.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: roleConfig.color }]} onPress={makePrediction} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Prediction</Text>}
          </TouchableOpacity>

          {prediction && (
            <View style={styles.result}>
              <Text style={styles.resultValue}>{prediction.prediction}</Text>
              <Text style={styles.resultConfidence}>Confidence: {prediction.confidence}%</Text>
              <Text style={styles.resultExplanation}>{prediction.explanation?.summary}</Text>
            </View>
          )}
        </View>

        {/* Admin Panel Button - only for SYSTEM_ADMIN and ORG_ADMIN */}
        {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'ORG_ADMIN') && (
          <TouchableOpacity style={[styles.adminBtn, { backgroundColor: roleConfig.color }]} onPress={() => setScreen('admin')}>
            <Text style={styles.buttonText}>🛡️ Admin Panel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  loginContainer: { flex: 1, backgroundColor: '#667eea' },
  loginHeader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  loginLogo: { fontSize: 80, marginBottom: 20 },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  loginSubtitle: { fontSize: 16, color: '#fff', opacity: 0.9 },
  loginForm: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  roleText: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  logout: { color: '#fff', fontSize: 16 },
  card: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2d3748' },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 15 },
  roleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginTop: 10, marginBottom: 8 },
  allowedItem: { fontSize: 15, color: '#38a169', paddingVertical: 3 },
  blockedItem: { fontSize: 15, color: '#e53e3e', paddingVertical: 3 },
  input: { backgroundColor: '#f7fafc', padding: 14, borderRadius: 10, marginBottom: 12, fontSize: 16, color: '#2d3748' },
  label: { fontSize: 14, color: '#718096', marginBottom: 6, marginTop: 4 },
  button: { backgroundColor: '#667eea', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  contextRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  contextBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#f7fafc', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  contextBtnText: { color: '#666', fontSize: 14, fontWeight: '600' },
  result: { marginTop: 15, padding: 15, backgroundColor: '#f7fafc', borderRadius: 10 },
  resultValue: { fontSize: 36, fontWeight: 'bold', color: '#667eea', marginBottom: 8 },
  resultConfidence: { fontSize: 16, color: '#666', marginBottom: 8 },
  resultExplanation: { fontSize: 14, color: '#888', lineHeight: 20 },
  testUsers: { marginTop: 25, padding: 15, backgroundColor: '#f7fafc', borderRadius: 10 },
  testTitle: { fontWeight: 'bold', marginBottom: 8, color: '#2d3748' },
  testUser: { color: '#666', fontSize: 13, marginBottom: 4 },
  adminBtn: { margin: 15, padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
});
