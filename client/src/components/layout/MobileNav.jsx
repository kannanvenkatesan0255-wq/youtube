/**
 * VidTube Mobile Bottom Navigation
 * Matches YouTube's mobile app bottom bar
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Film, PlusCircle, Tv, User } from 'lucide-react';

export const MobileNav = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-12 bg-white dark:bg-[#0f0f0f] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around px-2 select-none">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] ${
            isActive
              ? 'text-[#0f0f0f] dark:text-[#f1f1f1] font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/shorts"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] ${
            isActive
              ? 'text-[#0f0f0f] dark:text-[#f1f1f1] font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        <Film className="w-5 h-5 mb-0.5 text-[#FF0033]" />
        <span>Shorts</span>
      </NavLink>

      <button
        type="button"
        className="flex items-center justify-center p-1 text-[#0f0f0f] dark:text-[#f1f1f1]"
        title="Create"
      >
        <PlusCircle className="w-8 h-8 stroke-[1.5]" />
      </button>

      <NavLink
        to="/subscriptions"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] ${
            isActive
              ? 'text-[#0f0f0f] dark:text-[#f1f1f1] font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        <Tv className="w-5 h-5 mb-0.5" />
        <span>Subscriptions</span>
      </NavLink>

      <NavLink
        to="/you"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] ${
            isActive
              ? 'text-[#0f0f0f] dark:text-[#f1f1f1] font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>You</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
