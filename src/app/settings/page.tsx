// src/app/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { VehicleGroup } from '@/types/groups';
import { GroupService } from '@/services/groupService';
import GroupPricingCard from '@/components/GroupPricingCard';
import PricingModal from '@/components/PricingModal';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [groups, setGroups] = useState<VehicleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<VehicleGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<VehicleGroup | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [initializing, setInitializing] = useState(false);
  
  const router = useRouter();

  // Load groups
  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await GroupService.getGroups(100); // Get all groups
      setGroups(result.groups);
      setFilteredGroups(result.groups);
    } catch (error) {
      toast.error('Failed to load groups');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize default groups
  const initializeDefaultGroups = async () => {
    try {
      setInitializing(true);
      await GroupService.initializeDefaultGroups();
      toast.success('Default groups initialized successfully');
      await loadGroups();
    } catch (error) {
      toast.error('Failed to initialize default groups');
      console.error(error);
    } finally {
      setInitializing(false);
    }
  };

  // Filter groups based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, groups]);

  // Load groups on component mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Handle vehicle count click - navigate to assignment page
  const handleVehicleCountClick = (group: VehicleGroup) => {
    router.push(`/settings/groups/${group.id}/vehicles`);
  };

  // Handle pricing click
  const handlePricingClick = (group: VehicleGroup) => {
    setSelectedGroup(group);
    setShowPricingModal(true);
  };

  // Handle pricing update
  const handlePricingUpdate = async (
    groupId: string,
    pricing: { hourlyRate: number; dailyRate: number; weeklyRate: number; monthlyRate: number }
  ) => {
    try {
      await GroupService.updateGroupPricing(groupId, pricing);
      toast.success('Pricing updated successfully');
      await loadGroups();
      setShowPricingModal(false);
      setSelectedGroup(null);
    } catch (error) {
      toast.error('Failed to update pricing');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600 mt-2">Manage your vehicle groups and pricing</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/fleet')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 flex items-center space-x-2"
              >
                <span>🚗</span>
                <span>Fleet</span>
              </button>
              {groups.length === 0 && !loading && (
                <button
                  onClick={initializeDefaultGroups}
                  disabled={initializing}
                  className="px-4 py-2 text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>⚡</span>
                  <span>{initializing ? 'Initializing...' : 'Initialize Groups'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Group and Pricing Management</h2>
          
          {/* Search */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search groups..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
              <div className="text-sm text-blue-600">Total Groups</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {groups.filter(g => g.status === 'active').length}
              </div>
              <div className="text-sm text-green-600">Active Groups</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {groups.reduce((sum, g) => sum + g.vehicleCount, 0)}
              </div>
              <div className="text-sm text-purple-600">Assigned Vehicles</div>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vehicle Groups Found</h3>
            <p className="text-gray-600 mb-6">Get started by initializing your default vehicle groups</p>
            <button
              onClick={initializeDefaultGroups}
              disabled={initializing}
              className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-all duration-200 font-medium disabled:opacity-50"
            >
              {initializing ? 'Initializing...' : 'Initialize Default Groups'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <GroupPricingCard
                key={group.id}
                group={group}
                onVehicleCountClick={() => handleVehicleCountClick(group)}
                onPricingClick={() => handlePricingClick(group)}
              />
            ))}
          </div>
        )}

        {filteredGroups.length === 0 && groups.length > 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Pricing Modal */}
      {showPricingModal && selectedGroup && (
        <PricingModal
          group={selectedGroup}
          onUpdate={handlePricingUpdate}
          onClose={() => {
            setShowPricingModal(false);
            setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
}