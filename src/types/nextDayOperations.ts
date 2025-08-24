// src/types/nextDayOperations.ts

import { Booking } from './bookings';

export interface CheckoutBooking {
  id: string;
  coastrReference: string;
  customerName: string;
  phoneNumber: string;
  registration: string;
  make?: string;
  model?: string;
  makeModel?: string;
  pickUpTime: string;
  pickUpLocation: string;
  comments?: string;
  depositToBeCollectedAtBranch?: number;
}

export interface CheckinBooking {
  id: string;
  coastrReference: string;
  customerName: string;
  phoneNumber: string;
  registration: string;
  make?: string;
  model?: string;
  makeModel?: string;
  dropOffTime: string;
  dropOffLocation: string;
  comments?: string;
}

export interface NextDayOperations {
  date: string;
  checkouts: CheckoutBooking[];
  checkins: CheckinBooking[];
}