/**
 * VidTube Responsive Video Grid Component
 * YouTube layout: 1 col on mobile, 2 col on tablet, 3-4 col on desktop
 */
import React from 'react';
import VideoCard from './VideoCard';

export const VideoGrid = ({ videos = [] }) => {
  if (!videos || videos.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-500">
        <p className="text-base">No videos found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 pb-12">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

export default VideoGrid;
