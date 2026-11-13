/**
 * Informative Placeholder Page for Upcoming Phases
 * Displays YouTube-styled message explaining the roadmap phase
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

export const PlaceholderPage = ({ title = 'Section', phase = 2 }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[#FF0033] mb-4">
        <Clock className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-[#FF0033] bg-[#FF0033]/10 px-3 py-1 rounded-full mb-2">
        Scheduled for Phase {phase}
      </span>
      <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
        {title}
      </h1>
      <p className="text-sm text-[#606060] dark:text-[#aaaaaa] max-w-md mb-6">
        The core foundation, architecture, and routes for this section are established in Phase 1. Full interactive features will be implemented in Phase {phase} per the roadmap.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white hover:bg-neutral-800 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-neutral-200 text-sm font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </Link>
    </div>
  );
};

export default PlaceholderPage;
