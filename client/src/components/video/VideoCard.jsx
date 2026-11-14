/**
 * VidTube Video Card Component
 * Exact reproduction of YouTube video card layout, metadata, badges, and hover actions
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import Avatar from '../common/Avatar';
import { DurationBadge, VerifiedBadge } from '../common/Badge';
import { formatViews, formatTimeAgo, formatDuration } from '../../utils/formatters';

export const VideoCard = ({ video }) => {
  if (!video) return null;

  const videoId = video._id || video.id;
  const watchUrl = `/watch/${videoId}`;

  const durationFormatted = typeof video.duration === 'number'
    ? formatDuration(video.duration)
    : video.duration;

  const viewsFormatted = typeof video.views === 'number'
    ? formatViews(video.views)
    : video.views;

  const timeAgoFormatted = video.createdAt
    ? formatTimeAgo(video.createdAt)
    : 'Recently';

  return (
    <article className="group flex flex-col select-none">
      {/* Thumbnail Container (16:9 ratio) */}
      <Link
        to={watchUrl}
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 transition-all duration-200 group-hover:rounded-none group-hover:shadow-md block"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Video Duration Badge */}
        <DurationBadge durationText={durationFormatted} />
      </Link>

      {/* Video Details & Channel Info */}
      <div className="flex gap-3 items-start mt-3 px-0.5">
        {/* Channel Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <Avatar
            src={video.channel?.avatar}
            name={video.channel?.name || 'Channel'}
            size="md"
          />
        </div>

        {/* Video Metadata */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Video Title (2 lines clamp) */}
          <Link to={watchUrl}>
            <h3
              className="text-sm font-semibold leading-snug line-clamp-2 text-[#0f0f0f] dark:text-[#f1f1f1] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              title={video.title}
            >
              {video.title}
            </h3>
          </Link>

          {/* Channel Name */}
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#606060] dark:text-[#aaaaaa] hover:text-[#0f0f0f] dark:hover:text-[#f1f1f1] transition-colors">
            <span className="truncate">{video.channel?.name || 'VidTube Channel'}</span>
            {video.channel?.isVerified && <VerifiedBadge />}
          </div>

          {/* Views & Timestamp */}
          <div className="flex items-center gap-1 text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
            <span>{viewsFormatted}</span>
            <span className="text-[10px] leading-none">•</span>
            <span>{timeAgoFormatted}</span>
          </div>
        </div>

        {/* Three-dot context menu */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label="Action menu"
            className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
