// src/services/bookingPricingService.ts

import { GroupAssignmentService } from './groupAssignmentService';
import { GroupService } from './groupService';
import { VehicleService } from './vehicleService';
import { VehicleGroup } from '@/types/groups';
import { Vehicle } from '@/types/fleet';

export interface VehicleGroupInfo {
  vehicle: Vehicle | null;
  group: VehicleGroup | null;
  assignment: any | null;
}

export interface PricingCalculation {
  dailyRate: number;
  numberOfDays: number;
  totalHireCharge: number;
  groupName: string;
  groupId: string;
}

export class BookingPricingService {
  
  /**
   * Get vehicle and its assigned group information by registration
   */
  static async getVehicleGroupInfo(registration: string): Promise<VehicleGroupInfo> {
    try {
      // Search for the vehicle by registration
      const vehicles = await VehicleService.searchVehicles(registration);
      const vehicle = vehicles.find(v => 
        v.registration.toLowerCase() === registration.toLowerCase()
      );

      if (!vehicle) {
        return {
          vehicle: null,
          group: null,
          assignment: null
        };
      }

      // Get group assignment for this vehicle
      const assignment = await GroupAssignmentService.getVehicleAssignment(vehicle.id!);
      
      if (!assignment) {
        return {
          vehicle,
          group: null,
          assignment: null
        };
      }

      // Get full group details
      const group = await GroupService.getGroupById(assignment.groupId);

      return {
        vehicle,
        group,
        assignment
      };
    } catch (error) {
      console.error('Error getting vehicle group info:', error);
      throw new Error('Failed to get vehicle group information');
    }
  }

  /**
   * Calculate pricing based on group daily rate and rental period
   */
  static calculatePricing(
    dailyRate: number,
    pickUpDate: string,
    dropOffDate: string
  ): PricingCalculation | null {
    try {
      if (!pickUpDate || !dropOffDate || dailyRate <= 0) {
        return null;
      }

      const startDate = new Date(pickUpDate);
      const endDate = new Date(dropOffDate);
      
      // Debug logging
      console.log('Date calculation:', {
        pickUpDate,
        dropOffDate,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        comparison: startDate > endDate
      });
      
      // Allow same-day rentals - only reject if dropoff is actually before pickup
      if (startDate > endDate) {
        console.error('Date validation failed:', { startDate, endDate, pickUpDate, dropOffDate });
        throw new Error('Drop off date cannot be before pick up date');
      }

      // Calculate number of days
      const diffTime = endDate.getTime() - startDate.getTime();
      const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // For same-day rentals (diffTime = 0), set to 1 day
      const numberOfDays = calculatedDays === 0 ? 1 : Math.max(1, calculatedDays);

      console.log('Days calculation:', {
        diffTime,
        calculatedDays,
        finalDays: numberOfDays
      });

      // Calculate total hire charge
      const totalHireCharge = dailyRate * numberOfDays;

      return {
        dailyRate,
        numberOfDays,
        totalHireCharge,
        groupName: '',
        groupId: ''
      };
    } catch (error) {
      console.error('Error calculating pricing:', error);
      throw error;
    }
  }

