// src/components/PricingModal.tsx

'use client';

import { useState } from 'react';
import { VehicleGroup } from '@/types/groups';

interface PricingModalProps {
  group: VehicleGroup;
  onUpdate: (
    groupId: string,
    pricing: { hourlyRate: number; dailyRate: number; weeklyRate: number; monthlyRate: number }
  ) => Promise<void>;
  onClose: () => void;
}

export default function PricingModal({ group, onUpdate, onClose }: PricingModalProps) {
  const [formData, setFormData] = useState({
    hourlyRate: group.hourlyRate.toString(),
    dailyRate: group.dailyRate.toString(),
    weeklyRate: group.weeklyRate.toString(),
    monthlyRate: group.monthlyRate.toString()
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate hourly rate
    const hourlyRate = parseFloat(formData.hourlyRate);
    if (isNaN(hourlyRate) || hourlyRate < 0) {
      newErrors.hourlyRate = 'Please enter a valid hourly rate';
    }

    // Validate daily rate
    const dailyRate = parseFloat(formData.dailyRate);
    if (isNaN(dailyRate) || dailyRate < 0) {
      newErrors.dailyRate = 'Please enter a valid daily rate';
    }

    // Validate weekly rate
    const weeklyRate = parseFloat(formData.weeklyRate);
    if (isNaN(weeklyRate) || weeklyRate < 0) {
      newErrors.weeklyRate = 'Please enter a valid weekly rate';
    }

    // Validate monthly rate
    const monthlyRate = parseFloat(formData.monthlyRate);
    if (isNaN(monthlyRate) || monthlyRate < 0) {
      newErrors.monthlyRate = 'Please enter a valid monthly rate';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const pricing = {
        hourlyRate: parseFloat(formData.hourlyRate),
        dailyRate: parseFloat(formData.dailyRate),
        weeklyRate: parseFloat(formData.weeklyRate),
        monthlyRate: parseFloat(formData.monthlyRate)
      };

      await onUpdate(group.id!, pricing);
    } catch (error) {
      console.error('Error updating pricing:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Pricing
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {group.name}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Hourly Rate */}
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate (£)
              </label>
              <input
                type="number"
                id="hourlyRate"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hourlyRate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.hourlyRate && (
                <p className="text-red-600 text-xs mt-1">{errors.hourlyRate}</p>
              )}
            </div>

            {/* Daily Rate */}
            <div>
              <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Daily Rate (£)
              </label>
              <input
                type="number"
                id="dailyRate"
                step="0.01"
                min="0"
                value={formData.dailyRate}
                onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dailyRate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.dailyRate && (
                <p className="text-red-600 text-xs mt-1">{errors.dailyRate}</p>
              )}
            </div>

            {/* Weekly Rate */}
            <div>
              <label htmlFor="weeklyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Rate (£)
              </label>
              <input
                type="number"
                id="weeklyRate"
                step="0.01"
                min="0"
                value={formData.weeklyRate}
                onChange={(e) => handleInputChange('weeklyRate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.weeklyRate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.weeklyRate && (
                <p className="text-red-600 text-xs mt-1">{errors.weeklyRate}</p>
              )}
            </div>

            {/* Monthly Rate */}
            <div>
              <label htmlFor="monthlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rate (£)
              </label>
              <input
                type="number"
                id="monthlyRate"
                step="0.01"
                min="0"
                value={formData.monthlyRate}
                onChange={(e) => handleInputChange('monthlyRate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.monthlyRate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.monthlyRate && (
                <p className="text-red-600 text-xs mt-1">{errors.monthlyRate}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {saving ? 'Saving...' : 'Update Pricing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}