// src/types/bookings.ts

export interface Booking {
  id?: string;
  
  // Core booking fields in the exact order you specified
  bookingConfirmationDate: Date;
  supplier?: string;
  reference?: string; // This is supplierRef
  coastrReference: string;
  sageInv?: string; // This is accountsInvoiceRef
  notes?: string;
  customerName: string;
  phoneNumber: string;
  group?: string; // This is vehicleGroup
  registration: string;
  makeModel?: string; // Combined make & model for display
  make?: string; // Separate for data storage
  model?: string; // Separate for data storage
  pickUpDate: Date;
  pickUpTime: string;
  pickUpLocation: string;
  dropOffDate: Date;
  dropOffTime: string;
  dropOffLocation: string;
  noOfDays?: number;
  hireChargeInclVat?: number;
  insurance?: number;
  additionalIncome?: number;
  additionalIncomeReason?: string;
  extras?: number;
  extrasType?: string;
  depositToBeCollectedAtBranch?: number;
  depositToBeCollectedStatus?: 'Yes' | 'No'; // Green/Red status
  chargesIncome?: number;
  paidToUs?: number;
  deposit?: number;
  returnedDate?: Date | string | null; // Allow both date and text for legacy data
  comments?: string;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface BookingFormData {
  bookingConfirmationDate: string;
  supplier: string;
  reference: string; // supplierRef
  coastrReference: string;
  sageInv: string; // accountsInvoiceRef
  notes: string;
  customerName: string;
  phoneNumber: string;
  group: string; // vehicleGroup
  registration: string;
  make: string;
  model: string;
  pickUpDate: string;
  pickUpTime: string;
  pickUpLocation: string;
  dropOffDate: string;
  dropOffTime: string;
  dropOffLocation: string;
  hireChargeInclVat: string;
  insurance: string;
  additionalIncome: string;
  additionalIncomeReason: string;
  extras: string;
  extrasType: string;
  depositToBeCollectedAtBranch: string;
  depositToBeCollectedStatus: string;
  chargesIncome: string;
  paidToUs: string;
  deposit: string;
  returnedDate: string; // Allow text input
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