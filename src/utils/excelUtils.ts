// src/utils/excelUtils.ts

import { Vehicle, VehicleSize } from '@/types/fleet';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface ExcelValidationResult {
  valid: boolean;
  error?: string;
}

export class ExcelUtils {
  // Generate Excel template
  static generateTemplate(): Blob {
    const headers = [
      'Registration',
      'VIN Number',
      'Make',
      'Model',
      'Colour',
      'Size',
      'MOT Expiry (DD/MM/YYYY)',
      'Tax Expiry (DD/MM/YYYY)',
      'Comments'
    ];

    const exampleData = [
      [
        'AB12 CDE',
        'WBA1234567890123',
        'Ford',
        'Focus',
        'Blue',
        'medium',
        '15/06/2025',
        '01/03/2025',
        'Regular service needed'
      ],
      [
        'XY34 FGH',
        'WVW1234567890123',
        'Volkswagen',
        'Golf',
        'Silver',
        'medium',
        '20/08/2025',
        '15/04/2025',
        'Low mileage vehicle'
      ]
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Registration
      { wch: 20 }, // VIN Number
      { wch: 15 }, // Make
      { wch: 15 }, // Model
      { wch: 12 }, // Colour
      { wch: 10 }, // Size
      { wch: 20 }, // MOT Expiry
      { wch: 20 }, // Tax Expiry
      { wch: 30 }  // Comments
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Template');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Export vehicles to Excel
  static exportToExcel(vehicles: Vehicle[]): Blob {
    const headers = [
      'Registration',
      'VIN Number',
      'Make',
      'Model',
      'Colour',
      'Size',
      'MOT Expiry',
      'Tax Expiry',
      'Status',
      'Comments',
      'Created Date',
      'Last Modified'
    ];

    const data = vehicles.map(vehicle => [
      vehicle.registration,
      vehicle.vinNumber || '',
      vehicle.make,
      vehicle.model,
      vehicle.colour || '',
      vehicle.size || '',
      vehicle.motExpiry ? format(vehicle.motExpiry, 'dd/MM/yyyy') : '',
      vehicle.taxExpiry ? format(vehicle.taxExpiry, 'dd/MM/yyyy') : '',
      vehicle.status,
      vehicle.comments || '',
      format(vehicle.createdAt, 'dd/MM/yyyy HH:mm'),
      format(vehicle.updatedAt, 'dd/MM/yyyy HH:mm')
    ]);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Registration
      { wch: 20 }, // VIN Number
      { wch: 15 }, // Make
      { wch: 15 }, // Model
      { wch: 12 }, // Colour
      { wch: 10 }, // Size
      { wch: 15 }, // MOT Expiry
      { wch: 15 }, // Tax Expiry
      { wch: 12 }, // Status
      { wch: 30 }, // Comments
      { wch: 18 }, // Created Date
      { wch: 18 }  // Last Modified
    ];
    ws['!cols'] = colWidths;

    // Apply styles to header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E0E0E0' } }
      };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Fleet Inventory');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Parse Excel file
  static async parseExcel(file: File): Promise<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
          
          const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);
          
          const vehicles = dataRows.map((row, index) => {
            // MEGA DEBUG: Log everything
            console.log('=== DEBUGGING ROW ===');
            console.log(`Processing row ${index + 2}`);
            console.log('Raw row data:', row);
            console.log('Row length:', row.length);
            console.log('Individual cells:');
            row.forEach((cell, cellIndex) => {
              console.log(`  Cell ${cellIndex}:`, cell, '(type:', typeof cell, ')');
            });
            
            // Validate required fields
            if (!row[0] || !row[2] || !row[3]) {
              throw new Error(`Row ${index + 2}: Registration, Make, and Model are required`);
            }

            // Helper function to safely convert cell values
            const getCellValue = (cell: any): string | null => {
              console.log('getCellValue processing:', cell, 'type:', typeof cell);
              if (cell === null || cell === undefined || cell === '') {
                console.log('getCellValue returning null (empty)');
                return null;
              }
              const str = String(cell).trim();
              const result = str === '' ? null : str;
              console.log('getCellValue final result:', result);
              return result;
            };

            const registration = getCellValue(row[0]);
            const vinNumber = getCellValue(row[1]);
            const make = getCellValue(row[2]);
            const model = getCellValue(row[3]);
            const colour = getCellValue(row[4]);
            const size = getCellValue(row[5]); // Direct assignment, no parsing!
            const comments = getCellValue(row[8]);

            console.log('FINAL PARSED VALUES:');
            console.log('registration:', registration);
            console.log('vinNumber:', vinNumber);
            console.log('make:', make);
            console.log('model:', model);
            console.log('colour:', colour);
            console.log('size:', size);
            console.log('comments:', comments);

            if (!registration || !make || !model) {
              throw new Error(`Row ${index + 2}: Registration, Make, and Model cannot be empty`);
            }

            const finalVehicle = {
              registration,
              vinNumber,
              make,
              model,
              colour,
              size, // Store exactly what's in the Excel file!
              motExpiry: this.parseExcelDate(row[6]),
              taxExpiry: this.parseExcelDate(row[7]),
              comments,
              status: 'available' as const,
              createdBy: 'bulk_upload',
              lastModifiedBy: 'bulk_upload'
            };

            console.log('FINAL VEHICLE OBJECT:', finalVehicle);
            console.log('=== END ROW DEBUG ===\n');

            return finalVehicle;
          });

          resolve(vehicles);
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

  // Parse date from Excel (handles both string and Excel serial number)
  private static parseExcelDate(value: unknown): Date | null {
    if (!value) return null;

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      // Excel dates start from 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const msPerDay = 86400000;
      const date = new Date(excelEpoch.getTime() + (value - 2) * msPerDay);
      return isNaN(date.getTime()) ? null : date;
    }

    // If it's a string in DD/MM/YYYY format
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length !== 3) return null;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  // We don't need parseSize anymore - just store raw values!
  
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