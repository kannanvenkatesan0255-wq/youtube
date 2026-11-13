/**
 * VidTube Horizontal Category Filter Chips
 * Matches YouTube's sticky chip navigation with left/right scroll controls and gradient fades
 */
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../../utils/constants';

export const CategoryChips = ({
  categories = CATEGORIES,
  selectedCategory = 'All',
  onSelectCategory
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 20);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative sticky top-14 z-30 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md border-b border-transparent dark:border-neutral-900 py-3 select-none">
      {/* Left Arrow Button with Fade Gradient */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-6 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-[#0f0f0f] dark:via-[#0f0f0f]/90 dark:to-transparent">
          <button
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Chips Scrollable Row */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth px-4"
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => onSelectCategory && onSelectCategory(category)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-[#0f0f0f] text-white dark:bg-white dark:text-[#0f0f0f]'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Right Arrow Button with Fade Gradient */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-6 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-[#0f0f0f] dark:via-[#0f0f0f]/90 dark:to-transparent">
          <button
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryChips;
