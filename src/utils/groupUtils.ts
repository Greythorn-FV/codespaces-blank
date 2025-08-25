// src/utils/groupUtils.ts

import { VehicleGroup } from '@/types/groups';

export class GroupUtils {
  
  // Format currency with proper GBP formatting
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Validate pricing data
  static validatePricing(pricing: {
    hourlyRate: number;
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (pricing.hourlyRate < 0) {
      errors.push('Hourly rate cannot be negative');
    }
    if (pricing.dailyRate < 0) {
      errors.push('Daily rate cannot be negative');
    }
    if (pricing.weeklyRate < 0) {
      errors.push('Weekly rate cannot be negative');
    }
    if (pricing.monthlyRate < 0) {
      errors.push('Monthly rate cannot be negative');
    }

    // Logical validation - weekly should be less than monthly
    if (pricing.weeklyRate > pricing.monthlyRate && pricing.monthlyRate > 0) {
      errors.push('Weekly rate should not exceed monthly rate');
    }

    // Daily rate should make sense compared to hourly
    if (pricing.dailyRate > 0 && pricing.hourlyRate > 0) {
      const maxDailyFromHourly = pricing.hourlyRate * 24;
      if (pricing.dailyRate > maxDailyFromHourly * 1.5) { // Allow some flexibility
        errors.push('Daily rate seems unusually high compared to hourly rate');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Calculate suggested pricing based on base rate
  static calculateSuggestedPricing(baseHourlyRate: number): {
    hourlyRate: number;
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
  } {
    return {
      hourlyRate: baseHourlyRate,
      dailyRate: Math.round(baseHourlyRate * 8), // 8-hour day
      weeklyRate: Math.round(baseHourlyRate * 8 * 5), // 5-day week with 10% discount
      monthlyRate: Math.round(baseHourlyRate * 8 * 20) // 20-day month with 15% discount
    };
  }

  // Get group status color classes
  static getStatusColorClasses(status: 'active' | 'inactive'): {
    badgeClasses: string;
    dotClasses: string;
  } {
    if (status === 'active') {
      return {
        badgeClasses: 'bg-green-100 text-green-800',
        dotClasses: 'bg-green-400'
      };
    }
    return {
      badgeClasses: 'bg-gray-100 text-gray-800',
      dotClasses: 'bg-gray-400'
    };
  }

  // Sort groups by various criteria
  static sortGroups(
    groups: VehicleGroup[], 
    sortBy: 'name' | 'vehicleCount' | 'dailyRate' | 'status' = 'name',
    direction: 'asc' | 'desc' = 'asc'
  ): VehicleGroup[] {
    const sorted = [...groups].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'vehicleCount':
          comparison = a.vehicleCount - b.vehicleCount;
          break;
        case 'dailyRate':
          comparison = a.dailyRate - b.dailyRate;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }

  // Filter groups by search term
  static filterGroups(groups: VehicleGroup[], searchTerm: string): VehicleGroup[] {
    if (!searchTerm.trim()) {
      return groups;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return groups.filter(group =>
      group.name.toLowerCase().includes(term) ||
      group.status.toLowerCase().includes(term)
    );
  }

  // Get pricing summary for a group
  static getPricingSummary(group: VehicleGroup): {
    hasRates: boolean;
    lowestRate: number;
    highestRate: number;
    averageRate: number;
  } {
    const rates = [group.hourlyRate, group.dailyRate, group.weeklyRate, group.monthlyRate];
    const nonZeroRates = rates.filter(rate => rate > 0);
    
    if (nonZeroRates.length === 0) {
      return {
        hasRates: false,
        lowestRate: 0,
        highestRate: 0,
        averageRate: 0
      };
    }
    
    return {
      hasRates: true,
      lowestRate: Math.min(...nonZeroRates),
      highestRate: Math.max(...nonZeroRates),
      averageRate: nonZeroRates.reduce((sum, rate) => sum + rate, 0) / nonZeroRates.length
    };
  }

  // Validate group name
  static validateGroupName(name: string, existingGroups: VehicleGroup[], excludeId?: string): {
    valid: boolean;
    error?: string;
  } {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return { valid: false, error: 'Group name is required' };
    }
    
    if (trimmedName.length < 3) {
      return { valid: false, error: 'Group name must be at least 3 characters long' };
    }
    
    if (trimmedName.length > 100) {
      return { valid: false, error: 'Group name must be less than 100 characters' };
    }
    
    // Check for duplicate names
    const duplicate = existingGroups.find(group => 
      group.name.toLowerCase() === trimmedName.toLowerCase() && 
      group.id !== excludeId
    );
    
    if (duplicate) {
      return { valid: false, error: 'A group with this name already exists' };
    }
    
    return { valid: true };
  }

  // Get default group names from the provided list
  static getDefaultGroupNames(): string[] {
    return [
      'STND MONOSOF 7 SEAT AUTO',
      'MEDIUM 4X4 MANUAL',
      'SHORT WHEEL BASE VAN MAN',
      'MID - SIZE CROSSOVER AUTO',
      'SMALL HATCHBACK AUTO',
      'MEDIUM 4X4 AUTO',
      'MEDIUM 4X4 PREMIUM AUTO',
      'CITY CAR AUTO',
      'MEDIUM WHEEL BASE VAN',
      'MPV AUTO 8 SEAT PREMIUM',
      'DOUBLE CAB PICK UP',
      'LONG WHEEL BASE ELECTRIC',
      'COMPACT/WAC MAN 7 SEAT',
      'LONG WHEEL BASE VAN',
      'MPV AUTO 9 SEAT',
      'MPV MANUAL 17 MANUAL',
      'LOW LOADER - LLD',
      'ESTATE AUTO',
      'SMALL VAN',
      'CREW CAB 5 SEAT MAN',
      'MID - SIZE CROSSOVER MAN',
      'SINGLE CAB TIPPER',
      'LUTON BOX VAN TAIL LIFT',
      'LWB REFRIGERTED VAN',
      'SWB REFRIGERTED VAN',
      'EX LONG WHEEL BASE',
      'SHORT WHEEL BASE VAN AUTO',
      'MPV MANUAL 14 SEAT',
      'MPV MANUAL 11 SEAT',
      'MPV AUTO 8 SEAT',
      'STND MONOSOF 7 SEAT AUTO',
      'STND MONOSOF 7 SEAT MAN',
      'CREW CAB 5 SEAT AUTO',
      'CREW CAB 5 SEAT AUTO',
      'STANDARD 4X4 AUTO',
      'COMPACT CROSSOVER AUTO',
      'COMPACT CROSSOVER MANUAL',
      'SMALL HATCHBACK PREMIUM AUTO',
      'SMALL HATCHBACK MAN',
      'CITY CAR MANUAL',
      'EXECUTIVE LARGE 4X4 - EXCL4'
    ];
  }

  // Generate group statistics
  static generateGroupStatistics(groups: VehicleGroup[]): {
    totalGroups: number;
    activeGroups: number;
    inactiveGroups: number;
    totalAssignedVehicles: number;
    averageDailyRate: number;
    groupsWithoutPricing: number;
    groupsWithoutVehicles: number;
  } {
    const activeGroups = groups.filter(g => g.status === 'active');
    const groupsWithRates = groups.filter(g => g.dailyRate > 0);
    const totalDailyRate = groupsWithRates.reduce((sum, g) => sum + g.dailyRate, 0);
    
    return {
      totalGroups: groups.length,
      activeGroups: activeGroups.length,
      inactiveGroups: groups.length - activeGroups.length,
      totalAssignedVehicles: groups.reduce((sum, g) => sum + g.vehicleCount, 0),
      averageDailyRate: groupsWithRates.length > 0 ? totalDailyRate / groupsWithRates.length : 0,
      groupsWithoutPricing: groups.filter(g => g.dailyRate === 0).length,
      groupsWithoutVehicles: groups.filter(g => g.vehicleCount === 0).length
    };
  }
}