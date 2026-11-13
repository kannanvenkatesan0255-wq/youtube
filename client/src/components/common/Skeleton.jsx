/**
 * YouTube-style Skeleton Loading Components
 */
import React from 'react';

export const VideoCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {/* Thumbnail skeleton (16:9 ratio) */}
      <div className="w-full aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      {/* Channel avatar and metadata skeleton */}
      <div className="flex gap-3 items-start mt-1">
        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};

export const VideoGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
      {Array.from({ length: count }).map((_, index) => (
        <VideoCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
};
