import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import authService from '../api/authService';

export type UserType = 'student' | 'librarian' | 'admin' | null;

interface AuthContextType {
  userType: UserType;
  sessionVersion: number;
  login: (username: string, password?: string) => Promise<UserType>;
  socialLogin: (registrationId: string, code: string) => Promise<{ role: UserType; isNewUser?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [sessionVersion, setSessionVersion] = useState(0);
  const [userType, setUserType] = useState<UserType>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('userType');
    return (saved as UserType) || null;
  });

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === 'userType' || event.key === null) {
        setUserType(localStorage.getItem('userType') as UserType || null);
        setSessionVersion(version => version + 1);
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  const handleToken = (accessToken: string, refreshToken: string): UserType => {
    let type: UserType = 'student';
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    try {
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      if (payload.scope && payload.scope.includes('ADMIN')) {
        type = 'admin';
      } else if (payload.scope && payload.scope.includes('LIBRARIAN')) {
        type = 'librarian';
      }
    } catch (e) {
      console.error('Failed to parse token payload', e);
    }
    
    setUserType(type);
    setSessionVersion(version => version + 1);
    localStorage.setItem('userType', type);
    return type;
  };

  const login = async (username: string, password?: string): Promise<UserType> => {
    let type: UserType = 'student';

    if (password) {
      try {
        const response = await authService.login(username, password);
        if (response && response.data) {
          return handleToken(response.data.accessToken, response.data.refreshToken);
        }
      } catch (error) {
        console.error('Login failed', error);
        throw error;
      }
    } else {
      type = username.toLowerCase() === 'admin'
        ? 'admin'
        : username.toLowerCase() === 'librarian'
          ? 'librarian'
          : 'student';
      setUserType(type);
      localStorage.setItem('userType', type);
    }

    return type;
  };

  const socialLogin = async (registrationId: string, code: string): Promise<{ role: UserType; isNewUser?: boolean }> => {
    try {
      const response = await authService.socialLoginCallback(registrationId, code);
      if (response && response.data) {
        const role = handleToken(response.data.accessToken, response.data.refreshToken);
        return { role, isNewUser: response.data.isNewUser };
      }
      throw new Error('Invalid response from social login callback');
    } catch (error) {
      console.error('Social login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    // 1. Gọi backend để đưa refreshToken vào blacklist
    const refreshToken = localStorage.getItem('refreshToken');
    // Clear private UI immediately, even if the logout HTTP request takes time.
    setUserType(null);
    setSessionVersion(version => version + 1);
    localStorage.removeItem('userType');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('Lỗi khi gọi API logout:', error);
      }
    }

  };

  return (
    <AuthContext.Provider value={{ userType, sessionVersion, login, socialLogin, logout }}>
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
