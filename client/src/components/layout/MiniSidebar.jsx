/**
 * VidTube Collapsed Mini Sidebar (Desktop 72px width)
 * Matches YouTube's desktop collapsed sidebar layout
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Film, Tv, UserCheck } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';

export const MiniSidebar = () => {
  const { isCollapsed, isMobileScreen } = useSidebar();

  // MiniSidebar is only visible on desktop/tablet when collapsed is true
  if (!isCollapsed || isMobileScreen) {
    return null;
  }

  const items = [
    { label: 'Home', icon: <Home className="w-5 h-5" />, to: '/' },
    { label: 'Shorts', icon: <Film className="w-5 h-5 text-[#FF0033]" />, to: '/shorts' },
    { label: 'Subscriptions', icon: <Tv className="w-5 h-5" />, to: '/subscriptions' },
    { label: 'You', icon: <UserCheck className="w-5 h-5" />, to: '/you' }
  ];

  return (
    <aside className="fixed top-14 left-0 bottom-0 z-40 w-[72px] bg-white dark:bg-[#0f0f0f] border-r border-neutral-200 dark:border-neutral-800 py-3 flex flex-col items-center select-none transition-colors">
      <div className="flex flex-col gap-1 w-full px-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-4 px-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-[#0f0f0f] dark:text-[#f1f1f1] font-medium'
                  : 'text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`
            }
          >
            <div className="mb-1">{item.icon}</div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default MiniSidebar;
