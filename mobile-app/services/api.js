import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const aiAPI = {
  predict: (data) => api.post('/ai/predict', data),
};

export const adminAPI = {
  assignRole: (data) => api.post('/admin/assign-role', data),
  getAllLogs: () => api.get('/admin/logs'),
  getAllUsers: () => api.get('/admin/users'),
};

export const blockchainAPI = {
  logAction: (data) => api.post('/blockchain/log', data),
  getLogs: () => api.get('/blockchain/logs'),
};

export default api;
