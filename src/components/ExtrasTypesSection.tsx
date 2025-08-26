// src/components/ExtrasTypesSection.tsx

'use client';

import { useState, useEffect } from 'react';
import { ExtrasType } from '@/types/extrasTypes';
import { ExtrasTypesService } from '@/services/extrasTypesService';
import toast from 'react-hot-toast';

interface ExtrasTypesSectionProps {
  className?: string;
}

export default function ExtrasTypesSection({ className = '' }: ExtrasTypesSectionProps) {
  const [extrasTypes, setExtrasTypes] = useState<ExtrasType[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [editingPrices, setEditingPrices] = useState<{[key: string]: string}>({});

  // Load extras types
  const loadExtrasTypes = async () => {
    try {
      setLoading(true);
      const types = await ExtrasTypesService.getAllExtrasTypes();
      setExtrasTypes(types);
    } catch (error) {
      toast.error('Failed to load extras types');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize default extras types
  const handleInitializeDefaults = async () => {
    try {
      setInitializing(true);
      await ExtrasTypesService.initializeDefaultExtrasTypes();
      toast.success('Default extras types initialized successfully');
      await loadExtrasTypes();
    } catch (error) {
      toast.error('Failed to initialize default extras types');
      console.error(error);
    } finally {
      setInitializing(false);
    }
  };

  // Handle price update
  const handlePriceUpdate = async (id: string, newPrice: string) => {
    try {
      const price = parseFloat(newPrice) || 0;
      await ExtrasTypesService.updateExtrasTypePrice(id, price);
      toast.success('Price updated successfully');
      
      // Update local state
      setExtrasTypes(prev => prev.map(extra => 
        extra.id === id ? { ...extra, price } : extra
      ));
      
      // Clear editing state
      setEditingPrices(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } catch (error) {
      toast.error('Failed to update price');
      console.error(error);
    }
  };

  // Handle price edit
  const handlePriceEdit = (id: string, currentPrice: number) => {
    setEditingPrices(prev => ({
      ...prev,
      [id]: currentPrice.toString()
    }));
  };

  // Handle price cancel
  const handlePriceCancel = (id: string) => {
    setEditingPrices(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    loadExtrasTypes();
  }, []);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Section Header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⭐</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Extras Types</h2>
              <p className="text-sm text-gray-600">Configure pricing for booking extras and add-ons</p>
            </div>
          </div>
          {extrasTypes.length === 0 && !loading && (
            <button
              onClick={handleInitializeDefaults}
              disabled={initializing}
              className="px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition-all duration-200 flex items-center space-x-2 font-medium"
            >
              <span>⚡</span>
              <span>{initializing ? 'Initializing...' : 'Initialize Defaults'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <span className="ml-3 text-gray-600">Loading extras types...</span>
          </div>
        ) : extrasTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Extras Types Found</h3>
            <p className="text-gray-600 text-sm mb-6">Initialize default extras types to get started</p>
            <button
              onClick={handleInitializeDefaults}
              disabled={initializing}
              className="px-6 py-3 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 font-medium"
            >
              {initializing ? 'Initializing...' : 'Initialize Default Extras Types'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800">Total Types</div>
                <div className="text-2xl font-bold text-green-900">{extrasTypes.length}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800">Active Types</div>
                <div className="text-2xl font-bold text-blue-900">
                  {extrasTypes.filter(extra => extra.status === 'active').length}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm font-medium text-amber-800">Avg. Price</div>
                <div className="text-2xl font-bold text-amber-900">
                  {formatCurrency(
                    extrasTypes.reduce((sum, extra) => sum + extra.price, 0) / extrasTypes.length || 0
                  )}
                </div>
              </div>
            </div>

            {/* Extras Types List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extrasTypes.map((extra) => (
                <div
                  key={extra.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    extra.status === 'active'
                      ? 'border-green-200 bg-green-50 hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold ${
                      extra.status === 'active' ? 'text-green-900' : 'text-gray-600'
                    }`}>
                      {extra.name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      extra.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {extra.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price per day:</span>
                      {editingPrices[extra.id!] !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editingPrices[extra.id!]}
                            onChange={(e) => setEditingPrices(prev => ({
                              ...prev,
                              [extra.id!]: e.target.value
                            }))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                            autoFocus
                          />
                          <button
                            onClick={() => handlePriceUpdate(extra.id!, editingPrices[extra.id!])}
                            className="text-green-600 hover:text-green-700 text-xs"
                            title="Save"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => handlePriceCancel(extra.id!)}
                            className="text-red-600 hover:text-red-700 text-xs"
                            title="Cancel"
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${
                            extra.status === 'active' ? 'text-green-900' : 'text-gray-600'
                          }`}>
                            {formatCurrency(extra.price)}
                          </span>
                          <button
                            onClick={() => handlePriceEdit(extra.id!, extra.price)}
                            className="text-blue-600 hover:text-blue-700 text-xs"
                            title="Edit Price"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Updated: {extra.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}