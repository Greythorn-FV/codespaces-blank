// src/contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '@/services/authService';
import { UserProfile, AuthContextType } from '@/types/user';
import toast from 'react-hot-toast';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await AuthService.signIn(email, password, rememberMe);
      setUser(userProfile);
      
      toast.success(`Welcome back, ${userProfile.displayName || userProfile.email}!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await AuthService.signOut();
      setUser(null);
      
      toast.success('Logged out successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      
      await AuthService.forgotPassword(email);
      
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset email';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (oobCode: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      
      await AuthService.resetPassword(oobCode, newPassword);
      
      toast.success('Password reset successfully. You can now log in with your new password.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      setError(null);
      
      await AuthService.updateUserProfile(user.uid, data);
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!user) return;

      setError(null);
      
      const updatedUser = await AuthService.getUserProfile(user.uid);
      setUser(updatedUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user data';
      setError(errorMessage);
      console.error('Refresh user error:', errorMessage);
    }
  };

  const hasPermission = (permission: keyof UserProfile['permissions']): boolean => {
    return user?.permissions?.[permission] || false;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isMember = (): boolean => {
    return user?.role === 'member';
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshUser,
    hasPermission,
    isAdmin,
    isMember,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for protected routes
export interface WithAuthOptions {
  requiredRole?: 'admin' | 'member';
  requiredPermission?: keyof UserProfile['permissions'];
  redirectTo?: string;
}

export function withAuth<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  options: WithAuthOptions = {}
) {
  const { requiredRole, requiredPermission, redirectTo = '/auth/login' } = options;

  const AuthorizedComponent: React.FC<T> = (props) => {
    const { user, loading } = useAuth();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          window.location.href = redirectTo;
          return;
        }

        if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
          toast.error('You do not have permission to access this page');
          window.location.href = '/';
          return;
        }

        if (requiredPermission && !user.permissions?.[requiredPermission]) {
          toast.error('You do not have permission to access this feature');
          window.location.href = '/';
          return;
        }
      }
    }, [user, loading]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to access this page.</p>
          </div>
        </div>
      );
    }

    if (requiredPermission && !user.permissions?.[requiredPermission]) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to access this feature.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  AuthorizedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthorizedComponent;
}