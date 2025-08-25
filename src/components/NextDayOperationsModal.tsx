// src/components/NextDayOperationsModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { NextDayOperations, CheckoutBooking, CheckinBooking } from '@/types/nextDayOperations';
import { NextDayOperationsService } from '@/services/nextDayOperationsService';
import toast from 'react-hot-toast';

interface NextDayOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OperationChecklist {
  documents: boolean;
  hireCharges: boolean;
  deposit: boolean;
}

// Utility functions for better organization
const formatTime = (time: string): string => {
  if (!time) return '-';
  return time;
};

// Sub-components for better separation of concerns
interface TableHeaderProps {
  columns: string[];
}

const TableHeader = ({ columns }: TableHeaderProps) => (
  <thead>
    <tr className="bg-gray-50 border-b border-gray-200">
      {columns.map((column) => (
        <th
          key={column}
          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          {column}
        </th>
      ))}
    </tr>
  </thead>
);

interface CheckoutRowProps {
  checkout: CheckoutBooking;
  index: number;
  date: string;
  checklist: OperationChecklist;
  onChecklistUpdate: (field: keyof OperationChecklist, value: boolean) => void;
}

const CheckoutRow = ({ checkout, index, date, checklist, onChecklistUpdate }: CheckoutRowProps) => (
  <tr className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
    <td className="px-3 py-2 text-xs font-medium text-gray-900">{checkout.coastrReference}</td>
    <td className="px-3 py-2 text-xs text-gray-900 max-w-32 truncate" title={checkout.customerName}>
      {checkout.customerName}
    </td>
    <td className="px-3 py-2 text-xs text-gray-900">{checkout.phoneNumber || '-'}</td>
    <td className="px-3 py-2 text-xs font-medium text-gray-900">{checkout.registration}</td>
    <td className="px-3 py-2 text-xs text-gray-900 max-w-40 truncate" title={checkout.makeModel}>
      {checkout.makeModel || `${checkout.make || ''} ${checkout.model || ''}`.trim() || '-'}
    </td>
    <td className="px-3 py-2 text-xs text-gray-900">{date}</td>
    <td className="px-3 py-2 text-xs font-medium text-gray-900">{formatTime(checkout.pickUpTime)}</td>
    <td className="px-3 py-2 text-xs text-gray-900 max-w-32 truncate" title={checkout.pickUpLocation}>
      {checkout.pickUpLocation || '-'}
    </td>
    <td className="px-3 py-2 text-center">
      <input
        type="checkbox"
        checked={checklist.documents}
        onChange={(e) => onChecklistUpdate('documents', e.target.checked)}
        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
      />
    </td>
    <td className="px-3 py-2 text-center">
      <input
        type="checkbox"
        checked={checklist.hireCharges}
        onChange={(e) => onChecklistUpdate('hireCharges', e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
    </td>
    <td className="px-3 py-2 text-center">
      <input
        type="checkbox"
        checked={checklist.deposit}
        onChange={(e) => onChecklistUpdate('deposit', e.target.checked)}
        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
      />
    </td>
  </tr>
);

interface CheckinRowProps {
  checkin: CheckinBooking;
  index: number;
  date: string;
}

const CheckinRow = ({ checkin, index, date }: CheckinRowProps) => (
  <tr className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
    <td className="px-3 py-2 text-xs font-medium text-gray-900">{checkin.coastrReference}</td>
    <td className="px-3 py-2 text-xs text-gray-900 max-w-32 truncate" title={checkin.customerName}>
      {checkin.customerName}
    </td>
    <td className="px-3 py-2 text-xs text-gray-900">{checkin.phoneNumber || '-'}</td>
    <td className="px-3 py-2 text-xs font-medium text-gray-900">{checkin.registration}</td>
    <td className="px-3 py-2 text-xs text-gray-900 max-w-40 truncate" title={checkin.makeModel}>
      {checkin.makeModel || `${checkin.make || ''} ${checkin.model || ''}`.trim() || '-'}
    </td>
    <td className="px-3 py-2 text-xs text-gray-900">{date}</td>
    <td className="px-3 py-2 text-xs font-medium text-gray-900">{formatTime(checkin.dropOffTime)}</td>
    <td className="px-3 py-2 text-xs text-gray-900 max-w-32 truncate" title={checkin.dropOffLocation}>
      {checkin.dropOffLocation || '-'}
    </td>
  </tr>
);

interface EmptyStateProps {
  icon: string;
  message: string;
}

const EmptyState = ({ icon, message }: EmptyStateProps) => (
  <div className="text-center py-8 text-gray-500">
    <div className="text-4xl mb-2">{icon}</div>
    <p>{message}</p>
  </div>
);

interface LoadingStateProps {}

const LoadingState = ({}: LoadingStateProps) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600">Loading operations...</p>
  </div>
);

// Constants for better maintainability
const CHECKOUT_COLUMNS = [
  'Coastr', 'Name', 'Phone', 'REG', 'Vehicle', 'Date', 'Time', 'Location', 
  'Documents', 'Hire Charges', 'Deposit'
];

const CHECKIN_COLUMNS = [
  'Coastr', 'Name', 'Phone', 'REG', 'Vehicle', 'Date', 'Time', 'Location'
];

export default function NextDayOperationsModal({ isOpen, onClose }: NextDayOperationsModalProps) {
  const [operations, setOperations] = useState<NextDayOperations | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'checkouts' | 'checkins'>('checkouts');
  const [checklists, setChecklists] = useState<Record<string, OperationChecklist>>({});

  // Business logic functions
  const initializeChecklists = (checkouts: CheckoutBooking[]): Record<string, OperationChecklist> => {
    const initialChecklists: Record<string, OperationChecklist> = {};
    checkouts.forEach(operation => {
      initialChecklists[operation.id] = {
        documents: false,
        hireCharges: false,
        deposit: false
      };
    });
    return initialChecklists;
  };

  const loadNextDayOperations = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await NextDayOperationsService.getNextDayOperations();
      setOperations(data);
      
      // Initialize checklists only for checkouts
      const initialChecklists = initializeChecklists(data.checkouts);
      setChecklists(initialChecklists);
    } catch (error) {
      toast.error('Failed to load next day operations');
      console.error('Error loading operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = (operationId: string, field: keyof OperationChecklist, value: boolean): void => {
    setChecklists(prev => ({
      ...prev,
      [operationId]: {
        ...prev[operationId],
        [field]: value
      }
    }));
  };

  const handleTabChange = (tab: 'checkouts' | 'checkins'): void => {
    setActiveTab(tab);
  };

  // Effects
  useEffect(() => {
    if (isOpen) {
      loadNextDayOperations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] w-full max-h-[90vh] overflow-hidden border-2 border-gray-300">
        {/* Header Section */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>📅</span>
                <span>Next Day's Operations</span>
              </h2>
              {operations && (
                <p className="text-lg text-gray-600 mt-1">
                  {operations.date}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleTabChange('checkouts')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'checkouts'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🚗</span>
                <span>Pick-ups ({operations?.checkouts.length || 0})</span>
              </button>
              <button
                onClick={() => handleTabChange('checkins')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'checkins'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🏁</span>
                <span>Drop-offs ({operations?.checkins.length || 0})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="overflow-auto max-h-[60vh]">
          {loading ? (
            <LoadingState />
          ) : operations ? (
            <>
              {/* Checkouts Tab */}
              {activeTab === 'checkouts' && (
                <div className="p-4">
                  {operations.checkouts.length === 0 ? (
                    <EmptyState 
                      icon="🚗" 
                      message="No vehicle pick-ups scheduled for tomorrow" 
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <TableHeader columns={CHECKOUT_COLUMNS} />
                        <tbody className="divide-y divide-gray-200">
                          {operations.checkouts.map((checkout, index) => {
                            const checklist = checklists[checkout.id] || { 
                              documents: false, 
                              hireCharges: false, 
                              deposit: false 
                            };
                            return (
                              <CheckoutRow
                                key={checkout.id}
                                checkout={checkout}
                                index={index}
                                date={operations.date}
                                checklist={checklist}
                                onChecklistUpdate={(field, value) => 
                                  updateChecklist(checkout.id, field, value)
                                }
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Checkins Tab */}
              {activeTab === 'checkins' && (
                <div className="p-4">
                  {operations.checkins.length === 0 ? (
                    <EmptyState 
                      icon="🏁" 
                      message="No vehicle drop-offs scheduled for tomorrow" 
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <TableHeader columns={CHECKIN_COLUMNS} />
                        <tbody className="divide-y divide-gray-200">
                          {operations.checkins.map((checkin, index) => (
                            <CheckinRow
                              key={checkin.id}
                              checkin={checkin}
                              index={index}
                              date={operations.date}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load operations data.</p>
              <button
                onClick={loadNextDayOperations}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {operations && (
                <div className="flex items-center space-x-6">
                  <span>
                    📊 {operations.checkouts.length} pick-ups, {operations.checkins.length} drop-offs scheduled
                  </span>
                  {activeTab === 'checkouts' && (
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center space-x-1">
                        <input type="checkbox" className="h-3 w-3 text-green-600 rounded" disabled />
                        <span>Documents</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <input type="checkbox" className="h-3 w-3 text-blue-600 rounded" disabled />
                        <span>Hire Charges</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <input type="checkbox" className="h-3 w-3 text-orange-600 rounded" disabled />
                        <span>Deposit</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}