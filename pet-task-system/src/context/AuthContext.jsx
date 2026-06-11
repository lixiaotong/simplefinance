import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const API = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(API + '/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(r => r.json()).then(d => {
          if (d.user) { setUser(d.user); setStudent(d.student); }
          else localStorage.removeItem('token');
        }).catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await fetch(API + '/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setStudent(data.student);
    return data;
  };

  const register = async (username, password, nickname) => {
    const res = await fetch(API + '/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password,nickname}) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setStudent(data.student);
    return data;
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); setStudent(null); };

  const refreshStudent = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(API + '/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if (data.student) setStudent(data.student);
  }, []);

  const apiFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers, 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, student, loading, login, register, logout, refreshStudent, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
