// src/components/BookingBulkUploadModal.tsx

'use client';

import { useState, useRef } from 'react';
import { BookingService } from '@/services/bookingService';
import { BookingExcelUtils } from '@/utils/bookingExcelUtils';
import { BulkUploadResult } from '@/types/bookings';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface BookingBulkUploadModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function BookingBulkUploadModal({ onSuccess, onClose }: BookingBulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validation = BookingExcelUtils.validateExcelFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }
    setFile(file);
    setUploadResult(null);
  };

  const downloadTemplate = () => {
    try {
      const template = BookingExcelUtils.generateTemplate();
      const filename = BookingExcelUtils.generateFilename('booking_template');
      BookingExcelUtils.downloadFile(template, filename);
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Template download error:', error);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Parse Excel file
      const bookings = await BookingExcelUtils.parseExcel(file);
      
      if (bookings.length === 0) {
        toast.error('No valid data found in the file');
        return;
      }

      toast.loading(`Processing ${bookings.length} bookings...`, { id: 'upload-progress' });

      // Upload bookings
      const result = await BookingService.bulkUploadBookings(bookings);
      setUploadResult(result);

      toast.dismiss('upload-progress');

      if (result.success > 0) {
        toast.success(`Successfully uploaded ${result.success} bookings`);
        if (result.failed === 0) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        toast.error('No bookings were uploaded successfully');
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} bookings failed to upload. Check the error report below.`);
      }
    } catch (error) {
      toast.dismiss('upload-progress');
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!uploadResult || uploadResult.errors.length === 0) return;

    const errorData = [
      ['Row', 'Booking Reference', 'Error'],
      ...uploadResult.errors.map(err => [err.row, err.booking, err.error])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(errorData);
    XLSX.utils.book_append_sheet(wb, ws, 'Upload Errors');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    BookingExcelUtils.downloadFile(blob, 'booking_upload_errors.xlsx');
    toast.success('Error report downloaded');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Bookings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!uploadResult ? (
            <>
              {/* Download Template Button */}
              <div className="mb-6 flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="px-6 py-3 text-blue-600 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Template</span>
                </button>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    {file ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">✓</span>
                        <span>File selected: {file.name}</span>
                      </div>
                    ) : (
                      'Upload Booking Data'
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {file ? (
                      <span className="text-sm">
                        Click "Upload Bookings" below to process the file
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="font-semibold text-blue-600 hover:text-blue-500 underline"
                          type="button"
                        >
                          Click to upload
                        </button>
                        {' or drag and drop your Excel file here'}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Excel files only (.xlsx, .xls) - Max 10MB
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">📋</span>
                  Upload Instructions
                </h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Download the template using the "Download Template" button above</li>
                  <li>Fill in your booking data following the exact column order</li>
                  <li><strong>Required fields:</strong> Booking Confirmation Date, Coastr Reference, Customer Name, Registration, Pick Up Date & Location, Drop Off Date & Location</li>
                  <li><strong>Date format:</strong> DD/MM/YYYY (e.g., 25/01/2025)</li>
                  <li><strong>Financial fields:</strong> Enter amounts as numbers (e.g., 150.00)</li>
                  <li><strong>Deposit Status:</strong> Leave blank or enter "Yes" if collected</li>
                  <li><strong>Returned Date:</strong> Can be a date (DD/MM/YYYY) or text (e.g., "Pending collection")</li>
                  <li>Save your file and upload it here</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Upload Bookings</span>
                    </div>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Upload Results */
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Upload Complete!</h3>
                <p className="text-gray-600 mt-2">Here's a summary of the upload results:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{uploadResult.success}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{uploadResult.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{uploadResult.success + uploadResult.failed}</div>
                  <div className="text-sm text-blue-700">Total Processed</div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-red-900 mb-3">Upload Errors</h4>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {uploadResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                          <strong>Row {error.row}</strong> ({error.booking}): {error.error}
                        </div>
                      ))}
                      {uploadResult.errors.length > 10 && (
                        <div className="text-sm text-red-600 italic">
                          ... and {uploadResult.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={downloadErrorReport}
                    className="mt-4 px-4 py-2 text-red-600 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Download Error Report
                  </button>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setFile(null);
                    setUploadResult(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={onSuccess}
                  className="px-6 py-3 text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg transition-all duration-200"
                >
                  View Bookings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}