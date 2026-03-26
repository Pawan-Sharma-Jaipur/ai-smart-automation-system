const API_URL = 'http://localhost:5000';

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  register: async (username, email, password, role = 'User') => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role })
    });
    return res.json();
  },

  // AI Predictions
  predict: async (hour, usageCount, context, batteryLevel, userId) => {
    const res = await fetch(`${API_URL}/api/ai/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hour, usageCount, context, batteryLevel, userId })
    });
    return res.json();
  },

  getPredictions: async () => {
    const res = await fetch(`${API_URL}/api/ai/predictions`);
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${API_URL}/api/ai/stats`);
    return res.json();
  },

  // Users
  getUsers: async () => {
    const res = await fetch(`${API_URL}/api/users`);
    return res.json();
  },

  changeRole: async (userId, role) => {
    const res = await fetch(`${API_URL}/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  // Logs
  getLogs: async () => {
    const res = await fetch(`${API_URL}/api/logs`);
    return res.json();
  },

  // Admin
  getDashboard: async () => {
    const res = await fetch(`${API_URL}/api/admin/dashboard`);
    return res.json();
  },

  // Health
  health: async () => {
    const res = await fetch(`${API_URL}/health`);
    return res.json();
  }
};
