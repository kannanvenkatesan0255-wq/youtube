/**
 * Search Filters Bar Component
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';

export const SearchFiltersBar = ({
  filters = {},
  onFilterChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeType = filters.type || 'all';
  const activeUploadDate = filters.uploadDate || 'all';
  const activeDuration = filters.duration || 'all';
  const activeSortBy = filters.sortBy || 'relevance';

  const typeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Videos', value: 'video' },
    { label: 'Shorts', value: 'short' },
    { label: 'Channels', value: 'channel' }
  ];

  const uploadDateOptions = [
    { label: 'Any time', value: 'all' },
    { label: 'Last hour', value: 'hour' },
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
    { label: 'This year', value: 'year' }
  ];

  const durationOptions = [
    { label: 'Any duration', value: 'all' },
    { label: 'Under 4 minutes', value: 'under4m' },
    { label: '4 - 20 minutes', value: '4to20m' },
    { label: 'Over 20 minutes', value: 'over20m' }
  ];

  const sortOptions = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Upload date', value: 'date' },
    { label: 'View count', value: 'views' },
    { label: 'Rating', value: 'rating' }
  ];

  const hasActiveFilters =
    activeUploadDate !== 'all' || activeDuration !== 'all' || activeSortBy !== 'relevance';

  return (
    <div className="w-full mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-3">
      {/* Quick Type Chips & Filter Toggle */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ ...filters, type: opt.value, page: 1 })}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeType === opt.value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex-shrink-0 ${
            hasActiveFilters || isOpen
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
              : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 animate-fadeIn text-sm">
          {/* Upload Date */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Upload Date
            </h4>
            <ul className="space-y-1.5">
              {uploadDateOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => onFilterChange({ ...filters, uploadDate: opt.value, page: 1 })}
                    className={`flex items-center gap-1.5 w-full text-left py-1 hover:text-blue-600 dark:hover:text-blue-400 ${
                      activeUploadDate === opt.value
                        ? 'font-semibold text-blue-600 dark:text-blue-400'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {activeUploadDate === opt.value && <Check className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Duration */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Duration
            </h4>
            <ul className="space-y-1.5">
              {durationOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => onFilterChange({ ...filters, duration: opt.value, page: 1 })}
                    className={`flex items-center gap-1.5 w-full text-left py-1 hover:text-blue-600 dark:hover:text-blue-400 ${
                      activeDuration === opt.value
                        ? 'font-semibold text-blue-600 dark:text-blue-400'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {activeDuration === opt.value && <Check className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Sort By */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Sort By
            </h4>
            <ul className="space-y-1.5">
              {sortOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => onFilterChange({ ...filters, sortBy: opt.value, page: 1 })}
                    className={`flex items-center gap-1.5 w-full text-left py-1 hover:text-blue-600 dark:hover:text-blue-400 ${
                      activeSortBy === opt.value
                        ? 'font-semibold text-blue-600 dark:text-blue-400'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {activeSortBy === opt.value && <Check className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Reset Filters Action */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={() =>
                  onFilterChange({
                    type: activeType,
                    uploadDate: 'all',
                    duration: 'all',
                    sortBy: 'relevance',
                    page: 1
                  })
                }
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium mb-1"
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFiltersBar;
