// src/components/ExtrasTypeDropdown.tsx

'use client';

import { useState, useEffect } from 'react';
import { ExtrasType, SelectedExtrasType } from '@/types/extrasTypes';
import { ExtrasTypesService } from '@/services/extrasTypesService';

interface ExtrasTypeDropdownProps {
  value: SelectedExtrasType[];
  onChange: (selectedExtras: SelectedExtrasType[]) => void;
  className?: string;
  disabled?: boolean;
}

export default function ExtrasTypeDropdown({ 
  value, 
  onChange, 
  className = '', 
  disabled = false 
}: ExtrasTypeDropdownProps) {
  const [extrasTypes, setExtrasTypes] = useState<ExtrasType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Load active extras types
  const loadExtrasTypes = async () => {
    try {
      setLoading(true);
      const types = await ExtrasTypesService.getActiveExtrasTypes();
      setExtrasTypes(types);
    } catch (error) {
      console.error('Failed to load extras types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtrasTypes();
  }, []);

  // Handle extras selection toggle
  const handleToggleExtra = (extraType: ExtrasType) => {
    const existingIndex = value.findIndex(item => item.id === extraType.id);
    
    if (existingIndex >= 0) {
      // Remove if already selected
      const newSelected = value.filter(item => item.id !== extraType.id);
      onChange(newSelected);
    } else {
      // Add if not selected
      const newExtra: SelectedExtrasType = {
        id: extraType.id!,
        name: extraType.name,
        price: extraType.price,
        selected: true
      };
      onChange([...value, newExtra]);
    }
  };

  // Check if an extra is selected
  const isSelected = (extraTypeId: string): boolean => {
    return value.some(item => item.id === extraTypeId);
  };

  // Format selected extras for display
  const formatSelectedExtras = (): string => {
    if (value.length === 0) return 'Select extras...';
    if (value.length === 1) return value[0].name;
    return `${value.length} extras selected`;
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

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
          Loading extras...
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors ${
          disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'bg-white text-gray-900 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={value.length === 0 ? 'text-gray-500' : ''}>
            {formatSelectedExtras()}
          </span>
          <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {extrasTypes.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No extras types available
            </div>
          ) : (
            <div className="py-1">
              {extrasTypes.map((extraType) => (
                <div
                  key={extraType.id}
                  onClick={() => handleToggleExtra(extraType)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected(extraType.id!) ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      isSelected(extraType.id!) 
                        ? 'bg-yellow-500 border-yellow-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected(extraType.id!) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      isSelected(extraType.id!) ? 'font-medium text-yellow-900' : 'text-gray-900'
                    }`}>
                      {extraType.name}
                    </span>
                  </div>
                  <span className={`text-sm ${
                    isSelected(extraType.id!) ? 'font-semibold text-yellow-800' : 'text-gray-600'
                  }`}>
                    {formatCurrency(extraType.price)}/day
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Selected extras summary */}
      {value.length > 0 && (
        <div className="mt-2 space-y-1">
          {value.map((extra) => (
            <div 
              key={extra.id}
              className="flex items-center justify-between text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1"
            >
              <span className="text-yellow-800 font-medium">{extra.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-700">{formatCurrency(extra.price)}/day</span>
                <button
                  type="button"
                  onClick={() => handleToggleExtra({ id: extra.id, name: extra.name, price: extra.price } as ExtrasType)}
                  className="text-yellow-600 hover:text-yellow-800 font-bold"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}