// src/components/SearchAndControls.tsx

'use client';

interface ViewToggleProps {
  viewMode: 'summary' | 'detailed';
  onViewModeChange: (mode: 'summary' | 'detailed') => void;
  className?: string;
}

function ViewToggle({ viewMode, onViewModeChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex bg-gray-100 rounded-lg p-1 shadow-sm">
        <button
          onClick={() => onViewModeChange('summary')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
            viewMode === 'summary'
              ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          type="button"
        >
          <span>📋</span>
          <span>Summary</span>
        </button>
        <button
          onClick={() => onViewModeChange('detailed')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
            viewMode === 'detailed'
              ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          type="button"
        >
          <span>📊</span>
          <span>Detailed</span>
        </button>
      </div>
    </div>
  );
}

interface SearchAndControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  viewMode: 'summary' | 'detailed';
  onViewModeChange: (mode: 'summary' | 'detailed') => void;
}

export default function SearchAndControls({
  searchTerm,
  onSearchChange,
  onSearch,
  onClearSearch,
  viewMode,
  onViewModeChange
}: SearchAndControlsProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Search Section */}
          <div className="flex-1 flex space-x-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by coastr reference, customer name, or registration..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
            />
            <button
              onClick={onSearch}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                title="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* View Toggle */}
          <ViewToggle 
            viewMode={viewMode} 
            onViewModeChange={onViewModeChange}
            className="w-full sm:w-auto justify-center sm:justify-end"
          />
        </div>
      </div>
    </div>
  );
}