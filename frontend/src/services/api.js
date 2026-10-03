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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isLogin =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/admin/login');
    if (error.response?.status === 401 && !isLogin) {
      sessionStorage.removeItem('portal.session');
      const onAdmin = window.location.pathname.startsWith('/admin');
      const target = onAdmin ? '/admin/login' : '/login';
      if (window.location.pathname !== target) {
        window.location.assign(target);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
