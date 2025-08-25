// src/components/DepositReturnedModal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Booking } from '@/types/bookings';
import { BookingService } from '@/services/bookingService';
import toast from 'react-hot-toast';

interface DepositReturnedModalProps {
  booking: Booking;
  onSuccess: () => void;
  onClose: () => void;
}

interface DepositReturnedFormData {
  returnedDate: string;
}

export default function DepositReturnedModal({ 
  booking, 
  onSuccess, 
  onClose 
}: DepositReturnedModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DepositReturnedFormData>({
    defaultValues: {
      returnedDate: booking.returnedDate ? 
        (typeof booking.returnedDate === 'string' ? 
          booking.returnedDate : 
          new Date(booking.returnedDate).toISOString().split('T')[0]) :
        new Date().toISOString().split('T')[0] // Default to today
    }
  });

  const onSubmit = async (data: DepositReturnedFormData) => {
    setIsLoading(true);
    
    try {
      // Update only the returnedDate field
      const updatedBooking = {
        ...booking,
        returnedDate: data.returnedDate,
        updatedAt: new Date(),
        lastModifiedBy: 'system'
      };

      await BookingService.updateBooking(booking.id!, updatedBooking);
      
      toast.success(`Deposit return date set for ${booking.coastrReference}`);
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update deposit return date';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCustomerInfo = () => {
    return `${booking.customerName} (${booking.registration})`;
  };

  const formatBookingPeriod = () => {
    const pickup = new Date(booking.pickUpDate).toLocaleDateString();
    const dropoff = new Date(booking.dropOffDate).toLocaleDateString();
    return `${pickup} - ${dropoff}`;
  };

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Deposit Returned
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Booking Info */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Booking Reference:</span>
              <span className="text-sm font-semibold text-gray-900">{booking.coastrReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Customer:</span>
              <span className="text-sm text-gray-900">{formatCustomerInfo()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Rental Period:</span>
              <span className="text-sm text-gray-900">{formatBookingPeriod()}</span>
            </div>
            {booking.depositToBeCollectedAtBranch && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Deposit Amount:</span>
                <span className="text-sm font-semibold text-green-600">
                  £{booking.depositToBeCollectedAtBranch.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="returnedDate" className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Return Date *
              </label>
              <input
                type="date"
                id="returnedDate"
                {...register('returnedDate', { 
                  required: 'Deposit return date is required' 
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.returnedDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.returnedDate && (
                <p className="text-red-600 text-xs mt-1">{errors.returnedDate.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Date when the customer's deposit was returned
              </p>
            </div>

            {/* Current Status */}
            {booking.returnedDate && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-blue-800 mb-1">Current Status:</div>
                <div className="text-sm text-blue-700">
                  Deposit returned on: {
                    typeof booking.returnedDate === 'string' 
                      ? booking.returnedDate 
                      : new Date(booking.returnedDate).toLocaleDateString()
                  }
                </div>
              </div>
            )}
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
              disabled={isLoading}
              className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Set Deposit Returned'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}