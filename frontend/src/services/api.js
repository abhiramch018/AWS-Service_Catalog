import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem('portal.session');
  if (!raw) {
    return config;
  }

  try {
    const session = JSON.parse(raw);
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  } catch {
    // A damaged demo session is ignored. This value is never an AWS credential.
  }

  return config;
});

export default api;
