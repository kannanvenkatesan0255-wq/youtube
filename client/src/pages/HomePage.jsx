/**
 * VidTube Homepage
 * Complete Phase 1 YouTube UI Shell: Sticky Category Chips + Responsive Video Grid
 */
import React, { useState, useMemo } from 'react';
import CategoryChips from '../components/video/CategoryChips';
import VideoGrid from '../components/video/VideoGrid';
import { SAMPLE_VIDEOS } from '../utils/sampleData';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Filter sample videos by category if not 'All'
  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'All') return SAMPLE_VIDEOS;
    return SAMPLE_VIDEOS.filter(
      (v) => v.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [selectedCategory]);

  return (
    <div className="w-full">
      {/* Horizontal Category Filter Chips */}
      <CategoryChips
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Container */}
      <div className="px-4 sm:px-6 pt-4">
        {/* Phase 1 Architectural Badge Banner */}
        {showWelcomeBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF0033]/10 text-[#FF0033] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF0033] bg-[#FF0033]/10 px-2 py-0.5 rounded-full">
                    Phase 1 of 10
                  </span>
                  <h2 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                    VidTube Full-Stack Foundation Initialized
                  </h2>
                </div>
                <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
                  Production architecture established: React 19, Tailwind CSS, Express REST API, Mongoose schemas, and YouTube exact UI shell.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Video Grid */}
        <VideoGrid videos={filteredVideos.length > 0 ? filteredVideos : SAMPLE_VIDEOS} />
      </div>
    </div>
  );
};

export default HomePage;
