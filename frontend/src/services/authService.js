import api from './api';

const SESSION_KEY = 'portal.session';

export function readSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw);
    if (!session?.user?.email) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function loginRequest(email, password) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
}

export async function registerRequest(name, email, password) {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
}
