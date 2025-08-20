// src/types/bookings.ts

export interface Booking {
  id?: string;
  
  // Booking Information
  bookingConfirmationDate: Date;
  coastrReference: string;
  accountsInvoiceRef?: string;
  supplier?: string;
  supplierRef?: string;
  
  // Customer Information
  customerName: string;
  phoneNumber: string;
  additionalDriverCollected?: number;
  
  // Vehicle & Rental Details
  vehicleGroup?: string;
  registration: string;
  make?: string; // Auto-filled from fleet
  model?: string; // Auto-filled from fleet
  noOfDays?: number; // Auto-calculated
  pickupDate: Date;
  pickupTime: string;
  dropoffDate: Date;
  dropoffTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  
  // Financial Information
  depositBlocked?: string; // Changed to string for Yes/No
  hireChargeInclVat?: number;
  insurance?: number;
  additionalHoursDays?: number;
  additionalRentalCollected?: number;
  cdwStandardPremiumCollected?: string; // Changed to string for dropdown
  depositToBeCollected?: number;
  damageCharge?: number;
  additionalCharges?: number;
  paidToUs?: number;
  depositReturnedDate?: Date | null;
  
  // Additional Information
  comments?: string;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface BookingFormData {
  bookingConfirmationDate: string;
  coastrReference: string;
  accountsInvoiceRef: string;
  supplier: string;
  supplierRef: string;
  customerName: string;
  phoneNumber: string;
  additionalDriverCollected: string;
  vehicleGroup: string;
  registration: string;
  make: string;
  model: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  depositBlocked: string;
  hireChargeInclVat: string;
  insurance: string;
  additionalHoursDays: string;
  additionalRentalCollected: string;
  cdwStandardPremiumCollected: string;
  depositToBeCollected: string;
  damageCharge: string;
  additionalCharges: string;
  paidToUs: string;
  depositReturnedDate: string;
  comments: string;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    booking: string;
    error: string;
  }>;
}

export interface BookingSearchResult {
  bookings: Booking[];
  lastDoc: any;
  hasMore: boolean;
}

export type SortDirection = 'asc' | 'desc';
export type BookingSortField = keyof Booking;