import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = axios.create({ baseURL: '/api' });

// Inject token on every request
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('smart_ews_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smart_ews_token');
    if (token) {
      API.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('smart_ews_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await API.post('/auth/login', { email, password });
    localStorage.setItem('smart_ews_token', r.data.token);
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('smart_ews_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { API };
