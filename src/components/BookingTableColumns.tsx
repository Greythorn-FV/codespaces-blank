// src/components/BookingTableColumns.tsx

import { Booking } from '@/types/bookings';

export type ColumnKey = keyof Booking | 'actions';

export interface TableColumn {
  key: ColumnKey;
  label: string;
  sortable: boolean;
  width?: string;
}

// Summary view columns (your selected essential columns)
export const SUMMARY_COLUMNS: TableColumn[] = [
  { key: 'coastrReference', label: 'Coastr Ref', sortable: true },
  { key: 'customerName', label: 'Customer', sortable: true },
  { key: 'registration', label: 'Registration', sortable: true },
  { key: 'pickUpLocation', label: 'Pick Up Location', sortable: true },
  { key: 'pickUpDate', label: 'Pick Up Date', sortable: true },
  { key: 'pickUpTime', label: 'Pick Up Time', sortable: false },
  { key: 'dropOffLocation', label: 'Drop Off Location', sortable: true },
  { key: 'dropOffDate', label: 'Drop Off Date', sortable: true },
  { key: 'dropOffTime', label: 'Drop Off Time', sortable: false },
  { key: 'paidToUs', label: 'Paid To Us', sortable: true },
  { key: 'comments', label: 'Comments', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false }
];

// Detailed view columns (all columns in your exact order)
export const DETAILED_COLUMNS: TableColumn[] = [
  { key: 'bookingConfirmationDate', label: 'Booking Date', sortable: true },
  { key: 'supplier', label: 'Supplier', sortable: true },
  { key: 'reference', label: 'Reference', sortable: true },
  { key: 'coastrReference', label: 'Coastr Ref', sortable: true },
  { key: 'sageInv', label: 'SAGE INV', sortable: true },
  { key: 'notes', label: 'Notes', sortable: true },
  { key: 'customerName', label: 'Customer', sortable: true },
  { key: 'phoneNumber', label: 'Phone', sortable: true },
  { key: 'group', label: 'Group', sortable: true },
  { key: 'registration', label: 'Registration', sortable: true },
  { key: 'makeModel', label: 'Make & Model', sortable: true },
  { key: 'pickUpDate', label: 'Pick Up Date', sortable: true },
  { key: 'pickUpTime', label: 'Pick Up Time', sortable: false },
  { key: 'pickUpLocation', label: 'Pick Up Location', sortable: true },
  { key: 'dropOffDate', label: 'Drop Off Date', sortable: true },
  { key: 'dropOffTime', label: 'Drop Off Time', sortable: false },
  { key: 'dropOffLocation', label: 'Drop Off Location', sortable: true },
  { key: 'noOfDays', label: 'Days', sortable: true },
  { key: 'hireChargeInclVat', label: 'Hire Charge', sortable: true },
  { key: 'insurance', label: 'Insurance', sortable: true },
  { key: 'additionalIncome', label: 'Add Income', sortable: true },
  { key: 'additionalIncomeReason', label: 'Income Reason', sortable: false },
  { key: 'extras', label: 'Extras', sortable: true },
  { key: 'extrasType', label: 'Extras Type', sortable: false },
  { key: 'depositToBeCollectedAtBranch', label: 'Deposit @ Branch', sortable: true },
  { key: 'chargesIncome', label: 'Charges Income', sortable: true },
  { key: 'paidToUs', label: 'Paid To Us', sortable: true },
  { key: 'returnedDate', label: 'Deposit Returned Date', sortable: false },
  { key: 'comments', label: 'Comments', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false }
];

export const getColumnsForView = (viewMode: 'summary' | 'detailed'): TableColumn[] => {
  return viewMode === 'summary' ? SUMMARY_COLUMNS : DETAILED_COLUMNS;
};