// src/components/VehicleTable.tsx

'use client';

import { Vehicle } from '@/types/fleet';
import { format } from 'date-fns';

interface VehicleTableProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onSort: (field: keyof Vehicle) => void;
  sortField: keyof Vehicle;
  sortDirection: 'asc' | 'desc';
}

export default function VehicleTable({
  vehicles,
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortDirection
}: VehicleTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rented':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'retired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const isExpiringSoon = (date: Date | null | undefined) => {
    if (!date) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(date) <= thirtyDaysFromNow;
  };

  const SortIcon = ({ field }: { field: keyof Vehicle }) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return sortDirection === 'asc' ? 
      <span className="text-indigo-600 ml-1">↑</span> : 
      <span className="text-indigo-600 ml-1">↓</span>;
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th
                onClick={() => onSort('registration')}
                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Registration
                  <SortIcon field="registration" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                VIN Number
              </th>
              <th
                onClick={() => onSort('make')}
                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Make
                  <SortIcon field="make" />
                </div>
              </th>
              <th
                onClick={() => onSort('model')}
                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Model
                  <SortIcon field="model" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Colour
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Size
              </th>
              <th
                onClick={() => onSort('motExpiry')}
                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  MOT Expiry
                  <SortIcon field="motExpiry" />
                </div>
              </th>
              <th
                onClick={() => onSort('taxExpiry')}
                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Tax Expiry
                  <SortIcon field="taxExpiry" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Comments
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {vehicles.map((vehicle, index) => (
              <tr 
                key={vehicle.id} 
                className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                    {vehicle.registration}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                  {vehicle.vinNumber || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {vehicle.make}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                  {vehicle.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {vehicle.colour || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md capitalize">
                    {vehicle.size || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    isExpiringSoon(vehicle.motExpiry) 
                      ? 'text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200' 
                      : 'text-gray-600'
                  }`}>
                    {formatDate(vehicle.motExpiry)}
                    {isExpiringSoon(vehicle.motExpiry) && ' ⚠️'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    isExpiringSoon(vehicle.taxExpiry) 
                      ? 'text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200' 
                      : 'text-gray-600'
                  }`}>
                    {formatDate(vehicle.taxExpiry)}
                    {isExpiringSoon(vehicle.taxExpiry) && ' ⚠️'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    getStatusColor(vehicle.status)
                  }`}>
                    {vehicle.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="max-w-xs truncate" title={vehicle.comments || undefined}>
                    {vehicle.comments || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(vehicle)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 shadow-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => vehicle.id && onDelete(vehicle.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 shadow-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}