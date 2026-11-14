/**
 * VidTube Custom Video Progress / Scrub Bar
 * Exact YouTube timeline scrubber with buffered ranges, smooth drag seek, and time preview tooltip
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatDuration } from '../../utils/formatters';

export const ProgressBar = ({
  currentTime = 0,
  duration = 0,
  bufferedTime = 0,
  onSeek
}) => {
  const barRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null); // percentage 0 - 1
  const [hoverTime, setHoverTime] = useState(null);

  const calculatePercentage = useCallback(
    (e) => {
      if (!barRef.current || duration <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return offsetX / rect.width;
    },
    [duration]
  );

  const handlePointerDown = (e) => {
    setIsDragging(true);
    const pct = calculatePercentage(e);
    const targetTime = pct * duration;
    if (onSeek) onSeek(targetTime);
  };

  const handlePointerMove = (e) => {
    const pct = calculatePercentage(e);
    setHoverPosition(pct);
    setHoverTime(pct * duration);

    if (isDragging && onSeek) {
      onSeek(pct * duration);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
      setHoverTime(null);
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (isDragging) {
        const pct = calculatePercentage(e);
        setHoverPosition(pct);
        setHoverTime(pct * duration);
        if (onSeek) onSeek(pct * duration);
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalPointerMove);
      window.addEventListener('mouseup', handleGlobalPointerUp);
      window.addEventListener('touchmove', handleGlobalPointerMove);
      window.addEventListener('touchend', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalPointerMove);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchmove', handleGlobalPointerMove);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [isDragging, calculatePercentage, duration, onSeek]);

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;
  const hoverPercent = hoverPosition !== null ? hoverPosition * 100 : 0;

  return (
    <div
      ref={barRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onTouchStart={handlePointerDown}
      className="relative w-full h-4 flex items-center cursor-pointer group select-none py-1"
    >
      {/* Time Hover Tooltip */}
      {hoverTime !== null && hoverPosition !== null && duration > 0 && (
        <div
          className="absolute -top-7 transform -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-white text-[11px] font-mono pointer-events-none shadow-md z-30"
          style={{ left: `${hoverPercent}%` }}
        >
          {formatDuration(hoverTime)}
        </div>
      )}

      {/* Main Track Background */}
      <div className="relative w-full h-1 group-hover:h-1.5 transition-all duration-150 bg-white/20 rounded-full overflow-hidden">
        {/* Buffer Range Bar */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-white/40 transition-all duration-200"
          style={{ width: `${Math.min(100, Math.max(0, bufferedPercent))}%` }}
        />

        {/* Hover Ghost Bar */}
        {hoverPosition !== null && (
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/30 transition-none"
            style={{ width: `${Math.min(100, Math.max(0, hoverPercent))}%` }}
          />
        )}

        {/* Played Progress Bar (YouTube Red) */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-[#FF0033] transition-none"
          style={{ width: `${Math.min(100, Math.max(0, playedPercent))}%` }}
        />
      </div>

      {/* Scrubber Thumb Knob */}
      <div
        className={`absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#FF0033] shadow-md pointer-events-none transition-transform duration-100 ${
          isDragging || hoverPosition !== null ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'
        }`}
        style={{ left: `${Math.min(100, Math.max(0, playedPercent))}%` }}
      />
    </div>
  );
};

export default ProgressBar;
