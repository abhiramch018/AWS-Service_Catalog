import api from './api';

export async function fetchRequestableProducts() {
  const response = await api.get('/api/product-requests/options');
  return response.data;
}

export async function fetchMyProductRequests() {
  const response = await api.get('/api/product-requests');
  return response.data;
}

export async function submitProductRequest(payload) {
  const response = await api.post('/api/product-requests', payload);
  return response.data;
}

export async function fetchAdminProductRequests() {
  const response = await api.get('/api/admin/product-requests');
  return response.data;
}

export async function approveProductRequest(requestId, adminComment) {
  const response = await api.patch(`/api/admin/product-requests/${requestId}/approve`, {
    adminComment,
  });
  return response.data;
}

export async function rejectProductRequest(requestId, adminComment) {
  const response = await api.patch(`/api/admin/product-requests/${requestId}/reject`, {
    adminComment,
  });
  return response.data;
}
