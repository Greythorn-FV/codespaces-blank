// src/components/BookingForm.tsx

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Booking, BookingFormData } from '@/types/bookings';
import { BookingService } from '@/services/bookingService';
import { VehicleService } from '@/services/vehicleService';
import toast from 'react-hot-toast';

interface BookingFormProps {
  booking?: Booking;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BookingForm({ booking, onSuccess, onCancel }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleSuggestions, setVehicleSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<BookingFormData>({
    defaultValues: {
      bookingConfirmationDate: booking?.bookingConfirmationDate ? new Date(booking.bookingConfirmationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      coastrReference: booking?.coastrReference || '',
      accountsInvoiceRef: booking?.accountsInvoiceRef || '',
      supplier: booking?.supplier || '',
      supplierRef: booking?.supplierRef || '',
      customerName: booking?.customerName || '',
      phoneNumber: booking?.phoneNumber || '',
      additionalDriverCollected: booking?.additionalDriverCollected?.toString() || '',
      vehicleGroup: booking?.vehicleGroup || '',
      registration: booking?.registration || '',
      make: booking?.make || '',
      model: booking?.model || '',
      pickupDate: booking?.pickupDate ? new Date(booking.pickupDate).toISOString().split('T')[0] : '',
      pickupTime: booking?.pickupTime || '',
      dropoffDate: booking?.dropoffDate ? new Date(booking.dropoffDate).toISOString().split('T')[0] : '',
      dropoffTime: booking?.dropoffTime || '',
      pickupLocation: booking?.pickupLocation || '',
      dropoffLocation: booking?.dropoffLocation || '',
      depositBlocked: booking?.depositBlocked?.toString() || '',
      hireChargeInclVat: booking?.hireChargeInclVat?.toString() || '',
      insurance: booking?.insurance?.toString() || '',
      additionalHoursDays: booking?.additionalHoursDays?.toString() || '',
      additionalRentalCollected: booking?.additionalRentalCollected?.toString() || '',
      cdwStandardPremiumCollected: booking?.cdwStandardPremiumCollected?.toString() || '',
      depositToBeCollected: booking?.depositToBeCollected?.toString() || '',
      damageCharge: booking?.damageCharge?.toString() || '',
      additionalCharges: booking?.additionalCharges?.toString() || '',
      paidToUs: booking?.paidToUs?.toString() || '',
      depositReturnedDate: booking?.depositReturnedDate ? new Date(booking.depositReturnedDate).toISOString().split('T')[0] : '',
      comments: booking?.comments || ''
    }
  });

  // Watch form values for calculations
  const pickupDate = watch('pickupDate');
  const dropoffDate = watch('dropoffDate');
  const pickupLocation = watch('pickupLocation');
  const registration = watch('registration');
  
  // Watch financial fields for auto-calculation
  const hireChargeInclVat = watch('hireChargeInclVat');
  const insurance = watch('insurance');
  const additionalHoursDays = watch('additionalHoursDays');
  const additionalRentalCollected = watch('additionalRentalCollected');
  const depositToBeCollected = watch('depositToBeCollected');
  const damageCharge = watch('damageCharge');
  const additionalCharges = watch('additionalCharges');

  // Auto-calculate "Paid To Us" from all financial fields
  useEffect(() => {
    const fields = [
      hireChargeInclVat,
      insurance,
      additionalHoursDays,
      additionalRentalCollected,
      depositToBeCollected,
      damageCharge,
      additionalCharges
    ];
    
    const total = fields.reduce((sum, field) => {
      const value = parseFloat(field || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    setValue('paidToUs', total.toFixed(2));
  }, [hireChargeInclVat, insurance, additionalHoursDays, additionalRentalCollected, depositToBeCollected, damageCharge, additionalCharges, setValue]);

  // Auto-calculate number of days
  useEffect(() => {
    if (pickupDate && dropoffDate) {
      const pickup = new Date(pickupDate);
      const dropoff = new Date(dropoffDate);
      const diffTime = Math.abs(dropoff.getTime() - pickup.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Note: We don't set this in the form as it's calculated, but we could display it
    }
  }, [pickupDate, dropoffDate]);

  // Auto-set dropoff location to match pickup location
  useEffect(() => {
    if (pickupLocation && !getValues('dropoffLocation')) {
      setValue('dropoffLocation', pickupLocation);
    }
  }, [pickupLocation, setValue, getValues]);

  // Vehicle registration smart lookup
  useEffect(() => {
    const searchVehicles = async () => {
      if (registration && registration.length > 2) {
        try {
          const vehicles = await VehicleService.searchVehicles(registration);
          setVehicleSuggestions(vehicles);
          setShowSuggestions(vehicles.length > 0);
          
          // Auto-fill if exact match
          const exactMatch = vehicles.find(v => v.registration.toLowerCase() === registration.toLowerCase());
          if (exactMatch) {
            setValue('make', exactMatch.make);
            setValue('model', exactMatch.model);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Error searching vehicles:', error);
        }
      } else {
        setVehicleSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(searchVehicles, 300);
    return () => clearTimeout(debounceTimer);
  }, [registration, setValue]);

  const selectVehicle = (vehicle: any) => {
    setValue('registration', vehicle.registration);
    setValue('make', vehicle.make);
    setValue('model', vehicle.model);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    
    try {
      // Calculate number of days
      const pickup = new Date(data.pickupDate);
      const dropoff = new Date(data.dropoffDate);
      const diffTime = Math.abs(dropoff.getTime() - pickup.getTime());
      const noOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const bookingData = {
        bookingConfirmationDate: new Date(data.bookingConfirmationDate),
        coastrReference: data.coastrReference,
        accountsInvoiceRef: data.accountsInvoiceRef || undefined,
        supplier: data.supplier || undefined,
        supplierRef: data.supplierRef || undefined,
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        additionalDriverCollected: data.additionalDriverCollected ? parseFloat(data.additionalDriverCollected) : undefined,
        vehicleGroup: data.vehicleGroup || undefined,
        registration: data.registration,
        make: data.make || undefined,
        model: data.model || undefined,
        noOfDays,
        pickupDate: new Date(data.pickupDate),
        pickupTime: data.pickupTime,
        dropoffDate: new Date(data.dropoffDate),
        dropoffTime: data.dropoffTime,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        depositBlocked: data.depositBlocked || undefined, // String value (Yes/No)
        hireChargeInclVat: data.hireChargeInclVat ? parseFloat(data.hireChargeInclVat) : undefined,
        insurance: data.insurance ? parseFloat(data.insurance) : undefined,
        additionalHoursDays: data.additionalHoursDays ? parseFloat(data.additionalHoursDays) : undefined,
        additionalRentalCollected: data.additionalRentalCollected ? parseFloat(data.additionalRentalCollected) : undefined,
        cdwStandardPremiumCollected: data.cdwStandardPremiumCollected || undefined, // String value (CDW/Standard/Premium)
        depositToBeCollected: data.depositToBeCollected ? parseFloat(data.depositToBeCollected) : undefined,
        damageCharge: data.damageCharge ? parseFloat(data.damageCharge) : undefined,
        additionalCharges: data.additionalCharges ? parseFloat(data.additionalCharges) : undefined,
        paidToUs: data.paidToUs ? parseFloat(data.paidToUs) : undefined,
        depositReturnedDate: data.depositReturnedDate ? new Date(data.depositReturnedDate) : null,
        comments: data.comments || undefined,
        createdBy: 'current_user',
        lastModifiedBy: 'current_user'
      };

      if (booking?.id) {
        await BookingService.updateBooking(booking.id, bookingData);
        toast.success('Booking updated successfully');
      } else {
        await BookingService.addBooking(bookingData);
        toast.success('Booking created successfully');
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save booking';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Booking Information Section */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
            📅 Booking Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Confirmation Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register('bookingConfirmationDate', { required: 'Booking date is required' })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {errors.bookingConfirmationDate && (
                <p className="mt-1 text-sm text-red-600">{errors.bookingConfirmationDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coastr Reference <span className="text-red-500">*</span>
              </label>
              <input
                {...register('coastrReference', { required: 'Coastr reference is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CR-2024-001"
                disabled={isLoading}
              />
              {errors.coastrReference && (
                <p className="mt-1 text-sm text-red-600">{errors.coastrReference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accounts Invoice Ref
              </label>
              <input
                {...register('accountsInvoiceRef')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Invoice reference"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Supplier & Reference
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  {...register('supplier')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Supplier"
                  disabled={isLoading}
                />
                <input
                  {...register('supplierRef')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ref"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
            👤 Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('customerName', { required: 'Customer name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Full customer name"
                disabled={isLoading}
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phoneNumber', { required: 'Phone number is required' })}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., +44 7123 456789"
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Driver Collected (£)
              </label>
              <input
                {...register('additionalDriverCollected')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Vehicle & Rental Details Section */}
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
            🚗 Vehicle & Rental Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Group
              </label>
              <input
                {...register('vehicleGroup')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Economy, Luxury"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration <span className="text-red-500">*</span>
              </label>
              <input
                {...register('registration', { required: 'Registration is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., AB12 CDE"
                style={{ textTransform: 'uppercase' }}
                disabled={isLoading}
              />
              {errors.registration && (
                <p className="mt-1 text-sm text-red-600">{errors.registration.message}</p>
              )}
              
              {/* Vehicle Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {vehicleSuggestions.map((vehicle, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-purple-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectVehicle(vehicle)}
                    >
                      <div className="font-medium">{vehicle.registration}</div>
                      <div className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make
              </label>
              <input
                {...register('make')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                placeholder="Auto-filled from fleet"
                disabled={isLoading}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                {...register('model')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                placeholder="Auto-filled from fleet"
                disabled={isLoading}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  {...register('pickupDate', { required: 'Pickup date is required' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <input
                  {...register('pickupTime', { required: 'Pickup time is required' })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>
              {(errors.pickupDate || errors.pickupTime) && (
                <p className="mt-1 text-sm text-red-600">Pickup date and time are required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drop-off Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  {...register('dropoffDate', { required: 'Drop-off date is required' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <input
                  {...register('dropoffTime', { required: 'Drop-off time is required' })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>
              {(errors.dropoffDate || errors.dropoffTime) && (
                <p className="mt-1 text-sm text-red-600">Drop-off date and time are required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location <span className="text-red-500">*</span>
              </label>
              <input
                {...register('pickupLocation', { required: 'Pickup location is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Heathrow Airport"
                disabled={isLoading}
              />
              {errors.pickupLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.pickupLocation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drop-off Location <span className="text-red-500">*</span>
              </label>
              <input
                {...register('dropoffLocation', { required: 'Drop-off location is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Auto-filled from pickup location"
                disabled={isLoading}
              />
              {errors.dropoffLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.dropoffLocation.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information Section */}
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center">
            💰 Financial Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Blocked
              </label>
              <select
                {...register('depositBlocked')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={isLoading}
              >
                <option value="">Select...</option>
                <option value="Yes" className="text-green-600 font-semibold">✅ Yes</option>
                <option value="No" className="text-red-600 font-semibold">❌ No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hire Charge incl VAT (£)
              </label>
              <input
                {...register('hireChargeInclVat')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance (£)
              </label>
              <input
                {...register('insurance')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Hours/Days (£)
              </label>
              <input
                {...register('additionalHoursDays')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Rental Collected @ FV (£)
              </label>
              <input
                {...register('additionalRentalCollected')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CDW/Standard/Premium Collected @ FV
              </label>
              <select
                {...register('cdwStandardPremiumCollected')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={isLoading}
              >
                <option value="">Select...</option>
                <option value="CDW">CDW</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit TO BE Collected @ FV (£)
              </label>
              <input
                {...register('depositToBeCollected')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Damage Charge (£)
              </label>
              <input
                {...register('damageCharge')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Charges (£)
              </label>
              <input
                {...register('additionalCharges')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid To Us (£) <span className="text-xs text-gray-500">(Auto-calculated)</span>
              </label>
              <input
                {...register('paidToUs')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-green-50"
                placeholder="Auto-calculated total"
                disabled={isLoading}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Returned Date
              </label>
              <input
                {...register('depositReturnedDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            📝 Additional Information
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              {...register('comments')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Any additional notes or comments..."
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : booking ? 'Update Booking' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}