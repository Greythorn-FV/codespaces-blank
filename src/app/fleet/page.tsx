// src/app/fleet/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '@/types/fleet';
import { VehicleService } from '@/services/vehicleService';
import { ExcelUtils } from '@/utils/excelUtils';
import VehicleForm from '@/components/VehicleForm';
import VehicleTable from '@/components/VehicleTable';
import BulkUploadModal from '@/components/BulkUploadModal';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { DocumentSnapshot } from 'firebase/firestore';

function FleetPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [sortField, setSortField] = useState<keyof Vehicle>('registration');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load vehicles
  const loadVehicles = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const result = await VehicleService.getVehicles(
        20,
        reset ? undefined : lastDoc || undefined,
        sortField,
        sortDirection
      );
      
      if (reset) {
        setVehicles(result.vehicles);
        setLastDoc(result.lastDoc);
      } else {
        setVehicles(prev => [...prev, ...result.vehicles]);
        setLastDoc(result.lastDoc);
      }
      
      setHasMore(result.hasMore);
    } catch (error) {
      toast.error('Failed to load vehicles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [lastDoc, sortField, sortDirection]);

  // Initial load and when sorting changes
  useEffect(() => {
    setLastDoc(null); // Reset pagination when sorting changes
    loadVehicles(true);
  }, [sortField, sortDirection]);

  // Search vehicles
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setLastDoc(null);
      loadVehicles(true);
      return;
    }

    try {
      setLoading(true);
      const results = await VehicleService.searchVehicles(searchTerm);
      setVehicles(results);
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
    const blob = ExcelUtils.generateTemplate();
    ExcelUtils.downloadFile(blob, 'fleet_inventory_template.xlsx');
    toast.success('Template downloaded successfully');
  };

  // Export vehicles
  const handleExport = async () => {
    try {
      // For export, we might want to get all vehicles, not just the displayed ones
      const allVehicles = vehicles; // In production, fetch all from DB
      const blob = ExcelUtils.exportToExcel(allVehicles);
      ExcelUtils.downloadFile(blob, `fleet_inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Fleet inventory exported successfully');
    } catch (error) {
      toast.error('Failed to export vehicles');
      console.error(error);
    }
  };

  // Delete vehicle
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await VehicleService.deleteVehicle(id);
      toast.success('Vehicle deleted successfully');
      setLastDoc(null);
      loadVehicles(true);
    } catch (error) {
      toast.error('Failed to delete vehicle');
      console.error(error);
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingVehicle(null);
    setLastDoc(null);
    loadVehicles(true);
  };

  // Handle bulk upload success
  const handleBulkUploadSuccess = () => {
    setShowBulkUpload(false);
    setLastDoc(null);
    loadVehicles(true);
  };

  // Clear all vehicles
  const handleClearAll = async () => {
    const confirmMessage = `⚠️ WARNING: This will permanently delete ALL ${vehicles.length} vehicles from your database.\n\nThis action cannot be undone!\n\nType "DELETE ALL" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE ALL') {
      if (userInput !== null) {
        toast.error('Deletion cancelled - incorrect confirmation text');
      }
      return;
    }

    try {
      setLoading(true);
      await VehicleService.clearAllVehicles();
      toast.success('All vehicles deleted successfully');
      setVehicles([]);
      setLastDoc(null);
      setHasMore(false);
    } catch (error) {
      toast.error('Failed to delete all vehicles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sort
  const handleSort = (field: keyof Vehicle) => {
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
      loadVehicles(false);
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
                Fleet Inventory
              </h1>
              <p className="text-gray-600 mt-2">Manage your vehicle fleet efficiently</p>
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
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by registration number..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-8 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-all duration-200 font-medium"
            >
              Search
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLastDoc(null);
                  loadVehicles(true);
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
        {loading && vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No vehicles found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <>
            <VehicleTable
              vehicles={vehicles}
              onEdit={setEditingVehicle}
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
                  className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingVehicle) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <VehicleForm
                vehicle={editingVehicle || undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingVehicle(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          onSuccess={handleBulkUploadSuccess}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
}

// Export with AuthGuard protection - THIS IS THE KEY ADDITION
export default function ProtectedFleetPage() {
  return (
    <AuthGuard requiredPermission="canManageFleet">
      <FleetPage />
    </AuthGuard>
  );
}