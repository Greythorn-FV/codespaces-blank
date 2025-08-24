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
      bookingConfirmationDate: booking?.bookingConfirmationDate ? 
        new Date(booking.bookingConfirmationDate).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      supplier: booking?.supplier || '',
      reference: booking?.reference || '',
      coastrReference: booking?.coastrReference || '',
      sageInv: booking?.sageInv || '',
      notes: booking?.notes || '',
      customerName: booking?.customerName || '',
      phoneNumber: booking?.phoneNumber || '',
      group: booking?.group || '',
      registration: booking?.registration || '',
      make: booking?.make || '',
      model: booking?.model || '',
      pickUpDate: booking?.pickUpDate ? 
        new Date(booking.pickUpDate).toISOString().split('T')[0] : '',
      pickUpTime: booking?.pickUpTime || '',
      pickUpLocation: booking?.pickUpLocation || '',
      dropOffDate: booking?.dropOffDate ? 
        new Date(booking.dropOffDate).toISOString().split('T')[0] : '',
      dropOffTime: booking?.dropOffTime || '',
      dropOffLocation: booking?.dropOffLocation || '',
      hireChargeInclVat: booking?.hireChargeInclVat?.toString() || '',
      insurance: booking?.insurance?.toString() || '',
      additionalIncome: booking?.additionalIncome?.toString() || '',
      additionalIncomeReason: booking?.additionalIncomeReason || '',
      extras: booking?.extras?.toString() || '',
      extrasType: booking?.extrasType || '',
      depositToBeCollectedAtBranch: booking?.depositToBeCollectedAtBranch?.toString() || '',
      depositToBeCollectedStatus: booking?.depositToBeCollectedStatus || '',
      chargesIncome: booking?.chargesIncome?.toString() || '',
      paidToUs: booking?.paidToUs?.toString() || '',
      deposit: booking?.deposit?.toString() || '',
      returnedDate: booking?.returnedDate ? 
        (typeof booking.returnedDate === 'string' ? 
          booking.returnedDate : 
          new Date(booking.returnedDate).toISOString().split('T')[0]) : '',
      comments: booking?.comments || ''
    }
  });

  // Watch form values for calculations and auto-fill
  const registration = watch('registration');
  const pickUpDate = watch('pickUpDate');
  const dropOffDate = watch('dropOffDate');
  
  // Watch financial fields for auto-calculation of "Paid To Us" (EXCLUDING ALL DEPOSITS)
  const hireChargeInclVat = watch('hireChargeInclVat');
  const insurance = watch('insurance');
  const additionalIncome = watch('additionalIncome');
  const extras = watch('extras');
  const chargesIncome = watch('chargesIncome');

  // Auto-calculate "Paid To Us" from revenue fields only (NO DEPOSITS)
  useEffect(() => {
    const fields = [
      hireChargeInclVat,
      insurance,
      additionalIncome,
      extras,
      chargesIncome
      // NOTE: NO deposits included - they all get refunded
    ];
    
    const total = fields.reduce((sum, field) => {
      const value = parseFloat(field || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    setValue('paidToUs', total > 0 ? total.toFixed(2) : '');
  }, [hireChargeInclVat, insurance, additionalIncome, extras, chargesIncome, setValue]);

  // Auto-fill vehicle details when registration changes
  useEffect(() => {
    if (registration && registration.length >= 3) {
      const searchVehicle = async () => {
        try {
          const vehicles = await VehicleService.searchVehicles(registration);
          setVehicleSuggestions(vehicles);
          setShowSuggestions(vehicles.length > 0);
          
          // Auto-fill if exact match found
          const exactMatch = vehicles.find(v => 
            v.registration.toLowerCase() === registration.toLowerCase()
          );
          
          if (exactMatch && !getValues('make')) {
            setValue('make', exactMatch.make || '');
            setValue('model', exactMatch.model || '');
          }
        } catch (error) {
          console.error('Error searching vehicles:', error);
        }
      };
      
      searchVehicle();
    } else {
      setShowSuggestions(false);
    }
  }, [registration, setValue, getValues]);

  const selectVehicle = (vehicle: any) => {
    setValue('registration', vehicle.registration);
    setValue('make', vehicle.make || '');
    setValue('model', vehicle.model || '');
    setShowSuggestions(false);
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    try {
      // Convert form data to Booking object
      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        bookingConfirmationDate: new Date(data.bookingConfirmationDate),
        supplier: data.supplier || undefined,
        reference: data.reference || undefined,
        coastrReference: data.coastrReference,
        sageInv: data.sageInv || undefined,
        notes: data.notes || undefined,
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        group: data.group || undefined,
        registration: data.registration.toUpperCase(),
        make: data.make || undefined,
        model: data.model || undefined,
        makeModel: data.make && data.model ? `${data.make} ${data.model}` : (data.make || data.model || undefined),
        pickUpDate: new Date(data.pickUpDate),
        pickUpTime: data.pickUpTime,
        pickUpLocation: data.pickUpLocation,
        dropOffDate: new Date(data.dropOffDate),
        dropOffTime: data.dropOffTime,
        dropOffLocation: data.dropOffLocation,
        hireChargeInclVat: data.hireChargeInclVat ? parseFloat(data.hireChargeInclVat) : undefined,
        insurance: data.insurance ? parseFloat(data.insurance) : undefined,
        additionalIncome: data.additionalIncome ? parseFloat(data.additionalIncome) : undefined,
        additionalIncomeReason: data.additionalIncomeReason || undefined,
        extras: data.extras ? parseFloat(data.extras) : undefined,
        extrasType: data.extrasType || undefined,
        depositToBeCollectedAtBranch: data.depositToBeCollectedAtBranch ? parseFloat(data.depositToBeCollectedAtBranch) : undefined,
        depositToBeCollectedStatus: data.depositToBeCollectedStatus as 'Yes' | 'No' || undefined,
        chargesIncome: data.chargesIncome ? parseFloat(data.chargesIncome) : undefined,
        paidToUs: data.paidToUs ? parseFloat(data.paidToUs) : undefined,
        deposit: data.deposit ? parseFloat(data.deposit) : undefined,
        returnedDate: data.returnedDate || null,
        comments: data.comments || undefined,
        createdBy: booking?.createdBy || 'user',
        lastModifiedBy: 'user'
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
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      console.error('Error saving booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {booking ? 'Edit Booking' : 'Add New Booking'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Booking Information Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Booking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Booking Confirmation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Confirmation Date *
                </label>
                <input
                  type="date"
                  {...register('bookingConfirmationDate', { required: 'Booking date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.bookingConfirmationDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.bookingConfirmationDate.message}</p>
                )}
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  {...register('supplier')}
                  placeholder="e.g., Fourways, Market Place"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reference (Supplier Ref) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  {...register('reference')}
                  placeholder="Supplier reference number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Coastr Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coastr Reference *
                </label>
                <input
                  type="text"
                  {...register('coastrReference', { required: 'Coastr reference is required' })}
                  placeholder="e.g., CR2025001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.coastrReference && (
                  <p className="text-red-500 text-xs mt-1">{errors.coastrReference.message}</p>
                )}
              </div>

              {/* SAGE INV */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SAGE INV
                </label>
                <input
                  type="text"
                  {...register('sageInv')}
                  placeholder="Invoice reference"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  {...register('notes')}
                  placeholder="Booking notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4">👤 Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  {...register('customerName', { required: 'Customer name is required' })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.customerName && (
                  <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('phoneNumber')}
                  placeholder="e.g., 07123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="bg-purple-50 p-6 rounded-lg relative">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">🚗 Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Registration */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration *
                </label>
                <input
                  type="text"
                  {...register('registration', { required: 'Registration is required' })}
                  placeholder="e.g., AB12 CDE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.registration && (
                  <p className="text-red-500 text-xs mt-1">{errors.registration.message}</p>
                )}
                
                {/* Vehicle Suggestions */}
                {showSuggestions && vehicleSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {vehicleSuggestions.map((vehicle, index) => (
                      <div
                        key={index}
                        onClick={() => selectVehicle(vehicle)}
                        className="px-3 py-2 cursor-pointer hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{vehicle.registration}</div>
                        <div className="text-sm text-gray-600">
                          {vehicle.make} {vehicle.model}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make
                </label>
                <input
                  type="text"
                  {...register('make')}
                  placeholder="e.g., Ford, BMW"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  {...register('model')}
                  placeholder="e.g., Focus, 3 Series"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Group - MOVED HERE FROM CUSTOMER SECTION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Group
                </label>
                <select
                  {...register('group')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select group</option>
                  <option value="Economy">Economy</option>
                  <option value="Compact">Compact</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Standard">Standard</option>
                  <option value="Full Size">Full Size</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rental Details Section */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">📅 Rental Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pick Up Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pick Up Date *
                </label>
                <input
                  type="date"
                  {...register('pickUpDate', { required: 'Pick up date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {errors.pickUpDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.pickUpDate.message}</p>
                )}
              </div>

              {/* Pick Up Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pick Up Time
                </label>
                <select
                  {...register('pickUpTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 24 }, (_, hour) =>
                    ['00', '15', '30', '45'].map(minute => {
                      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      );
                    })
                  ).flat()}
                </select>
              </div>

              {/* Drop Off Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drop Off Date *
                </label>
                <input
                  type="date"
                  {...register('dropOffDate', { required: 'Drop off date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {errors.dropOffDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.dropOffDate.message}</p>
                )}
              </div>

              {/* Drop Off Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drop Off Time
                </label>
                <select
                  {...register('dropOffTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 24 }, (_, hour) =>
                    ['00', '15', '30', '45'].map(minute => {
                      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      );
                    })
                  ).flat()}
                </select>
              </div>

              {/* Pick Up Location */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pick Up Location *
                </label>
                <input
                  type="text"
                  {...register('pickUpLocation', { required: 'Pick up location is required' })}
                  placeholder="e.g., London Heathrow Airport"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {errors.pickUpLocation && (
                  <p className="text-red-500 text-xs mt-1">{errors.pickUpLocation.message}</p>
                )}
              </div>

              {/* Drop Off Location */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drop Off Location *
                </label>
                <input
                  type="text"
                  {...register('dropOffLocation', { required: 'Drop off location is required' })}
                  placeholder="e.g., London Heathrow Airport"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {errors.dropOffLocation && (
                  <p className="text-red-500 text-xs mt-1">{errors.dropOffLocation.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-4">💰 Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Hire Charge incl Vat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Charge incl Vat (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('hireChargeInclVat')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Insurance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('insurance')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Additional Income Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Income (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('additionalIncome')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Additional Income Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Income Reason
                </label>
                <input
                  type="text"
                  {...register('additionalIncomeReason')}
                  placeholder="e.g., Additional driver fee"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Extras Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extras (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('extras')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Extras Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extras Type
                </label>
                <input
                  type="text"
                  {...register('extrasType')}
                  placeholder="e.g., GPS, Child seat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Deposit TO BE Collected @ Branch Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit @ Branch (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('depositToBeCollectedAtBranch')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Deposit TO BE Collected Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Status
                </label>
                <select
                  {...register('depositToBeCollectedStatus')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select status</option>
                  <option value="Yes" className="text-green-600">Yes (Collected)</option>
                  <option value="No" className="text-red-600">No (Not Collected)</option>
                </select>
              </div>

              {/* Charges Income */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charges Income (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('chargesIncome')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Paid To Us (Auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid To Us (£) 
                  <span className="text-xs text-blue-600">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('paidToUs')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  readOnly
                />
              </div>

              {/* Deposit Returned Date - ONLY THE DATE FIELD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Returned Date
                  <span className="text-xs text-gray-500">(Date or text)</span>
                </label>
                <input
                  type="text"
                  {...register('returnedDate')}
                  placeholder="DD/MM/YYYY or text note"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Comments */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Comments</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                {...register('comments')}
                rows={3}
                placeholder="Additional comments or notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {booking ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                booking ? 'Update Booking' : 'Create Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}