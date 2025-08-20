// src/app/bookings/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Booking } from '@/types/bookings';
import { BookingService } from '@/services/bookingService';
import { BookingExcelUtils } from '@/utils/bookingExcelUtils';
import BookingForm from '@/components/BookingForm';
import BookingTable from '@/components/BookingTable';
import toast, { Toaster } from 'react-hot-toast';
import { DocumentSnapshot } from 'firebase/firestore';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [sortField, setSortField] = useState<keyof Booking>('bookingConfirmationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Handle sort
  const handleSort = (field: keyof Booking) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loading && hasMore && lastDoc) {
      loadBookings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                📖 Bookings Management
              </h1>
              {bookings.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''} loaded
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportAllBookings}
                disabled={loading}
                className="px-4 py-2 text-white bg-green-500 border border-green-600 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📊</span>
                <span>{loading ? 'Exporting...' : 'Export All to Excel'}</span>
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-white bg-red-500 border border-red-600 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by registration or customer name..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-8 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md transition-all duration-200 font-medium"
            >
              Search
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLastDoc(null);
                  loadBookings(true);
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading && bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-600 mb-4">No bookings found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all duration-200"
            >
              Create Your First Booking
            </button>
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
            />
            
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-2xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Add new booking"
      >
        <span className="text-2xl">➕</span>
      </button>


      {/* Add/Edit Form Modal */}
      {(showAddForm || editingBooking) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {editingBooking ? '✏️ Edit Booking' : '➕ Create New Booking'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingBooking(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <BookingForm
                booking={editingBooking || undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingBooking(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}