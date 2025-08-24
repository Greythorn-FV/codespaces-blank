// src/services/nextDayOperationsService.ts

import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/types/bookings';
import { NextDayOperations, CheckoutBooking, CheckinBooking } from '@/types/nextDayOperations';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

const COLLECTION_NAME = 'bookings';

export class NextDayOperationsService {
  // Get next day's date
  private static getNextDay(): Date {
    return addDays(new Date(), 1);
  }

  // Format date for display
  private static formatDisplayDate(date: Date): string {
    return format(date, 'EEEE, MMMM do, yyyy');
  }

  // Convert Firestore document to Booking
  private static convertToBooking(doc: any): Booking {
    const data = doc.data();
    return {
      id: doc.id,
      coastrReference: data.coastrReference || '',
      customerName: data.customerName || '',
      phoneNumber: data.phoneNumber || '',
      registration: data.registration || '',
      make: data.make || undefined,
      model: data.model || undefined,
      makeModel: data.make && data.model ? `${data.make} ${data.model}` : (data.make || data.model || undefined),
      pickUpDate: data.pickUpDate ? data.pickUpDate.toDate() : new Date(),
      pickUpTime: data.pickUpTime || '',
      pickUpLocation: data.pickUpLocation || '',
      dropOffDate: data.dropOffDate ? data.dropOffDate.toDate() : new Date(),
      dropOffTime: data.dropOffTime || '',
      dropOffLocation: data.dropOffLocation || '',
      comments: data.comments || undefined,
      depositToBeCollectedAtBranch: data.depositToBeCollectedAtBranch || undefined,
      // Add other required fields with defaults
      bookingConfirmationDate: data.bookingConfirmationDate ? data.bookingConfirmationDate.toDate() : new Date(),
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      createdBy: data.createdBy || '',
      lastModifiedBy: data.lastModifiedBy || ''
    } as Booking;
  }

  // Convert booking to checkout format
  private static toCheckoutBooking(booking: Booking): CheckoutBooking {
    return {
      id: booking.id || '',
      coastrReference: booking.coastrReference,
      customerName: booking.customerName,
      phoneNumber: booking.phoneNumber,
      registration: booking.registration,
      make: booking.make,
      model: booking.model,
      makeModel: booking.makeModel,
      pickUpTime: booking.pickUpTime,
      pickUpLocation: booking.pickUpLocation,
      comments: booking.comments,
      depositToBeCollectedAtBranch: booking.depositToBeCollectedAtBranch
    };
  }

  // Convert booking to checkin format
  private static toCheckinBooking(booking: Booking): CheckinBooking {
    return {
      id: booking.id || '',
      coastrReference: booking.coastrReference,
      customerName: booking.customerName,
      phoneNumber: booking.phoneNumber,
      registration: booking.registration,
      make: booking.make,
      model: booking.model,
      makeModel: booking.makeModel,
      dropOffTime: booking.dropOffTime,
      dropOffLocation: booking.dropOffLocation,
      comments: booking.comments
    };
  }

  // Get bookings for a specific date range
  private static async getBookingsForDate(date: Date, dateField: 'pickUpDate' | 'dropOffDate'): Promise<Booking[]> {
    try {
      const startOfTargetDay = Timestamp.fromDate(startOfDay(date));
      const endOfTargetDay = Timestamp.fromDate(endOfDay(date));

      const q = query(
        collection(db, COLLECTION_NAME),
        where(dateField, '>=', startOfTargetDay),
        where(dateField, '<=', endOfTargetDay)
      );

      const snapshot = await getDocs(q);
      const bookings: Booking[] = [];

      snapshot.forEach((doc) => {
        bookings.push(this.convertToBooking(doc));
      });

      return bookings;
    } catch (error) {
      console.error(`Error fetching ${dateField} bookings:`, error);
      throw new Error(`Failed to fetch ${dateField} bookings`);
    }
  }

  // Get all next day operations
  static async getNextDayOperations(): Promise<NextDayOperations> {
    try {
      const nextDay = this.getNextDay();

      // Get checkouts (pickups for next day)
      const checkoutBookings = await this.getBookingsForDate(nextDay, 'pickUpDate');
      const checkouts = checkoutBookings
        .map(booking => this.toCheckoutBooking(booking))
        .sort((a, b) => a.pickUpTime.localeCompare(b.pickUpTime)); // Sort by time

      // Get checkins (dropoffs for next day)
      const checkinBookings = await this.getBookingsForDate(nextDay, 'dropOffDate');
      const checkins = checkinBookings
        .map(booking => this.toCheckinBooking(booking))
        .sort((a, b) => a.dropOffTime.localeCompare(b.dropOffTime)); // Sort by time

      return {
        date: this.formatDisplayDate(nextDay),
        checkouts,
        checkins
      };
    } catch (error) {
      console.error('Error getting next day operations:', error);
      throw new Error('Failed to get next day operations');
    }
  }

  // Get operations for any specific date (for future use)
  static async getOperationsForDate(targetDate: Date): Promise<NextDayOperations> {
    try {
      // Get checkouts (pickups for target date)
      const checkoutBookings = await this.getBookingsForDate(targetDate, 'pickUpDate');
      const checkouts = checkoutBookings
        .map(booking => this.toCheckoutBooking(booking))
        .sort((a, b) => a.pickUpTime.localeCompare(b.pickUpTime));

      // Get checkins (dropoffs for target date)
      const checkinBookings = await this.getBookingsForDate(targetDate, 'dropOffDate');
      const checkins = checkinBookings
        .map(booking => this.toCheckinBooking(booking))
        .sort((a, b) => a.dropOffTime.localeCompare(b.dropOffTime));

      return {
        date: this.formatDisplayDate(targetDate),
        checkouts,
        checkins
      };
    } catch (error) {
      console.error('Error getting operations for date:', error);
      throw new Error('Failed to get operations for specified date');
    }
  }
}