/**
 * Single Content Deep-Dive Analytics Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import studioService from '../../services/studioService';

export const StudioContentAnalyticsPage = () => {
  const { contentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    fetchContentAnalytics();
  }, [contentId]);

  const fetchContentAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studioService.getContentAnalytics(contentId);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch content analytics');
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

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white dark:bg-[#282828] border border-gray-200 dark:border-gray-800 rounded-xl text-center shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Analytics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error || 'Content not found'}</p>
        <Link to="/studio/content" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">
          Back to Content
        </Link>
      </div>
    );
  }

  const { content, timeseries28d } = data;

  // Chart Geometry
  const chartData = timeseries28d || [];
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  const maxValue = Math.max(1, ...(chartData.map((d) => d.views) || [0]));

  const points = chartData.map((d, index) => {
    const x = paddingX + (index / Math.max(1, chartData.length - 1)) * innerWidth;
    const y = svgHeight - paddingY - (d.views / maxValue) * innerHeight;
    return { x, y, date: d.date, views: d.views };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `M ${points[0].x},${svgHeight - paddingY} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${svgHeight - paddingY} Z`
    : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/studio/content"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Content List</span>
        </Link>

        <Link
          to={content.contentType === 'Short' ? `/shorts/${content._id}` : `/watch/${content._id}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
        >
          <span>View on VidTube</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>

      {/* Content Header Card */}
      <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-5">
        <div className="relative w-full md:w-56 aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
          {content.thumbnailUrl ? (
            <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Preview</div>
          )}
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">
            {content.contentType === 'Short' ? 'SHORT' : `${Math.floor((content.duration || 0) / 60)}:${String((content.duration || 0) % 60).padStart(2, '0')}`}
          </span>
        </div>

        <div className="flex-1 space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${content.contentType === 'Short' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {content.contentType}
            </span>
            <span className="text-xs text-gray-500">
              Published on {new Date(content.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs font-semibold capitalize text-gray-600 dark:text-gray-300">
              • {content.visibility}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
            {content.title}
          </h1>

          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {content.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#282828] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Total Views</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {(content.views || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-[#282828] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Likes</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {(content.likesCount || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-[#282828] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Comments</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {(content.commentsCount || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-[#282828] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Duration</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {Math.floor((content.duration || 0) / 60)}m {(content.duration || 0) % 60}s
          </div>
        </div>
      </div>

      {/* 28-day Views Trend Interactive Chart */}
      <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Views (Last 28 Days)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily view progression for this content.</p>
          </div>
          {hoveredPoint && (
            <div className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold shadow animate-fade-in">
              {hoveredPoint.date}: {hoveredPoint.views.toLocaleString()} views
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-60 select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="singleChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Guide Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = svgHeight - paddingY - ratio * innerHeight;
              const val = Math.round(ratio * maxValue);
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-gray-100 dark:text-gray-800"
                    strokeWidth="1"
                    strokeDasharray={ratio > 0 ? '3 3' : 'none'}
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-gray-400"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path d={areaPath} fill="url(#singleChartGradient)" />

            {/* Polyline stroke */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />

            {/* Interactive dots */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.date === p.date ? 6 : 3}
                className="cursor-pointer fill-red-600 stroke-white dark:stroke-[#282828] stroke-2 transition-all hover:r-6"
                onMouseEnter={() => setHoveredPoint(p)}
              />
            ))}

            {/* Date labels */}
            {points.length > 0 && (
              <>
                <text
                  x={points[0].x}
                  y={svgHeight - 10}
                  textAnchor="start"
                  className="text-[10px] fill-gray-400 font-medium"
                >
                  {points[0].date}
                </text>
                <text
                  x={points[points.length - 1].x}
                  y={svgHeight - 10}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400 font-medium"
                >
                  {points[points.length - 1].date}
                </text>
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StudioContentAnalyticsPage;
