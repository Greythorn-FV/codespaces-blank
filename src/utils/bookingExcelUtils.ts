// src/utils/bookingExcelUtils.ts

import { Booking } from '@/types/bookings';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface ExcelValidationResult {
  valid: boolean;
  error?: string;
}

// Type for parsed Excel data - matches what we'll create
interface ParsedBookingData {
  bookingConfirmationDate: Date;
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
  makeModel: string;
  pickUpDate: Date;
  pickUpTime: string;
  pickUpLocation: string;
  dropOffDate: Date;
  dropOffTime: string;
  dropOffLocation: string;
  noOfDays?: number;
  hireChargeInclVat: number;
  insurance: number;
  additionalIncome: number;
  additionalIncomeReason: string;
  extras: number;
  extrasType: string;
  depositToBeCollectedAtBranch: number;
  depositToBeCollectedStatus: 'Yes' | 'No' | '';
  chargesIncome: number;
  paidToUs: number;
  deposit: number;
  returnedDate: Date | string;
  comments: string;
  createdBy: string;
  lastModifiedBy: string;
}

export class BookingExcelUtils {
  // Generate Excel template with the exact columns you specified
  static generateTemplate(): Blob {
    const headers = [
      'Booking Confirmation Date',
      'Supplier',
      'Reference', 
      'Coastr Reference',
      'SAGE INV',
      'Notes',
      'Customer Name',
      'Phone Number',
      'Group',
      'Registration',
      'Make & Model',
      'Pick Up Date',
      'Pick Up Time',
      'Pick Up Location',
      'Drop Off Date',
      'Drop Off Time',
      'Drop Off Location',
      'No of Days',
      'Hire Charge incl Vat',
      'Insurance',
      'Additional Income',
      'Additional Income Reason',
      'Extras',
      'Extras Type',
      'Deposit TO BE Collected @ Branch',
      'Charges Income',
      'Paid To Us',
      'Deposit',
      'Returned Date',
      'Comments'
    ];

    const exampleData = [
      [
        '25/01/2025',
        'Enterprise',
        'ENT123',
        'CR2025001',
        'INV-2025-001',
        'Urgent booking',
        'John Smith',
        '07123456789',
        'Economy',
        'AB12 CDE',
        'Ford Focus',
        '26/01/2025',
        '09:00',
        'London Heathrow',
        '28/01/2025',
        '17:00',
        'London Heathrow',
        '2',
        '150.00',
        '25.00',
        '50.00',
        'Additional driver fee',
        '15.00',
        'GPS Navigation',
        '200.00',
        '0.00',
        '440.00',
        '200.00',
        '30/01/2025',
        'Customer satisfied'
      ],
      [
        '25/01/2025',
        'Avis',
        'AV456',
        'CR2025002',
        'INV-2025-002',
        '',
        'Jane Doe',
        '07987654321',
        'Premium',
        'XY34 FGH',
        'BMW 3 Series',
        '27/01/2025',
        '10:30',
        'Manchester Airport',
        '02/02/2025',
        '16:00',
        'Manchester Airport',
        '6',
        '450.00',
        '75.00',
        '0.00',
        '',
        '30.00',
        'Child seat',
        '300.00',
        '0.00',
        '855.00',
        '300.00',
        'Pending collection',
        'VIP customer'
      ]
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, // Booking Confirmation Date
      { wch: 15 }, // Supplier
      { wch: 12 }, // Reference
      { wch: 15 }, // Coastr Reference
      { wch: 15 }, // SAGE INV
      { wch: 15 }, // Notes
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Phone Number
      { wch: 12 }, // Group
      { wch: 12 }, // Registration
      { wch: 18 }, // Make & Model
      { wch: 15 }, // Pick Up Date
      { wch: 12 }, // Pick Up Time
      { wch: 20 }, // Pick Up Location
      { wch: 15 }, // Drop Off Date
      { wch: 12 }, // Drop Off Time
      { wch: 20 }, // Drop Off Location
      { wch: 12 }, // No of Days
      { wch: 18 }, // Hire Charge incl Vat
      { wch: 12 }, // Insurance
      { wch: 15 }, // Additional Income
      { wch: 25 }, // Additional Income Reason
      { wch: 10 }, // Extras
      { wch: 15 }, // Extras Type
      { wch: 25 }, // Deposit TO BE Collected @ Branch
      { wch: 15 }, // Charges Income
      { wch: 12 }, // Paid To Us
      { wch: 10 }, // Deposit
      { wch: 15 }, // Returned Date
      { wch: 20 }  // Comments
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Booking Template');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Export bookings to Excel with all columns in the exact order
  static exportBookingsToExcel(bookings: Booking[]): Blob {
    const headers = [
      'Booking Confirmation Date',
      'Supplier',
      'Reference',
      'Coastr Reference',
      'SAGE INV',
      'Notes',
      'Customer Name',
      'Phone Number',
      'Group',
      'Registration',
      'Make & Model',
      'Pick Up Date',
      'Pick Up Time',
      'Pick Up Location',
      'Drop Off Date',
      'Drop Off Time',
      'Drop Off Location',
      'No of Days',
      'Hire Charge incl Vat',
      'Insurance',
      'Additional Income',
      'Additional Income Reason',
      'Extras',
      'Extras Type',
      'Deposit TO BE Collected @ Branch',
      'Charges Income',
      'Paid To Us',
      'Deposit',
      'Returned Date',
      'Comments'
    ];

    const data = bookings.map(booking => [
      booking.bookingConfirmationDate ? format(booking.bookingConfirmationDate, 'dd/MM/yyyy') : '',
      booking.supplier || '',
      booking.reference || '',
      booking.coastrReference || '',
      booking.sageInv || '',
      booking.notes || '',
      booking.customerName || '',
      booking.phoneNumber || '',
      booking.group || '',
      booking.registration || '',
      booking.makeModel || (booking.make && booking.model ? `${booking.make} ${booking.model}` : booking.make || booking.model || ''),
      booking.pickUpDate ? format(booking.pickUpDate, 'dd/MM/yyyy') : '',
      booking.pickUpTime || '',
      booking.pickUpLocation || '',
      booking.dropOffDate ? format(booking.dropOffDate, 'dd/MM/yyyy') : '',
      booking.dropOffTime || '',
      booking.dropOffLocation || '',
      booking.noOfDays || '',
      booking.hireChargeInclVat || '',
      booking.insurance || '',
      booking.additionalIncome || '',
      booking.additionalIncomeReason || '',
      booking.extras || '',
      booking.extrasType || '',
      booking.depositToBeCollectedAtBranch || '',
      booking.chargesIncome || '',
      booking.paidToUs || '',
      booking.deposit || '',
      booking.returnedDate ? 
        (typeof booking.returnedDate === 'string' ? booking.returnedDate : format(booking.returnedDate, 'dd/MM/yyyy')) : '',
      booking.comments || ''
    ]);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    const colWidths = [
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 },
      { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
      { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Safe string conversion - no null values
  private static safeString(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    return String(value).trim();
  }

  // Safe number conversion - returns 0 for invalid
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
  private static parseReturnedDate(input: any): Date | string {
    if (!input) return '';
    
    const inputStr = String(input).trim();
    if (inputStr === '') return '';
    
    // If it contains letters, treat as text comment
    if (/[a-zA-Z]/.test(inputStr)) {
      return inputStr;
    }
    
    // Try to parse as date
    try {
      const date = this.parseFlexibleDate(input);
      return date;
    } catch (error) {
      // If date parsing fails, return as text
      return inputStr;
    }
  }

  // Extract just the time part from Excel datetime - ENHANCED VERSION
  private static extractTimeFromExcel(timeInput: any): string {
    if (!timeInput) return '';
    
    // If it's already a simple string like "09:00" or "13:30"
    if (typeof timeInput === 'string') {
      const cleaned = timeInput.trim();
      
      // Check if it's already in HH:MM format
      const timeMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        // Ensure proper formatting (pad hours if needed)
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      
      // Extract time from the long GMT format string
      const gmtMatch = cleaned.match(/(\d{2}):(\d{2}):(\d{2})\s+GMT/);
      if (gmtMatch) {
        const [, hours, minutes] = gmtMatch;
        return `${hours}:${minutes}`;
      }
      
      // More aggressive regex to find ANY time pattern
      const anyTimeMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
      if (anyTimeMatch) {
        const [, hours, minutes] = anyTimeMatch;
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      
      return ''; // Return empty if we can't parse the string
    }
    
    // If it's an Excel Date object (the main culprit!) 
    if (timeInput instanceof Date) {
      // Check if it's a valid date first
      if (isNaN(timeInput.getTime())) {
        return '';
      }
      
      const hours = timeInput.getHours().toString().padStart(2, '0');
      const minutes = timeInput.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // If it's a number (Excel time serial - fraction of a day)
    if (typeof timeInput === 'number') {
      // Excel time is stored as fraction of day (0.5 = 12:00 PM)
      if (timeInput >= 0 && timeInput <= 1) {
        const totalMinutes = Math.round(timeInput * 24 * 60);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    // ENHANCED: Handle Excel datetime serial numbers (like 44927.375)
    if (typeof timeInput === 'number' && timeInput > 1) {
      // Extract the decimal part (time portion)
      const timeFraction = timeInput - Math.floor(timeInput);
      const totalMinutes = Math.round(timeFraction * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Fallback - try to convert to string and extract time
    try {
      const str = String(timeInput);
      console.log('Trying to parse time from:', str); // DEBUG
      
      // Look for time patterns in the string
      const patterns = [
        /(\d{1,2}):(\d{2}):(\d{2})/,  // HH:MM:SS
        /(\d{1,2}):(\d{2})/,          // HH:MM
        /\b(\d{1,2}):(\d{2})\b/       // More specific HH:MM
      ];
      
      for (const pattern of patterns) {
        const match = str.match(pattern);
        if (match) {
          const hours = match[1].padStart(2, '0');
          const minutes = match[2].padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      }
    } catch (error) {
      console.warn('Could not parse time:', timeInput, error);
    }
    
    return ''; // Return empty if all parsing fails
  }

  // Parse Excel file for bulk upload
  static async parseExcel(file: File): Promise<ParsedBookingData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with headers
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (rawData.length < 2) {
            throw new Error('File must contain at least a header row and one data row');
          }

          // Skip header row and process data
          const bookings = rawData.slice(1).map((row, index) => {
            // Validate required fields
            const coastrRef = this.safeString(row[3]);
            const customerName = this.safeString(row[6]);
            
            if (!coastrRef || !customerName) {
              throw new Error(`Row ${index + 2}: Coastr Reference and Customer Name are required`);
            }

            // Split Make & Model if provided as combined field
            const makeModel = this.safeString(row[10]);
            let make = '';
            let model = '';
            
            if (makeModel) {
              const parts = makeModel.split(' ');
              if (parts.length >= 2) {
                make = parts[0];
                model = parts.slice(1).join(' ');
              } else {
                make = makeModel;
              }
            }

            // Parse deposit status
            let depositStatus: 'Yes' | 'No' | '' = '';
            const depositAmount = this.safeNumber(row[24]);
            if (depositAmount > 0) {
              depositStatus = 'Yes';
            }

            return {
              // Map Excel columns to booking fields in exact order
              bookingConfirmationDate: this.parseFlexibleDate(row[0]),
              supplier: this.safeString(row[1]),
              reference: this.safeString(row[2]),
              coastrReference: coastrRef,
              sageInv: this.safeString(row[4]),
              notes: this.safeString(row[5]),
              customerName: customerName,
              phoneNumber: this.safeString(row[7]),
              group: this.safeString(row[8]),
              registration: this.safeString(row[9]),
              make,
              model,
              makeModel,
              pickUpDate: this.parseFlexibleDate(row[11]),
              pickUpTime: this.extractTimeFromExcel(row[12]), // FIXED: Extract time properly
              pickUpLocation: this.safeString(row[13]),
              dropOffDate: this.parseFlexibleDate(row[14]),
              dropOffTime: this.extractTimeFromExcel(row[15]), // FIXED: Extract time properly
              dropOffLocation: this.safeString(row[16]),
              noOfDays: this.safeNumber(row[17]) || undefined,
              hireChargeInclVat: this.safeNumber(row[18]),
              insurance: this.safeNumber(row[19]),
              additionalIncome: this.safeNumber(row[20]),
              additionalIncomeReason: this.safeString(row[21]),
              extras: this.safeNumber(row[22]),
              extrasType: this.safeString(row[23]),
              depositToBeCollectedAtBranch: depositAmount,
              depositToBeCollectedStatus: depositStatus,
              chargesIncome: this.safeNumber(row[25]),
              paidToUs: this.safeNumber(row[26]),
              deposit: this.safeNumber(row[27]),
              returnedDate: this.parseReturnedDate(row[28]),
              comments: this.safeString(row[29]),
              createdBy: 'bulk_upload',
              lastModifiedBy: 'bulk_upload'
            } as ParsedBookingData;
          });

          resolve(bookings);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          reject(new Error(`Failed to parse Excel file: ${errorMessage}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Generate filename with timestamp
  static generateFilename(prefix: string): string {
    const now = new Date();
    const timestamp = format(now, 'yyyy-MM-dd_HH-mm-ss');
    return `${prefix}_${timestamp}.xlsx`;
  }

  // Download file
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

  // Validate Excel file
  static validateExcelFile(file: File): ExcelValidationResult {
    // Check file extension
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return { valid: false, error: 'Please upload an Excel file (.xlsx or .xls)' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    return { valid: true };
  }
}