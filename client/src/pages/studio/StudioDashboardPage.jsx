/**
 * Studio Dashboard Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import studioService from '../../services/studioService';

export const StudioDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studioService.getDashboard();
      if (res.success) {
        setDashboard(res.data);
      } else {
        setError(res.message || 'Failed to load studio dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Creator Studio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white dark:bg-[#282828] border border-gray-200 dark:border-gray-800 rounded-xl text-center shadow-sm">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Failed to Load Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error || 'An unexpected error occurred'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { channel, overview28d, latestContent, topVideos, topShorts, recentComments, recentSubscribers } = dashboard;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header & Channel Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow overflow-hidden">
            {channel.avatar ? (
              <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              channel.name?.[0]?.toUpperCase() || 'C'
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              {channel.name}
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                Creator
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              @{channel.handle} • <span className="font-semibold text-gray-800 dark:text-gray-200">{channel.subscribersCount.toLocaleString()}</span> subscribers • <span className="font-semibold text-gray-800 dark:text-gray-200">{channel.videosCount + channel.shortsCount}</span> uploads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Content</span>
          </Link>
          <Link
            to={`/channel/@${channel.handle}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors"
          >
            <span>View Channel</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Channel Analytics Cards (28-day real metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Views */}
        <div className="bg-white dark:bg-[#282828] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Views (28d)</span>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {overview28d.views.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total channel views: {channel.totalViews.toLocaleString()}</p>
          </div>
        </div>

        {/* Card 2: Watch Time */}
        <div className="bg-white dark:bg-[#282828] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Watch Time (Hours)</span>
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {overview28d.watchTimeHours}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{overview28d.watchTimeSeconds.toLocaleString()} total seconds watched</p>
          </div>
        </div>

        {/* Card 3: Subscribers Gained */}
        <div className="bg-white dark:bg-[#282828] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Subscribers (28d)</span>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              +{overview28d.subscribersGained}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current total: {channel.subscribersCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Card 4: Quick Link to Analytics */}
        <Link
          to="/studio/analytics"
          className="bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30 p-5 rounded-xl border border-red-200 dark:border-red-900/50 transition-colors flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Channel Analytics</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">See detailed charts & reports</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Timeseries, audience breakdown & CSV exports</p>
          </div>
        </Link>
      </div>

      {/* Main Grid: Latest Content & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Latest Video & Top Performing Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Published Content */}
          <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Latest Published Content</h2>
              <Link to="/studio/content" className="text-xs font-semibold text-red-600 hover:text-red-700">
                Go to Content
              </Link>
            </div>

            {latestContent ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-56 aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                  {latestContent.thumbnailUrl ? (
                    <img src={latestContent.thumbnailUrl} alt={latestContent.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No thumbnail</div>
                  )}
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">
                    {latestContent.contentType === 'Short' ? 'SHORT' : `${Math.floor((latestContent.duration || 0) / 60)}:${String((latestContent.duration || 0) % 60).padStart(2, '0')}`}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${latestContent.contentType === 'Short' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {latestContent.contentType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(latestContent.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {latestContent.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      Views: <span className="font-bold text-gray-900 dark:text-white">{(latestContent.views || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      Likes: <span className="font-bold text-gray-900 dark:text-white">{(latestContent.likesCount || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      Comments: <span className="font-bold text-gray-900 dark:text-white">{(latestContent.commentsCount || 0).toLocaleString()}</span>
                    </div>
                    <Link
                      to={`/studio/content/${latestContent._id}/analytics`}
                      className="text-red-600 hover:text-red-700 font-semibold"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No videos or shorts uploaded yet.{' '}
                <Link to="/upload" className="text-red-600 font-semibold hover:underline">
                  Upload your first video
                </Link>
              </div>
            )}
          </div>

          {/* Top Videos */}
          <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Top Videos (All Time)</h2>
            {topVideos.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topVideos.map((vid, idx) => (
                  <div key={vid._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
                      <div className="w-16 h-10 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden shrink-0">
                        {vid.thumbnailUrl && <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />}
                      </div>
                      <Link to={`/watch/${vid._id}`} className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-red-600 truncate">
                        {vid.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      <span>{(vid.views || 0).toLocaleString()} views</span>
                      <Link to={`/studio/content/${vid._id}/analytics`} className="text-red-600 hover:underline font-semibold">
                        Analytics
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No video views recorded yet.</p>
            )}
          </div>

          {/* Top Shorts */}
          {topShorts.length > 0 && (
            <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Top Shorts (All Time)</h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topShorts.map((short, idx) => (
                  <div key={short._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
                      <div className="w-10 h-14 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden shrink-0">
                        {short.thumbnailUrl && <img src={short.thumbnailUrl} alt={short.title} className="w-full h-full object-cover" />}
                      </div>
                      <Link to={`/shorts/${short._id}`} className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-red-600 truncate">
                        {short.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      <span>{(short.views || 0).toLocaleString()} views</span>
                      <Link to={`/studio/content/${short._id}/analytics`} className="text-red-600 hover:underline font-semibold">
                        Analytics
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Comments & Recent Subscribers */}
        <div className="space-y-6">
          {/* Recent Comments */}
          <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Comments</h2>
              <Link to="/studio/comments" className="text-xs font-semibold text-red-600 hover:text-red-700">
                View all
              </Link>
            </div>

            {recentComments.length > 0 ? (
              <div className="space-y-4">
                {recentComments.map((c) => (
                  <div key={c._id} className="text-sm border-b border-gray-100 dark:border-gray-800/80 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {c.user?.avatar ? <img src={c.user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : c.user?.name?.[0] || 'U'}
                      </div>
                      <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">{c.user?.name || 'User'}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 pl-8">"{c.text}"</p>
                    <p className="text-[10px] text-gray-400 pl-8 mt-1 truncate">on: {c.contentTitle}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No comments received yet.</p>
            )}
          </div>

          {/* Recent Subscribers */}
          <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Recent Subscribers</h2>
            {recentSubscribers.length > 0 ? (
              <div className="space-y-3">
                {recentSubscribers.map((s) => (
                  <div key={s._id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">
                        {s.user?.avatar ? <img src={s.user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : s.user?.name?.[0] || 'S'}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{s.user?.name || 'Subscriber'}</p>
                        <p className="text-gray-400 text-[10px]">@{s.user?.username || 'user'}</p>
                      </div>
                    </div>
                    <span className="text-gray-400 shrink-0">{new Date(s.subscribedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No subscribers yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioDashboardPage;
