// src/components/GroupFormModal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { VehicleGroup, GroupFormData } from '@/types/groups';
import { GroupService } from '@/services/groupService';
import toast from 'react-hot-toast';

interface GroupFormModalProps {
  group?: VehicleGroup;
  onSuccess: () => void;
  onClose: () => void;
}

export default function GroupFormModal({ group, onSuccess, onClose }: GroupFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<GroupFormData>({
    defaultValues: {
      name: group?.name || '',
      hourlyRate: group?.hourlyRate?.toString() || '0',
      dailyRate: group?.dailyRate?.toString() || '0',
      weeklyRate: group?.weeklyRate?.toString() || '0',
      monthlyRate: group?.monthlyRate?.toString() || '0',
      status: group?.status || 'active'
    }
  });

  const onSubmit = async (data: GroupFormData) => {
    setIsLoading(true);
    
    try {
      if (group?.id) {
        // Update existing group
        await GroupService.updateGroup(group.id, data);
        toast.success('Group updated successfully');
      } else {
        // Create new group
        await GroupService.createGroup(data);
        toast.success('Group created successfully');
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save group';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border-2 border-gray-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {group ? 'Edit Group' : 'Add New Group'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  {...register('name', { 
                    required: 'Group name is required',
                    minLength: { value: 3, message: 'Group name must be at least 3 characters' },
                    maxLength: { value: 100, message: 'Group name must be less than 100 characters' }
                  })}
                  placeholder="e.g., SMALL HATCHBACK AUTO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Only active groups will appear in booking forms
                </p>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">💰 Pricing Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Hourly Rate */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hourly Rate (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('hourlyRate', {
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: 'Please enter a valid amount'
                      }
                    })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isLoading}
                  />
                  {errors.hourlyRate && (
                    <p className="text-red-500 text-xs mt-1">{errors.hourlyRate.message}</p>
                  )}
                </div>

                {/* Daily Rate */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Daily Rate (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('dailyRate', {
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: 'Please enter a valid amount'
                      }
                    })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isLoading}
                  />
                  {errors.dailyRate && (
                    <p className="text-red-500 text-xs mt-1">{errors.dailyRate.message}</p>
                  )}
                </div>

                {/* Weekly Rate */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Weekly Rate (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('weeklyRate', {
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: 'Please enter a valid amount'
                      }
                    })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isLoading}
                  />
                  {errors.weeklyRate && (
                    <p className="text-red-500 text-xs mt-1">{errors.weeklyRate.message}</p>
                  )}
                </div>

                {/* Monthly Rate */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Monthly Rate (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('monthlyRate', {
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: 'Please enter a valid amount'
                      }
                    })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isLoading}
                  />
                  {errors.monthlyRate && (
                    <p className="text-red-500 text-xs mt-1">{errors.monthlyRate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Information Note */}
            {group && group.vehicleCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 text-sm">⚠️</span>
                  <div className="text-xs text-yellow-800">
                    <strong>Note:</strong> This group has {group.vehicleCount} assigned vehicle{group.vehicleCount !== 1 ? 's' : ''}. 
                    Deactivating will hide it from booking forms, but existing assignments remain unchanged.
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {group ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  group ? 'Update Group' : 'Create Group'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}