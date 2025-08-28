// src/scripts/setupAdmin.ts
// Run this script once to create the first admin user

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, ROLE_PERMISSIONS } from '@/types/user';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate configuration
console.log('🔍 Checking Firebase configuration...');
console.log('API Key:', firebaseConfig.apiKey ? 'Present' : '❌ MISSING');
console.log('Auth Domain:', firebaseConfig.authDomain || '❌ MISSING');
console.log('Project ID:', firebaseConfig.projectId || '❌ MISSING');

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('\n❌ Firebase configuration is incomplete!');
  console.error('Please check your .env.local file contains:');
  console.error('- NEXT_PUBLIC_FIREBASE_API_KEY');
  console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.error('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_APP_ID');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupAdminUser() {
  try {
    console.log('\n🚀 Creating admin user...');

    // Admin user credentials
    const adminData = {
      email: 'admin@fairviewbooking.com',
      password: 'Admin123!@#',
      displayName: 'System Administrator',
    };

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminData.email,
      adminData.password
    );

    const user = userCredential.user;
    console.log('✅ Firebase Auth user created:', user.uid);

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: adminData.displayName,
    });
    console.log('✅ Firebase Auth profile updated');

    // Create user profile in Firestore
    const userProfile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> = {
      uid: user.uid,
      email: adminData.email,
      displayName: adminData.displayName,
      photoURL: user.photoURL,
      role: 'admin',
      isActive: true,
      permissions: ROLE_PERMISSIONS.admin,
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
    console.log('✅ Firestore user profile created');

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to create admin user:');
    
    if (error.code === 'auth/email-already-in-use') {
      console.error('An admin user with this email already exists.');
      console.log('Try logging in with:');
      console.log('Email: admin@fairviewbooking.com');
      console.log('Password: Admin123!@#');
    } else if (error.code === 'auth/invalid-api-key') {
      console.error('Invalid Firebase API key. Please check your .env.local file.');
    } else if (error.code === 'auth/network-request-failed') {
      console.error('Network error. Please check your internet connection.');
    } else {
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the setup
console.log('🔧 Setting up admin user for Fairview Booking Manager...');
setupAdminUser();