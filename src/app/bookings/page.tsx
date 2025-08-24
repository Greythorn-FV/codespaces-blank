// src/app/bookings/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Booking } from '@/types/bookings';
import { BookingService } from '@/services/bookingService';
import { BookingExcelUtils } from '@/utils/bookingExcelUtils';
import BookingForm from '@/components/BookingForm';
import BookingTable from '@/components/BookingTable';
import BookingBulkUploadModal from '@/components/BookingBulkUploadModal';
import NextDayOperationsModal from '@/components/NextDayOperationsModal';
import SearchAndControls from '@/components/SearchAndControls';
import toast, { Toaster } from 'react-hot-toast';
import { DocumentSnapshot } from 'firebase/firestore';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showNextDayOperations, setShowNextDayOperations] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [sortField, setSortField] = useState<keyof Booking>('bookingConfirmationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Load bookings
  const loadBookings = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const result = await BookingService.getBookings(
        20,
        reset ? undefined : lastDoc || undefined,
        sortField,
        sortDirection
      );
      
      if (reset) {
        setBookings(result.bookings);
        setLastDoc(result.lastDoc);
      } else {
        setBookings(prev => [...prev, ...result.bookings]);
        setLastDoc(result.lastDoc);
      }
      
      setHasMore(result.hasMore);
    } catch (error) {
      toast.error('Failed to load bookings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [lastDoc, sortField, sortDirection]);

  // Initial load and when sorting changes
  useEffect(() => {
    setLastDoc(null);
    loadBookings(true);
  }, [sortField, sortDirection]);

  // Search bookings
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setLastDoc(null);
      loadBookings(true);
      return;
    }

    try {
      setLoading(true);
      const results = await BookingService.searchBookings(searchTerm);
      setBookings(results);
      setHasMore(false);
      setLastDoc(null);
    } catch (error) {
      toast.error('Search failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setLastDoc(null);
    loadBookings(true);
  };

  // Export all bookings to Excel
  const handleExportAllBookings = async () => {
    try {
      setLoading(true);
      toast.loading('Preparing Excel export...', { id: 'export-loading' });
      
      // Get ALL bookings from database (not just the displayed ones)
      const allBookings = await BookingService.getAllBookingsForExport();
      
      if (allBookings.length === 0) {
        toast.error('No bookings to export', { id: 'export-loading' });
        return;
      }
      
      // Generate Excel file with ALL columns
      const excelBlob = BookingExcelUtils.exportBookingsToExcel(allBookings);
      const filename = BookingExcelUtils.generateFilename('all_bookings');
      
      // Download the file
      BookingExcelUtils.downloadFile(excelBlob, filename);
      
      toast.success(`Successfully exported ${allBookings.length} bookings to Excel`, { id: 'export-loading' });
    } catch (error) {
      toast.error('Failed to export bookings to Excel', { id: 'export-loading' });
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all bookings
  const handleClearAll = async () => {
    const confirmMessage = `⚠️ WARNING: This will permanently delete ALL ${bookings.length} bookings from your database.\n\nThis action cannot be undone!\n\nType "DELETE ALL" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE ALL') {
      if (userInput !== null) {
        toast.error('Deletion cancelled - incorrect confirmation text');
      }
      return;
    }

    try {
      setLoading(true);
      await BookingService.clearAllBookings();
      toast.success('All bookings deleted successfully');
      setBookings([]);
      setLastDoc(null);
      setHasMore(false);
    } catch (error) {
      toast.error('Failed to delete all bookings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete booking
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      await BookingService.deleteBooking(id);
      toast.success('Booking deleted successfully');
      setLastDoc(null);
      loadBookings(true);
    } catch (error) {
      toast.error('Failed to delete booking');
      console.error(error);
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingBooking(null);
    setLastDoc(null);
    loadBookings(true);
  };

  // Handle bulk upload success
  const handleBulkUploadSuccess = () => {
    setShowBulkUpload(false);
    setLastDoc(null);
    loadBookings(true);
  };

  // Handle sort
  const handleSort = (field: keyof Booking) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">📋 Bookings Management</h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage your car rental bookings with complete financial tracking
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowNextDayOperations(true)}
                className="px-4 py-2 text-amber-700 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>📅</span>
                <span>Next Day's Operations</span>
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 text-purple-700 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>📤</span>
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={handleExportAllBookings}
                className="px-4 py-2 text-green-700 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Export to Excel</span>
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-white bg-red-500 border border-red-600 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Clear All</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                <span>➕</span>
                <span>Add Booking</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <SearchAndControls 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Bookings Table */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading && bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? `No bookings match "${searchTerm}". Try a different search term.`
                  : "Get started by adding your first booking or uploading bulk data."
                }
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Add First Booking
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="px-6 py-3 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  Bulk Upload
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <BookingTable
              bookings={bookings}
              onEdit={setEditingBooking}
              onDelete={handleDelete}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              viewMode={viewMode}
            />
            
            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => loadBookings(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    'Load More Bookings'
                  )}
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {bookings.length} bookings in {viewMode} view
              {hasMore && ' (more available)'}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showAddForm && (
        <BookingForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingBooking && (
        <BookingForm
          booking={editingBooking}
          onSuccess={handleFormSuccess}
          onCancel={() => setEditingBooking(null)}
        />
      )}

      {showBulkUpload && (
        <BookingBulkUploadModal
          onSuccess={handleBulkUploadSuccess}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      <NextDayOperationsModal
        isOpen={showNextDayOperations}
        onClose={() => setShowNextDayOperations(false)}
      />
    </div>
  );
}
