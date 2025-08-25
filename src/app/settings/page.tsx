// src/app/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { VehicleGroup } from '@/types/groups';
import { GroupService } from '@/services/groupService';
import GroupPricingCard from '@/components/GroupPricingCard';
import PricingModal from '@/components/PricingModal';
import GroupFormModal from '@/components/GroupFormModal';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [groups, setGroups] = useState<VehicleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<VehicleGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<VehicleGroup | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showGroupFormModal, setShowGroupFormModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<VehicleGroup | null>(null);
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

  // Handle edit group
  const handleEditGroup = (group: VehicleGroup) => {
    setEditingGroup(group);
    setShowGroupFormModal(true);
  };

  // Handle add new group
  const handleAddGroup = () => {
    setEditingGroup(null);
    setShowGroupFormModal(true);
  };

  // Handle group form success
  const handleGroupFormSuccess = () => {
    setShowGroupFormModal(false);
    setEditingGroup(null);
    loadGroups();
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

  // Handle status toggle
  const handleStatusToggle = async (group: VehicleGroup) => {
    try {
      const newStatus = group.status === 'active' ? 'inactive' : 'active';
      const groupFormData = {
        name: group.name,
        hourlyRate: group.hourlyRate.toString(),
        dailyRate: group.dailyRate.toString(),
        weeklyRate: group.weeklyRate.toString(),
        monthlyRate: group.monthlyRate.toString(),
        status: newStatus
      };
      
      await GroupService.updateGroup(group.id!, groupFormData);
      toast.success(`Group ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      await loadGroups();
    } catch (error) {
      toast.error('Failed to update group status');
      console.error(error);
    }
  };

  // Handle delete group
  const handleDeleteGroup = async (group: VehicleGroup) => {
    if (group.vehicleCount > 0) {
      toast.error('Cannot delete group with assigned vehicles. Please remove all vehicles first.');
      return;
    }

    const confirmMessage = `Are you sure you want to delete the group "${group.name}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      await GroupService.deleteGroup(group.id!);
      toast.success('Group deleted successfully');
      await loadGroups();
    } catch (error) {
      toast.error('Failed to delete group');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600 mt-2">Configure your system settings</p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Groups and Pricing Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏷️</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Groups & Pricing</h2>
                  <p className="text-sm text-gray-600">Manage vehicle groups and their pricing rates</p>
                </div>
              </div>
              <button
                onClick={handleAddGroup}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                <span>➕</span>
                <span>Add Group</span>
              </button>
            </div>
          </div>

          {/* Search and Stats */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 relative max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search groups..."
                  className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">🔍</span>
                </div>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-3 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 text-sm"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-lg font-bold text-gray-900">{groups.length}</div>
                <div className="text-xs text-gray-600">Total Groups</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-lg font-bold text-green-600">
                  {groups.filter(g => g.status === 'active').length}
                </div>
                <div className="text-xs text-gray-600">Active Groups</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-lg font-bold text-orange-600">
                  {groups.filter(g => g.status === 'inactive').length}
                </div>
                <div className="text-xs text-gray-600">Inactive Groups</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-lg font-bold text-purple-600">
                  {groups.reduce((sum, g) => sum + g.vehicleCount, 0)}
                </div>
                <div className="text-xs text-gray-600">Assigned Vehicles</div>
              </div>
            </div>
          </div>

          {/* Groups Grid */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicle Groups Found</h3>
                <p className="text-gray-600 mb-6 text-sm">Get started by initializing your default vehicle groups or create a custom group</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={initializeDefaultGroups}
                    disabled={initializing}
                    className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    {initializing ? 'Initializing...' : 'Initialize Default Groups'}
                  </button>
                  <button
                    onClick={handleAddGroup}
                    className="px-6 py-3 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                  >
                    Create Custom Group
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredGroups.map((group) => (
                  <GroupPricingCard
                    key={group.id}
                    group={group}
                    onVehicleCountClick={() => handleVehicleCountClick(group)}
                    onPricingClick={() => handlePricingClick(group)}
                    onEditClick={() => handleEditGroup(group)}
                    onStatusToggle={() => handleStatusToggle(group)}
                    onDeleteClick={() => handleDeleteGroup(group)}
                  />
                ))}
              </div>
            )}

            {filteredGroups.length === 0 && groups.length > 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups found</h3>
                <p className="text-gray-600 text-sm">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>

        {/* Future Settings Sections - Placeholder for additional settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">⚙️</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
                <p className="text-sm text-gray-600">Additional system settings will appear here</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">🔧</div>
              <p className="text-sm">More settings sections coming soon...</p>
            </div>
          </div>
        </div>

        {/* Another Future Section Example */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-600">User roles and permissions settings</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">👤</div>
              <p className="text-sm">User management features coming soon...</p>
            </div>
          </div>
        </div>
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

      {/* Group Form Modal */}
      {showGroupFormModal && (
        <GroupFormModal
          group={editingGroup}
          onSuccess={handleGroupFormSuccess}
          onClose={() => {
            setShowGroupFormModal(false);
            setEditingGroup(null);
          }}
        />
      )}
    </div>
  );
}