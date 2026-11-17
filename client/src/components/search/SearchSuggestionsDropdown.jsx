/**
 * Search Suggestions Dropdown Component
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
import React from 'react';
import { Search, Clock, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SearchSuggestionsDropdown = ({
  suggestions = [],
  isOpen = false,
  activeIndex = -1,
  onSelectSuggestion,
  onDeleteHistoryItem,
  className = ''
}) => {
  const navigate = useNavigate();

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  const handleItemClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === 'channel' && item.handle) {
      navigate(`/@${item.handle}`);
    } else {
      onSelectSuggestion(item.text);
    }
  };

  const handleDelete = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteHistoryItem && item.id) {
      onDeleteHistoryItem(item.id);
    }
  };

  return (
    <div
      className={`absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#212121] border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden z-50 py-2.5 transition-all animate-fadeIn ${className}`}
    >
      <ul className="flex flex-col text-sm">
        {suggestions.map((item, idx) => {
          const isSelected = idx === activeIndex;

          return (
            <li
              key={`${item.type}-${item.id || item.text}-${idx}`}
              onMouseDown={(e) => handleItemClick(e, item)}
              className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-neutral-100 dark:bg-neutral-700/60 text-[#0f0f0f] dark:text-[#f1f1f1]'
                  : 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 text-[#0f0f0f] dark:text-[#f1f1f1]'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                {item.type === 'history' ? (
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                ) : item.type === 'channel' ? (
                  item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.text}
                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <User className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  )
                ) : (
                  <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                )}

                <div className="flex flex-col truncate">
                  <span
                    className={`truncate ${
                      item.type === 'history'
                        ? 'text-purple-700 dark:text-purple-300 font-medium'
                        : ''
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.type === 'channel' && item.handle && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      @{item.handle}
                    </span>
                  )}
                </div>
              </div>

              {item.type === 'history' && (
                <button
                  type="button"
                  title="Remove from history"
                  onMouseDown={(e) => handleDelete(e, item)}
                  className="p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SearchSuggestionsDropdown;
