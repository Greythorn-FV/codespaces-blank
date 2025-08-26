// src/components/BookingTableColumns.tsx

import { Booking } from '@/types/bookings';

export type ColumnKey = keyof Booking | 'actions';

export interface TableColumn {
  key: ColumnKey;
  label: string;
  sortable: boolean;
  width?: string;
}

// Summary view columns - essential columns in a clean layout
export const SUMMARY_COLUMNS: TableColumn[] = [
  { key: 'coastrReference', label: 'Coastr Ref', sortable: true, width: '110px' },
  { key: 'customerName', label: 'Customer Name', sortable: true, width: '140px' },
  { key: 'phoneNumber', label: 'Phone', sortable: true, width: '120px' },
  { key: 'registration', label: 'Registration', sortable: true, width: '100px' },
  { key: 'pickUpLocation', label: 'Pick Up Location', sortable: true, width: '140px' },
  { key: 'pickUpDate', label: 'Pick Up Date', sortable: true, width: '110px' },
  { key: 'pickUpTime', label: 'Pick Up Time', sortable: false, width: '90px' },
  { key: 'dropOffLocation', label: 'Drop Off Location', sortable: true, width: '140px' },
  { key: 'dropOffDate', label: 'Drop Off Date', sortable: true, width: '110px' },
  { key: 'dropOffTime', label: 'Drop Off Time', sortable: false, width: '90px' },
  { key: 'paidToUs', label: 'Paid To Us', sortable: true, width: '100px' },
  { key: 'comments', label: 'Comments', sortable: false, width: '160px' },
  { key: 'actions', label: 'Actions', sortable: false, width: '140px' }
];

// Detailed view columns - all columns in proper order, all headers in single row
export const DETAILED_COLUMNS: TableColumn[] = [
  { key: 'bookingConfirmationDate', label: 'Booking Date', sortable: true, width: '120px' },
  { key: 'supplier', label: 'Supplier', sortable: true, width: '100px' },
  { key: 'reference', label: 'Reference', sortable: true, width: '100px' },
  { key: 'coastrReference', label: 'Coastr Ref', sortable: true, width: '110px' },
  { key: 'sageInv', label: 'SAGE INV', sortable: true, width: '100px' },
  { key: 'notes', label: 'Notes', sortable: true, width: '140px' },
  { key: 'customerName', label: 'Customer Name', sortable: true, width: '140px' },
  { key: 'phoneNumber', label: 'Phone Number', sortable: true, width: '120px' },
  { key: 'group', label: 'Group', sortable: true, width: '100px' },
  { key: 'registration', label: 'Registration', sortable: true, width: '100px' },
  { key: 'makeModel', label: 'Make & Model', sortable: true, width: '140px' },
  { key: 'pickUpDate', label: 'Pick Up Date', sortable: true, width: '110px' },
  { key: 'pickUpTime', label: 'Pick Up Time', sortable: false, width: '90px' },
  { key: 'pickUpLocation', label: 'Pick Up Location', sortable: true, width: '140px' },
  { key: 'dropOffDate', label: 'Drop Off Date', sortable: true, width: '110px' },
  { key: 'dropOffTime', label: 'Drop Off Time', sortable: false, width: '90px' },
  { key: 'dropOffLocation', label: 'Drop Off Location', sortable: true, width: '140px' },
  { key: 'noOfDays', label: 'No of Days', sortable: true, width: '80px' },
  { key: 'hireChargeInclVat', label: 'Hire Charge incl VAT', sortable: true, width: '110px' },
  { key: 'insurance', label: 'Insurance', sortable: true, width: '90px' },
  { key: 'additionalIncome', label: 'Additional Income', sortable: true, width: '110px' },
  { key: 'additionalIncomeReason', label: 'Additional Income Reason', sortable: false, width: '140px' },
  { key: 'extras', label: 'Extras', sortable: true, width: '80px' },
  { key: 'extrasType', label: 'Extras Type', sortable: false, width: '120px' },
  { key: 'depositToBeCollectedAtBranch', label: 'Deposit @ Branch', sortable: true, width: '120px' },
  { key: 'chargesIncome', label: 'Charges Income', sortable: true, width: '110px' },
  { key: 'paidToUs', label: 'Paid To Us', sortable: true, width: '100px' },
  { key: 'deposit', label: 'Deposit', sortable: true, width: '80px' },
  { key: 'returnedDate', label: 'Deposit Returned Date', sortable: false, width: '120px' },
  { key: 'comments', label: 'Comments', sortable: false, width: '160px' },
  { key: 'actions', label: 'Actions', sortable: false, width: '140px' }
];

export const getColumnsForView = (viewMode: 'summary' | 'detailed'): TableColumn[] => {
  return viewMode === 'summary' ? SUMMARY_COLUMNS : DETAILED_COLUMNS;
};