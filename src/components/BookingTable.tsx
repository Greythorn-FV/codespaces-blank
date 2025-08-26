// src/components/BookingTable.tsx

'use client';

import { Booking } from '@/types/bookings';
import { format } from 'date-fns';
import { getColumnsForView, type ColumnKey } from './BookingTableColumns';

interface BookingTableProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onDepositReturned: (booking: Booking) => void;
  onSort: (field: keyof Booking) => void;
  sortField: keyof Booking;
  sortDirection: 'asc' | 'desc';
  viewMode: 'summary' | 'detailed';
}

export default function BookingTable({
  bookings,
  onEdit,
  onDelete,
  onDepositReturned,
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

  const handleRowClick = (booking: Booking, columnKey: ColumnKey, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on action buttons
    if (columnKey === 'actions') return;
    
    // Don't trigger if clicking on a button or link
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;
    
    onEdit(booking);
  };

  const SortIcon = ({ field }: { field: keyof Booking }) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1 text-xs">⇅</span>;
    }
    return sortDirection === 'asc' ? 
      <span className="text-indigo-600 ml-1 text-xs">↑</span> : 
      <span className="text-indigo-600 ml-1 text-xs">↓</span>;
  };

  const getCellContent = (booking: Booking, columnKey: ColumnKey) => {
    switch (columnKey) {
      case 'bookingConfirmationDate':
        return (
          <div className="text-xs font-medium text-gray-800 text-center">
            {formatDate(booking.bookingConfirmationDate)}
          </div>
        );
      case 'supplier':
        return (
          <div className="text-xs text-gray-600 text-center">
            {booking.supplier || '-'}
          </div>
        );
      case 'reference':
        return (
          <div className="text-xs text-gray-600 text-center">
            {booking.reference || '-'}
          </div>
        );
      case 'coastrReference':
        return (
          <div className="flex justify-center">
            <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              {booking.coastrReference}
            </div>
          </div>
        );
      case 'sageInv':
        return (
          <div className="text-xs text-gray-600 text-center">
            {booking.sageInv || '-'}
          </div>
        );
      case 'notes':
        return (
          <div className="text-xs text-gray-600 max-w-24 truncate text-center mx-auto" title={booking.notes || '-'}>
            {booking.notes || '-'}
          </div>
        );
      case 'customerName':
        return (
          <div className="text-xs font-medium text-gray-800 text-center">
            {booking.customerName}
          </div>
        );
      case 'phoneNumber':
        return (
          <div className="text-xs text-gray-600 text-center">
            {booking.phoneNumber}
          </div>
        );
      case 'group':
        return (
          <div className="flex justify-center">
            <div className="text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
              {booking.group || 'Unassigned'}
            </div>
          </div>
        );
      case 'registration':
        return (
          <div className="flex justify-center">
            <div className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              {booking.registration}
            </div>
          </div>
        );
      case 'makeModel':
        return (
          <div className="text-xs text-gray-700 text-center">
            {booking.makeModel || `${booking.make || ''} ${booking.model || ''}`.trim() || '-'}
          </div>
        );
      case 'pickUpDate':
        return (
          <div className="text-xs text-gray-700 text-center">
            {formatDate(booking.pickUpDate)}
          </div>
        );
      case 'pickUpTime':
        return (
          <div className="text-xs text-gray-600 text-center">
            {booking.pickUpTime || '-'}
          </div>
        );
      case 'pickUpLocation':
        return (
          <div className="text-xs text-gray-600 max-w-24 truncate text-center mx-auto" title={booking.pickUpLocation || '-'}>
            {booking.pickUpLocation || '-'}
          </div>
        );
      case 'dropOffDate':
        return (
          <div className="text-xs text-gray-700 text-center">
            {formatDate(booking.dropOffDate)}
          </div>
        );
      case 'dropOffTime':
        return (
          <div className="text-xs text-gray-600 text-center">
            {booking.dropOffTime || '-'}
          </div>
        );
      case 'dropOffLocation':
        return (
          <div className="text-xs text-gray-600 max-w-24 truncate text-center mx-auto" title={booking.dropOffLocation || '-'}>
            {booking.dropOffLocation || '-'}
          </div>
        );
      case 'noOfDays':
        return (
          <div className="flex justify-center">
            <div className="text-xs font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
              {booking.noOfDays || '-'}
            </div>
          </div>
        );
      case 'hireChargeInclVat':
        return (
          <div className="text-xs font-medium text-green-700 text-center">
            {formatCurrency(booking.hireChargeInclVat)}
          </div>
        );
      case 'insurance':
        return (
          <div className="text-xs text-gray-700 text-center">
            {formatCurrency(booking.insurance)}
          </div>
        );
      case 'additionalIncome':
        return (
          <div className="text-xs text-gray-700 text-center">
            {formatCurrency(booking.additionalIncome)}
          </div>
        );
      case 'additionalIncomeReason':
        return (
          <div className="text-xs text-gray-600 max-w-24 truncate text-center mx-auto" title={booking.additionalIncomeReason || '-'}>
            {booking.additionalIncomeReason || '-'}
          </div>
        );
      case 'extras':
        return (
          <div className="text-xs text-gray-700 text-center">
            {formatCurrency(booking.extras)}
          </div>
        );
      case 'extrasType':
        return (
          <div className="text-xs text-gray-600 max-w-24 truncate text-center mx-auto" title={booking.extrasType || '-'}>
            {booking.extrasType || '-'}
          </div>
        );
      case 'depositToBeCollectedAtBranch':
        return (
          <div className="text-xs text-gray-700 text-center">
            {formatCurrency(booking.depositToBeCollectedAtBranch)}
          </div>
        );
      case 'chargesIncome':
        return (
          <div className="text-xs text-gray-700 text-center">
            {formatCurrency(booking.chargesIncome)}
          </div>
        );
      case 'paidToUs':
        return (
          <div className="flex justify-center">
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {formatCurrency(booking.paidToUs)}
            </div>
          </div>
        );
      case 'returnedDate':
        return (
          <div className="text-xs text-center">
            {booking.returnedDate ? (
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-green-700">✅ Returned</div>
                <div className="text-xs text-green-600">
                  {formatReturnedDate(booking.returnedDate)}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-orange-700">⏳ Pending</div>
                <div className="text-xs text-orange-600">Not returned</div>
              </div>
            )}
          </div>
        );
      case 'comments':
        return (
          <div className="text-xs text-gray-600 max-w-32 truncate text-center mx-auto" title={booking.comments || '-'}>
            {booking.comments || '-'}
          </div>
        );
      case 'actions':
        return (
          <div className="flex flex-col space-y-1 items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(booking);
              }}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors duration-200"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDepositReturned(booking);
              }}
              className={`text-xs font-medium transition-colors duration-200 ${
                booking.returnedDate 
                  ? 'text-green-600 hover:text-green-800' 
                  : 'text-orange-600 hover:text-orange-800'
              }`}
            >
              {booking.returnedDate ? 'Update Return' : 'Deposit Return'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                booking.id && onDelete(booking.id);
              }}
              className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        );
      default:
        return <div className="text-xs">-</div>;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable && column.key !== 'actions' && onSort(column.key as keyof Booking)}
                  className={`px-1 py-1.5 text-center text-xs font-bold text-gray-600 uppercase tracking-tight ${
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
                className={`cursor-pointer hover:bg-indigo-50 transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    onClick={(e) => handleRowClick(booking, column.key, e)}
                    className={`px-1 py-1.5 text-center ${column.key === 'actions' ? 'whitespace-nowrap' : ''}`}
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