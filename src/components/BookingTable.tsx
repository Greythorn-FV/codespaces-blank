// src/components/BookingTable.tsx

'use client';

import { Booking } from '@/types/bookings';
import { format } from 'date-fns';

interface BookingTableProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onSort: (field: keyof Booking) => void;
  sortField: keyof Booking;
  sortDirection: 'asc' | 'desc';
}

export default function BookingTable({
  bookings,
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortDirection
}: BookingTableProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const formatDateTime = (date: Date | null | undefined, time?: string) => {
    if (!date) return '-';
    const dateStr = format(new Date(date), 'dd/MM/yyyy');
    return time ? `${dateStr} ${time}` : dateStr;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return `£${amount.toFixed(2)}`;
  };

  const SortIcon = ({ field }: { field: keyof Booking }) => {
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
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <tr>
              <th
                onClick={() => onSort('bookingConfirmationDate')}
                className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Booking Date
                  <SortIcon field="bookingConfirmationDate" />
                </div>
              </th>
              <th
                onClick={() => onSort('coastrReference')}
                className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Coastr Ref
                  <SortIcon field="coastrReference" />
                </div>
              </th>
              <th
                onClick={() => onSort('customerName')}
                className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Customer
                  <SortIcon field="customerName" />
                </div>
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Phone
              </th>
              <th
                onClick={() => onSort('registration')}
                className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Vehicle
                  <SortIcon field="registration" />
                </div>
              </th>
              <th
                onClick={() => onSort('pickupDate')}
                className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Pickup
                  <SortIcon field="pickupDate" />
                </div>
              </th>
              <th
                onClick={() => onSort('dropoffDate')}
                className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none"
              >
                <div className="flex items-center">
                  Drop-off
                  <SortIcon field="dropoffDate" />
                </div>
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Days
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Hire Charge
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Paid To Us
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {bookings.map((booking, index) => (
              <tr 
                key={booking.id} 
                className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(booking.bookingConfirmationDate)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md inline-block">
                    {booking.coastrReference}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {booking.customerName}
                  </div>
                  {booking.accountsInvoiceRef && (
                    <div className="text-xs text-gray-500">
                      Inv: {booking.accountsInvoiceRef}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {booking.phoneNumber}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md inline-block">
                    {booking.registration}
                  </div>
                  {(booking.make || booking.model) && (
                    <div className="text-xs text-gray-600 mt-1">
                      {booking.make} {booking.model}
                    </div>
                  )}
                  {booking.vehicleGroup && (
                    <div className="text-xs text-purple-600 bg-purple-100 px-1 py-0.5 rounded mt-1 inline-block">
                      {booking.vehicleGroup}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDateTime(booking.pickupDate, booking.pickupTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.pickupLocation}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDateTime(booking.dropoffDate, booking.dropoffTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.dropoffLocation}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.noOfDays || '-'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(booking.hireChargeInclVat)}
                  </div>
                  {booking.insurance && (
                    <div className="text-xs text-gray-500">
                      Ins: {formatCurrency(booking.insurance)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-blue-600">
                    {formatCurrency(booking.paidToUs)}
                  </div>
                  {booking.depositReturnedDate && (
                    <div className="text-xs text-green-600">
                      Deposit returned: {formatDate(booking.depositReturnedDate)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => onEdit(booking)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 shadow-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => booking.id && onDelete(booking.id)}
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