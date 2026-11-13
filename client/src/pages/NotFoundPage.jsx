/**
 * YouTube-style 404 Not Found Page
 */
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/common/Logo';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center select-none">
      <div className="mb-6 opacity-90 scale-125">
        <Logo showCountryCode={false} />
      </div>
      <h1 className="text-3xl font-extrabold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
        404
      </h1>
      <h2 className="text-lg font-medium text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
        This page isn't available. Sorry about that.
      </h2>
      <p className="text-sm text-[#606060] dark:text-[#aaaaaa] max-w-sm mb-6">
        Try searching for something else or returning to the VidTube homepage.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-full bg-[#0f0f0f] text-white hover:bg-neutral-800 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-neutral-200 text-sm font-semibold transition"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
