// src/components/AssignedVehicleList.tsx

'use client';

import { GroupAssignment } from '@/types/groups';

interface AssignedVehicleListProps {
  assignments: GroupAssignment[];
  onRemoveVehicle: (vehicleId: string, registration: string) => void;
}

export default function AssignedVehicleList({ 
  assignments, 
  onRemoveVehicle 
}: AssignedVehicleListProps) {
  
  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-sm">No vehicles assigned to this group yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Use the search box to add vehicles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {assignment.registration}
            </div>
            <div className="text-xs text-gray-500">
              Assigned on {assignment.assignedAt.toLocaleDateString()}
            </div>
          </div>
          
          <button
            onClick={() => onRemoveVehicle(assignment.vehicleId, assignment.registration)}
            className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 group"
            title={`Remove ${assignment.registration} from group`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform duration-200">
              🗑️
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}