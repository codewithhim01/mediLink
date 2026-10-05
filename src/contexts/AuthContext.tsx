import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { api } from '../services/api.js';
import { joinUserRoom } from '../services/socket.js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('medilink_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('medilink_token')) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      const res = await api.getCurrentUser();
      if (res.success && res.user) {
        setUser(res.user);
        setProfile(res.profile);
        joinUserRoom(res.user.id);
      } else {
        localStorage.removeItem('medilink_token');
        setUser(null);
        setProfile(null);
      }
    } catch {
      localStorage.removeItem('medilink_token');
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('medilink_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setProfile(res.profile);
        joinUserRoom(res.user.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (res.success && res.token) {
        localStorage.setItem('medilink_token', res.token);
        setToken(res.token);
        setUser(res.user);
        joinUserRoom(res.user.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('medilink_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const switchDemoRole = async (role: Role) => {
    const credentials: Record<Role, { email: string; pass: string }> = {
      PATIENT: { email: 'patient@medilink.com', pass: 'Patient@123' },
      DOCTOR: { email: 'doctor@medilink.com', pass: 'Doctor@123' },
      CLINIC: { email: 'clinic@medilink.com', pass: 'Clinic@123' },
      LABORATORY: { email: 'lab@medilink.com', pass: 'Lab@123' },
      ADMIN: { email: 'admin@medilink.com', pass: 'Admin@123' },
    };

    const target = credentials[role];
    if (target) {
      await login(target.email, target.pass);
    }
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
