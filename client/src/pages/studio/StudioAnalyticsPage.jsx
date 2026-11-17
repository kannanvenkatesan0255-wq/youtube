/**
 * Creator Studio Channel Analytics Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 * Real database aggregations, interactive SVG charts, zero-fill continuity, audience breakdown, CSV export
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import studioService from '../../services/studioService';

export const StudioAnalyticsPage = () => {
  const [period, setPeriod] = useState('28d');
  const [activeMetric, setActiveMetric] = useState('views');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'content' | 'audience'
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [topContent, setTopContent] = useState([]);
  const [audience, setAudience] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAllAnalytics();
  }, [period]);

  useEffect(() => {
    fetchTimeseriesData();
  }, [activeMetric, period]);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovRes, tsRes, topRes, audRes] = await Promise.all([
        studioService.getAnalyticsOverview({ period }),
        studioService.getTimeseries({ period, metric: activeMetric }),
        studioService.getTopContent({ period, limit: 10 }),
        studioService.getAudience({ period })
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (tsRes.success) setTimeseries(tsRes.data);
      if (topRes.success) setTopContent(topRes.data);
      if (audRes.success) setAudience(audRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load channel analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeseriesData = async () => {
    try {
      setChartLoading(true);
      const res = await studioService.getTimeseries({ period, metric: activeMetric });
      if (res.success) {
        setTimeseries(res.data);
      }
    } catch (err) {
      console.error('Failed to update chart metric:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const handleExportCSV = async (type = 'overview') => {
    try {
      setExporting(true);
      await studioService.exportAnalyticsCSV(type, period);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white dark:bg-[#282828] border border-gray-200 dark:border-gray-800 rounded-xl text-center shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Analytics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchAllAnalytics}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics } = overview;

  // SVG Chart Geometry calculations
  const chartData = timeseries?.data || [];
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  const maxValue = Math.max(1, ...(chartData.map((d) => d.value) || [0]));

  const points = chartData.map((d, index) => {
    const x = paddingX + (index / Math.max(1, chartData.length - 1)) * innerWidth;
    const y = svgHeight - paddingY - (d.value / maxValue) * innerHeight;
    return { x, y, date: d.date, value: d.value };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `M ${points[0].x},${svgHeight - paddingY} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${svgHeight - paddingY} Z`
    : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Channel Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Real performance metrics and audience insights derived from database records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white dark:bg-[#282828] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 shadow-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last 365 days</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={() => handleExportCSV('overview')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            title="Download RFC 4180 CSV report"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'content'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Content Performance
        </button>
        <button
          onClick={() => setActiveTab('audience')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'audience'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Audience
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Interactive Metric Switcher Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Metric 1: Views */}
            <button
              onClick={() => setActiveMetric('views')}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeMetric === 'views'
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#282828] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Views</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {metrics.views.current.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
                <span className={metrics.views.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                  {metrics.views.diff >= 0 ? `+${metrics.views.diff}` : metrics.views.diff} ({metrics.views.percentChange}%)
                </span>
                <span className="text-gray-400 text-[10px]">vs prev</span>
              </div>
            </button>

            {/* Metric 2: Watch Time */}
            <button
              onClick={() => setActiveMetric('watchTime')}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeMetric === 'watchTime'
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#282828] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Watch Time (h)</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {metrics.watchTimeHours.current}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
                <span className={metrics.watchTimeHours.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                  {metrics.watchTimeHours.diff >= 0 ? `+${metrics.watchTimeHours.diff}` : metrics.watchTimeHours.diff} ({metrics.watchTimeHours.percentChange}%)
                </span>
              </div>
            </button>

            {/* Metric 3: Subscribers */}
            <button
              onClick={() => setActiveMetric('subscribers')}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeMetric === 'subscribers'
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#282828] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Subscribers</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {metrics.subscribersNet.current >= 0 ? `+${metrics.subscribersNet.current}` : metrics.subscribersNet.current}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
                <span className={metrics.subscribersNet.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                  {metrics.subscribersNet.diff >= 0 ? `+${metrics.subscribersNet.diff}` : metrics.subscribersNet.diff}
                </span>
              </div>
            </button>

            {/* Metric 4: Likes */}
            <button
              onClick={() => setActiveMetric('likes')}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeMetric === 'likes'
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#282828] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Likes</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {metrics.likes.current.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
                <span className={metrics.likes.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                  {metrics.likes.diff >= 0 ? `+${metrics.likes.diff}` : metrics.likes.diff}
                </span>
              </div>
            </button>

            {/* Metric 5: Comments */}
            <button
              onClick={() => setActiveMetric('comments')}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeMetric === 'comments'
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#282828] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Comments</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {metrics.comments.current.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
                <span className={metrics.comments.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                  {metrics.comments.diff >= 0 ? `+${metrics.comments.diff}` : metrics.comments.diff}
                </span>
              </div>
            </button>
          </div>

          {/* Interactive SVG Timeseries Chart */}
          <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white capitalize">
                  {activeMetric} over time ({period})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Daily aggregated values with zero-fill continuity. Hover over points for exact daily data.
                </p>
              </div>

              {hoveredPoint && (
                <div className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold shadow animate-fade-in">
                  {hoveredPoint.date}: {hoveredPoint.value.toLocaleString()} {activeMetric}
                </div>
              )}
            </div>

            {chartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : points.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-64 select-none"
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <path d={areaPath} fill="url(#chartGradient)" />

                  {/* Polyline stroke */}
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

                  {/* Interactive circle dots */}
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

                  {/* Date labels on bottom */}
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
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-gray-500">
                No timeseries events recorded in this period.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Top Performing Content</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Content ranked by total views in {period}.</p>
            </div>
            <button
              onClick={() => handleExportCSV('content')}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Export Content CSV
            </button>
          </div>

          {topContent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th className="py-3 px-4">Content</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Views</th>
                    <th className="py-3 px-4">Likes</th>
                    <th className="py-3 px-4">Comments</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {topContent.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="w-14 h-9 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden shrink-0">
                          {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="truncate max-w-xs font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.contentType === 'Short' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {item.contentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        {(item.views || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {(item.likesCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {(item.commentsCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/studio/content/${item._id}/analytics`}
                          className="text-red-600 hover:text-red-700 font-semibold text-xs"
                        >
                          Deep-Dive
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-sm text-gray-500">No content available for performance ranking.</p>
          )}
        </div>
      )}

      {activeTab === 'audience' && audience && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Content Distribution: Videos vs Shorts */}
          <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Content Type Distribution</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total views share between Long-form Videos and Shorts.</p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Videos ({audience.contentDistribution.videos.count} uploads)</span>
                  <span>{audience.contentDistribution.videos.percent}% ({audience.contentDistribution.videos.views.toLocaleString()} views)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${audience.contentDistribution.videos.percent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Shorts ({audience.contentDistribution.shorts.count} uploads)</span>
                  <span>{audience.contentDistribution.shorts.percent}% ({audience.contentDistribution.shorts.views.toLocaleString()} views)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full transition-all" style={{ width: `${audience.contentDistribution.shorts.percent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Subscribers vs Non-Subscribers Views */}
          <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Viewer Loyalty Split</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ratio of views originating from subscribed vs non-subscribed viewers.</p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Subscribers</span>
                  <span>{audience.subscriberVsNonSubscriber.subscriberPercent}% ({audience.subscriberVsNonSubscriber.subscriberViews.toLocaleString()} views)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${audience.subscriberVsNonSubscriber.subscriberPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Non-Subscribers</span>
                  <span>{audience.subscriberVsNonSubscriber.nonSubscriberPercent}% ({audience.subscriberVsNonSubscriber.nonSubscriberViews.toLocaleString()} views)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-gray-400 dark:bg-gray-600 h-full rounded-full transition-all" style={{ width: `${audience.subscriberVsNonSubscriber.nonSubscriberPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioAnalyticsPage;
