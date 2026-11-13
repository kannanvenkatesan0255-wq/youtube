/**
 * VidTube Homepage
 * Complete Phase 1-3 YouTube UI Shell: Sticky Category Chips + Responsive Video Grid
 * Fetches real public videos from API with seamless fallback to sample showcase videos.
 */
import React, { useState, useEffect, useMemo } from 'react';
import CategoryChips from '../components/video/CategoryChips';
import VideoGrid from '../components/video/VideoGrid';
import { SAMPLE_VIDEOS } from '../utils/sampleData';
import { Sparkles, UploadCloud, Loader2 } from 'lucide-react';
import { videoService } from '../services/videoService';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [realVideos, setRealVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch real public videos from backend
  useEffect(() => {
    let isMounted = true;
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const params = {
          limit: 24,
          ...(selectedCategory !== 'All' ? { category: selectedCategory } : {})
        };
        const res = await videoService.getPublicVideos(params);
        if (isMounted && res.data && Array.isArray(res.data.videos)) {
          setRealVideos(res.data.videos);
        }
      } catch (err) {
        // Silently fall back to sample videos if backend is not yet populated or offline
        console.debug('Using sample showcase videos:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // Filter sample videos by category if not 'All'
  const filteredSampleVideos = useMemo(() => {
    if (selectedCategory === 'All') return SAMPLE_VIDEOS;
    return SAMPLE_VIDEOS.filter(
      (v) => v.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [selectedCategory]);

  // Combine real uploaded videos first, followed by sample videos if real videos are few
  const displayVideos = useMemo(() => {
    if (realVideos.length > 0) {
      return realVideos;
    }
    return filteredSampleVideos;
  }, [realVideos, filteredSampleVideos]);

  return (
    <div className="w-full">
      {/* Horizontal Category Filter Chips */}
      <CategoryChips
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Container */}
      <div className="px-4 sm:px-6 pt-4">
        {/* Phase 3 Architectural Showcase Banner */}
        {showWelcomeBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF0033]/10 text-[#FF0033] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF0033] bg-[#FF0033]/10 px-2 py-0.5 rounded-full">
                    Phase 3 Active
                  </span>
                  <h2 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                    VidTube Video Upload & Storage Engine Deployed
                  </h2>
                </div>
                <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
                  Direct Cloudinary signed uploads, video metadata persistence, thumbnail management, and creator studio enabled.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF0033] text-white hover:bg-[#d9002c] transition shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Video
              </Link>
              <button
                onClick={() => setShowWelcomeBanner(false)}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Video Grid */}
        {loading && realVideos.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-neutral-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading videos...</span>
          </div>
        ) : (
          <VideoGrid videos={displayVideos} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
