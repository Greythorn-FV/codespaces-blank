// src/utils/bookingExcelUtils.ts

import { Booking } from '@/types/bookings';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export class BookingExcelUtils {
  // Export ALL bookings data to Excel with ALL columns
  static exportBookingsToExcel(bookings: Booking[]): Blob {
    const headers = [
      // Booking Information
      'Booking Confirmation Date',
      'Supplier',
      'Supplier Ref',
      'Coastr Reference',
      'Accounts Invoice Ref',
      
      // Customer Information  
      'Customer Name',
      'Phone Number',
      'Additional Driver Collected (£)',
      
      // Vehicle & Rental Details
      'Vehicle Group',
      'Registration',
      'Make',
      'Model',
      'No of Days',
      'Pickup Date',
      'Pickup Time', 
      'Pickup Location',
      'Drop off Date',
      'Drop off Time',
      'Drop off Location',
      
      // Financial Information
      'Deposit Blocked',
      'Hire Charge incl VAT (£)',
      'Insurance (£)',
      'Additional Hours/Days (£)',
      'Additional Rental Collected @ FV (£)',
      'CDW/Standard/Premium Collected @ FV',
      'Deposit TO BE Collected @ FV (£)',
      'Damage Charge (£)',
      'Additional Charges (£)',
      'Paid To Us (£)',
      'Deposit Returned Date',
      
      // Additional Information
      'Comments',
      
      // System Information
      'Created Date',
      'Last Modified Date',
      'Created By',
      'Last Modified By'
    ];

    const data = bookings.map(booking => [
      // Booking Information
      booking.bookingConfirmationDate ? format(booking.bookingConfirmationDate, 'dd/MM/yyyy') : '',
      booking.supplier || '',
      booking.supplierRef || '',
      booking.coastrReference || '',
      booking.accountsInvoiceRef || '',
      
      // Customer Information
      booking.customerName || '',
      booking.phoneNumber || '',
      booking.additionalDriverCollected || '',
      
      // Vehicle & Rental Details
      booking.vehicleGroup || '',
      booking.registration || '',
      booking.make || '',
      booking.model || '',
      booking.noOfDays || '',
      booking.pickupDate ? format(booking.pickupDate, 'dd/MM/yyyy') : '',
      booking.pickupTime || '',
      booking.pickupLocation || '',
      booking.dropoffDate ? format(booking.dropoffDate, 'dd/MM/yyyy') : '',
      booking.dropoffTime || '',
      booking.dropoffLocation || '',
      
      // Financial Information
      booking.depositBlocked || '',
      booking.hireChargeInclVat || '',
      booking.insurance || '',
      booking.additionalHoursDays || '',
      booking.additionalRentalCollected || '',
      booking.cdwStandardPremiumCollected || '',
      booking.depositToBeCollected || '',
      booking.damageCharge || '',
      booking.additionalCharges || '',
      booking.paidToUs || '',
      booking.depositReturnedDate ? format(booking.depositReturnedDate, 'dd/MM/yyyy') : '',
      
      // Additional Information
      booking.comments || '',
      
      // System Information
      booking.createdAt ? format(booking.createdAt, 'dd/MM/yyyy HH:mm') : '',
      booking.updatedAt ? format(booking.updatedAt, 'dd/MM/yyyy HH:mm') : '',
      booking.createdBy || '',
      booking.lastModifiedBy || ''
    ]);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths for better readability
    const colWidths = [
      // Booking Information
      { wch: 18 }, // Booking Confirmation Date
      { wch: 15 }, // Supplier
      { wch: 15 }, // Supplier Ref
      { wch: 18 }, // Coastr Reference
      { wch: 20 }, // Accounts Invoice Ref
      
      // Customer Information
      { wch: 25 }, // Customer Name
      { wch: 18 }, // Phone Number
      { wch: 20 }, // Additional Driver Collected
      
      // Vehicle & Rental Details
      { wch: 15 }, // Vehicle Group
      { wch: 12 }, // Registration
      { wch: 15 }, // Make
      { wch: 15 }, // Model
      { wch: 10 }, // No of Days
      { wch: 12 }, // Pickup Date
      { wch: 10 }, // Pickup Time
      { wch: 20 }, // Pickup Location
      { wch: 12 }, // Drop off Date
      { wch: 10 }, // Drop off Time
      { wch: 20 }, // Drop off Location
      
      // Financial Information
      { wch: 15 }, // Deposit Blocked
      { wch: 18 }, // Hire Charge incl VAT
      { wch: 12 }, // Insurance
      { wch: 18 }, // Additional Hours/Days
      { wch: 25 }, // Additional Rental Collected @ FV
      { wch: 25 }, // CDW/Standard/Premium Collected @ FV
      { wch: 25 }, // Deposit TO BE Collected @ FV
      { wch: 15 }, // Damage Charge
      { wch: 18 }, // Additional Charges
      { wch: 15 }, // Paid To Us
      { wch: 18 }, // Deposit Returned Date
      
      // Additional Information
      { wch: 30 }, // Comments
      
      // System Information
      { wch: 18 }, // Created Date
      { wch: 18 }, // Last Modified Date
      { wch: 15 }, // Created By
      { wch: 15 }  // Last Modified By
    ];
    ws['!cols'] = colWidths;

    // Apply styles to header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } }, // Indigo background
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }

    // Apply alternating row colors and borders to data
    for (let R = 1; R <= data.length; R++) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + (R + 1);
        if (!ws[address]) continue;
        
        ws[address].s = {
          fill: { fgColor: { rgb: R % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } }, // Alternating colors
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } }
          },
          alignment: { vertical: 'top', wrapText: true }
        };
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Download file helper
  static downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // Generate filename with current date
  static generateFilename(prefix: string = 'bookings'): string {
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd_HH-mm');
    return `${prefix}_export_${dateStr}.xlsx`;
  }
}