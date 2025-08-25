// src/types/groups.ts

export interface VehicleGroup {
  id?: string;
  name: string;
  vehicleCount: number;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface GroupAssignment {
  id?: string;
  groupId: string;
  groupName: string;
  vehicleId: string;
  registration: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface GroupFormData {
  name: string;
  hourlyRate: string;
  dailyRate: string;
  weeklyRate: string;
  monthlyRate: string;
  status: string;
}

export interface GroupPricingUpdate {
  groupId: string;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
}

export interface GroupSearchResult {
  groups: VehicleGroup[];
  lastDoc: any;
  hasMore: boolean;
}

export type GroupSortField = keyof VehicleGroup;