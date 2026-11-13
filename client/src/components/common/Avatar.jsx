/**
 * Reusable Avatar Component
 * YouTube circular profile photo with fallback initials and optional live indicator
 */
import React, { useState } from 'react';

export const Avatar = ({
  src,
  alt = 'User avatar',
  name = '',
  size = 'md',
  isLive = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(!src);

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div
        className={`${sizes[size] || sizes.md} rounded-full overflow-hidden flex items-center justify-center font-semibold bg-neutral-200 dark:bg-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] select-none ${
          isLive ? 'ring-2 ring-[#FF0033]' : ''
        }`}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name || alt)}</span>
        )}
      </div>
      {isLive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FF0033] text-white text-[9px] font-bold px-1 rounded uppercase tracking-wider">
          LIVE
        </span>
      )}
    </div>
  );
};

export default Avatar;
