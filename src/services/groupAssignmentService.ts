// src/services/groupAssignmentService.ts

import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GroupAssignment } from '@/types/groups';
import { Vehicle } from '@/types/fleet';
import { GroupService } from './groupService';

export class GroupAssignmentService {
  private static readonly COLLECTION_NAME = 'groupAssignments';

  // Assign vehicle to group
  static async assignVehicleToGroup(
    groupId: string,
    groupName: string,
    vehicle: Vehicle
  ): Promise<string> {
    try {
      // Check if vehicle is already assigned to this group
      const existingAssignment = await this.getVehicleAssignment(vehicle.id!);
      if (existingAssignment && existingAssignment.groupId === groupId) {
        throw new Error('Vehicle is already assigned to this group');
      }

      // Remove from previous group if assigned
      if (existingAssignment) {
        await this.removeVehicleFromGroup(vehicle.id!);
      }

      // Create new assignment
      const assignment: Omit<GroupAssignment, 'id'> = {
        groupId,
        groupName,
        vehicleId: vehicle.id!,
        registration: vehicle.registration,
        assignedAt: new Date(),
        assignedBy: 'system'
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...assignment,
        assignedAt: Timestamp.fromDate(assignment.assignedAt)
      });

      // Update vehicle count in the group
      await this.updateGroupVehicleCount(groupId);

      return docRef.id;
    } catch (error) {
      console.error('Error assigning vehicle to group:', error);
      throw new Error('Failed to assign vehicle to group');
    }
  }

  // Remove vehicle from group
  static async removeVehicleFromGroup(vehicleId: string): Promise<void> {
    try {
      const assignment = await this.getVehicleAssignment(vehicleId);
      if (!assignment) {
        throw new Error('Vehicle is not assigned to any group');
      }

      // Delete assignment
      const assignmentRef = doc(db, this.COLLECTION_NAME, assignment.id!);
      await deleteDoc(assignmentRef);

      // Update vehicle count in the group
      await this.updateGroupVehicleCount(assignment.groupId);
    } catch (error) {
      console.error('Error removing vehicle from group:', error);
      throw new Error('Failed to remove vehicle from group');
    }
  }

  // Get vehicle's current group assignment
  static async getVehicleAssignment(vehicleId: string): Promise<GroupAssignment | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('vehicleId', '==', vehicleId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt?.toDate() || new Date(),
      } as GroupAssignment;
    } catch (error) {
      console.error('Error fetching vehicle assignment:', error);
      throw new Error('Failed to fetch vehicle assignment');
    }
  }

  // Get all vehicles assigned to a group
  static async getVehiclesInGroup(groupId: string): Promise<GroupAssignment[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('groupId', '==', groupId)
      );
      
      const snapshot = await getDocs(q);
      const assignments: GroupAssignment[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        assignments.push({
          id: doc.id,
          ...data,
          assignedAt: data.assignedAt?.toDate() || new Date(),
        } as GroupAssignment);
      });

      return assignments;
    } catch (error) {
      console.error('Error fetching vehicles in group:', error);
      throw new Error('Failed to fetch vehicles in group');
    }
  }

  // Get all unassigned vehicles
  static async getUnassignedVehicles(allVehicles: Vehicle[]): Promise<Vehicle[]> {
    try {
      const assignmentsSnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const assignedVehicleIds = new Set<string>();
      
      assignmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        assignedVehicleIds.add(data.vehicleId);
      });

      return allVehicles.filter(vehicle => !assignedVehicleIds.has(vehicle.id!));
    } catch (error) {
      console.error('Error fetching unassigned vehicles:', error);
      throw new Error('Failed to fetch unassigned vehicles');
    }
  }

  // Update vehicle count for a group
  private static async updateGroupVehicleCount(groupId: string): Promise<void> {
    try {
      const assignments = await this.getVehiclesInGroup(groupId);
      await GroupService.updateVehicleCount(groupId, assignments.length);
    } catch (error) {
      console.error('Error updating group vehicle count:', error);
      throw new Error('Failed to update group vehicle count');
    }
  }

  // Clear all assignments for a group
  static async clearGroupAssignments(groupId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('groupId', '==', groupId)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Update group vehicle count to 0
      await GroupService.updateVehicleCount(groupId, 0);
    } catch (error) {
      console.error('Error clearing group assignments:', error);
      throw new Error('Failed to clear group assignments');
    }
  }

  // Bulk assign vehicles to groups
  static async bulkAssignVehicles(
    assignments: Array<{ groupId: string; groupName: string; vehicleId: string; registration: string }>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const assignmentsRef = collection(db, this.COLLECTION_NAME);

      for (const assignment of assignments) {
        const assignmentRef = doc(assignmentsRef);
        const assignmentData: Omit<GroupAssignment, 'id'> = {
          groupId: assignment.groupId,
          groupName: assignment.groupName,
          vehicleId: assignment.vehicleId,
          registration: assignment.registration,
          assignedAt: new Date(),
          assignedBy: 'system'
        };

        batch.set(assignmentRef, {
          ...assignmentData,
          assignedAt: Timestamp.fromDate(assignmentData.assignedAt)
        });
      }

      await batch.commit();

      // Update vehicle counts for affected groups
      const groupIds = [...new Set(assignments.map(a => a.groupId))];
      for (const groupId of groupIds) {
        await this.updateGroupVehicleCount(groupId);
      }
    } catch (error) {
      console.error('Error bulk assigning vehicles:', error);
      throw new Error('Failed to bulk assign vehicles');
    }
  }
}