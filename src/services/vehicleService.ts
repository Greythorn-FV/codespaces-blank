// src/services/vehicleService.ts

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vehicle, BulkUploadResult, VehicleSearchResult, VehicleSize, VehicleStatus } from '@/types/fleet';

const COLLECTION_NAME = 'vehicles';

interface VehicleData {
  registration: string;
  vinNumber?: string;
  make: string;
  model: string;
  colour?: string;
  size?: string;  // Changed to string to accept ANY value
  motExpiry?: Timestamp | null;
  taxExpiry?: Timestamp | null;
  comments?: string;
  status: VehicleStatus;
  createdBy: string;
  lastModifiedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class VehicleService {
  // Security: Input validation and sanitization
  private static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  private static validateRegistration(registration: string): boolean {
    // UK registration format validation
    const regPattern = /^[A-Z]{2}\d{2}\s?[A-Z]{3}$|^[A-Z]\d{1,3}\s?[A-Z]{3}$|^[A-Z]{3}\s?\d{1,3}[A-Z]$|^[A-Z]{2}\d{2}\s?\d{3}$/i;
    return regPattern.test(registration);
  }

  private static validateVIN(vin: string): boolean {
    // VIN should be 17 characters
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
  }

  // Convert Firestore document to Vehicle
  private static convertToVehicle(docSnapshot: any, data: any): Vehicle {
    return {
      id: docSnapshot.id,
      registration: data.registration,
      vinNumber: data.vinNumber || null,
      make: data.make,
      model: data.model,
      colour: data.colour || null,
      size: data.size || null,
      motExpiry: data.motExpiry ? data.motExpiry.toDate() : null,
      taxExpiry: data.taxExpiry ? data.taxExpiry.toDate() : null,
      comments: data.comments || null,
      status: data.status,
      createdBy: data.createdBy,
      lastModifiedBy: data.lastModifiedBy,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
    } as Vehicle;
  }

  // Get all vehicles with pagination
  static async getVehicles(
    pageSize: number = 20, 
    lastDoc?: DocumentSnapshot,
    sortField: string = 'registration',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<VehicleSearchResult> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy(sortField, sortDirection),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const vehicles: Vehicle[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        vehicles.push(this.convertToVehicle(docSnapshot, data));
      });

      return {
        vehicles,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw new Error('Failed to fetch vehicles');
    }
  }

