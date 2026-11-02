import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api, { setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'user';
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(tokenStore.get());
  const [user, setUser] = useState(readUser());
  const [sessionNotice, setSessionNotice] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = useCallback(
    (notice = '') => {
      tokenStore.clear();
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      setSessionNotice(notice);
      queryClient.clear(); // never show one user's cached data to the next
      navigate('/login', { replace: true });
    },
    [navigate, queryClient]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => logout('Your session has expired. Please log in again.'));
  }, [logout]);

  const login = async (credentials) => {
    const { data } = await api.post('/user/login', credentials);
    tokenStore.set(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setSessionNotice('');
  };

  const signup = (payload) => api.post('/user/signup', payload).then((r) => r.data);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: !!token, login, signup, logout, sessionNotice, setSessionNotice }),
    [token, user, logout, sessionNotice]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
