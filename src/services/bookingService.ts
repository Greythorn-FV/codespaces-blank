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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BulkUploadResult, BookingSearchResult } from '@/types/bookings';
import { SelectedExtrasType } from '@/types/extrasTypes';

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
  selectedExtrasTypes: SelectedExtrasType[];
  depositToBeCollectedAtBranch: number;
  // In Firestore păstrăm string simplu, dar în Booking (app) îl tratăm ca union "Yes" | "No" | undefined
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
    if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
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
        if (field && typeof field.toDate === 'function') return field.toDate();
        return this.parseFlexibleDate(field);
      } catch {
        return new Date();
      }
    };

    const safeReturnedDate = (field: any) => {
      if (!field) return undefined;
      if (typeof field === 'string') return field;
      try {
        if (field?.toDate) return field.toDate();
        return this.parseFlexibleDate(field);
      } catch {
        return undefined;
      }
    };

    // mapăm statusul la union-ul cerut de tipul Booking
    const rawStatus = this.safeString(data.depositToBeCollectedStatus);
    const mappedStatus: 'Yes' | 'No' | undefined =
      rawStatus === 'Yes' ? 'Yes' : rawStatus === 'No' ? 'No' : undefined;

    return {
      id: docSnapshot.id,
      bookingConfirmationDate: safeDate(data.bookingConfirmationDate),
      supplier: this.safeString(data.supplier),
      reference: this.safeString(data.reference),
      coastrReference: this.safeString(data.coastrReference),
      sageInv: this.safeString(data.sageInv),
      notes: this.safeString(data.notes),
      customerName: this.safeString(data.customerName),
      phoneNumber: this.safeString(data.phoneNumber),
      group: this.safeString(data.group),
      registration: this.safeString(data.registration),
      make: this.safeString(data.make),
      model: this.safeString(data.model),
      makeModel: this.safeString(data.make && data.model ? `${data.make} ${data.model}` : data.makeModel),
      pickUpDate: safeDate(data.pickUpDate),
      pickUpTime: this.safeString(data.pickUpTime),
      pickUpLocation: this.safeString(data.pickUpLocation),
      dropOffDate: safeDate(data.dropOffDate),
      dropOffTime: this.safeString(data.dropOffTime),
      dropOffLocation: this.safeString(data.dropOffLocation),
      noOfDays: this.safeNumber(data.noOfDays),
      hireChargeInclVat: this.safeNumber(data.hireChargeInclVat),
      insurance: this.safeNumber(data.insurance),
      additionalIncome: this.safeNumber(data.additionalIncome),
      additionalIncomeReason: this.safeString(data.additionalIncomeReason),
      extras: this.safeNumber(data.extras),
      extrasType: this.safeString(data.extrasType),
      selectedExtrasTypes: data.selectedExtrasTypes || [],
      depositToBeCollectedAtBranch: this.safeNumber(data.depositToBeCollectedAtBranch),
      depositToBeCollectedStatus: mappedStatus,
      chargesIncome: this.safeNumber(data.chargesIncome),
      paidToUs: this.safeNumber(data.paidToUs),
      deposit: this.safeNumber(data.deposit),
      returnedDate: safeReturnedDate(data.returnedDate),
      comments: this.safeString(data.comments),
      createdAt: safeDate(data.createdAt),
      updatedAt: safeDate(data.updatedAt),
      createdBy: this.safeString(data.createdBy),
      lastModifiedBy: this.safeString(data.lastModifiedBy),
    };
  }

  // Prepare safe data for Firestore - ensure NO undefined values
  private static prepareSafeBookingData(booking: any): BookingFirestoreDoc {
    const pickUpDate = this.parseFlexibleDate(booking.pickUpDate);
    const dropOffDate = this.parseFlexibleDate(booking.dropOffDate);
    const bookingConfirmationDate = this.parseFlexibleDate(booking.bookingConfirmationDate);

    // Calculate number of days if not provided
    let noOfDays = this.safeNumber(booking.noOfDays);
    if (!noOfDays && pickUpDate && dropOffDate) {
      const timeDiff = dropOffDate.getTime() - pickUpDate.getTime();
      noOfDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    }

    // mapăm union-ul din app către string pentru Firestore
    const statusUnion = booking.depositToBeCollectedStatus as 'Yes' | 'No' | undefined;
    const statusForFirestore =
      statusUnion === 'Yes' ? 'Yes' : statusUnion === 'No' ? 'No' : '';

    return {
      bookingConfirmationDate: Timestamp.fromDate(bookingConfirmationDate),
      supplier: this.safeString(booking.supplier),
      reference: this.safeString(booking.reference),
      coastrReference: this.safeString(booking.coastrReference),
      sageInv: this.safeString(booking.sageInv),
      notes: this.safeString(booking.notes),
      customerName: this.safeString(booking.customerName),
      phoneNumber: this.safeString(booking.phoneNumber),
      group: this.safeString(booking.group),
      registration: this.safeString(booking.registration),
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
      selectedExtrasTypes: booking.selectedExtrasTypes || [],
      depositToBeCollectedAtBranch: this.safeNumber(booking.depositToBeCollectedAtBranch),
      depositToBeCollectedStatus: statusForFirestore,
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
          } else if (key === 'selectedExtrasTypes') {
            (updateData as any)[key] = value || [];
          } else if (key === 'depositToBeCollectedStatus') {
            // acceptă doar 'Yes' sau 'No' în Firestore; altfel gol
            const v = typeof value === 'string' ? value.trim() : '';
            (updateData as any)[key] = v === 'Yes' ? 'Yes' : v === 'No' ? 'No' : '';
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

  // Enhanced search bookings - searches across ALL specified fields
  static async searchBookings(searchTerm: string): Promise<Booking[]> {
    try {
      const bookings: Booking[] = [];
      const searchLower = searchTerm.toLowerCase().trim();
      const searchUpper = searchTerm.toUpperCase().trim();
      const addedIds = new Set<string>(); // To prevent duplicates

      if (!searchTerm.trim()) {
        return bookings;
      }

      // Helper function to add booking if not already added
      const addBookingIfUnique = (docSnapshot: DocumentSnapshot) => {
        if (!addedIds.has(docSnapshot.id)) {
          addedIds.add(docSnapshot.id);
          bookings.push(this.convertToBooking(docSnapshot, docSnapshot.data()));
        }
      };

      // Search by coastr reference (case sensitive prefix match)
      try {
        const coastrQuery = query(
          collection(db, COLLECTION_NAME),
          where('coastrReference', '>=', searchTerm),
          where('coastrReference', '<=', searchTerm + '\uf8ff'),
          limit(20)
        );
        const coastrSnapshot = await getDocs(coastrQuery);
        coastrSnapshot.forEach(addBookingIfUnique);
      } catch (error) {
        console.log('Coastr reference search failed:', error);
      }

      // Search by SAGE Invoice (case sensitive prefix match)
      try {
        const sageQuery = query(
          collection(db, COLLECTION_NAME),
          where('sageInv', '>=', searchTerm),
          where('sageInv', '<=', searchTerm + '\uf8ff'),
          limit(20)
        );
        const sageSnapshot = await getDocs(sageQuery);
        sageSnapshot.forEach(addBookingIfUnique);
      } catch (error) {
        console.log('SAGE Invoice search failed:', error);
      }

      // Search by customer name (case sensitive prefix match)
      try {
        const customerQuery = query(
          collection(db, COLLECTION_NAME),
          where('customerName', '>=', searchTerm),
          where('customerName', '<=', searchTerm + '\uf8ff'),
          limit(20)
        );
        const customerSnapshot = await getDocs(customerQuery);
        customerSnapshot.forEach(addBookingIfUnique);
      } catch (error) {
        console.log('Customer name search failed:', error);
      }

      // Search by phone number (try both as-is and cleaned version)
      try {
        const phoneClean = searchTerm.replace(/\s+/g, '');
        
        // Search with original term
        const phoneQuery1 = query(
          collection(db, COLLECTION_NAME),
          where('phoneNumber', '>=', searchTerm),
          where('phoneNumber', '<=', searchTerm + '\uf8ff'),
          limit(20)
        );
        const phoneSnapshot1 = await getDocs(phoneQuery1);
        phoneSnapshot1.forEach(addBookingIfUnique);

        // Search with cleaned version if different
        if (phoneClean !== searchTerm) {
          const phoneQuery2 = query(
            collection(db, COLLECTION_NAME),
            where('phoneNumber', '>=', phoneClean),
            where('phoneNumber', '<=', phoneClean + '\uf8ff'),
            limit(20)
          );
          const phoneSnapshot2 = await getDocs(phoneQuery2);
          phoneSnapshot2.forEach(addBookingIfUnique);
        }
      } catch (error) {
        console.log('Phone number search failed:', error);
      }

      // Search by vehicle registration (uppercase prefix match)
      try {
        const regQuery = query(
          collection(db, COLLECTION_NAME),
          where('registration', '>=', searchUpper),
          where('registration', '<=', searchUpper + '\uf8ff'),
          limit(20)
        );
        const regSnapshot = await getDocs(regQuery);
        regSnapshot.forEach(addBookingIfUnique);
      } catch (error) {
        console.log('Registration search failed:', error);
      }

      // For comments search, we need to get all bookings and filter client-side
      // This is less efficient but necessary for partial text matches
      if (bookings.length < 50) { // Only do this expensive operation if we don't have many results
        try {
          const allBookingsQuery = query(
            collection(db, COLLECTION_NAME),
            limit(1000) // Reasonable limit to prevent excessive reads
          );
          const allSnapshot = await getDocs(allBookingsQuery);
          
          allSnapshot.forEach((docSnapshot) => {
            if (!addedIds.has(docSnapshot.id)) {
              const data = docSnapshot.data();
              const comments = this.safeString(data.comments).toLowerCase();
              
              // Check if search term is found in comments
              if (comments.includes(searchLower)) {
                addBookingIfUnique(docSnapshot);
              }
            }
          });
        } catch (error) {
          console.log('Comments search failed:', error);
        }
      }

      // Sort results by most recent booking confirmation date
      bookings.sort((a, b) => {
        const dateA = a.bookingConfirmationDate?.getTime() || 0;
        const dateB = b.bookingConfirmationDate?.getTime() || 0;
        return dateB - dateA;
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
          // NU mai trimitem câmpul 'data' dacă tipul tău nu îl definește;
          // pune-l opțional în tip (vezi secțiunea types/bookings.ts de mai jos) sau comentează linia următoare
          result.errors.push({
            row: i + 1,
            error: errorMessage,
            data: bookings[i] // <- dacă nu vrei 'data' în rezultat, șterge această linie și actualizează tipul
          } as any);
        }
      }

      // Commit any remaining items in the batch
      if (batchCount > 0) {
        await batch.commit();
      }

      return result;
    } catch (error) {
      console.error('Error in bulk upload:', error);
      throw new Error('Bulk upload failed');
    }
  }

  // Clear all bookings - WARNING: This deletes ALL bookings
  static async clearAllBookings(): Promise<void> {
    try {
      // Get all bookings in batches and delete them
      const batchSize = 500;
      let hasMore = true;
      
      while (hasMore) {
        const q = query(collection(db, COLLECTION_NAME), limit(batchSize));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // If we got fewer docs than the batch size, we're done
        hasMore = snapshot.docs.length === batchSize;
      }
    } catch (error) {
      console.error('Error clearing all bookings:', error);
      throw new Error('Failed to clear all bookings');
    }
  }
}
