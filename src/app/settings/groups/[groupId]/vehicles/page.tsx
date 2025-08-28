// src/app/settings/groups/[groupId]/vehicles/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VehicleGroup, GroupAssignment } from '@/types/groups';
import { Vehicle } from '@/types/fleet';
import { GroupService } from '@/services/groupService';
import { GroupAssignmentService } from '@/services/groupAssignmentService';
import { VehicleService } from '@/services/vehicleService';
import VehicleDropdown from '@/components/VehicleDropdown';
import AssignedVehicleList from '@/components/AssignedVehicleList';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

function VehicleAssignmentPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<VehicleGroup | null>(null);
  const [assignedVehicles, setAssignedVehicles] = useState<GroupAssignment[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [unassignedVehicles, setUnassignedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load group details
      const groupData = await GroupService.getGroupById(groupId);
      if (!groupData) {
        toast.error('Group not found');
        router.push('/settings');
        return;
      }
      setGroup(groupData);

      // Load assigned vehicles for this group
      const assignments = await GroupAssignmentService.getVehiclesInGroup(groupId);
      setAssignedVehicles(assignments);

      // Load all vehicles
      const vehiclesResult = await VehicleService.getVehicles(1000); // Get all vehicles
      setAllVehicles(vehiclesResult.vehicles);

      // Get unassigned vehicles
      const unassigned = await GroupAssignmentService.getUnassignedVehicles(vehiclesResult.vehicles);
      setUnassignedVehicles(unassigned);
      
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle vehicle assignment
  const handleAssignVehicle = async (vehicle: Vehicle) => {
    try {
      setAssigning(true);
      await GroupAssignmentService.assignVehicleToGroup(
        groupId,
        group!.name,
        vehicle
      );
      
      toast.success(`${vehicle.registration} assigned to ${group!.name}`);
      setSearchTerm(''); // Clear search
      await loadData(); // Reload data
    } catch (error) {
      toast.error('Failed to assign vehicle');
      console.error(error);
    } finally {
      setAssigning(false);
    }
  };

  // Handle vehicle removal
  const handleRemoveVehicle = async (vehicleId: string, registration: string) => {
    if (!confirm(`Are you sure you want to remove ${registration} from this group?`)) {
      return;
    }

    try {
      await GroupAssignmentService.removeVehicleFromGroup(vehicleId);
      toast.success(`${registration} removed from group`);
      await loadData(); // Reload data
    } catch (error) {
      toast.error('Failed to remove vehicle');
      console.error(error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-600 mb-4">The requested group could not be found.</p>
          <button
            onClick={() => router.push('/settings')}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => router.push('/settings')}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  ← Back to Settings
                </button>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {group.name}
              </h1>
              <p className="text-gray-600 mt-2">Manage vehicle assignments for this group</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{assignedVehicles.length}</div>
              <div className="text-sm text-gray-600">Assigned Vehicles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Vehicle Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Vehicle to Group</h2>
            
            <div className="space-y-4">
              <VehicleDropdown
                vehicles={unassignedVehicles}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onVehicleSelect={handleAssignVehicle}
                loading={assigning}
                placeholder="Type registration number to search..."
              />
              
              {unassignedVehicles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-3xl mb-2">🚗</div>
                  <p>All vehicles are already assigned to groups</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Vehicles Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Assigned Vehicles ({assignedVehicles.length})
            </h2>
            
            <AssignedVehicleList
              assignments={assignedVehicles}
              onRemoveVehicle={handleRemoveVehicle}
            />
          </div>
        </div>

        {/* Group Info Card */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-blue-600">
                £{group.hourlyRate.toFixed(2)}
              </div>
              <div className="text-sm text-blue-600">Hourly Rate</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-green-600">
                £{group.dailyRate.toFixed(2)}
              </div>
              <div className="text-sm text-green-600">Daily Rate</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-purple-600">
                £{group.weeklyRate.toFixed(2)}
              </div>
              <div className="text-sm text-purple-600">Weekly Rate</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-orange-600">
                £{group.monthlyRate.toFixed(2)}
              </div>
              <div className="text-sm text-orange-600">Monthly Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with AuthGuard protection - THIS IS THE KEY ADDITION
export default function ProtectedVehicleAssignmentPage() {
  return (
    <AuthGuard requiredPermission="canManageSettings">
      <VehicleAssignmentPage />
    </AuthGuard>
  );
}