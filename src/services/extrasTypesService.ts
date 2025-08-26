// src/services/extrasTypesService.ts

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ExtrasType, ExtrasTypeFormData, DEFAULT_EXTRAS_TYPES } from '@/types/extrasTypes';

export class ExtrasTypesService {
  private static readonly COLLECTION_NAME = 'extrasTypes';

  // Initialize default extras types
  static async initializeDefaultExtrasTypes(): Promise<void> {
    try {
      const batch = writeBatch(db);
      const extrasRef = collection(db, this.COLLECTION_NAME);

      for (const extraType of DEFAULT_EXTRAS_TYPES) {
        const extrasTypeRef = doc(extrasRef);
        const extrasTypeData: Omit<ExtrasType, 'id'> = {
          name: extraType.name,
          price: extraType.price,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          lastModifiedBy: 'system'
        };
        
        batch.set(extrasTypeRef, {
          ...extrasTypeData,
          createdAt: Timestamp.fromDate(extrasTypeData.createdAt),
          updatedAt: Timestamp.fromDate(extrasTypeData.updatedAt)
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error initializing default extras types:', error);
      throw new Error('Failed to initialize default extras types');
    }
  }

  // Get all extras types
  static async getAllExtrasTypes(): Promise<ExtrasType[]> {
    try {
      const extrasRef = collection(db, this.COLLECTION_NAME);
      const q = query(extrasRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as ExtrasType));
    } catch (error) {
      console.error('Error getting extras types:', error);
      throw new Error('Failed to get extras types');
    }
  }

  // Get active extras types only
  static async getActiveExtrasTypes(): Promise<ExtrasType[]> {
    try {
      const extrasRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        extrasRef, 
        where('status', '==', 'active'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as ExtrasType));
    } catch (error) {
      console.error('Error getting active extras types:', error);
      throw new Error('Failed to get active extras types');
    }
  }

  // Get extras type by ID
  static async getExtrasTypeById(id: string): Promise<ExtrasType | null> {
    try {
      const extrasRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(extrasRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      } as ExtrasType;
    } catch (error) {
      console.error('Error getting extras type by ID:', error);
      throw new Error('Failed to get extras type');
    }
  }

  // Create new extras type
  static async createExtrasType(formData: ExtrasTypeFormData): Promise<string> {
    try {
      const extrasRef = collection(db, this.COLLECTION_NAME);
      const extrasTypeData: Omit<ExtrasType, 'id'> = {
        name: formData.name.trim(),
        price: parseFloat(formData.price) || 0,
        status: formData.status as 'active' | 'inactive',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system'
      };

      const docRef = await addDoc(extrasRef, {
        ...extrasTypeData,
        createdAt: Timestamp.fromDate(extrasTypeData.createdAt),
        updatedAt: Timestamp.fromDate(extrasTypeData.updatedAt)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating extras type:', error);
      throw new Error('Failed to create extras type');
    }
  }

  // Update extras type
  static async updateExtrasType(id: string, formData: ExtrasTypeFormData): Promise<void> {
    try {
      const extrasRef = doc(db, this.COLLECTION_NAME, id);
      const updateData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price) || 0,
        status: formData.status as 'active' | 'inactive',
        updatedAt: Timestamp.fromDate(new Date()),
        lastModifiedBy: 'system'
      };

      await updateDoc(extrasRef, updateData);
    } catch (error) {
      console.error('Error updating extras type:', error);
      throw new Error('Failed to update extras type');
    }
  }

  // Delete extras type
  static async deleteExtrasType(id: string): Promise<void> {
    try {
      const extrasRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(extrasRef);
    } catch (error) {
      console.error('Error deleting extras type:', error);
      throw new Error('Failed to delete extras type');
    }
  }

  // Update extras type price only
  static async updateExtrasTypePrice(id: string, price: number): Promise<void> {
    try {
      const extrasRef = doc(db, this.COLLECTION_NAME, id);
      const updateData = {
        price,
        updatedAt: Timestamp.fromDate(new Date()),
        lastModifiedBy: 'system'
      };

      await updateDoc(extrasRef, updateData);
    } catch (error) {
      console.error('Error updating extras type price:', error);
      throw new Error('Failed to update extras type price');
    }
  }

  // Check if extras types exist (for initialization check)
  static async extrasTypesExist(): Promise<boolean> {
    try {
      const extrasRef = collection(db, this.COLLECTION_NAME);
      const querySnapshot = await getDocs(extrasRef);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if extras types exist:', error);
      return false;
    }
  }
}