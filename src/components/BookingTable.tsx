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
    // Handle null, undefined, or empty values
    if (amount === null || amount === undefined) return '-';
    // Handle zero and positive values
    if (typeof amount === 'number') {
      return `£${amount.toFixed(2)}`;
    }
    return '-';
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
      <span className="text-gray-600 ml-1 text-xs">↑</span> : 
      <span className="text-gray-600 ml-1 text-xs">↓</span>;
  };

  const getCellContent = (booking: Booking, columnKey: ColumnKey) => {
    switch (columnKey) {
      case 'bookingConfirmationDate':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatDate(booking.bookingConfirmationDate)}
          </div>
        );
      case 'supplier':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {booking.supplier || '-'}
          </div>
        );
      case 'reference':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {booking.reference || '-'}
          </div>
        );
      case 'coastrReference':
        return (
          <div className="text-xs font-medium text-gray-900 text-center whitespace-nowrap">
            {booking.coastrReference || '-'}
          </div>
        );
      case 'sageInv':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {booking.sageInv || '-'}
          </div>
        );
      case 'notes':
        return (
          <div className="text-xs text-gray-600 max-w-32 truncate text-center mx-auto" 
               title={booking.notes || '-'}>
            {booking.notes || '-'}
          </div>
        );
      case 'customerName':
        return (
          <div className="text-xs text-gray-900 max-w-32 truncate text-center mx-auto" 
               title={booking.customerName || '-'}>
            {booking.customerName || '-'}
          </div>
        );
      case 'phoneNumber':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {booking.phoneNumber || '-'}
          </div>
        );
      case 'group':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {booking.group || '-'}
          </div>
        );
      case 'registration':
        return (
          <div className="text-xs font-medium text-gray-900 text-center whitespace-nowrap">
            {booking.registration || '-'}
          </div>
        );
      case 'makeModel':
        return (
          <div className="text-xs text-gray-600 max-w-32 truncate text-center mx-auto" 
               title={booking.makeModel || (booking.make && booking.model ? `${booking.make} ${booking.model}` : booking.make || booking.model || '-')}>
            {booking.makeModel || (booking.make && booking.model ? `${booking.make} ${booking.model}` : booking.make || booking.model || '-')}
          </div>
        );
      case 'pickUpDate':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatDate(booking.pickUpDate)}
          </div>
        );
      case 'pickUpTime':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {booking.pickUpTime || '-'}
          </div>
        );
      case 'pickUpLocation':
        return (
          <div className="text-xs text-gray-600 max-w-32 truncate text-center mx-auto" 
               title={booking.pickUpLocation || '-'}>
            {booking.pickUpLocation || '-'}
          </div>
        );
      case 'dropOffDate':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatDate(booking.dropOffDate)}
          </div>
        );
      case 'dropOffTime':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {booking.dropOffTime || '-'}
          </div>
        );
      case 'dropOffLocation':
        return (
          <div className="text-xs text-gray-600 max-w-32 truncate text-center mx-auto" 
               title={booking.dropOffLocation || '-'}>
            {booking.dropOffLocation || '-'}
          </div>
        );
      case 'noOfDays':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {booking.noOfDays || '-'}
          </div>
        );
      case 'hireChargeInclVat':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatCurrency(booking.hireChargeInclVat)}
          </div>
        );
      case 'insurance':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatCurrency(booking.insurance)}
          </div>
        );
      case 'additionalIncome':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatCurrency(booking.additionalIncome)}
          </div>
        );
      case 'additionalIncomeReason':
        return (
          <div className="text-xs text-gray-600 max-w-32 truncate text-center mx-auto" 
               title={booking.additionalIncomeReason || '-'}>
            {booking.additionalIncomeReason || '-'}
          </div>
        );
      case 'extras':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatCurrency(booking.extras)}
          </div>
        );
      case 'extrasType':
        return (
          <div className="text-xs text-gray-600 max-w-28 truncate text-center mx-auto" 
               title={booking.extrasType || '-'}>
            {booking.extrasType || '-'}
          </div>
        );
      case 'depositToBeCollectedAtBranch':
        return (
          <div className="text-xs text-orange-700 text-center font-semibold whitespace-nowrap">
            {formatCurrency(booking.depositToBeCollectedAtBranch)}
          </div>
        );
      case 'chargesIncome':
        return (
          <div className="text-xs text-center whitespace-nowrap">
            {formatCurrency(booking.chargesIncome)}
          </div>
        );
      case 'paidToUs':
        return (
          <div className="text-xs text-green-800 text-center font-semibold whitespace-nowrap">
            {formatCurrency(booking.paidToUs)}
          </div>
        );
      case 'deposit':
        return (
          <div className="text-xs text-yellow-700 text-center whitespace-nowrap">
            {formatCurrency(booking.deposit)}
          </div>
        );
      case 'returnedDate':
        return (
          <div className="text-xs text-gray-600 text-center whitespace-nowrap">
            {formatReturnedDate(booking.returnedDate)}
          </div>
        );
      case 'comments':
        return (
          <div className="text-xs text-gray-600 max-w-40 truncate text-center mx-auto" 
               title={booking.comments || '-'}>
            {booking.comments || '-'}
          </div>
        );
      case 'actions':
        return (
          <div className="flex space-x-1 justify-center items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(booking);
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
              title="Edit booking details"
            >
              Edit
            </button>
            {/* Conditional Mark Returned Button */}
            {(() => {
              // Only show if deposit exists, is greater than 0, and hasn't been returned
              const hasDeposit = booking.depositToBeCollectedAtBranch && 
                                booking.depositToBeCollectedAtBranch > 0;
              const notReturned = !booking.returnedDate || booking.returnedDate === '';
              
              if (hasDeposit && notReturned) {
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDepositReturned(booking);
                    }}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-200 whitespace-nowrap"
                    title="Mark deposit as returned to customer"
                  >
                    Mark Returned
                  </button>
                );
              }
              return null;
            })()}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this booking?')) {
                  onDelete(booking.id);
                }
              }}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200"
              title="Delete this booking"
            >
              Delete
            </button>
          </div>
        );
      default:
        return <div className="text-xs text-gray-500 text-center">-</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table Container with Horizontal Scroll */}
      <div className={`overflow-x-auto ${viewMode === 'detailed' ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
        <table className={`w-full ${viewMode === 'detailed' ? 'min-w-[2000px]' : 'min-w-full'}`}>
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable && column.key !== 'actions' && onSort(column.key as keyof Booking)}
                  className={`px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap ${
                    column.sortable && column.key !== 'actions' 
                      ? 'cursor-pointer hover:bg-indigo-100 transition-colors duration-200 select-none'
                      : ''
                  } ${viewMode === 'summary' ? 'text-center' : 'text-center'}`}
                  style={viewMode === 'detailed' ? { 
                    minWidth: getColumnWidth(column.key),
                    width: getColumnWidth(column.key)
                  } : undefined}
                >
                  <div className="flex items-center justify-center">
                    <span>{column.label}</span>
                    {column.sortable && column.key !== 'actions' && (
                      <SortIcon field={column.key as keyof Booking} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
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
                    className="px-3 py-2 align-middle"
                    style={viewMode === 'detailed' ? { 
                      minWidth: getColumnWidth(column.key),
                      width: getColumnWidth(column.key)
                    } : undefined}
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

// Helper function to determine column widths for detailed view
function getColumnWidth(columnKey: ColumnKey): string {
  const widthMap: Record<string, string> = {
    bookingConfirmationDate: '120px',
    supplier: '100px',
    reference: '100px',
    coastrReference: '110px',
    sageInv: '100px',
    notes: '140px',
    customerName: '140px',
    phoneNumber: '120px',
    group: '100px',
    registration: '100px',
    makeModel: '140px',
    pickUpDate: '110px',
    pickUpTime: '90px',
    pickUpLocation: '140px',
    dropOffDate: '110px',
    dropOffTime: '90px',
    dropOffLocation: '140px',
    noOfDays: '80px',
    hireChargeInclVat: '110px',
    insurance: '90px',
    additionalIncome: '110px',
    additionalIncomeReason: '140px',
    extras: '80px',
    extrasType: '120px',
    depositToBeCollectedAtBranch: '120px',
    chargesIncome: '110px',
    paidToUs: '100px',
    deposit: '80px',
    returnedDate: '120px',
    comments: '160px',
    actions: '180px' // Increased width for "Mark Returned" button
  };
  
  return widthMap[columnKey as string] || '100px';
}