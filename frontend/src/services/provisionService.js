import api from './api';

export async function submitProvisionRequest(payload) {
  const response = await api.post('/api/provision', payload);
  return response.data;
}

export async function fetchProvisionRequests() {
  const response = await api.get('/api/provision');
  return response.data;
}

export async function fetchProvisionRequest(requestId) {
  const response = await api.get(`/api/provision/${requestId}`);
  return response.data;
}
