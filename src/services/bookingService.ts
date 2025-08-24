// src/services/bookingService.ts

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
  DocumentSnapshot,
  AddPrefixToKeys
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BulkUploadResult, BookingSearchResult } from '@/types/bookings';

const COLLECTION_NAME = 'bookings';

// Firestore document interface - all fields are required as strings/numbers/Timestamps
interface BookingFirestoreDoc {
  bookingConfirmationDate: Timestamp;
  supplier: string;
  reference: string;
  coastrReference: string;
  sageInv: string;
  notes: string;
  customerName: string;
  phoneNumber: string;
  group: string;
  registration: string;
  make: string;
  model: string;
  pickUpDate: Timestamp;
  pickUpTime: string;
  pickUpLocation: string;
  dropOffDate: Timestamp;
  dropOffTime: string;
  dropOffLocation: string;
  noOfDays: number;
  hireChargeInclVat: number;
  insurance: number;
  additionalIncome: number;
  additionalIncomeReason: string;
  extras: number;
  extrasType: string;
  depositToBeCollectedAtBranch: number;
  depositToBeCollectedStatus: string;
  chargesIncome: number;
  paidToUs: number;
  deposit: number;
  returnedDate: Timestamp | string;
  comments: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastModifiedBy: string;
}

export class BookingService {
  // Security: Input validation and sanitization
  private static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  // Safe string conversion - no undefined values allowed
  private static safeString(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    return String(value).trim();
  }

