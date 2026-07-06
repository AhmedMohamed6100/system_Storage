import React, { createContext, useContext, useState } from 'react';
import { User, AuthState } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => boolean;
  loginWithRecovery: (key: string) => boolean;
  logout: () => void;
  currentUser: User | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => authService.getAuthState());

  const login = (username: string, password: string): boolean => {
    const user = authService.login(username, password);
    if (user) {
      setAuthState({ isAuthenticated: true, currentUser: user });
      return true;
    }
    return false;
  };

  const loginWithRecovery = (key: string): boolean => {
    const user = authService.loginWithRecoveryKey(key);
    if (user) {
      setAuthState({ isAuthenticated: true, currentUser: user });
      return true;
    }
    return false;
  };

  const logout = () => {
    authService.logout();
    setAuthState({ isAuthenticated: false, currentUser: null });
  };

  return (
    <AuthContext.Provider value={{
      authState,
      login,
      loginWithRecovery,
      logout,
      currentUser: authState.currentUser,
      isAuthenticated: authState.isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
