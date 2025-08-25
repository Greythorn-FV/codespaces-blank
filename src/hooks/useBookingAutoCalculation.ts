// src/hooks/useBookingAutoCalculation.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { BookingFormData } from '@/types/bookings';
import { BookingPricingService, VehicleGroupInfo, PricingCalculation } from '@/services/bookingPricingService';
import toast from 'react-hot-toast';

interface UseBookingAutoCalculationProps {
  registration: string;
  pickUpDate: string;
  dropOffDate: string;
  setValue: UseFormSetValue<BookingFormData>;
  getValues: UseFormGetValues<BookingFormData>;
}

interface AutoCalculationState {
  loading: boolean;
  vehicleInfo: VehicleGroupInfo | null;
  pricing: PricingCalculation | null;
  error: string | null;
}

export function useBookingAutoCalculation({
  registration,
  pickUpDate,
  dropOffDate,
  setValue,
  getValues
}: UseBookingAutoCalculationProps) {
  const [state, setState] = useState<AutoCalculationState>({
    loading: false,
    vehicleInfo: null,
    pricing: null,
    error: null
  });

  // Refs to track processed values and prevent duplicate processing
  const lastProcessedReg = useRef<string>('');
  const lastProcessedDates = useRef<string>('');
  const registrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const datesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Clear all timeouts function
  const clearAllTimeouts = useCallback(() => {
    if (registrationTimeoutRef.current) {
      clearTimeout(registrationTimeoutRef.current);
      registrationTimeoutRef.current = null;
    }
    if (datesTimeoutRef.current) {
      clearTimeout(datesTimeoutRef.current);
      datesTimeoutRef.current = null;
    }
  }, []);

  // Process registration change
  const processRegistration = useCallback(async (reg: string) => {
    if (isProcessingRef.current || !reg || reg.length < 3) {
      return;
    }

    isProcessingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const vehicleInfo = await BookingPricingService.getVehicleGroupInfo(reg);
      
      if (vehicleInfo.vehicle) {
        // Only set if not already set
        const currentMake = getValues('make');
        const currentModel = getValues('model');
        
        if (!currentMake && vehicleInfo.vehicle.make) {
          setValue('make', vehicleInfo.vehicle.make);
        }
        if (!currentModel && vehicleInfo.vehicle.model) {
          setValue('model', vehicleInfo.vehicle.model);
        }
        
        if (vehicleInfo.group) {
          setValue('group', vehicleInfo.group.name);
        } else {
          setValue('group', '');
        }
      }

      setState(prev => ({
        ...prev,
        vehicleInfo,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: null
      }));
      console.error('Error processing registration:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [setValue, getValues]);

  // Process pricing calculation
  const processPricing = useCallback(async (reg: string, pickup: string, dropoff: string) => {
    if (isProcessingRef.current || !reg || !pickup || !dropoff || !state.vehicleInfo?.group) {
      return;
    }

    isProcessingRef.current = true;
    setState(prev => ({ ...prev, loading: true }));

    try {
      const result = await BookingPricingService.getCompletePricingCalculation(reg, pickup, dropoff);

      setState(prev => ({
        ...prev,
        pricing: result.pricing,
        error: result.error || null,
        loading: false
      }));

      if (result.success && result.pricing) {
        const currentHireCharge = getValues('hireChargeInclVat');
        if (!currentHireCharge || currentHireCharge === '0' || currentHireCharge === '') {
          setValue('hireChargeInclVat', result.pricing.totalHireCharge.toFixed(2));
          
          toast.success(
            `Calculated: ${result.pricing.numberOfDays} days × £${result.pricing.dailyRate} = £${result.pricing.totalHireCharge.toFixed(2)}`,
            { duration: 3000 }
          );
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: null
      }));
      console.error('Error processing pricing:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [state.vehicleInfo?.group, setValue, getValues]);

  // Handle registration changes
  useEffect(() => {
    const currentReg = registration?.trim() || '';
    
    if (lastProcessedReg.current === currentReg) {
      return; // Already processed this registration
    }

    clearAllTimeouts();

    if (currentReg.length < 3) {
      lastProcessedReg.current = '';
      setState({
        loading: false,
        vehicleInfo: null,
        pricing: null,
        error: null
      });
      setValue('group', '');
      return;
    }

    lastProcessedReg.current = currentReg;
    
    registrationTimeoutRef.current = setTimeout(() => {
      processRegistration(currentReg);
    }, 800);

  }, [registration, clearAllTimeouts, processRegistration, setValue]);

  // Handle date changes
  useEffect(() => {
    const datesKey = `${pickUpDate}|${dropOffDate}`;
    
    if (lastProcessedDates.current === datesKey) {
      return; // Already processed these dates
    }

    if (!pickUpDate || !dropOffDate || !registration || !state.vehicleInfo?.group) {
      return; // Not ready for pricing calculation
    }

    clearAllTimeouts();
    lastProcessedDates.current = datesKey;

    datesTimeoutRef.current = setTimeout(() => {
      processPricing(registration, pickUpDate, dropOffDate);
    }, 500);

  }, [pickUpDate, dropOffDate, registration, state.vehicleInfo?.group, clearAllTimeouts, processPricing]);

  // Manual recalculation
  const recalculate = useCallback(() => {
    if (registration && pickUpDate && dropOffDate) {
      clearAllTimeouts();
      lastProcessedReg.current = '';
      lastProcessedDates.current = '';
      
      // Process registration first, then pricing
      processRegistration(registration).then(() => {
        setTimeout(() => {
          processPricing(registration, pickUpDate, dropOffDate);
        }, 100);
      });
    }
  }, [registration, pickUpDate, dropOffDate, clearAllTimeouts, processRegistration, processPricing]);

  // Get calculation summary
  const getCalculationSummary = useCallback(() => {
    if (!state.pricing || !state.vehicleInfo?.group) {
      return null;
    }

    return {
      vehicle: state.vehicleInfo.vehicle?.registration,
      group: state.vehicleInfo.group.name,
      days: state.pricing.numberOfDays,
      dailyRate: state.pricing.dailyRate,
      total: state.pricing.totalHireCharge,
      calculation: BookingPricingService.formatPricingDisplay(state.pricing)
    };
  }, [state.pricing, state.vehicleInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    loading: state.loading,
    vehicleInfo: state.vehicleInfo,
    pricing: state.pricing,
    error: state.error,
    recalculate,
    getCalculationSummary
  };
}