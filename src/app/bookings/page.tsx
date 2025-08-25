// src/app/bookings/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Booking } from '@/types/bookings';
import { BookingService } from '@/services/bookingService';
import { BookingExcelUtils } from '@/utils/bookingExcelUtils';
import BookingForm from '@/components/BookingForm';
import BookingTable from '@/components/BookingTable';
import BookingBulkUploadModal from '@/components/BookingBulkUploadModal';
import DepositReturnedModal from '@/components/DepositReturnedModal';
import NextDayOperationsModal from '@/components/NextDayOperationsModal';
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
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showNextDayOps, setShowNextDayOps] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [depositBooking, setDepositBooking] = useState<Booking | null>(null);
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

  // Download template
  const handleDownloadTemplate = () => {
    const blob = BookingExcelUtils.generateTemplate();
    BookingExcelUtils.downloadFile(blob, 'booking_template.xlsx');
    toast.success('Template downloaded successfully');
  };

  // Export bookings
  const handleExport = async () => {
    try {
      const allBookings = bookings;
      const blob = BookingExcelUtils.exportBookingsToExcel(allBookings);
      BookingExcelUtils.downloadFile(blob, `bookings_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Bookings exported successfully');
    } catch (error) {
      toast.error('Failed to export bookings');
      console.error(error);
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

  // Handle deposit returned
  const handleDepositReturned = (booking: Booking) => {
    setDepositBooking(booking);
    setShowDepositModal(true);
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

  // Handle deposit modal success
  const handleDepositModalSuccess = () => {
    setShowDepositModal(false);
    setDepositBooking(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Bookings Management
              </h1>
              <p className="text-gray-600 mt-2">Manage your vehicle bookings efficiently</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>📥</span>
                <span>Download Template</span>
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>📤</span>
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Export</span>
              </button>
              <button
                onClick={() => setShowNextDayOps(true)}
                className="px-4 py-2 text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>📅</span>
                <span>Next Day Ops</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-all duration-200 font-medium flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add Booking</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1 relative max-w-md">
                <input
                  type="text"
                  placeholder="Search by coastr reference, customer name, or registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'summary'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'detailed'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
              <div className="text-sm text-blue-600">Total Bookings</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                £{bookings.reduce((sum, b) => sum + (b.paidToUs || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-green-600">Total Revenue</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {bookings.filter(b => b.returnedDate).length}
              </div>
              <div className="text-sm text-purple-600">Deposits Returned</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {bookings.filter(b => !b.returnedDate && b.depositToBeCollectedAtBranch && b.depositToBeCollectedAtBranch > 0).length}
              </div>
              <div className="text-sm text-orange-600">Deposits pending Return</div>
            </div>
          </div>

          {/* Advanced Actions */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 text-sm font-medium"
            >
              Clear All Bookings
            </button>
          </div>
        </div>

        {/* Main Content */}
        {loading && bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm.trim() 
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
        ) : (
          <>
            <BookingTable
              bookings={bookings}
              onEdit={setEditingBooking}
              onDelete={handleDelete}
              onDepositReturned={handleDepositReturned}
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
                  {loading ? 'Loading...' : 'Load More Bookings'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingBooking) && (
        <BookingForm
          booking={editingBooking || undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowAddForm(false);
            setEditingBooking(null);
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BookingBulkUploadModal
          onSuccess={handleBulkUploadSuccess}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {/* Deposit Returned Modal */}
      {showDepositModal && depositBooking && (
        <DepositReturnedModal
          booking={depositBooking}
          onSuccess={handleDepositModalSuccess}
          onClose={() => {
            setShowDepositModal(false);
            setDepositBooking(null);
          }}
        />
      )}

      {/* Next Day Operations Modal */}
      <NextDayOperationsModal
        isOpen={showNextDayOps}
        onClose={() => setShowNextDayOps(false)}
      />
    </div>
  );
}