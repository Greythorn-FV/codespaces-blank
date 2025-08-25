// src/services/groupService.ts

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
  limit, 
  startAfter, 
  where,
  writeBatch,
  DocumentSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VehicleGroup, GroupFormData, GroupSearchResult, GroupSortField } from '@/types/groups';

export class GroupService {
  private static readonly COLLECTION_NAME = 'vehicleGroups';

  // Initialize default groups from the provided list
  static async initializeDefaultGroups(): Promise<void> {
    const defaultGroups = [
      'STND MONOSOF 7 SEAT AUTO',
      'MEDIUM 4X4 MANUAL',
      'SHORT WHEEL BASE VAN MAN',
      'MID - SIZE CROSSOVER AUTO',
      'SMALL HATCHBACK AUTO',
      'MEDIUM 4X4 AUTO',
      'MEDIUM 4X4 PREMIUM AUTO',
      'CITY CAR AUTO',
      'MEDIUM WHEEL BASE VAN',
      'MPV AUTO 8 SEAT PREMIUM',
      'DOUBLE CAB PICK UP',
      'LONG WHEEL BASE ELECTRIC',
      'COMPACT/WAC MAN 7 SEAT',
      'LONG WHEEL BASE VAN',
      'MPV AUTO 9 SEAT',
      'MPV MANUAL 17 MANUAL',
      'LOW LOADER - LLD',
      'ESTATE AUTO',
      'SMALL VAN',
      'CREW CAB 5 SEAT MAN',
      'MID - SIZE CROSSOVER MAN',
      'SINGLE CAB TIPPER',
      'LUTON BOX VAN TAIL LIFT',
      'LWB REFRIGERTED VAN',
      'SWB REFRIGERTED VAN',
      'EX LONG WHEEL BASE',
      'SHORT WHEEL BASE VAN AUTO',
      'MPV MANUAL 14 SEAT',
      'MPV MANUAL 11 SEAT',
      'MPV AUTO 8 SEAT',
      'STND MONOSOF 7 SEAT AUTO',
      'STND MONOSOF 7 SEAT MAN',
      'CREW CAB 5 SEAT AUTO',
      'CREW CAB 5 SEAT AUTO',
      'STANDARD 4X4 AUTO',
      'COMPACT CROSSOVER AUTO',
      'COMPACT CROSSOVER MANUAL',
      'SMALL HATCHBACK PREMIUM AUTO',
      'SMALL HATCHBACK MAN',
      'CITY CAR MANUAL',
      'EXECUTIVE LARGE 4X4 - EXCL4'
    ];

    const batch = writeBatch(db);
    const groupsRef = collection(db, this.COLLECTION_NAME);

    for (const groupName of defaultGroups) {
      const groupRef = doc(groupsRef);
      const groupData: Omit<VehicleGroup, 'id'> = {
        name: groupName,
        vehicleCount: 0,
        hourlyRate: 0,
        dailyRate: 0,
        weeklyRate: 0,
        monthlyRate: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system'
      };
      batch.set(groupRef, {
        ...groupData,
        createdAt: Timestamp.fromDate(groupData.createdAt),
        updatedAt: Timestamp.fromDate(groupData.updatedAt)
      });
    }

    await batch.commit();
  }

  // Get all groups with pagination
  static async getGroups(
    pageSize = 20,
    lastDocument?: DocumentSnapshot,
    sortField: GroupSortField = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<GroupSearchResult> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy(sortField, sortDirection),
        limit(pageSize)
      );

      if (lastDocument) {
        q = query(q, startAfter(lastDocument));
      }

