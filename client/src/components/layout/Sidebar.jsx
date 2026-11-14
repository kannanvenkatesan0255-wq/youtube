/**
 * VidTube Left Sidebar (Expanded & Mobile Drawer)
 * Reproduces YouTube's exact navigation structure and styling
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Home,
  Film,
  Tv,
  History,
  ListVideo,
  SquarePlay,
  Clock,
  ThumbsUp,
  Flame,
  Music2,
  Gamepad2,
  Trophy,
  Radio,
  Settings,
  Flag,
  HelpCircle,
  MessageSquareWarning,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import SidebarItem from '../navigation/SidebarItem';
import Avatar from '../common/Avatar';
import { SAMPLE_CHANNELS } from '../../utils/sampleData';

export const Sidebar = () => {
  const { isCollapsed, isMobileOpen, isMobileScreen, closeMobileSidebar } = useSidebar();
  const location = useLocation();
  const isWatchPage = location.pathname.startsWith('/watch/');

  // If on desktop and collapsed, the MiniSidebar is rendered instead
  if (!isWatchPage && isCollapsed && !isMobileScreen) {
    return null;
  }

  const sidebarContent = (
    <aside className="w-60 h-[calc(100vh-56px)] overflow-y-auto px-3 py-3 select-none text-[#0f0f0f] dark:text-[#f1f1f1]">
      {/* Primary Section */}
      <div className="space-y-0.5">
        <SidebarItem icon={<Home className="w-5 h-5" />} label="Home" to="/" />
        <SidebarItem icon={<Film className="w-5 h-5 text-[#FF0033]" />} label="Shorts" to="/shorts" />
        <SidebarItem icon={<Tv className="w-5 h-5" />} label="Subscriptions" to="/subscriptions" />
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800 my-3" />

      {/* Library / "You" Section */}
      <div>
        <div className="flex items-center justify-between px-3 py-2 text-base font-semibold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition">
          <span className="flex items-center gap-1.5">
            You <ChevronRight className="w-4 h-4 text-neutral-500" />
          </span>
        </div>
        <div className="space-y-0.5 mt-1">
          <SidebarItem icon={<History className="w-5 h-5" />} label="History" to="/history" />
          <SidebarItem icon={<ListVideo className="w-5 h-5" />} label="Playlists" to="/playlists" />
          <SidebarItem icon={<SquarePlay className="w-5 h-5" />} label="Your videos" to="/studio/videos" />
          <SidebarItem icon={<Clock className="w-5 h-5" />} label="Watch Later" to="/playlist?list=WL" />
          <SidebarItem icon={<ThumbsUp className="w-5 h-5" />} label="Liked videos" to="/playlist?list=LL" />
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800 my-3" />

      {/* Subscriptions Section */}
      <div>
        <h3 className="px-3 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
          Subscriptions
        </h3>
        <div className="space-y-1 mt-1">
          {SAMPLE_CHANNELS.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center gap-5 px-3 py-2 rounded-xl text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
            >
              <Avatar src={ch.avatar} name={ch.name} size="xs" />
              <span className="truncate flex-1">{ch.name}</span>
              {ch.isLive && (
                <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-ping" />
              )}
              {ch.hasNewVideo && !ch.isLive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800 my-3" />

      {/* Explore Section */}
      <div>
        <h3 className="px-3 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
          Explore
        </h3>
        <div className="space-y-0.5 mt-1">
          <SidebarItem icon={<Flame className="w-5 h-5" />} label="Trending" to="/explore/trending" />
          <SidebarItem icon={<Music2 className="w-5 h-5" />} label="Music" to="/explore/music" />
          <SidebarItem icon={<Gamepad2 className="w-5 h-5" />} label="Gaming" to="/explore/gaming" />
          <SidebarItem icon={<Trophy className="w-5 h-5" />} label="Sports" to="/explore/sports" />
          <SidebarItem icon={<Radio className="w-5 h-5" />} label="Podcasts" to="/explore/podcasts" />
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800 my-3" />

      {/* Settings & Help */}
      <div className="space-y-0.5">
        <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" to="/settings" />
        <SidebarItem icon={<Flag className="w-5 h-5" />} label="Report history" to="/report" />
        <SidebarItem icon={<HelpCircle className="w-5 h-5" />} label="Help" to="/help" />
        <SidebarItem icon={<MessageSquareWarning className="w-5 h-5" />} label="Send feedback" to="/feedback" />
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800 my-3" />

      {/* Footer Info */}
      <div className="px-3 py-2 text-xs text-[#606060] dark:text-[#aaaaaa] space-y-3 leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span>About</span>
          <span>Press</span>
          <span>Copyright</span>
          <span>Contact us</span>
          <span>Creators</span>
          <span>Advertise</span>
          <span>Developers</span>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span>Terms</span>
          <span>Privacy</span>
          <span>Policy & Safety</span>
          <span>How VidTube works</span>
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-600 pt-1">
          © 2026 VidTube LLC — Internship Foundation
        </p>
      </div>
    </aside>
  );

  // If Mobile Screen or Watch Page, render drawer with backdrop
  if (isMobileScreen || isWatchPage) {
    if (!isMobileOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />
        {/* Drawer Content */}
        <div className="relative z-10 bg-white dark:bg-[#0f0f0f] shadow-2xl">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop expanded fixed sidebar
  return (
    <div className="fixed top-14 left-0 bottom-0 z-40 bg-white dark:bg-[#0f0f0f] border-r border-neutral-200 dark:border-neutral-800 transition-colors">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;
