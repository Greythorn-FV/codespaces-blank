// src/types/extrasTypes.ts

export interface ExtrasType {
  id?: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface ExtrasTypeFormData {
  name: string;
  price: string;
  status: string;
}

export interface SelectedExtrasType {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

export interface ExtrasCalculation {
  selectedExtras: SelectedExtrasType[];
  totalPerDay: number;
  numberOfDays: number;
  totalExtrasAmount: number;
}

export const DEFAULT_EXTRAS_TYPES = [
  { name: 'CDW', price: 0 },
  { name: 'Standard Protection', price: 0 },
  { name: 'Premium Protection', price: 0 },
  { name: 'Young driver surcharge', price: 0 },
  { name: 'Additional Driver', price: 0 },
  { name: 'Airport Surcharge', price: 0 },
  { name: 'Child Seat', price: 0 }
] as const;