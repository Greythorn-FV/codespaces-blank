// src/app/page.tsx

'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';

function HomePage() {
  const { user, hasPermission } = useAuth();

  const dashboardItems = [
    {
      href: '/fleet',
      title: 'Fleet Management',
      description: 'Manage your vehicle inventory',
      icon: '🚗',
      color: 'from-blue-500 to-blue-600',
      permission: 'canManageFleet' as const,
    },
    {
      href: '/bookings',
      title: 'Booking Management',
      description: 'Manage vehicle bookings and reservations',
      icon: '📅',
      color: 'from-green-500 to-green-600',
      permission: 'canManageBookings' as const,
    },
    {
      href: '/settings',
      title: 'Settings & Groups',
      description: 'Configure groups, pricing, and system settings',
      icon: '🔧',
      color: 'from-purple-500 to-purple-600',
      permission: 'canManageSettings' as const,
    },
    {
      href: '/reports',
      title: 'Reports & Analytics',
      description: 'View business insights and reports',
      icon: '📊',
      color: 'from-orange-500 to-orange-600',
      permission: 'canViewReports' as const,
    },
  ];

  const visibleItems = dashboardItems.filter(item => 
    hasPermission(item.permission)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <span className="text-2xl text-white">👋</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {getUserDisplayName()}!
            </h1>
            <p className="text-gray-600 mb-2">
              Welcome to Fairview Booking Manager
            </p>
            <div className="inline-flex items-center space-x-2">
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${user?.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
              `}>
                {getRoleDisplay(user?.role || 'member')}
              </span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200 transform hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <p>Activity tracking coming soon...</p>
            <p className="text-sm mt-2">Your recent actions and system updates will appear here.</p>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">System Status: Operational</h4>
                <p className="text-sm text-gray-600">All systems are running smoothly</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedHomePage() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}