import api from './api';

export async function adminLoginRequest(email, password) {
  const response = await api.post('/api/admin/login', { email, password });
  return response.data;
}

export async function fetchAdminDashboard() {
  const response = await api.get('/api/admin/dashboard');
  return response.data;
}
