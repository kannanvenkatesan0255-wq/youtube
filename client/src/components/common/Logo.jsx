/**
 * VidTube Brand Logo Component
 * YouTube-inspired red-and-white branding with original VidTube identity
 */
import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ className = '', showCountryCode = true }) => {
  return (
    <Link to="/" className={`flex items-center gap-1 select-none group ${className}`} aria-label="VidTube Home">
      {/* Red rounded rectangle badge with white play triangle */}
      <div className="relative w-7 h-5 sm:w-8 sm:h-5.5 rounded-lg bg-[#FF0033] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white translate-x-0.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      {/* Brand Name Text */}
      <div className="flex items-start">
        <span className="text-lg sm:text-xl font-bold tracking-tighter text-[#0f0f0f] dark:text-white font-sans">
          Vid<span className="text-[#0f0f0f] dark:text-white">Tube</span>
        </span>
        {showCountryCode && (
          <span className="text-[10px] font-medium text-[#606060] dark:text-[#aaaaaa] ml-1 -mt-0.5 select-none">
            IN
          </span>
        )}
      </div>
    </Link>
  );
};

export default Logo;
