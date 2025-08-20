// src/types/fleet.ts

export type VehicleSize = 'small' | 'medium' | 'large' | 'van' | 'suv';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'retired';
export type SortDirection = 'asc' | 'desc';

export interface Vehicle {
  id?: string;
  registration: string;
  vinNumber?: string | null;
  make: string;
  model: string;
  colour?: string | null;
  size?: string | null;  // Changed from VehicleSize to string to accept ANY value
  motExpiry?: Date | null;
  taxExpiry?: Date | null;
  comments?: string | null;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface VehicleFormData {
  registration: string;
  vinNumber: string;
  make: string;
  model: string;
  colour: string;
  size: string;
  motExpiry: string;
  taxExpiry: string;
  comments: string;
  status: string;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    registration: string;
    error: string;
  }>;
}

export interface VehicleSearchResult {
  vehicles: Vehicle[];
  lastDoc: any;
  hasMore: boolean;
}

export type SortField = keyof Vehicle;