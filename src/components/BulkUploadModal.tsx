// src/components/BulkUploadModal.tsx

'use client';

import { useState, useRef } from 'react';
import { VehicleService } from '@/services/vehicleService';
import { ExcelUtils } from '@/utils/excelUtils';
import { BulkUploadResult } from '@/types/fleet';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function BulkUploadModal({ onSuccess, onClose }: BulkUploadModalProps) {
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
    const validation = ExcelUtils.validateExcelFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }
    setFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Parse Excel file
      const vehicles = await ExcelUtils.parseExcel(file);
      
      if (vehicles.length === 0) {
        toast.error('No valid data found in the file');
        return;
      }

      // Upload vehicles
      const result = await VehicleService.bulkUploadVehicles(vehicles);
      setUploadResult(result);

      if (result.success > 0) {
        toast.success(`Successfully uploaded ${result.success} vehicles`);
        if (result.failed === 0) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        toast.error('No vehicles were uploaded successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!uploadResult || uploadResult.errors.length === 0) return;

    const errorData = [
      ['Row', 'Registration', 'Error'],
      ...uploadResult.errors.map(err => [err.row, err.registration, err.error])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(errorData);
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    ExcelUtils.downloadFile(blob, 'upload_errors.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bulk Upload Vehicles</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {!uploadResult ? (
            <>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
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
                
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                
                <p className="mt-2 text-sm text-gray-600">
                  {file ? (
                    <span className="font-semibold">{file.name}</span>
                  ) : (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="font-semibold text-blue-600 hover:text-blue-500"
                        type="button"
                      >
                        Click to upload
                      </button>
                      {' or drag and drop'}
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Excel files only (.xlsx, .xls) - Max 10MB
                </p>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  📋 Instructions:
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the template using the &quot;Download Template&quot; button</li>
                  <li>Fill in the vehicle details in the Excel file</li>
                  <li>Ensure Registration, Make, and Model are filled for each vehicle</li>
                  <li>Dates should be in DD/MM/YYYY format</li>
                  <li>Upload the completed file here</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  disabled={uploading}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!file || uploading}
                  type="button"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Upload Results */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Upload Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium text-green-600">✓ Successful:</span> {uploadResult.success} vehicles
                    </p>
                    {uploadResult.failed > 0 && (
                      <p>
                        <span className="font-medium text-red-600">✗ Failed:</span> {uploadResult.failed} vehicles
                      </p>
                    )}
                  </div>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">Errors</h3>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-red-200">
                            <th className="text-left py-1 pr-4">Row</th>
                            <th className="text-left py-1 pr-4">Registration</th>
                            <th className="text-left py-1">Error</th>
                          </tr>
                        </thead>
                        <tbody className="text-red-700">
                          {uploadResult.errors.map((error, index) => (
                            <tr key={index} className="border-b border-red-100">
                              <td className="py-1 pr-4">{error.row}</td>
                              <td className="py-1 pr-4">{error.registration}</td>
                              <td className="py-1">{error.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      onClick={downloadErrorReport}
                      className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                      type="button"
                    >
                      Download Error Report
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  type="button"
                >
                  Close
                </button>
                {uploadResult.failed > 0 && (
                  <button
                    onClick={() => {
                      setFile(null);
                      setUploadResult(null);
                    }}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    type="button"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}