import { useState, useCallback } from 'react';
import { validateUser, type AxieStudioUser } from '../config/users';

interface AuthState {
  user: AxieStudioUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

export const useAxieStudioAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const user = validateUser(credentials.username, credentials.password);
      
      if (user) {
        // Update last login time
        updateLastLogin(user);
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });

        // Store authentication state
        localStorage.setItem('axie-studio-auth', JSON.stringify({
          user,
          timestamp: Date.now()
        }));

        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid username or password'
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please try again.'
      }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    
    localStorage.removeItem('axie-studio-auth');
  }, []);

  const checkAuthStatus = useCallback(() => {
    try {
      const stored = localStorage.getItem('axie-studio-auth');
      if (stored) {
        const { user, timestamp } = JSON.parse(stored);
        
        // Check if auth is still valid (24 hours)
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        
        if (!isExpired && user) {
          // Verify user still exists and is active
          const currentUser = validateUser(user.username, user.password);
          if (currentUser) {
            setAuthState({
              user: currentUser,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
    
    // Clear invalid auth
    localStorage.removeItem('axie-studio-auth');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    return false;
  }, []);

  const updateLastLogin = (user: AxieStudioUser) => {
    try {
      const stored = localStorage.getItem('axie-studio-users');
      if (stored) {
        const users: AxieStudioUser[] = JSON.parse(stored);
        const updatedUsers = users.map(u => 
          u.id === user.id 
            ? { ...u, lastLogin: new Date().toISOString() }
            : u
        );
        localStorage.setItem('axie-studio-users', JSON.stringify(updatedUsers));
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus,
    clearError
  };
};
