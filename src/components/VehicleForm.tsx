// src/components/VehicleForm.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Vehicle, VehicleFormData, VehicleSize, VehicleStatus } from '@/types/fleet';
import { VehicleService } from '@/services/vehicleService';
import toast from 'react-hot-toast';

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<VehicleFormData>({
    defaultValues: {
      registration: vehicle?.registration || '',
      vinNumber: vehicle?.vinNumber || '',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      colour: vehicle?.colour || '',
      size: vehicle?.size || '',
      motExpiry: vehicle?.motExpiry ? new Date(vehicle.motExpiry).toISOString().split('T')[0] : '',
      taxExpiry: vehicle?.taxExpiry ? new Date(vehicle.taxExpiry).toISOString().split('T')[0] : '',
      comments: vehicle?.comments || '',
      status: vehicle?.status || 'available'
    }
  });

  const onSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    
    try {
      const vehicleData = {
        registration: data.registration,
        vinNumber: data.vinNumber || undefined,
        make: data.make,
        model: data.model,
        colour: data.colour || undefined,
        size: data.size as string || undefined,
        motExpiry: data.motExpiry ? new Date(data.motExpiry) : null,
        taxExpiry: data.taxExpiry ? new Date(data.taxExpiry) : null,
        comments: data.comments || undefined,
        status: data.status as VehicleStatus,
        createdBy: 'current_user', // In production, get from auth
        lastModifiedBy: 'current_user'
      };

      if (vehicle?.id) {
        await VehicleService.updateVehicle(vehicle.id, vehicleData);
        toast.success('Vehicle updated successfully');
      } else {
        await VehicleService.addVehicle(vehicleData);
        toast.success('Vehicle added successfully');
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save vehicle';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration <span className="text-red-500">*</span>
          </label>
          <input
            {...register('registration', { 
              required: 'Registration is required',
              pattern: {
                value: /^[A-Z]{2}\d{2}\s?[A-Z]{3}$|^[A-Z]\d{1,3}\s?[A-Z]{3}$|^[A-Z]{3}\s?\d{1,3}[A-Z]$|^[A-Z]{2}\d{2}\s?\d{3}$/i,
                message: 'Invalid UK registration format'
              }
            })}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.registration ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., AB12 CDE"
            style={{ textTransform: 'uppercase' }}
            disabled={isLoading}
          />
          {errors.registration && (
            <p className="mt-1 text-sm text-red-600">{errors.registration.message}</p>
          )}
        </div>

        {/* VIN Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            VIN Number
          </label>
          <input
            {...register('vinNumber', {
              pattern: {
                value: /^[A-HJ-NPR-Z0-9]{17}$/i,
                message: 'VIN must be 17 characters'
              }
            })}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.vinNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="17-character VIN"
            disabled={isLoading}
          />
          {errors.vinNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.vinNumber.message}</p>
          )}
        </div>

        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            {...register('make', { required: 'Make is required' })}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.make ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Ford"
            disabled={isLoading}
          />
          {errors.make && (
            <p className="mt-1 text-sm text-red-600">{errors.make.message}</p>
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            {...register('model', { required: 'Model is required' })}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.model ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Focus"
            disabled={isLoading}
          />
          {errors.model && (
            <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
          )}
        </div>

        {/* Colour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colour
          </label>
          <input
            {...register('colour')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Blue"
            disabled={isLoading}
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size
          </label>
          <input
            {...register('size')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., L2H2, 6 Seater, Medium, etc."
            disabled={isLoading}
          />
        </div>

        {/* MOT Expiry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MOT Expiry
          </label>
          <input
            {...register('motExpiry')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Tax Expiry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Expiry
          </label>
          <input
            {...register('taxExpiry')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comments
        </label>
        <textarea
          {...register('comments')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes..."
          disabled={isLoading}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
}