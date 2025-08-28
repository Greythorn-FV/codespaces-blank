// src/types/user.ts

export type UserRole = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  createdBy?: string;
  permissions: {
    canManageUsers: boolean;
    canManageFleet: boolean;
    canManageBookings: boolean;
    canManageSettings: boolean;
    canViewReports: boolean;
    canExportData: boolean;
  };
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface UserRegistrationData {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
}

// Permission mappings based on user roles
export const ROLE_PERMISSIONS: Record<UserRole, UserProfile['permissions']> = {
  admin: {
    canManageUsers: true,
    canManageFleet: true,
    canManageBookings: true,
    canManageSettings: true,
    canViewReports: true,
    canExportData: true,
  },
  member: {
    canManageUsers: false,
    canManageFleet: true,
    canManageBookings: true,
    canManageSettings: false,
    canViewReports: true,
    canExportData: false,
  },
};

// Email validation patterns to prevent fake emails
export const EMAIL_VALIDATION = {
  // Common fake email patterns
  FAKE_PATTERNS: [
    /fake@gmail\.com$/i,
    /fake@.*$/i,
    /test@.*$/i,
    /demo@.*$/i,
    /example@.*$/i,
    /temp@.*$/i,
    /dummy@.*$/i,
    /spam@.*$/i,
    /noreply@.*$/i,
    /no-reply@.*$/i,
  ],
  
  // Require proper email format
  VALID_FORMAT: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Additional business rules
  MIN_LENGTH: 5,
  MAX_LENGTH: 254,
};

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: keyof UserProfile['permissions']) => boolean;
  isAdmin: () => boolean;
  isMember: () => boolean;
}