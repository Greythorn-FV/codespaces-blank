// src/components/BookingTable.tsx

'use client';

import { Booking } from '@/types/bookings';
import { format } from 'date-fns';
import { getColumnsForView, type ColumnKey } from './BookingTableColumns';

interface BookingTableProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onDepositReturned: (booking: Booking) => void; // Added this prop
  onSort: (field: keyof Booking) => void;
  sortField: keyof Booking;
  sortDirection: 'asc' | 'desc';
  viewMode: 'summary' | 'detailed';
}

export default function BookingTable({
  bookings,
  onEdit,
  onDelete,
  onDepositReturned, // Added this prop
  onSort,
  sortField,
  sortDirection,
  viewMode
}: BookingTableProps) {
  const columns = getColumnsForView(viewMode);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return '-';
    return `£${amount.toFixed(2)}`;
  };

  const formatReturnedDate = (returnedDate: Date | string | null | undefined) => {
    if (!returnedDate) return '-';
    if (typeof returnedDate === 'string') return returnedDate;
    return format(new Date(returnedDate), 'dd/MM/yyyy');
  };

  const SortIcon = ({ field }: { field: keyof Booking }) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return sortDirection === 'asc' ? 
      <span className="text-indigo-600 ml-1">↑</span> : 
      <span className="text-indigo-600 ml-1">↓</span>;
  };

  const getCellContent = (booking: Booking, columnKey: ColumnKey) => {
    switch (columnKey) {
      case 'bookingConfirmationDate':
        return (
          <div className="text-sm font-medium text-gray-900">
            {formatDate(booking.bookingConfirmationDate)}
          </div>
        );
      case 'supplier':
        return (
          <div className="text-sm text-gray-600">
            {booking.supplier || '-'}
          </div>
        );
      case 'reference':
        return (
          <div className="text-sm text-gray-600">
            {booking.reference || '-'}
          </div>
        );
      case 'coastrReference':
        return (
          <div className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md inline-block">
            {booking.coastrReference}
          </div>
        );
      case 'sageInv':
        return (
          <div className="text-sm text-gray-600">
            {booking.sageInv || '-'}
          </div>
        );
      case 'notes':
        return (
          <div className="text-sm text-gray-600 max-w-32 truncate">
            {booking.notes || '-'}
          </div>
        );
      case 'customerName':
        return (
          <div className="text-sm font-semibold text-gray-900">
            {booking.customerName}
          </div>
        );
      case 'phoneNumber':
        return (
          <div className="text-sm text-gray-600">
            {booking.phoneNumber}
          </div>
        );
      case 'group':
        return (
          <div className="text-sm text-gray-600">
            {booking.group || '-'}
          </div>
        );
      case 'registration':
        return (
          <div className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md inline-block">
            {booking.registration}
          </div>
        );
      case 'makeModel':
        return (
          <div className="text-sm text-gray-600">
            {booking.makeModel || '-'}
          </div>
        );
      case 'pickUpDate':
        return (
          <div className="text-sm text-gray-900">
            {formatDate(booking.pickUpDate)}
          </div>
        );
      case 'pickUpTime':
        return (
          <div className="text-sm text-gray-600">
            {booking.pickUpTime || '-'}
          </div>
        );
      case 'pickUpLocation':
        return (
          <div className="text-sm text-gray-600 max-w-32 truncate">
            {booking.pickUpLocation || '-'}
          </div>
        );
      case 'dropOffDate':
        return (
          <div className="text-sm text-gray-900">
            {formatDate(booking.dropOffDate)}
          </div>
        );
      case 'dropOffTime':
        return (
          <div className="text-sm text-gray-600">
            {booking.dropOffTime || '-'}
          </div>
        );
      case 'dropOffLocation':
        return (
          <div className="text-sm text-gray-600 max-w-32 truncate">
            {booking.dropOffLocation || '-'}
          </div>
        );
      case 'noOfDays':
        return (
          <div className="text-sm font-medium text-gray-900">
            {booking.noOfDays || '-'}
          </div>
        );
      case 'hireChargeInclVat':
        return (
          <div className="text-sm font-medium text-green-600">
            {formatCurrency(booking.hireChargeInclVat)}
          </div>
        );
      case 'insurance':
        return (
          <div className="text-sm text-gray-900">
            {formatCurrency(booking.insurance)}
          </div>
        );
      case 'additionalIncome':
        return (
          <div className="text-sm text-blue-600">
            {formatCurrency(booking.additionalIncome)}
          </div>
        );
      case 'additionalIncomeReason':
        return (
          <div className="text-sm text-gray-600 max-w-32 truncate">
            {booking.additionalIncomeReason || '-'}
          </div>
        );
      case 'extras':
        return (
          <div className="text-sm text-purple-600">
            {formatCurrency(booking.extras)}
          </div>
        );
      case 'extrasType':
        return (
          <div className="text-sm text-gray-600 max-w-32 truncate">
            {booking.extrasType || '-'}
          </div>
        );
      case 'depositToBeCollectedAtBranch':
        return (
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-900">
              {formatCurrency(booking.depositToBeCollectedAtBranch)}
            </div>
            {booking.depositToBeCollectedStatus && (
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                booking.depositToBeCollectedStatus === 'Yes' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {booking.depositToBeCollectedStatus}
              </span>
            )}
          </div>
        );
      case 'chargesIncome':
        return (
          <div className="text-sm text-gray-900">
            {formatCurrency(booking.chargesIncome)}
          </div>
        );
      case 'paidToUs':
        return (
          <div className="text-sm font-bold text-green-700">
            {formatCurrency(booking.paidToUs)}
          </div>
        );
      case 'returnedDate':
        return (
          <div className="text-center">
            {booking.returnedDate ? (
              <div className="space-y-1">
                <div className="text-xs font-medium text-green-800">✅ Returned</div>
                <div className="text-xs text-green-600">
                  {formatReturnedDate(booking.returnedDate)}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs font-medium text-orange-800">⏳ Pending</div>
                <div className="text-xs text-orange-600">Not returned</div>
              </div>
            )}
          </div>
        );
      case 'comments':
        return (
          <div className="text-sm text-gray-600 max-w-32 truncate">
            {booking.comments || '-'}
          </div>
        );
      case 'actions':
        return (
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => onEdit(booking)}
              className="text-indigo-600 hover:text-indigo-900 text-xs font-medium transition-colors duration-200 text-left"
            >
              Edit
            </button>
            <button
              onClick={() => onDepositReturned(booking)}
              className={`text-xs font-medium transition-colors duration-200 text-left ${
                booking.returnedDate 
                  ? 'text-green-600 hover:text-green-800' 
                  : 'text-orange-600 hover:text-orange-800'
              }`}
            >
              {booking.returnedDate ? 'Update Return' : 'Deposit Returned'}
            </button>
            <button
              onClick={() => booking.id && onDelete(booking.id)}
              className="text-red-600 hover:text-red-900 text-xs font-medium transition-colors duration-200 text-left"
            >
              Delete
            </button>
          </div>
        );
      default:
        return <div>-</div>;
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable && column.key !== 'actions' && onSort(column.key as keyof Booking)}
                  className={`px-3 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${
                    column.sortable && column.key !== 'actions'
                      ? 'cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none'
                      : ''
                  }`}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && column.key !== 'actions' && (
                      <SortIcon field={column.key as keyof Booking} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking, index) => (
              <tr
                key={booking.id}
                className={`hover:bg-indigo-50/50 transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={`px-3 py-4 ${column.key === 'actions' ? 'whitespace-nowrap' : ''}`}
                  >
                    {getCellContent(booking, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}