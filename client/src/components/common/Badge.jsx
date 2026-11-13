/**
 * Reusable Badge Component
 * Duration badge, verified badge, notification count badge
 */
import React from 'react';
import { Check } from 'lucide-react';

export const DurationBadge = ({ durationText, className = '' }) => {
  if (!durationText) return null;
  return (
    <span
      className={`absolute bottom-2 right-2 bg-black/85 text-white text-xs font-semibold px-1.5 py-0.5 rounded tracking-wide backdrop-blur-sm pointer-events-none select-none ${className}`}
    >
      {durationText}
    </span>
  );
};

export const VerifiedBadge = ({ className = '' }) => {
  return (
    <span
      title="Verified Channel"
      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-neutral-500 text-white dark:bg-neutral-400 dark:text-neutral-900 ${className}`}
    >
      <Check className="w-2.5 h-2.5 stroke-[3]" />
    </span>
  );
};

export const NotificationBadge = ({ count = 0 }) => {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-[#FF0033] text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
};