  /**
   * Get complete pricing calculation for a registration and date range
   */
  static async getCompletePricingCalculation(
    registration: string,
    pickUpDate: string,
    dropOffDate: string
  ): Promise<{
    success: boolean;
    vehicleInfo: VehicleGroupInfo;
    pricing: PricingCalculation | null;
    error?: string;
  }> {
    try {
      // Get vehicle and group information
      const vehicleInfo = await this.getVehicleGroupInfo(registration);
      
      if (!vehicleInfo.vehicle) {
        return {
          success: false,
          vehicleInfo,
          pricing: null,
          error: `Vehicle with registration "${registration}" not found in fleet`
        };
      }

      if (!vehicleInfo.group) {
        return {
          success: false,
          vehicleInfo,
          pricing: null,
          error: `Vehicle "${registration}" is not assigned to any group. Please assign it in Settings.`
        };
      }

      // If no dates provided, return success with vehicle info but no pricing
      if (!pickUpDate || !dropOffDate) {
        return {
          success: true,
          vehicleInfo,
          pricing: null
        };
      }

      if (!vehicleInfo.group.dailyRate || vehicleInfo.group.dailyRate <= 0) {
        return {
          success: false,
          vehicleInfo,
          pricing: null,
          error: `Group "${vehicleInfo.group.name}" has no daily rate set. Please update pricing in Settings.`
        };
      }

      // Calculate pricing
      const pricing = this.calculatePricing(
        vehicleInfo.group.dailyRate,
        pickUpDate,
        dropOffDate
      );

      if (!pricing) {
        return {
          success: false,
          vehicleInfo,
          pricing: null,
          error: 'Unable to calculate pricing. Please check your dates.'
        };
      }

      // Add group information to pricing
      pricing.groupName = vehicleInfo.group.name;
      pricing.groupId = vehicleInfo.group.id!;

      return {
        success: true,
        vehicleInfo,
        pricing
      };
    } catch (error) {
      console.error('Error getting complete pricing calculation:', error);
      return {
        success: false,
        vehicleInfo: { vehicle: null, group: null, assignment: null },
        pricing: null,
        error: error instanceof Error ? error.message : 'Failed to calculate pricing'
      };
    }
  }

  /**
   * Validate rental dates
   */
  static validateRentalDates(pickUpDate: string, dropOffDate: string): {
    valid: boolean;
    error?: string;
    days?: number;
  } {
    if (!pickUpDate || !dropOffDate) {
      return {
        valid: false,
        error: 'Both pick up and drop off dates are required'
      };
    }

    const startDate = new Date(pickUpDate);
    const endDate = new Date(dropOffDate);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        valid: false,
        error: 'Invalid date format'
      };
    }

    // Check if drop off is same day or later (allow same-day rentals)
    if (startDate > endDate) {
      return {
        valid: false,
        error: 'Drop off date cannot be before pick up date'
      };
    }

    // Calculate days - minimum 1 day even for same-day rentals
    const diffTime = endDate.getTime() - startDate.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Check for reasonable rental period (not more than 1 year)
    if (days > 365) {
      return {
        valid: false,
        error: 'Rental period cannot exceed 365 days'
      };
    }

    return {
      valid: true,
      days
    };
  }

  /**
   * Format pricing display for UI
   */
  static formatPricingDisplay(pricing: PricingCalculation): string {
    return `${pricing.numberOfDays} days × £${pricing.dailyRate.toFixed(2)} = £${pricing.totalHireCharge.toFixed(2)}`;
  }

  /**
   * Get pricing suggestions for different rental periods
   */
  static getPricingSuggestions(group: VehicleGroup, days: number): {
    daily: number;
    hourly?: number;
    weekly?: number;
    monthly?: number;
    recommended: 'daily' | 'hourly' | 'weekly' | 'monthly';
    savings?: number;
  } {
    const dailyTotal = group.dailyRate * days;
    const suggestions: any = {
      daily: dailyTotal,
      recommended: 'daily'
    };

    // Add hourly if available and rental is short
    if (group.hourlyRate > 0 && days === 1) {
      const hourlyTotal = group.hourlyRate * 24; // Assume 24 hours for full day
      suggestions.hourly = hourlyTotal;
      if (hourlyTotal < dailyTotal) {
        suggestions.recommended = 'hourly';
        suggestions.savings = dailyTotal - hourlyTotal;
      }
    }

    // Add weekly if available and rental is 7+ days
    if (group.weeklyRate > 0 && days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      const weeklyTotal = (weeks * group.weeklyRate) + (remainingDays * group.dailyRate);
      suggestions.weekly = weeklyTotal;
      if (weeklyTotal < dailyTotal) {
        suggestions.recommended = 'weekly';
        suggestions.savings = dailyTotal - weeklyTotal;
      }
    }

    // Add monthly if available and rental is 30+ days
    if (group.monthlyRate > 0 && days >= 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      const monthlyTotal = (months * group.monthlyRate) + (remainingDays * group.dailyRate);
      suggestions.monthly = monthlyTotal;
      if (monthlyTotal < dailyTotal) {
        suggestions.recommended = 'monthly';
        suggestions.savings = dailyTotal - monthlyTotal;
      }
    }

    return suggestions;
  }
}