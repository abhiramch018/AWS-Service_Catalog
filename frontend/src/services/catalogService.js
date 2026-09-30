import api from './api';

export async function fetchDashboardSummary() {
  const response = await api.get('/api/dashboard');
  return response.data;
}

export async function fetchProducts() {
  const response = await api.get('/api/products');
  return response.data;
}

export async function fetchProduct(id) {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
}

export async function createProduct(payload) {
  const response = await api.post('/api/products', payload);
  return response.data;
}