  // Safe number conversion - returns 0 for invalid numbers
  private static safeNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  }

  // Parse date from any input - VERY permissive
  private static parseFlexibleDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    
    // If it's already a Date
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }
    
    // If it's a Timestamp
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    
    // If it's a string, try multiple formats
    if (typeof dateInput === 'string') {
      const cleaned = dateInput.trim();
      
      // Check if it looks like a comment (contains letters)
      if (/[a-zA-Z]/.test(cleaned)) {
        // It's probably a comment, return current date
        return new Date();
      }
      
      // Try DD/MM/YYYY format
      const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) return date;
      }
      
      // Try other common formats
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) return date;
    }
    
    // If it's a number (Excel serial date)
    if (typeof dateInput === 'number') {
      if (dateInput > 25000 && dateInput < 50000) { // Reasonable Excel date range
        const excelEpoch = new Date(1900, 0, 1);
        const msPerDay = 86400000;
        const date = new Date(excelEpoch.getTime() + (dateInput - 2) * msPerDay);
        if (!isNaN(date.getTime())) return date;
      }
    }
    
    // Fallback to current date
    return new Date();
  }

  // Parse returned date (can be date or text) - VERY permissive
  private static parseReturnedDate(input: any): Timestamp | string {
    if (!input) return '';
    
    const inputStr = String(input).trim();
    if (inputStr === '') return '';
    
    // If it contains letters, treat as text comment
    if (/[a-zA-Z]/.test(inputStr)) {
      return this.sanitizeInput(inputStr);
    }
    
    // Try to parse as date
    try {
      const date = this.parseFlexibleDate(input);
      return Timestamp.fromDate(date);
    } catch (error) {
      // If date parsing fails, return as text
      return this.sanitizeInput(inputStr);
    }
  }

  // Convert Firestore document to Booking
  private static convertToBooking(docSnapshot: DocumentSnapshot, data: any): Booking {
    const safeDate = (field: any) => {
      try {
        if (field && field.toDate) return field.toDate();
        return this.parseFlexibleDate(field);
      } catch (error) {
        return new Date();
      }
    };

    const safeReturnedDate = (field: any) => {
      if (!field) return null;
      if (typeof field === 'string') return field;
      try {
        if (field.toDate) return field.toDate();
        return this.parseFlexibleDate(field);
      } catch (error) {
        return String(field);
      }
    };

    return {
      id: docSnapshot.id,
      bookingConfirmationDate: safeDate(data.bookingConfirmationDate),
      supplier: this.safeString(data.supplier) || undefined,
      reference: this.safeString(data.reference) || undefined,
      coastrReference: this.safeString(data.coastrReference),
      sageInv: this.safeString(data.sageInv) || undefined,
      notes: this.safeString(data.notes) || undefined,
      customerName: this.safeString(data.customerName),
      phoneNumber: this.safeString(data.phoneNumber),
      group: this.safeString(data.group) || undefined,
      registration: this.safeString(data.registration),
      make: this.safeString(data.make) || undefined,
      model: this.safeString(data.model) || undefined,
      makeModel: data.make && data.model ? `${data.make} ${data.model}` : (data.make || data.model || undefined),
      pickUpDate: safeDate(data.pickUpDate),
      pickUpTime: this.safeString(data.pickUpTime),
      pickUpLocation: this.safeString(data.pickUpLocation),
      dropOffDate: safeDate(data.dropOffDate),
      dropOffTime: this.safeString(data.dropOffTime),
      dropOffLocation: this.safeString(data.dropOffLocation),
      noOfDays: this.safeNumber(data.noOfDays) || undefined,
      hireChargeInclVat: this.safeNumber(data.hireChargeInclVat) || undefined,
      insurance: this.safeNumber(data.insurance) || undefined,
      additionalIncome: this.safeNumber(data.additionalIncome) || undefined,
      additionalIncomeReason: this.safeString(data.additionalIncomeReason) || undefined,
      extras: this.safeNumber(data.extras) || undefined,
      extrasType: this.safeString(data.extrasType) || undefined,
      depositToBeCollectedAtBranch: this.safeNumber(data.depositToBeCollectedAtBranch) || undefined,
      depositToBeCollectedStatus: (this.safeString(data.depositToBeCollectedStatus) || undefined) as 'Yes' | 'No' | undefined,
      chargesIncome: this.safeNumber(data.chargesIncome) || undefined,
      paidToUs: this.safeNumber(data.paidToUs) || undefined,
      deposit: this.safeNumber(data.deposit) || undefined,
      returnedDate: safeReturnedDate(data.returnedDate),
      comments: this.safeString(data.comments) || undefined,
      createdAt: safeDate(data.createdAt),
      updatedAt: safeDate(data.updatedAt),
      createdBy: this.safeString(data.createdBy),
      lastModifiedBy: this.safeString(data.lastModifiedBy)
    };
  }

  // Auto-calculate number of days between pickup and dropoff
  private static calculateDays(pickupDate: Date, dropoffDate: Date): number {
    try {
      const timeDiff = dropoffDate.getTime() - pickupDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return Math.max(1, daysDiff); // Minimum 1 day
    } catch (error) {
      return 1; // Default to 1 day if calculation fails
    }
  }

  // Prepare safe booking data for Firestore (NO undefined values)
  private static prepareSafeBookingData(booking: any): BookingFirestoreDoc {
    const pickUpDate = this.parseFlexibleDate(booking.pickUpDate);
    const dropOffDate = this.parseFlexibleDate(booking.dropOffDate);
    const noOfDays = this.calculateDays(pickUpDate, dropOffDate);
    
    return {
      bookingConfirmationDate: Timestamp.fromDate(this.parseFlexibleDate(booking.bookingConfirmationDate)),
      supplier: this.safeString(booking.supplier),
      reference: this.safeString(booking.reference),
      coastrReference: this.safeString(booking.coastrReference),
      sageInv: this.safeString(booking.sageInv),
      notes: this.safeString(booking.notes),
      customerName: this.safeString(booking.customerName),
      phoneNumber: this.safeString(booking.phoneNumber),
      group: this.safeString(booking.group),
      registration: this.safeString(booking.registration).toUpperCase(),
      make: this.safeString(booking.make),
      model: this.safeString(booking.model),
      pickUpDate: Timestamp.fromDate(pickUpDate),
      pickUpTime: this.safeString(booking.pickUpTime),
      pickUpLocation: this.safeString(booking.pickUpLocation),
      dropOffDate: Timestamp.fromDate(dropOffDate),
      dropOffTime: this.safeString(booking.dropOffTime),
      dropOffLocation: this.safeString(booking.dropOffLocation),
      noOfDays,
      hireChargeInclVat: this.safeNumber(booking.hireChargeInclVat),
      insurance: this.safeNumber(booking.insurance),
      additionalIncome: this.safeNumber(booking.additionalIncome),
      additionalIncomeReason: this.safeString(booking.additionalIncomeReason),
      extras: this.safeNumber(booking.extras),
      extrasType: this.safeString(booking.extrasType),
      depositToBeCollectedAtBranch: this.safeNumber(booking.depositToBeCollectedAtBranch),
      depositToBeCollectedStatus: this.safeString(booking.depositToBeCollectedStatus),
      chargesIncome: this.safeNumber(booking.chargesIncome),
      paidToUs: this.safeNumber(booking.paidToUs),
      deposit: this.safeNumber(booking.deposit),
      returnedDate: this.parseReturnedDate(booking.returnedDate),
      comments: this.safeString(booking.comments),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: this.safeString(booking.createdBy || 'system'),
      lastModifiedBy: this.safeString(booking.lastModifiedBy || 'system')
    };
  }

  // Get all bookings with pagination
  static async getBookings(
    pageSize: number = 20, 
    lastDoc?: DocumentSnapshot,
    sortField: string = 'bookingConfirmationDate',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<BookingSearchResult> {
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
      const bookings: Booking[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        bookings.push(this.convertToBooking(docSnapshot, data));
      });

      return {
        bookings,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  // Get single booking
  static async getBooking(id: string): Promise<Booking | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return this.convertToBooking(docSnap, data);
      }
      return null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw new Error('Failed to fetch booking');
    }
  }

  // Add new booking
  static async addBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate only absolutely required fields
      if (!bookingData.coastrReference || !bookingData.customerName) {
        throw new Error('Coastr Reference and Customer Name are required');
      }

      const sanitizedData = this.prepareSafeBookingData(bookingData);
      const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizedData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  }

  // Update booking
  static async updateBooking(id: string, bookingData: Partial<Booking>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: Partial<BookingFirestoreDoc> = {};

      // Only include fields that are being updated
      Object.keys(bookingData).forEach(key => {
        const value = (bookingData as any)[key];
        if (value !== undefined) {
          if (key === 'bookingConfirmationDate' || key === 'pickUpDate' || key === 'dropOffDate') {
            (updateData as any)[key] = Timestamp.fromDate(this.parseFlexibleDate(value));
          } else if (key === 'returnedDate') {
            (updateData as any)[key] = this.parseReturnedDate(value);
          } else if (typeof value === 'string') {
            (updateData as any)[key] = this.safeString(value);
          } else if (typeof value === 'number') {
            (updateData as any)[key] = this.safeNumber(value);
          } else {
            (updateData as any)[key] = value;
          }
        }
      });

      // Always update the timestamp
      updateData.updatedAt = Timestamp.now();
      updateData.lastModifiedBy = this.safeString(bookingData.lastModifiedBy || 'system');

      await updateDoc(docRef, updateData as any);
    } catch (error) {
      console.error('Error updating booking:', error);
      throw new Error('Failed to update booking');
    }
  }

  // Delete booking
  static async deleteBooking(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw new Error('Failed to delete booking');
    }
  }

  // Search bookings
  static async searchBookings(searchTerm: string): Promise<Booking[]> {
    try {
      const bookings: Booking[] = [];
      const searchLower = searchTerm.toLowerCase();

      // Search by coastr reference
      const coastrQuery = query(
        collection(db, COLLECTION_NAME),
        where('coastrReference', '>=', searchTerm),
        where('coastrReference', '<=', searchTerm + '\uf8ff'),
        limit(50)
      );
      const coastrSnapshot = await getDocs(coastrQuery);
      coastrSnapshot.forEach(doc => {
        bookings.push(this.convertToBooking(doc, doc.data()));
      });

      // Search by customer name
      const customerQuery = query(
        collection(db, COLLECTION_NAME),
        where('customerName', '>=', searchTerm),
        where('customerName', '<=', searchTerm + '\uf8ff'),
        limit(50)
      );
      const customerSnapshot = await getDocs(customerQuery);
      customerSnapshot.forEach(doc => {
        const booking = this.convertToBooking(doc, doc.data());
        if (!bookings.find(b => b.id === booking.id)) {
          bookings.push(booking);
        }
      });

      // Search by registration
      const regQuery = query(
        collection(db, COLLECTION_NAME),
        where('registration', '>=', searchTerm.toUpperCase()),
        where('registration', '<=', searchTerm.toUpperCase() + '\uf8ff'),
        limit(50)
      );
      const regSnapshot = await getDocs(regQuery);
      regSnapshot.forEach(doc => {
        const booking = this.convertToBooking(doc, doc.data());
        if (!bookings.find(b => b.id === booking.id)) {
          bookings.push(booking);
        }
      });

      return bookings;
    } catch (error) {
      console.error('Error searching bookings:', error);
      throw new Error('Failed to search bookings');
    }
  }

  // Bulk upload bookings - VERY PERMISSIVE
  static async bulkUploadBookings(bookings: any[]): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      const batch = writeBatch(db);
      const batchSize = 500; // Firestore batch limit
      let batchCount = 0;
      
      for (let i = 0; i < bookings.length; i++) {
        try {
          const booking = bookings[i];
          
          // Validate only the most essential fields
          const coastrRef = this.safeString(booking.coastrReference);
          const customerName = this.safeString(booking.customerName);
          
          if (!coastrRef || !customerName) {
            throw new Error('Coastr Reference and Customer Name are required');
          }

          const docRef = doc(collection(db, COLLECTION_NAME));
          const bookingData = this.prepareSafeBookingData(booking);

          batch.set(docRef, bookingData);
          result.success++;
          batchCount++;

          // Commit batch when it reaches the limit
          if (batchCount >= batchSize) {
            await batch.commit();
            batchCount = 0;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failed++;
          result.errors.push({
            row: i + 2, // +2 for header row and 0-index
            booking: this.safeString(bookings[i].coastrReference) || `Row ${i + 2}`,
            error: errorMessage
          });
          console.warn(`Row ${i + 2} failed:`, errorMessage, bookings[i]);
        }
      }

      // Commit remaining items
      if (batchCount > 0) {
        await batch.commit();
      }

      return result;
    } catch (error) {
      console.error('Error in bulk upload:', error);
      throw new Error('Bulk upload failed');
    }
  }

  // Get all bookings for export
  static async getAllBookingsForExport(): Promise<Booking[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('bookingConfirmationDate', 'desc')
      );
      const snapshot = await getDocs(q);
      const bookings: Booking[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        bookings.push(this.convertToBooking(docSnapshot, data));
      });

      return bookings;
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw new Error('Failed to fetch bookings for export');
    }
  }

  // Clear all bookings (DANGER!)
  static async clearAllBookings(): Promise<void> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error clearing all bookings:', error);
      throw new Error('Failed to clear bookings');
    }
  }
}