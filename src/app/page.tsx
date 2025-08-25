// src/app/page.tsx

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Fleet Management System
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          {/* Fleet */}
          <Link 
            href="/fleet"
            className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">🚗</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Fleet</h2>
            <p className="text-gray-600 text-sm">Manage your vehicle inventory</p>
          </Link>

          {/* Bookings */}
          <Link 
            href="/bookings"
            className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">📅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Bookings</h2>
            <p className="text-gray-600 text-sm">Manage vehicle bookings</p>
          </Link>

          {/* Settings */}
          <Link 
            href="/settings"
            className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">🔧</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-600 text-sm">Groups and pricing</p>
          </Link>
        </div>
      </div>
    </div>
  );
}