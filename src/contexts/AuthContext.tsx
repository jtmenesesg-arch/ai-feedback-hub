import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('evaluador_token');
    localStorage.removeItem('evaluador_user');
  }, []);

  // Check for stored session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('evaluador_token');
    const storedUser = localStorage.getItem('evaluador_user');
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true,
        });
      } catch {
        logout();
      }
    }
  }, [logout]);

  // Inactivity timeout
  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    const interval = setInterval(() => {
      if (authState.isAuthenticated && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [authState.isAuthenticated, lastActivity, logout]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulated API call - replace with actual endpoint
      // POST https://api.mi-backend.com/auth/login
      const response = await fetch('https://api.mi-backend.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);

      // For demo purposes, simulate success with mock data
      if (!response) {
        // Demo mode: accept any login
        const mockUser: User = {
          id: '1',
          nombre: email.split('@')[0],
          email,
          rol: email.includes('admin') ? 'admin' : 'user',
          fecha_creacion: new Date().toISOString(),
        };
        const mockToken = 'demo-token-' + Date.now();
        
        setAuthState({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        });
        
        localStorage.setItem('evaluador_token', mockToken);
        localStorage.setItem('evaluador_user', JSON.stringify(mockUser));
        
        return { success: true };
      }

      if (!response.ok) {
        return { success: false, error: 'Credenciales inválidas' };
      }

      const data = await response.json();
      setAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });
      
      localStorage.setItem('evaluador_token', data.token);
      localStorage.setItem('evaluador_user', JSON.stringify(data.user));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // POST https://api.mi-backend.com/auth/reset-password-request
      const response = await fetch('https://api.mi-backend.com/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => null);

      // Demo mode
      if (!response) {
        return { success: true };
      }

      if (!response.ok) {
        return { success: false, error: 'Error al enviar solicitud' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // POST https://api.mi-backend.com/auth/change-password
      const response = await fetch('https://api.mi-backend.com/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      }).catch(() => null);

      // Demo mode
      if (!response) {
        return { success: true };
      }

      if (!response.ok) {
        return { success: false, error: 'Error al cambiar contraseña' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      requestPasswordReset,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
