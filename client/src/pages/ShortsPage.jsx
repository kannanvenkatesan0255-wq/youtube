/**
 * VidTube Shorts Dedicated Feed Page
 * Implements YouTube Shorts full-screen vertical navigation, keyboard & swipe controls,
 * single-video playback focus, comments drawer, and share triggers.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Check, Loader2, Sparkles } from 'lucide-react';
import ShortPlayerItem from '../components/shorts/ShortPlayerItem';
import ShortsCommentsDrawer from '../components/shorts/ShortsCommentsDrawer';
import { shortService } from '../services/shortService';
import { SAMPLE_SHORTS } from '../utils/sampleData';

export const ShortsPage = () => {
  const { shortId } = useParams();
  const navigate = useNavigate();

  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('vidtube_shorts_muted') !== 'false';
  });

  // Comments Drawer & Share Toast
  const [commentsShort, setCommentsShort] = useState(null);
  const [shareToast, setShareToast] = useState(null);

  // Touch and Wheel Navigation refs
  const touchStartY = useRef(0);
  const isNavigatingRef = useRef(false);

  /**
   * 1. Fetch Shorts Feed from Backend (with seamless sample data fallback)
   */
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadFeed = async () => {
      try {
        const res = await shortService.getShortsFeed({ limit: 20 });
        if (!isMounted) return;

        const dbShorts = res.data?.data?.shorts || [];
        if (dbShorts.length > 0) {
          setShorts(dbShorts);
          // If URL param specified a particular shortId, jump to it
          if (shortId) {
            const foundIdx = dbShorts.findIndex((s) => (s._id || s.id) === shortId);
            if (foundIdx !== -1) setActiveIndex(foundIdx);
          }
        } else {
          // Fallback to rich sample shorts
          setShorts(SAMPLE_SHORTS);
          if (shortId) {
            const foundIdx = SAMPLE_SHORTS.findIndex((s) => s.id === shortId);
            if (foundIdx !== -1) setActiveIndex(foundIdx);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.debug('Using sample shorts feed:', err.message);
        setShorts(SAMPLE_SHORTS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, [shortId]);

  /**
   * 2. Synchronize Active Index with Browser URL
   */
  useEffect(() => {
    if (shorts.length > 0 && shorts[activeIndex]) {
      const currentShort = shorts[activeIndex];
      const id = currentShort._id || currentShort.id;
      window.history.replaceState(null, '', `/shorts/${id}`);
    }
  }, [activeIndex, shorts]);

  /**
   * Navigation Functions
   */
  const goToNextShort = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 400);

    setActiveIndex((prev) => (prev < shorts.length - 1 ? prev + 1 : prev));
  }, [shorts.length]);

  const goToPrevShort = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 400);

    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  /**
   * 3. Keyboard Arrow Navigation
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextShort();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevShort();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextShort, goToPrevShort]);

  /**
   * 4. Touch Gestures (Swipe Up/Down on Mobile)
   */
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        goToNextShort(); // Swiped Up -> Next
      } else {
        goToPrevShort(); // Swiped Down -> Prev
      }
    }
  };

  /**
   * 5. Mouse Wheel Navigation (Debounced)
   */
  const handleWheel = (e) => {
    if (commentsShort) return; // Don't scroll feed if comments modal is open
    if (Math.abs(e.deltaY) > 40) {
      if (e.deltaY > 0) {
        goToNextShort();
      } else {
        goToPrevShort();
      }
    }
  };

  const toggleGlobalMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('vidtube_shorts_muted', String(next));
      return next;
    });
  };

  const handleShare = (short) => {
    const url = `${window.location.origin}/shorts/${short._id || short.id}`;
    if (navigator.share) {
      navigator.share({
        title: short.title,
        text: short.title,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        setShareToast('Link copied to clipboard');
        setTimeout(() => setShareToast(null), 2500);
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-[#FF0033] animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Loading VidTube Shorts...</p>
      </div>
    );
  }

  const currentShort = shorts[activeIndex];

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[calc(100vh-56px)] flex items-center justify-center overflow-hidden bg-neutral-100 dark:bg-[#0f0f0f]"
    >
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/90 text-white text-xs font-semibold shadow-2xl border border-neutral-700 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Floating Desktop Next / Previous Navigation Controls */}
      <div className="hidden lg:flex fixed right-8 top-1/2 transform -translate-y-1/2 flex-col gap-3 z-40">
        <button
          type="button"
          onClick={goToPrevShort}
          disabled={activeIndex === 0}
          aria-label="Previous Short (ArrowUp)"
          className="p-3 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[#0f0f0f] dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl transition active:scale-95"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <div className="text-[11px] font-mono font-bold text-center text-neutral-500">
          {activeIndex + 1}/{shorts.length}
        </div>

        <button
          type="button"
          onClick={goToNextShort}
          disabled={activeIndex >= shorts.length - 1}
          aria-label="Next Short (ArrowDown)"
          className="p-3 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[#0f0f0f] dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl transition active:scale-95"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Vertical Short Player View */}
      {currentShort && (
        <ShortPlayerItem
          key={currentShort._id || currentShort.id}
          short={currentShort}
          isActive={true}
          isMuted={isMuted}
          onToggleMute={toggleGlobalMute}
          onOpenComments={(s) => setCommentsShort(s)}
          onShare={handleShare}
        />
      )}

      {/* Slide-in Comments Drawer */}
      <ShortsCommentsDrawer
        isOpen={Boolean(commentsShort)}
        onClose={() => setCommentsShort(null)}
        shortId={commentsShort?._id || commentsShort?.id}
        commentsCount={commentsShort?.commentsCount || 0}
        shortTitle={commentsShort?.title || ''}
      />
    </div>
  );
};

export default ShortsPage;