  // Get single vehicle
  static async getVehicle(id: string): Promise<Vehicle | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return this.convertToVehicle(docSnap, data);
      }
      return null;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw new Error('Failed to fetch vehicle');
    }
  }

  // Add new vehicle with validation
  static async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate required fields
      if (!vehicleData.registration || !vehicleData.make || !vehicleData.model) {
        throw new Error('Registration, make, and model are required');
      }

      // Validate registration format
      if (!this.validateRegistration(vehicleData.registration)) {
        throw new Error('Invalid registration format');
      }

      // Validate VIN if provided
      if (vehicleData.vinNumber && !this.validateVIN(vehicleData.vinNumber)) {
        throw new Error('Invalid VIN format');
      }

      // Check for duplicate registration
      const existing = await this.getVehicleByRegistration(vehicleData.registration);
      if (existing) {
        throw new Error('Vehicle with this registration already exists');
      }

      // Sanitize inputs - Handle null values properly for Firestore
      const sanitizedData: VehicleData = {
        registration: this.sanitizeInput(vehicleData.registration.toUpperCase()),
        make: this.sanitizeInput(vehicleData.make),
        model: this.sanitizeInput(vehicleData.model),
        status: vehicleData.status,
        createdBy: vehicleData.createdBy,
        lastModifiedBy: vehicleData.lastModifiedBy,
        motExpiry: vehicleData.motExpiry ? Timestamp.fromDate(vehicleData.motExpiry) : null,
        taxExpiry: vehicleData.taxExpiry ? Timestamp.fromDate(vehicleData.taxExpiry) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Only add optional fields if they have actual string values (not null, undefined, or empty)
      if (vehicleData.vinNumber && vehicleData.vinNumber.trim()) {
        sanitizedData.vinNumber = this.sanitizeInput(vehicleData.vinNumber);
      }
      if (vehicleData.colour && vehicleData.colour.trim()) {
        sanitizedData.colour = this.sanitizeInput(vehicleData.colour);
      }
      if (vehicleData.size) {
        sanitizedData.size = vehicleData.size;
      }
      if (vehicleData.comments && vehicleData.comments.trim()) {
        sanitizedData.comments = this.sanitizeInput(vehicleData.comments);
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizedData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  }

  // Update vehicle with validation
  static async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Validate registration if being updated
      if (updates.registration) {
        if (!this.validateRegistration(updates.registration)) {
          throw new Error('Invalid registration format');
        }
        
        // Check for duplicate if registration is changing
        const existing = await this.getVehicleByRegistration(updates.registration);
        if (existing && existing.id !== id) {
          throw new Error('Vehicle with this registration already exists');
        }
      }

      // Validate VIN if being updated
      if (updates.vinNumber && !this.validateVIN(updates.vinNumber)) {
        throw new Error('Invalid VIN format');
      }

      // Sanitize string inputs - Remove undefined values for Firestore
      const sanitizedUpdates: Record<string, any> = {
        updatedAt: Timestamp.now()
      };

      // Only update fields that have values
      if (updates.registration) sanitizedUpdates.registration = this.sanitizeInput(updates.registration.toUpperCase());
      if (updates.make) sanitizedUpdates.make = this.sanitizeInput(updates.make);
      if (updates.model) sanitizedUpdates.model = this.sanitizeInput(updates.model);
      if (updates.colour) sanitizedUpdates.colour = this.sanitizeInput(updates.colour);
      if (updates.comments) sanitizedUpdates.comments = this.sanitizeInput(updates.comments);
      if (updates.vinNumber) sanitizedUpdates.vinNumber = this.sanitizeInput(updates.vinNumber);
      if (updates.size) sanitizedUpdates.size = updates.size;
      if (updates.status) sanitizedUpdates.status = updates.status;
      if (updates.createdBy) sanitizedUpdates.createdBy = updates.createdBy;
      if (updates.lastModifiedBy) sanitizedUpdates.lastModifiedBy = updates.lastModifiedBy;
      if (updates.motExpiry !== undefined) sanitizedUpdates.motExpiry = updates.motExpiry ? Timestamp.fromDate(updates.motExpiry) : null;
      if (updates.taxExpiry !== undefined) sanitizedUpdates.taxExpiry = updates.taxExpiry ? Timestamp.fromDate(updates.taxExpiry) : null;

      await updateDoc(docRef, sanitizedUpdates);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Delete vehicle
  static async deleteVehicle(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error('Failed to delete vehicle');
    }
  }

  // Get vehicle by registration
  static async getVehicleByRegistration(registration: string): Promise<Vehicle | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('registration', '==', registration.toUpperCase())
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docSnapshot = snapshot.docs[0];
        const data = docSnapshot.data();
        return this.convertToVehicle(docSnapshot, data);
      }
      return null;
    } catch (error) {
      console.error('Error fetching vehicle by registration:', error);
      throw new Error('Failed to fetch vehicle');
    }
  }

  // Bulk upload vehicles
  static async bulkUploadVehicles(vehicles: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<BulkUploadResult> {
    const batch = writeBatch(db);
    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        
        try {
          // Validate each vehicle
          if (!vehicle.registration || !vehicle.make || !vehicle.model) {
            throw new Error('Registration, make, and model are required');
          }

          if (!this.validateRegistration(vehicle.registration)) {
            throw new Error('Invalid registration format');
          }

          if (vehicle.vinNumber && !this.validateVIN(vehicle.vinNumber)) {
            throw new Error('Invalid VIN format');
          }

          // Check for duplicate
          const existing = await this.getVehicleByRegistration(vehicle.registration);
          if (existing) {
            throw new Error('Vehicle already exists');
          }

          // Add to batch - Handle null values properly for Firestore
          const docRef = doc(collection(db, COLLECTION_NAME));
          const vehicleData: VehicleData = {
            registration: this.sanitizeInput(vehicle.registration.toUpperCase()),
            make: this.sanitizeInput(vehicle.make),
            model: this.sanitizeInput(vehicle.model),
            status: vehicle.status,
            createdBy: vehicle.createdBy,
            lastModifiedBy: vehicle.lastModifiedBy,
            motExpiry: vehicle.motExpiry ? Timestamp.fromDate(vehicle.motExpiry) : null,
            taxExpiry: vehicle.taxExpiry ? Timestamp.fromDate(vehicle.taxExpiry) : null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          // Only add optional fields if they have actual string values (not null, undefined, or empty)
          if (vehicle.vinNumber && typeof vehicle.vinNumber === 'string' && vehicle.vinNumber.trim()) {
            vehicleData.vinNumber = this.sanitizeInput(vehicle.vinNumber);
          }
          if (vehicle.colour && typeof vehicle.colour === 'string' && vehicle.colour.trim()) {
            vehicleData.colour = this.sanitizeInput(vehicle.colour);
          }
          if (vehicle.size) {
            vehicleData.size = vehicle.size;
          }
          if (vehicle.comments && typeof vehicle.comments === 'string' && vehicle.comments.trim()) {
            vehicleData.comments = this.sanitizeInput(vehicle.comments);
          }

          batch.set(docRef, vehicleData);
          result.success++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failed++;
          result.errors.push({
            row: i + 2, // +2 for header row and 0-index
            registration: vehicle.registration || 'Unknown',
            error: errorMessage
          });
        }
      }

      // Commit batch
      if (result.success > 0) {
        await batch.commit();
      }

      return result;
    } catch (error) {
      console.error('Error in bulk upload:', error);
      throw new Error('Bulk upload failed');
    }
  }

  // Clear all vehicles (DANGER: Deletes everything!)
  static async clearAllVehicles(): Promise<void> {
    try {
      // Get all vehicle documents in batches
      const batch = writeBatch(db);
      const allVehiclesQuery = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(allVehiclesQuery);
      
      // Add each document to the delete batch
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Execute the batch delete
      await batch.commit();
      
      console.log(`Successfully deleted ${snapshot.docs.length} vehicles`);
    } catch (error) {
      console.error('Error clearing all vehicles:', error);
      throw new Error('Failed to clear all vehicles');
    }
  }

  // Search vehicles
  static async searchVehicles(searchTerm: string): Promise<Vehicle[]> {
    try {
      const term = this.sanitizeInput(searchTerm.toUpperCase());
      
      // Search by registration
      const regQuery = query(
        collection(db, COLLECTION_NAME),
        where('registration', '>=', term),
        where('registration', '<=', term + '\uf8ff'),
        limit(10)
      );
      
      const snapshot = await getDocs(regQuery);
      const vehicles: Vehicle[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        vehicles.push(this.convertToVehicle(docSnapshot, data));
      });

      return vehicles;
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw new Error('Search failed');
    }
  }
}