// src/components/GroupPricingCard.tsx

'use client';

import { VehicleGroup } from '@/types/groups';
import { useState } from 'react';

interface GroupPricingCardProps {
  group: VehicleGroup;
  onVehicleCountClick: () => void;
  onPricingClick: () => void;
  onEditClick: () => void;
  onStatusToggle: () => void;
  onDeleteClick: () => void;
}

export default function GroupPricingCard({ 
  group, 
  onVehicleCountClick, 
  onPricingClick,
  onEditClick,
  onStatusToggle,
  onDeleteClick
}: GroupPricingCardProps) {
  const [showActions, setShowActions] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <button
          onClick={onStatusToggle}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200"
          title="Click to deactivate"
        >
          <span className="w-1 h-1 bg-green-400 rounded-full mr-1"></span>
          Active
        </button>
      );
    }
    return (
      <button
        onClick={onStatusToggle}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
        title="Click to activate"
      >
        <span className="w-1 h-1 bg-gray-400 rounded-full mr-1"></span>
        Inactive
      </button>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden ${
      group.status === 'active' ? 'border-gray-200 hover:border-blue-200' : 'border-gray-300 bg-gray-50'
    }`}>
      {/* Compact Header with Actions */}
      <div className={`px-4 py-3 border-b border-gray-100 ${
        group.status === 'active' ? 'bg-gradient-to-r from-gray-50 to-blue-50' : 'bg-gray-100'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold truncate pr-2 ${
            group.status === 'active' ? 'text-gray-900' : 'text-gray-600'
          }`}>
            {group.name}
          </h3>
          <div className="flex items-center space-x-2">
            {getStatusBadge(group.status)}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="More actions"
              >
                <span className="text-sm">⋮</span>
              </button>
              {showActions && (
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                  <button
                    onClick={() => {
                      onEditClick();
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      onStatusToggle();
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <span>{group.status === 'active' ? '⏸️' : '▶️'}</span>
                    <span>{group.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                  </button>
                  {group.vehicleCount === 0 && (
                    <button
                      onClick={() => {
                        onDeleteClick();
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-100"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vehicle Count - Compact */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={onVehicleCountClick}
          className={`group flex items-center justify-between w-full p-2 rounded-md border transition-all duration-200 ${
            group.status === 'active' 
              ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300' 
              : 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs transition-colors duration-200 ${
              group.status === 'active' 
                ? 'bg-blue-600 group-hover:bg-blue-700' 
                : 'bg-gray-500 group-hover:bg-gray-600'
            }`}>
              {group.vehicleCount}
            </div>
            <div className="text-left">
              <div className={`text-xs font-medium ${
                group.status === 'active' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Vehicles
              </div>
            </div>
          </div>
          <div className={`transition-colors duration-200 text-xs ${
            group.status === 'active' 
              ? 'text-blue-600 group-hover:text-blue-700' 
              : 'text-gray-500 group-hover:text-gray-600'
          }`}>
            →
          </div>
        </button>
      </div>

      {/* Compact Pricing Grid */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Rates
          </h4>
          <button
            onClick={onPricingClick}
            className={`text-xs font-medium hover:underline transition-colors duration-200 ${
              group.status === 'active' 
                ? 'text-blue-600 hover:text-blue-700' 
                : 'text-gray-500 hover:text-gray-600'
            }`}
          >
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Hourly & Daily */}
          <div className={`rounded-md p-2 ${group.status === 'active' ? 'bg-gray-50' : 'bg-gray-100'}`}>
            <div className="text-xs text-gray-500 mb-1">Hourly</div>
            <div className={`text-sm font-semibold ${
              group.status === 'active' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {formatCurrency(group.hourlyRate)}
            </div>
          </div>

          <div className={`rounded-md p-2 ${group.status === 'active' ? 'bg-gray-50' : 'bg-gray-100'}`}>
            <div className="text-xs text-gray-500 mb-1">Daily</div>
            <div className={`text-sm font-semibold ${
              group.status === 'active' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {formatCurrency(group.dailyRate)}
            </div>
          </div>

          {/* Weekly & Monthly */}
          <div className={`rounded-md p-2 ${group.status === 'active' ? 'bg-gray-50' : 'bg-gray-100'}`}>
            <div className="text-xs text-gray-500 mb-1">Weekly</div>
            <div className={`text-sm font-semibold ${
              group.status === 'active' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {formatCurrency(group.weeklyRate)}
            </div>
          </div>

          <div className={`rounded-md p-2 ${group.status === 'active' ? 'bg-gray-50' : 'bg-gray-100'}`}>
            <div className="text-xs text-gray-500 mb-1">Monthly</div>
            <div className={`text-sm font-semibold ${
              group.status === 'active' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {formatCurrency(group.monthlyRate)}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Footer */}
      <div className={`px-4 py-2 border-t border-gray-100 ${
        group.status === 'active' ? 'bg-gray-50' : 'bg-gray-100'
      }`}>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Updated {group.updatedAt.toLocaleDateString()}</span>
          <span>#{group.id?.slice(-4)}</span>
        </div>
      </div>
    </div>
  );
}