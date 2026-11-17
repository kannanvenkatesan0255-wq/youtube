/**
 * VidTube Homepage Shorts Shelf Component
 * Exact YouTube Shorts shelf featuring vertical 9:16 preview cards linking straight to the Shorts feed
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import { shortService } from '../../services/shortService';
import { SAMPLE_SHORTS } from '../../utils/sampleData';
import { formatViews } from '../../utils/formatters';

export const ShortsShelf = () => {
  const [shorts, setShorts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchShorts = async () => {
      try {
        const res = await shortService.getShortsFeed({ limit: 6 });
        if (isMounted) {
          const list = res.data?.shorts || res.data?.data?.shorts || (Array.isArray(res.data) ? res.data : []);
          setShorts(list.length > 0 ? list : SAMPLE_SHORTS);
        }
      } catch {
        if (isMounted) setShorts(SAMPLE_SHORTS);
      }
    };

    fetchShorts();
    return () => {
      isMounted = false;
    };
  }, []);

  if (shorts.length === 0) return null;

  return (
    <div className="mb-8 pt-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF0033]/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-[#FF0033]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            Shorts
          </h2>
        </div>
        <Link
          to="/shorts"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </Link>
      </div>

      {/* Responsive Horizontal Grid of 9:16 Vertical Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {shorts.slice(0, 6).map((short) => {
          const id = short._id || short.id;
          return (
            <Link
              key={id}
              to={`/shorts/${id}`}
              className="group flex flex-col select-none"
            >
              <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-sm group-hover:shadow-md transition">
                <img
                  src={short.thumbnailUrl}
                  alt={short.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-x-2.5 bottom-2.5 text-white">
                  <h3
                    className="text-xs font-bold leading-tight line-clamp-2 drop-shadow-sm group-hover:text-blue-300 transition"
                    title={short.title}
                  >
                    {short.title}
                  </h3>
                  <p className="text-[11px] text-neutral-300 font-medium mt-1">
                    {formatViews(short.views || 0)} views
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ShortsShelf;
