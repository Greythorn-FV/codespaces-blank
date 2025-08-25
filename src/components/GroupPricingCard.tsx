// src/components/GroupPricingCard.tsx

'use client';

import { VehicleGroup } from '@/types/groups';

interface GroupPricingCardProps {
  group: VehicleGroup;
  onVehicleCountClick: () => void;
  onPricingClick: () => void;
}

export default function GroupPricingCard({ 
  group, 
  onVehicleCountClick, 
  onPricingClick 
}: GroupPricingCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></span>
        Inactive
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {group.name}
          </h3>
          {getStatusBadge(group.status)}
        </div>
        
        {/* Vehicle Count */}
        <div className="mt-4">
          <button
            onClick={onVehicleCountClick}
            className="group flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 w-full"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-blue-700 transition-colors duration-200">
                {group.vehicleCount}
              </div>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-blue-900">Assigned Vehicles</div>
              <div className="text-xs text-blue-600">Click to manage assignments</div>
            </div>
            <div className="flex-shrink-0">
              <span className="text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Pricing Rates
          </h4>
          <button
            onClick={onPricingClick}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200"
          >
            Edit Rates
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Hourly Rate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Hourly
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(group.hourlyRate)}
            </div>
          </div>

          {/* Daily Rate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Daily
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(group.dailyRate)}
            </div>
          </div>

          {/* Weekly Rate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Weekly
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(group.weeklyRate)}
            </div>
          </div>

          {/* Monthly Rate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Monthly
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(group.monthlyRate)}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Last updated: {group.updatedAt.toLocaleDateString()}</span>
            <span>ID: {group.id?.slice(-6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}