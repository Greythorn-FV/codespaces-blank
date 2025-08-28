// src/components/BookingForm.tsx

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Booking, BookingFormData } from '@/types/bookings';
import { SelectedExtrasType } from '@/types/extrasTypes';
import { BookingService } from '@/services/bookingService';
import { VehicleService } from '@/services/vehicleService';
import { GroupAssignmentService } from '@/services/groupAssignmentService';
import { GroupService } from '@/services/groupService';
import { useBookingAutoCalculation } from '@/hooks/useBookingAutoCalculation';
import ExtrasTypeDropdown from './ExtrasTypeDropdown';
import toast from 'react-hot-toast';

interface BookingFormProps {
  booking?: Booking;
  onSuccess: () => void;
  onCancel: () => void;
}

// Custom Time Component with separate hour and minute dropdowns
interface TimeSeparateProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const TimeSeparate = ({ value, onChange, className = '' }: TimeSeparateProps) => {
  // Parse existing time value
  const [hour, minute] = value ? value.split(':') : ['', ''];
  
  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString().padStart(2, '0'),
    label: i.toString().padStart(2, '0')
  }));

  // Generate minute options (only 00, 15, 30, 45)
  const minuteOptions = [
    { value: '00', label: '00' },
    { value: '15', label: '15' },
    { value: '30', label: '30' },
    { value: '45', label: '45' }
  ];

  const handleHourChange = (newHour: string) => {
    if (newHour && minute) {
      onChange(`${newHour}:${minute}`);
    } else if (newHour) {
      onChange(`${newHour}:`);
    } else {
      onChange('');
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    if (hour && newMinute) {
      onChange(`${hour}:${newMinute}`);
    } else if (newMinute && !hour) {
      onChange('');
    } else {
      if (hour) {
        onChange(`${hour}:`);
      } else {
        onChange('');
      }
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex-1">
        <select
          value={hour || ''}
          onChange={(e) => handleHourChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
        >
          <option value="">--</option>
          {hourOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-shrink-0 flex items-center">
        <span className="text-gray-400 font-semibold text-lg">:</span>
      </div>
      <div className="flex-1">
        <select
          value={minute || ''}
          onChange={(e) => handleMinuteChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">--</option>
          {minuteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default function BookingForm({ booking, onSuccess, onCancel }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleSuggestions, setVehicleSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedExtrasTypes, setSelectedExtrasTypes] = useState<SelectedExtrasType[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    setError,
    clearErrors
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
      returnedDate: booking?.returnedDate ? 
        (typeof booking.returnedDate === 'string' ? 
          booking.returnedDate : 
          new Date(booking.returnedDate).toISOString().split('T')[0]) : '',
      comments: booking?.comments || ''
    }
  });

  // Watch form values
  const registration = watch('registration');
  const pickUpDate = watch('pickUpDate');
  const dropOffDate = watch('dropOffDate');
  const pickUpTime = watch('pickUpTime');
  const dropOffTime = watch('dropOffTime');
  const hireChargeInclVat = watch('hireChargeInclVat');
  const insurance = watch('insurance');
  const additionalIncome = watch('additionalIncome');
  const extras = watch('extras');
  const chargesIncome = watch('chargesIncome');

  // Validate dates whenever they change
  useEffect(() => {
    if (pickUpDate && dropOffDate) {
      const pickup = new Date(pickUpDate);
      const dropoff = new Date(dropOffDate);
      
      if (dropoff < pickup) {
        setError('dropOffDate', {
          type: 'manual',
          message: 'Drop off date cannot be before pick up date'
        });
      } else {
        clearErrors('dropOffDate');
      }
    }
  }, [pickUpDate, dropOffDate, setError, clearErrors]);

  // Use auto-calculation hook
  const {
    loading: autoCalculating,
    vehicleInfo,
    pricing,
    error: calculationError,
    recalculate,
    getCalculationSummary
  } = useBookingAutoCalculation({
    registration,
    pickUpDate,
    dropOffDate,
    setValue,
    getValues
  });

  // Display calculation errors as form validation errors
  useEffect(() => {
    if (calculationError && calculationError.includes('Drop off date cannot be before pick up date')) {
      setError('dropOffDate', {
        type: 'manual',
        message: 'Drop off date must be on or after pick up date'
      });
    }
  }, [calculationError, setError]);

  // Initialize selectedExtrasTypes when editing an existing booking
  useEffect(() => {
    if (booking?.selectedExtrasTypes && Array.isArray(booking.selectedExtrasTypes)) {
      setSelectedExtrasTypes(booking.selectedExtrasTypes);
    } else {
      setSelectedExtrasTypes([]);
    }
  }, [booking]);

  // Calculate extras total based on selected extras types and number of days
  const calculateExtrasTotal = () => {
    if (selectedExtrasTypes.length === 0) {
      return 0;
    }

    // Use pricing days if available, otherwise calculate from form dates
    let days = pricing?.numberOfDays;
    if (!days && pickUpDate && dropOffDate) {
      days = calculateDays(pickUpDate, dropOffDate);
    }
    if (!days) days = 1; // Default to 1 day

    return selectedExtrasTypes.reduce((total, extra) => {
      return total + (extra.price * days);
    }, 0);
  };

  // Auto-calculate extras amount when selected extras change
  useEffect(() => {
    // Only auto-calculate if extras types have actually changed
    // Don't override manual edits unless extras selection changes
    if (selectedExtrasTypes.length === 0) {
      setValue('extras', '');
    } else {
      const extrasTotal = calculateExtrasTotal();
      setValue('extras', extrasTotal.toFixed(2));
    }
  }, [selectedExtrasTypes, setValue]);

  // Recalculate extras when dates change (only if extras are selected)
  useEffect(() => {
    if (selectedExtrasTypes.length > 0 && (pickUpDate && dropOffDate)) {
      const extrasTotal = calculateExtrasTotal();
      setValue('extras', extrasTotal.toFixed(2));
    }
  }, [pickUpDate, dropOffDate, selectedExtrasTypes, setValue]);

  // Auto-calculate "Paid To Us" from revenue fields only (NO DEPOSITS)
  useEffect(() => {
    const fields = [
      hireChargeInclVat,
      insurance,
      additionalIncome,
      extras,
      chargesIncome
    ];
    
    const total = fields.reduce((sum, field) => {
      const value = parseFloat(field || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    setValue('paidToUs', total > 0 ? total.toFixed(2) : '');
  }, [hireChargeInclVat, insurance, additionalIncome, extras, chargesIncome, setValue]);

  // Enhanced vehicle search - filter out vehicles from INACTIVE groups
  const searchVehicles = async (query: string) => {
    if (query.length < 2) {
      setVehicleSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Get vehicles that match the search
      const vehicles = await VehicleService.searchVehicles(query);
      
      // Filter vehicles to only include those from ACTIVE groups or unassigned vehicles
      const vehiclesWithActiveGroups = [];
      
      for (const vehicle of vehicles) {
        // Get the group assignment for this vehicle
        const assignment = await GroupAssignmentService.getVehicleAssignment(vehicle.id!);
        
        if (assignment) {
          // Check if the group is active
          const group = await GroupService.getGroupById(assignment.groupId);
          if (group && group.status === 'active') {
            vehiclesWithActiveGroups.push({
              ...vehicle,
              groupName: assignment.groupName,
              groupStatus: 'active'
            });
          }
          // Skip vehicles from inactive groups - they won't appear in suggestions
        } else {
          // Vehicle not assigned to any group, include it
          vehiclesWithActiveGroups.push({
            ...vehicle,
            groupName: 'Unassigned',
            groupStatus: 'unassigned'
          });
        }
      }
      
      setVehicleSuggestions(vehiclesWithActiveGroups.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(vehiclesWithActiveGroups.length > 0);
    } catch (error) {
      console.error('Failed to search vehicles:', error);
      setVehicleSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle vehicle selection from dropdown
  const selectVehicle = (vehicle: any) => {
    setValue('registration', vehicle.registration);
    setValue('make', vehicle.make);
    setValue('model', vehicle.model);
    
    // Only set group if it's from an active group
    if (vehicle.groupStatus === 'active') {
      setValue('group', vehicle.groupName);
    } else {
      setValue('group', ''); // Clear group if unassigned
    }
    
    setShowSuggestions(false);
    setVehicleSuggestions([]);
  };

  // Handle registration input change
  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setValue('registration', value);
    searchVehicles(value);
  };

  // Handle extras type changes
  const handleExtrasTypeChange = (newSelectedExtras: SelectedExtrasType[]) => {
    setSelectedExtrasTypes(newSelectedExtras);
    
    // Update the legacy extrasType field for backwards compatibility
    if (newSelectedExtras.length > 0) {
      const extrasTypeString = newSelectedExtras.map(extra => extra.name).join(', ');
      setValue('extrasType', extrasTypeString);
    } else {
      setValue('extrasType', '');
    }
  };

  // Calculate number of days between dates (allow same-day rentals)
  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Allow same-day rentals - minimum 1 day
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    return diffDays;
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
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
        extrasType: data.extrasType || undefined, // Legacy field
        selectedExtrasTypes: selectedExtrasTypes.length > 0 ? selectedExtrasTypes : undefined, // New structured field
        depositToBeCollectedAtBranch: data.depositToBeCollectedAtBranch ? parseFloat(data.depositToBeCollectedAtBranch) : undefined,
        depositToBeCollectedStatus: data.depositToBeCollectedStatus as 'Yes' | 'No' | undefined,
        chargesIncome: data.chargesIncome ? parseFloat(data.chargesIncome) : undefined,
        paidToUs: data.paidToUs ? parseFloat(data.paidToUs) : undefined,
        returnedDate: data.returnedDate || undefined,
        comments: data.comments || undefined,
        createdBy: 'system',
        lastModifiedBy: 'system',
        noOfDays: calculateDays(data.pickUpDate, data.dropOffDate)
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

  const calculationSummary = getCalculationSummary();

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {booking ? 'Edit Booking' : 'Create New Booking'}
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                {booking ? 'Update existing booking details' : 'Add a new booking to the system'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white transition-colors duration-200 p-2 hover:bg-slate-700 rounded-lg"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Container - MOVED FORM TAG HERE TO INCLUDE FOOTER */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(95vh-140px)]">
          {/* Scrollable Form Content */}
          <div className="overflow-y-auto flex-1">
            <div className="p-8 space-y-8">
              {/* Status Banner */}
              {(autoCalculating || calculationSummary || calculationError) && (
                <div className={`rounded-xl border-l-4 p-4 ${
                  calculationError
                    ? 'bg-red-50 border-red-400'
                    : autoCalculating 
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-green-50 border-green-400'
                }`}>
                  {calculationError && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Date Validation Error</h3>
                        <p className="text-xs text-red-700 mt-1">Please check your pickup and drop-off dates</p>
                      </div>
                    </div>
                  )}
                  
                  {autoCalculating && !calculationError && (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Calculating Pricing</h3>
                        <p className="text-xs text-blue-700 mt-1">Looking up vehicle group and calculating rates...</p>
                      </div>
                    </div>
                  )}
                  
                  {calculationSummary && !autoCalculating && !calculationError && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-green-800">Auto-calculated: {calculationSummary.calculation}</h3>
                          <p className="text-xs text-green-700 mt-1">
                            Vehicle: {calculationSummary.vehicle} | Group: {calculationSummary.group}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={recalculate}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Recalculate
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Form Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-8">
                  
                  {/* Booking Information */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.707 4.707a1 1 0 00-1.414-1.414L4 9.586l-.293-.293a1 1 0 00-1.414 1.414l1 1a1 1 0 001.414 0l3-3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Booking Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Booking Confirmation Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          {...register('bookingConfirmationDate', { required: 'Booking date is required' })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                        {errors.bookingConfirmationDate && (
                          <p className="text-red-600 text-xs mt-1">{errors.bookingConfirmationDate.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Supplier</label>
                          <input
                            type="text"
                            {...register('supplier')}
                            placeholder="e.g., Fourways, Market Place"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Reference</label>
                          <input
                            type="text"
                            {...register('reference')}
                            placeholder="Supplier reference"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Coastr Reference <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...register('coastrReference', { required: 'Coastr reference is required' })}
                            placeholder="e.g., CR2025001"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                          {errors.coastrReference && (
                            <p className="text-red-600 text-xs mt-1">{errors.coastrReference.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">SAGE INV</label>
                          <input
                            type="text"
                            {...register('sageInv')}
                            placeholder="Invoice reference"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                        <input
                          type="text"
                          {...register('notes')}
                          placeholder="Booking notes"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Customer Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Customer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('customerName', { required: 'Customer name is required' })}
                          placeholder="Full name"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        />
                        {errors.customerName && (
                          <p className="text-red-600 text-xs mt-1">{errors.customerName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          {...register('phoneNumber')}
                          placeholder="e.g., 07123456789"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 relative">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8 2a2 2 0 00-2 2v1.5H4a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2H8zm2 14a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Vehicle Information</h2>
                      {autoCalculating && (
                        <div className="flex items-center text-blue-600 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Auto-updating
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Registration <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('registration', { required: 'Registration is required' })}
                          onChange={handleRegistrationChange}
                          placeholder="e.g., AB12 CDE"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 uppercase"
                        />
                        {errors.registration && (
                          <p className="text-red-600 text-xs mt-1">{errors.registration.message}</p>
                        )}
                        
                        {/* Vehicle Suggestions */}
                        {showSuggestions && vehicleSuggestions.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {vehicleSuggestions.map((vehicle, index) => (
                              <div
                                key={index}
                                onClick={() => selectVehicle(vehicle)}
                                className="px-4 py-3 cursor-pointer hover:bg-purple-50 border-b border-slate-100 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-slate-900">{vehicle.registration}</div>
                                    <div className="text-sm text-slate-600">
                                      {vehicle.make} {vehicle.model}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                                      vehicle.groupStatus === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {vehicle.groupName}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Group</label>
                        <input
                          type="text"
                          {...register('group')}
                          placeholder="Auto-populated from active vehicle groups"
                          className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 shadow-sm"
                          readOnly
                        />
                        <p className="text-xs text-slate-500 mt-1">Only vehicles from active groups are shown</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Make</label>
                          <input
                            type="text"
                            {...register('make')}
                            placeholder="e.g., Ford"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                          <input
                            type="text"
                            {...register('model')}
                            placeholder="e.g., Transit"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  
                  {/* Rental Period */}
                  <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Rental Period</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Pick Up */}
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <h3 className="text-sm font-semibold text-orange-800 mb-4">Pick Up Details</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              {...register('pickUpDate', { required: 'Pick up date is required' })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                            {errors.pickUpDate && (
                              <p className="text-red-600 text-xs mt-1">{errors.pickUpDate.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                            <TimeSeparate
                              value={pickUpTime}
                              onChange={(value) => setValue('pickUpTime', value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">15-minute intervals only</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                            <input
                              type="text"
                              {...register('pickUpLocation')}
                              placeholder="e.g., Depot A, Terminal 1"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Drop Off */}
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <h3 className="text-sm font-semibold text-orange-800 mb-4">Drop Off Details</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              {...register('dropOffDate', { required: 'Drop off date is required' })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                            {errors.dropOffDate && (
                              <p className="text-red-600 text-xs mt-1">{errors.dropOffDate.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                            <TimeSeparate
                              value={dropOffTime}
                              onChange={(value) => setValue('dropOffTime', value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">15-minute intervals only</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                            <input
                              type="text"
                              {...register('dropOffLocation')}
                              placeholder="e.g., Depot A, Terminal 1"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rental Summary */}
                      {pickUpDate && dropOffDate && (
                        <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg p-4 border border-orange-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-orange-900">
                              Duration: {calculateDays(pickUpDate, dropOffDate)} day{calculateDays(pickUpDate, dropOffDate) !== 1 ? 's' : ''}
                            </span>
                            {vehicleInfo?.group && (
                              <span className="text-sm text-orange-800">
                                <span className="font-medium">{vehicleInfo.group.name}</span>
                                <span className="ml-2 text-orange-600 text-xs">
                                  (£{vehicleInfo.group.dailyRate}/day)
                                </span>
                              </span>
                            )}
                          </div>
                          {pickUpTime && dropOffTime && (
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-orange-200">
                              <span className="text-xs text-orange-700">Time:</span>
                              <span className="text-xs text-orange-800 font-medium">
                                {pickUpTime} - {dropOffTime}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Financial Information</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Hire Charge (Inc. VAT) <span className="text-red-500">*</span>
                            <span className="text-xs text-blue-600 ml-1">(Auto-calculated)</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('hireChargeInclVat', { required: 'Hire charge is required' })}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                          {errors.hireChargeInclVat && (
                            <p className="text-red-600 text-xs mt-1">{errors.hireChargeInclVat.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Insurance</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('insurance')}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Additional Income</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('additionalIncome')}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Charges Income</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('chargesIncome')}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Additional Income Reason</label>
                        <input
                          type="text"
                          {...register('additionalIncomeReason')}
                          placeholder="Reason for additional charge"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Extras Type <span className="text-xs text-blue-600 ml-1">(Multi-select)</span>
                        </label>
                        <ExtrasTypeDropdown
                          value={selectedExtrasTypes}
                          onChange={handleExtrasTypeChange}
                          className="w-full"
                        />
                        {selectedExtrasTypes.length > 0 && pricing?.numberOfDays && (
                          <p className="text-xs text-green-600 mt-1">
                            Total for {pricing.numberOfDays} day{pricing.numberOfDays !== 1 ? 's' : ''}: {formatCurrency(calculateExtrasTotal())}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Extras <span className="text-xs text-blue-600 ml-1">(Auto-calculated)</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('extras')}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Paid To Us <span className="text-xs text-blue-600 ml-1">(Auto-calculated)</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('paidToUs')}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Deposit @ Branch</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('depositToBeCollectedAtBranch')}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Deposit Status</label>
                          <select
                            {...register('depositToBeCollectedStatus')}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select status</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Deposit Returned Date</label>
                        <input
                          type="date"
                          {...register('returnedDate')}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Hidden Legacy Field */}
                      <input type="hidden" {...register('extrasType')} />
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Additional Comments</h2>
                    </div>
                    
                    <div>
                      <textarea
                        {...register('comments')}
                        rows={4}
                        placeholder="Any additional notes or comments about this booking..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Actions - NOW INSIDE FORM */}
          <div className="bg-slate-50 border-t border-slate-200 px-8 py-4">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
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
          </div>
        </form>
      </div>
    </div>
  );
}