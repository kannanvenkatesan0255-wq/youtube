/**
 * Sidebar Navigation Item
 * Consistent hover, active states, and Lucide icons matching YouTube
 */
import React from 'react';
import { NavLink } from 'react-router-dom';

export const SidebarItem = ({
  icon,
  label,
  to = '#',
  isActive = false,
  badge = null,
  onClick
}) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive: isCurrentActive }) => {
        const active = isActive || isCurrentActive;
        return `flex items-center gap-6 px-3 py-2.5 rounded-xl text-sm font-normal transition-colors select-none ${
          active
            ? 'bg-neutral-100 dark:bg-neutral-800 font-medium text-[#0f0f0f] dark:text-[#f1f1f1]'
            : 'text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`;
      }}
    >
      <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <span className="truncate flex-1 tracking-tight">{label}</span>
      {badge && <span className="flex-shrink-0">{badge}</span>}
    </NavLink>
  );
};

export default SidebarItem;
