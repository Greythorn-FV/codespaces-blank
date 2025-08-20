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
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BulkUploadResult, BookingSearchResult } from '@/types/bookings';

const COLLECTION_NAME = 'bookings';

interface BookingData {
  bookingConfirmationDate: Timestamp;
  coastrReference: string;
  accountsInvoiceRef?: string;
  supplier?: string;
  supplierRef?: string;
  customerName: string;
  phoneNumber: string;
  additionalDriverCollected?: number;
  vehicleGroup?: string;
  registration: string;
  make?: string;
  model?: string;
  noOfDays?: number;
  pickupDate: Timestamp;
  pickupTime: string;
  dropoffDate: Timestamp;
  dropoffTime: string;
  pickupLocation: string;
  dropoffLocation: string;
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
  depositReturnedDate?: Timestamp | null;
  comments?: string;
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

  // Convert Firestore document to Booking
  private static convertToBooking(docSnapshot: any, data: any): Booking {
    return {
      id: docSnapshot.id,
      bookingConfirmationDate: data.bookingConfirmationDate ? data.bookingConfirmationDate.toDate() : new Date(),
      coastrReference: data.coastrReference,
      accountsInvoiceRef: data.accountsInvoiceRef || null,
      supplier: data.supplier || null,
      supplierRef: data.supplierRef || null,
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      additionalDriverCollected: data.additionalDriverCollected || null,
      vehicleGroup: data.vehicleGroup || null,
      registration: data.registration,
      make: data.make || null,
      model: data.model || null,
      noOfDays: data.noOfDays || null,
      pickupDate: data.pickupDate ? data.pickupDate.toDate() : new Date(),
      pickupTime: data.pickupTime,
      dropoffDate: data.dropoffDate ? data.dropoffDate.toDate() : new Date(),
      dropoffTime: data.dropoffTime,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      depositBlocked: data.depositBlocked || null, // String value (Yes/No)
      hireChargeInclVat: data.hireChargeInclVat || null,
      insurance: data.insurance || null,
      additionalHoursDays: data.additionalHoursDays || null,
      additionalRentalCollected: data.additionalRentalCollected || null,
      cdwStandardPremiumCollected: data.cdwStandardPremiumCollected || null, // String value (CDW/Standard/Premium)
      depositToBeCollected: data.depositToBeCollected || null,
      damageCharge: data.damageCharge || null,
      additionalCharges: data.additionalCharges || null,
      paidToUs: data.paidToUs || null,
      depositReturnedDate: data.depositReturnedDate ? data.depositReturnedDate.toDate() : null,
      comments: data.comments || null,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      createdBy: data.createdBy,
      lastModifiedBy: data.lastModifiedBy
    } as Booking;
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
      // Validate required fields
      if (!bookingData.coastrReference || !bookingData.customerName || !bookingData.registration) {
        throw new Error('Coastr Reference, Customer Name, and Registration are required');
      }

      // Sanitize inputs and prepare data
      const sanitizedData: BookingData = {
        bookingConfirmationDate: Timestamp.fromDate(bookingData.bookingConfirmationDate),
        coastrReference: this.sanitizeInput(bookingData.coastrReference),
        accountsInvoiceRef: bookingData.accountsInvoiceRef ? this.sanitizeInput(bookingData.accountsInvoiceRef) : undefined,
        supplier: bookingData.supplier ? this.sanitizeInput(bookingData.supplier) : undefined,
        supplierRef: bookingData.supplierRef ? this.sanitizeInput(bookingData.supplierRef) : undefined,
        customerName: this.sanitizeInput(bookingData.customerName),
        phoneNumber: this.sanitizeInput(bookingData.phoneNumber),
        additionalDriverCollected: bookingData.additionalDriverCollected || undefined,
        vehicleGroup: bookingData.vehicleGroup ? this.sanitizeInput(bookingData.vehicleGroup) : undefined,
        registration: this.sanitizeInput(bookingData.registration.toUpperCase()),
        make: bookingData.make ? this.sanitizeInput(bookingData.make) : undefined,
        model: bookingData.model ? this.sanitizeInput(bookingData.model) : undefined,
        noOfDays: bookingData.noOfDays || undefined,
        pickupDate: Timestamp.fromDate(bookingData.pickupDate),
        pickupTime: this.sanitizeInput(bookingData.pickupTime),
        dropoffDate: Timestamp.fromDate(bookingData.dropoffDate),
        dropoffTime: this.sanitizeInput(bookingData.dropoffTime),
        pickupLocation: this.sanitizeInput(bookingData.pickupLocation),
        dropoffLocation: this.sanitizeInput(bookingData.dropoffLocation),
        depositBlocked: bookingData.depositBlocked || undefined,
        hireChargeInclVat: bookingData.hireChargeInclVat || undefined,
        insurance: bookingData.insurance || undefined,
        additionalHoursDays: bookingData.additionalHoursDays || undefined,
        additionalRentalCollected: bookingData.additionalRentalCollected || undefined,
        cdwStandardPremiumCollected: bookingData.cdwStandardPremiumCollected || undefined,
        depositToBeCollected: bookingData.depositToBeCollected || undefined,
        damageCharge: bookingData.damageCharge || undefined,
        additionalCharges: bookingData.additionalCharges || undefined,
        paidToUs: bookingData.paidToUs || undefined,
        depositReturnedDate: bookingData.depositReturnedDate ? Timestamp.fromDate(bookingData.depositReturnedDate) : null,
        comments: bookingData.comments ? this.sanitizeInput(bookingData.comments) : undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: bookingData.createdBy,
        lastModifiedBy: bookingData.lastModifiedBy
      };

      // Only add optional fields if they have actual values
      const cleanData: any = {};
      Object.entries(sanitizedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanData[key] = value;
        }
      });

      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  }

  // Update booking
  static async updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Sanitize string inputs
      const sanitizedUpdates: Record<string, any> = {
        updatedAt: Timestamp.now()
      };

      // Only update fields that have values
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          if (typeof value === 'string' && value.trim() !== '') {
            sanitizedUpdates[key] = this.sanitizeInput(value);
          } else if (value instanceof Date) {
            sanitizedUpdates[key] = Timestamp.fromDate(value);
          } else if (typeof value === 'number') {
            sanitizedUpdates[key] = value;
          } else if (value === null) {
            sanitizedUpdates[key] = null;
          }
        }
      });

      await updateDoc(docRef, sanitizedUpdates);
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  // Delete booking
  static async deleteBooking(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw new Error('Failed to delete booking');
    }
  }

  // Search bookings
  static async searchBookings(searchTerm: string): Promise<Booking[]> {
    try {
      const term = this.sanitizeInput(searchTerm.toUpperCase());
      
      // Search by registration or customer name
      const regQuery = query(
        collection(db, COLLECTION_NAME),
        where('registration', '>=', term),
        where('registration', '<=', term + '\uf8ff'),
        limit(10)
      );
      
      const snapshot = await getDocs(regQuery);
      const bookings: Booking[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        bookings.push(this.convertToBooking(docSnapshot, data));
      });

      return bookings;
    } catch (error) {
      console.error('Error searching bookings:', error);
      throw new Error('Search failed');
    }
  }

  // Get ALL bookings for export (no pagination)
  static async getAllBookingsForExport(): Promise<Booking[]> {
    try {
      const allBookingsQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy('bookingConfirmationDate', 'desc')
      );
      
      const snapshot = await getDocs(allBookingsQuery);
      const bookings: Booking[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        bookings.push(this.convertToBooking(docSnapshot, data));
      });

      console.log(`Retrieved ${bookings.length} bookings for export`);
      return bookings;
    } catch (error) {
      console.error('Error fetching all bookings for export:', error);
      throw new Error('Failed to fetch bookings for export');
    }
  }

  // Clear all bookings
  static async clearAllBookings(): Promise<void> {
    try {
      const batch = writeBatch(db);
      const allBookingsQuery = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(allBookingsQuery);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Successfully deleted ${snapshot.docs.length} bookings`);
    } catch (error) {
      console.error('Error clearing all bookings:', error);
      throw new Error('Failed to clear all bookings');
    }
  }
}