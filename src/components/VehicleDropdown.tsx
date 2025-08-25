// src/components/VehicleDropdown.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { Vehicle } from '@/types/fleet';

interface VehicleDropdownProps {
  vehicles: Vehicle[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onVehicleSelect: (vehicle: Vehicle) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function VehicleDropdown({
  vehicles,
  searchTerm,
  onSearchChange,
  onVehicleSelect,
  loading = false,
  placeholder = "Search vehicles..."
}: VehicleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter vehicles based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles([]);
      setIsOpen(false);
      return;
    }

    const filtered = vehicles.filter(vehicle =>
      vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredVehicles(filtered.slice(0, 10)); // Limit to 10 results
    setIsOpen(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [searchTerm, vehicles]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
    onSearchChange(''); // Clear search
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredVehicles.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredVehicles.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredVehicles.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredVehicles.length) {
          handleVehicleSelect(filteredVehicles[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get vehicle display info
  const getVehicleDisplayInfo = (vehicle: Vehicle) => {
    const makeModel = vehicle.make && vehicle.model 
      ? `${vehicle.make} ${vehicle.model}`
      : 'Unknown Make/Model';
    
    return {
      primary: vehicle.registration,
      secondary: makeModel,
      tertiary: vehicle.colour || 'No colour specified'
    };
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredVehicles.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={loading}
          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:bg-gray-100"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <span className="text-gray-400">🔍</span>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredVehicles.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredVehicles.map((vehicle, index) => {
            const { primary, secondary, tertiary } = getVehicleDisplayInfo(vehicle);
            const isHighlighted = index === highlightedIndex;
            
            return (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                  isHighlighted ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{primary}</div>
                    <div className="text-sm text-gray-600">{secondary}</div>
                    <div className="text-xs text-gray-500">{tertiary}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vehicle.status === 'available' 
                        ? 'bg-green-100 text-green-800'
                        : vehicle.status === 'rented'
                        ? 'bg-yellow-100 text-yellow-800'
                        : vehicle.status === 'maintenance'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm.trim() && filteredVehicles.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-sm">No vehicles found matching "{searchTerm}"</p>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500">
        {vehicles.length > 0 
          ? `${vehicles.length} unassigned vehicles available`
          : 'No unassigned vehicles available'
        }
      </div>
    </div>
  );
}