      const snapshot = await getDocs(q);
      const groups: VehicleGroup[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        groups.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as VehicleGroup);
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return { groups, lastDoc, hasMore };
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw new Error('Failed to fetch groups');
    }
  }

  // Get group by ID
  static async getGroupById(id: string): Promise<VehicleGroup | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as VehicleGroup;
      }
      return null;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw new Error('Failed to fetch group');
    }
  }

  // Search groups by name
  static async searchGroups(searchTerm: string): Promise<VehicleGroup[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('name')
      );
      
      const snapshot = await getDocs(q);
      const groups: VehicleGroup[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const group: VehicleGroup = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as VehicleGroup;
        
        // Simple text-based search
        if (group.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          groups.push(group);
        }
      });

      return groups;
    } catch (error) {
      console.error('Error searching groups:', error);
      throw new Error('Failed to search groups');
    }
  }

  // Create new group
  static async createGroup(groupData: GroupFormData): Promise<string> {
    try {
      const newGroup: Omit<VehicleGroup, 'id'> = {
        name: groupData.name.trim(),
        vehicleCount: 0,
        hourlyRate: parseFloat(groupData.hourlyRate) || 0,
        dailyRate: parseFloat(groupData.dailyRate) || 0,
        weeklyRate: parseFloat(groupData.weeklyRate) || 0,
        monthlyRate: parseFloat(groupData.monthlyRate) || 0,
        status: groupData.status as 'active' | 'inactive',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system'
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...newGroup,
        createdAt: Timestamp.fromDate(newGroup.createdAt),
        updatedAt: Timestamp.fromDate(newGroup.updatedAt)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  // Update group
  static async updateGroup(id: string, groupData: GroupFormData): Promise<void> {
    try {
      const groupRef = doc(db, this.COLLECTION_NAME, id);
      const updateData = {
        name: groupData.name.trim(),
        hourlyRate: parseFloat(groupData.hourlyRate) || 0,
        dailyRate: parseFloat(groupData.dailyRate) || 0,
        weeklyRate: parseFloat(groupData.weeklyRate) || 0,
        monthlyRate: parseFloat(groupData.monthlyRate) || 0,
        status: groupData.status as 'active' | 'inactive',
        updatedAt: Timestamp.fromDate(new Date()),
        lastModifiedBy: 'system'
      };

      await updateDoc(groupRef, updateData);
    } catch (error) {
      console.error('Error updating group:', error);
      throw new Error('Failed to update group');
    }
  }

  // Update group pricing only
  static async updateGroupPricing(
    id: string, 
    pricing: { hourlyRate: number; dailyRate: number; weeklyRate: number; monthlyRate: number }
  ): Promise<void> {
    try {
      const groupRef = doc(db, this.COLLECTION_NAME, id);
      const updateData = {
        hourlyRate: pricing.hourlyRate,
        dailyRate: pricing.dailyRate,
        weeklyRate: pricing.weeklyRate,
        monthlyRate: pricing.monthlyRate,
        updatedAt: Timestamp.fromDate(new Date()),
        lastModifiedBy: 'system'
      };

      await updateDoc(groupRef, updateData);
    } catch (error) {
      console.error('Error updating group pricing:', error);
      throw new Error('Failed to update group pricing');
    }
  }

  // Update vehicle count for a group
  static async updateVehicleCount(groupId: string, newCount: number): Promise<void> {
    try {
      const groupRef = doc(db, this.COLLECTION_NAME, groupId);
      await updateDoc(groupRef, {
        vehicleCount: newCount,
        updatedAt: Timestamp.fromDate(new Date()),
        lastModifiedBy: 'system'
      });
    } catch (error) {
      console.error('Error updating vehicle count:', error);
      throw new Error('Failed to update vehicle count');
    }
  }

  // Delete group
  static async deleteGroup(id: string): Promise<void> {
    try {
      const groupRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(groupRef);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  }

  // Get groups by status
  static async getGroupsByStatus(status: 'active' | 'inactive'): Promise<VehicleGroup[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', status),
        orderBy('name')
      );
      
      const snapshot = await getDocs(q);
      const groups: VehicleGroup[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        groups.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as VehicleGroup);
      });

      return groups;
    } catch (error) {
      console.error('Error fetching groups by status:', error);
      throw new Error('Failed to fetch groups');
    }
  }

  // Clear all groups
  static async clearAllGroups(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing all groups:', error);
      throw new Error('Failed to clear all groups');
    }
  }
}