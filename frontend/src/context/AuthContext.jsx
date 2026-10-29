import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hirehub_token'));
  const [loading, setLoading] = useState(true);

  // Load session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('hirehub_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.user);
          setProfile(data.profile);
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        localStorage.removeItem('hirehub_token');
        setUser(null);
        setProfile(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('hirehub_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
    }
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    if (data.success) {
      localStorage.setItem('hirehub_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('hirehub_token');
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const isSeeker = user?.role === 'job_seeker';
  const isRecruiter = user?.role === 'recruiter';
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        isAuthenticated,
        isSeeker,
        isRecruiter,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
