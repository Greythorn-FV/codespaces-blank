// src/services/authService.ts

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User,
  AuthError,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile, UserRole, EMAIL_VALIDATION, ROLE_PERMISSIONS } from '@/types/user';

export class AuthService {
  private static readonly USERS_COLLECTION = 'users';

  /**
   * Validates email against fake patterns and business rules
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check length
    if (trimmedEmail.length < EMAIL_VALIDATION.MIN_LENGTH) {
      return { isValid: false, error: 'Email is too short' };
    }

    if (trimmedEmail.length > EMAIL_VALIDATION.MAX_LENGTH) {
      return { isValid: false, error: 'Email is too long' };
    }

    // Check format
    if (!EMAIL_VALIDATION.VALID_FORMAT.test(trimmedEmail)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    // Check against fake patterns
    for (const pattern of EMAIL_VALIDATION.FAKE_PATTERNS) {
      if (pattern.test(trimmedEmail)) {
        return { isValid: false, error: 'This email address is not allowed. Please use a valid business email.' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates password strength
   */
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one special character' };
    }

    return { isValid: true };
  }

  /**
   * Sign in user with email and password
   */
  static async signIn(email: string, password: string, rememberMe = false): Promise<UserProfile> {
    try {
      // Validate email
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
      }

      // Set persistence based on remember me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const firebaseUser = userCredential.user;

      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      if (!userProfile) {
        throw new Error('User profile not found. Please contact an administrator.');
      }

      // Check if user is active
      if (!userProfile.isActive) {
        await signOut(auth);
        throw new Error('Your account has been deactivated. Please contact an administrator.');
      }

      // Update last login time
      await this.updateLastLogin(firebaseUser.uid);

      return userProfile;
    } catch (error) {
      console.error('Sign in error:', error);
      
      if (error instanceof Error) {
        // Handle specific Firebase Auth errors
        const authError = error as AuthError;
        switch (authError.code) {
          case 'auth/user-not-found':
            throw new Error('No account found with this email address.');
          case 'auth/wrong-password':
            throw new Error('Incorrect password. Please try again.');
          case 'auth/invalid-email':
            throw new Error('Please enter a valid email address.');
          case 'auth/user-disabled':
            throw new Error('This account has been disabled.');
          case 'auth/too-many-requests':
            throw new Error('Too many failed attempts. Please try again later.');
          case 'auth/network-request-failed':
            throw new Error('Network error. Please check your connection.');
          default:
            throw new Error(error.message || 'Failed to sign in. Please try again.');
        }
      }
      
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Create new user account (Admin only)
   */
  static async createUser(data: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    createdBy: string;
  }): Promise<UserProfile> {
    try {
      // Validate email
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
      }

      // Validate password
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
      }

      // Check if user already exists
      const existingUsers = await getDocs(
        query(collection(db, this.USERS_COLLECTION), where('email', '==', data.email.trim().toLowerCase()))
      );

      if (!existingUsers.empty) {
        throw new Error('A user with this email already exists.');
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateFirebaseProfile(firebaseUser, {
        displayName: data.displayName,
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: data.email.trim().toLowerCase(),
        displayName: data.displayName,
        photoURL: firebaseUser.photoURL,
        role: data.role,
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        createdBy: data.createdBy,
        permissions: ROLE_PERMISSIONS[data.role],
      };

      await setDoc(doc(db, this.USERS_COLLECTION, firebaseUser.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      return userProfile;
    } catch (error) {
      console.error('Create user error:', error);
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case 'auth/email-already-in-use':
            throw new Error('An account with this email already exists.');
          case 'auth/invalid-email':
            throw new Error('Please enter a valid email address.');
          case 'auth/operation-not-allowed':
            throw new Error('Account creation is not enabled.');
          case 'auth/weak-password':
            throw new Error('Password is too weak. Please choose a stronger password.');
          default:
            throw new Error(error.message || 'Failed to create user account.');
        }
      }
      
      throw new Error('An unexpected error occurred while creating the account.');
    }
  }

  /**
   * Send password reset email
   */
  static async forgotPassword(email: string): Promise<void> {
    try {
      // Validate email
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
      }

      // Check if user exists in our system
      const users = await getDocs(
        query(collection(db, this.USERS_COLLECTION), where('email', '==', email.trim().toLowerCase()))
      );

      if (users.empty) {
        throw new Error('No account found with this email address.');
      }

      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case 'auth/user-not-found':
            throw new Error('No account found with this email address.');
          case 'auth/invalid-email':
            throw new Error('Please enter a valid email address.');
          case 'auth/too-many-requests':
            throw new Error('Too many requests. Please try again later.');
          default:
            throw new Error(error.message || 'Failed to send password reset email.');
        }
      }
      
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Reset password with code
   */
  static async resetPassword(oobCode: string, newPassword: string): Promise<void> {
    try {
      // Validate password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
      }

      await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case 'auth/expired-action-code':
            throw new Error('Password reset link has expired. Please request a new one.');
          case 'auth/invalid-action-code':
            throw new Error('Invalid password reset link. Please request a new one.');
          case 'auth/weak-password':
            throw new Error('Password is too weak. Please choose a stronger password.');
          default:
            throw new Error(error.message || 'Failed to reset password.');
        }
      }
      
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        permissions: data.permissions || ROLE_PERMISSIONS[data.role as UserRole],
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, uid);
      
      // Convert dates to Firestore timestamps for storage
      const firebaseUpdates: any = { ...updates };
      
      if (updates.createdAt) {
        firebaseUpdates.createdAt = serverTimestamp();
      }
      
      if (updates.lastLoginAt) {
        firebaseUpdates.lastLoginAt = serverTimestamp();
      }

      await updateDoc(userRef, firebaseUpdates);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw new Error('Failed to update user profile.');
    }
  }

  /**
   * Update last login time
   */
  private static async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, {
        lastLoginAt: new Date(),
      });
    } catch (error) {
      // Don't throw error for this, just log it
      console.error('Update last login error:', error);
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userProfile = await this.getUserProfile(firebaseUser.uid);
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get current user
   */
  static getCurrentUser(): Promise<UserProfile | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        unsubscribe();
        if (firebaseUser) {
          const userProfile = await this.getUserProfile(firebaseUser.uid);
          resolve(userProfile);
        } else {
          resolve(null);
        }
      });
    });
  }
}