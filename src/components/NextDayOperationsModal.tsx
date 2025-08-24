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

export default function NextDayOperationsModal({ isOpen, onClose }: NextDayOperationsModalProps) {
  const [operations, setOperations] = useState<NextDayOperations | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'checkouts' | 'checkins'>('checkouts');

  useEffect(() => {
    if (isOpen) {
      loadNextDayOperations();
    }
  }, [isOpen]);

  const loadNextDayOperations = async () => {
    try {
      setLoading(true);
      const data = await NextDayOperationsService.getNextDayOperations();
      setOperations(data);
    } catch (error) {
      toast.error('Failed to load next day operations');
      console.error('Error loading operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return `£${amount.toFixed(2)}`;
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-xl">
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
                onClick={() => setActiveTab('checkouts')}
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
                onClick={() => setActiveTab('checkins')}
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

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading operations...</p>
            </div>
          ) : operations ? (
            <>
              {/* Checkouts Tab */}
              {activeTab === 'checkouts' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <span>🚗</span>
                    <span>Vehicle Pick-ups - {operations.date}</span>
                  </h3>
                  
                  {operations.checkouts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-6xl mb-4">🚗</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Pick-ups Scheduled</h3>
                      <p className="text-gray-500">No vehicle pick-ups are scheduled for tomorrow.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {operations.checkouts.map((checkout) => (
                        <div
                          key={checkout.id}
                          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Left Column */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                                  {checkout.coastrReference}
                                </span>
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                  {checkout.registration}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {checkout.customerName}
                              </div>
                              <div className="text-sm text-gray-600">
                                📞 {checkout.phoneNumber}
                              </div>
                            </div>

                            {/* Middle Column */}
                            <div className="space-y-2">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Vehicle:</span>{' '}
                                {checkout.makeModel || `${checkout.make || ''} ${checkout.model || ''}`.trim() || '-'}
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Time:</span>{' '}
                                <span className="font-bold text-blue-600">{formatTime(checkout.pickUpTime)}</span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Location:</span>{' '}
                                {checkout.pickUpLocation}
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-2">
                              {checkout.depositToBeCollectedAtBranch && checkout.depositToBeCollectedAtBranch > 0 && (
                                <div className="text-sm">
                                  <span className="font-medium text-orange-700">Deposit to Collect:</span>{' '}
                                  <span className="font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                    {formatCurrency(checkout.depositToBeCollectedAtBranch)}
                                  </span>
                                </div>
                              )}
                              {checkout.comments && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700">Comments:</span>
                                  <div className="text-gray-600 bg-gray-100 p-2 rounded mt-1 text-xs">
                                    {checkout.comments}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Checkins Tab */}
              {activeTab === 'checkins' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <span>🏁</span>
                    <span>Vehicle Drop-offs - {operations.date}</span>
                  </h3>
                  
                  {operations.checkins.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-6xl mb-4">🏁</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Drop-offs Scheduled</h3>
                      <p className="text-gray-500">No vehicle drop-offs are scheduled for tomorrow.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {operations.checkins.map((checkin) => (
                        <div
                          key={checkin.id}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Left Column */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                                  {checkin.coastrReference}
                                </span>
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                  {checkin.registration}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {checkin.customerName}
                              </div>
                              <div className="text-sm text-gray-600">
                                📞 {checkin.phoneNumber}
                              </div>
                            </div>

                            {/* Middle Column */}
                            <div className="space-y-2">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Vehicle:</span>{' '}
                                {checkin.makeModel || `${checkin.make || ''} ${checkin.model || ''}`.trim() || '-'}
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Time:</span>{' '}
                                <span className="font-bold text-blue-600">{formatTime(checkin.dropOffTime)}</span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Location:</span>{' '}
                                {checkin.dropOffLocation}
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-2">
                              {checkin.comments && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700">Comments:</span>
                                  <div className="text-gray-600 bg-gray-100 p-2 rounded mt-1 text-xs">
                                    {checkin.comments}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {operations && (
                <>
                  📊 {operations.checkouts.length} pick-ups, {operations.checkins.length} drop-offs scheduled
                </>
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