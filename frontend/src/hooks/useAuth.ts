import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { LoginResponse, LoginRequiresTotp } from '../types';

const TOKEN_KEY = 'pablo_token';
const EXPIRY_KEY = 'pablo_token_expiry';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function readToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (expiry && Date.now() > Number(expiry)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return stored;
  }
  return sessionStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS));
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(readToken);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false): Promise<LoginResponse | LoginRequiresTotp> => {
      const { data } = await api.post<LoginResponse | LoginRequiresTotp>('/auth/login', { email, password });

      if ('accessToken' in data) {
        storeToken(data.accessToken, rememberMe);
        setToken(data.accessToken);
      }

      return data;
    },
    [],
  );

  const verifyTotp = useCallback(
    async (preAuthToken: string, code: string, rememberMe = false): Promise<void> => {
      const { data } = await api.post<LoginResponse>('/auth/totp/verify-login', {
        preAuthToken,
        code,
      });
      storeToken(data.accessToken, rememberMe);
      setToken(data.accessToken);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return { token, isAuthenticated: !!token, login, verifyTotp, logout };
}
