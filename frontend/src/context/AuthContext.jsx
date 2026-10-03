import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { adminLoginRequest } from '../services/adminService';
import {
  clearSession,
  loginRequest,
  readSession,
  registerRequest,
  saveSession,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  useEffect(() => {
    let active = true;
    api
      .get('/api/health')
      .then((response) => {
        if (!active) {
          return;
        }
        setSession((current) => {
          if (!current || current.mode === response.data.mode) {
            return current;
          }
          const next = { ...current, mode: response.data.mode };
          saveSession(next);
          return next;
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => {
    return {
      user: session?.user ?? null,
      mode: session?.mode ?? 'demo',
      isAuthenticated: Boolean(session?.user),
      async login(email, password) {
        const result = await loginRequest(email, password);
        const nextSession = {
          user: result.user,
          token: result.token,
          mode: result.mode,
        };
        saveSession(nextSession);
        setSession(nextSession);
      },
      async adminLogin(email, password) {
        const result = await adminLoginRequest(email, password);
        const nextSession = {
          user: result.user,
          token: result.token,
          mode: result.mode,
        };
        saveSession(nextSession);
        setSession(nextSession);
      },
      async register(name, email, password) {
        const result = await registerRequest(name, email, password);
        const nextSession = {
          user: result.user,
          token: result.token,
          mode: result.mode,
        };
        saveSession(nextSession);
        setSession(nextSession);
      },
      logout() {
        clearSession();
        setSession(null);
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
