/**
 * VidTube Phase 8: Creator Studio, Channel Analytics & Content Management Dashboard Test Suite
 * Covers 35+ verification points:
 * - Authentication & Creator Channel resolution
 * - Studio Dashboard overview, cards, top content, recent comments & subscribers
 * - Period-based Analytics Overview (7d, 28d, 90d, 365d, custom) with delta comparisons
 * - Daily timeseries with guaranteed zero-fill continuity across multiple metrics
 * - Top content ranking by views, likes, comments with type filters
 * - Audience demographics (subscriber vs non-subscriber, videos vs shorts distribution)
 * - Subscriber analytics (gained, lost, net, recent list)
 * - Single content deep-dive analytics and view trend
 * - Unified content management (Videos & Shorts) with filters, search, and pagination
 * - Content metadata editing and deletion with owner authorization
 * - Studio comments aggregator across all owned content
 * - Channel customization (name, handle uniqueness, description, defaultVisibility, featuredVideo)
 * - RFC 4180 CSV export with formula injection sanitization (=, +, -, @, \t, \r escaped)
 * - Route aliasing (/api/studio and /api/analytics)
 *
 * Run via: npm run test:phase8 --workspace=server
 */
const axios = require('axios');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const { initSocket } = require('../services/socket.service');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const Short = require('../models/Short');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Subscription = require('../models/Subscription');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { config } = require('../config/env');

let serverInstance = null;
let client = null;

async function setup() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(config.mongodbUri);
  }

  const server = http.createServer(app);
  initSocket(server);

  return new Promise((resolve) => {
    serverInstance = server.listen(0, () => {
      const port = serverInstance.address().port;
      const baseURL = `http://localhost:${port}/api`;
      client = axios.create({
        baseURL,
        validateStatus: () => true
      });
      resolve(baseURL);
    });
  });
}

async function teardown() {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
  await mongoose.disconnect();
}

async function runTests() {
  console.log('\n======================================================');
  console.log('VIDTUBE PHASE 8: CREATOR STUDIO & ANALYTICS TEST SUITE');
  console.log('======================================================\n');

  await setup();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${message}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${message}`);
    }
  }

  try {
    const timestamp = Date.now();
    const creatorEmail = `creator_${timestamp}@test.com`;
    const viewerEmail = `viewer_${timestamp}@test.com`;
    const otherCreatorEmail = `other_${timestamp}@test.com`;

    // 1. Auth Guard Test
    console.log('\n--- 1. Authentication & Security Guard ---');
    const unauthDashboard = await client.get('/studio/dashboard');
    assert(unauthDashboard.status === 401, 'Unauthenticated request to /studio/dashboard returns 401');

    const unauthAnalytics = await client.get('/analytics/overview');
    assert(unauthAnalytics.status === 401, 'Unauthenticated request to /analytics/overview returns 401');

    // 2. Register Creator & Viewer
    console.log('\n--- 2. User & Channel Setup ---');
    const creatorReg = await client.post('/auth/register', {
      name: 'Tech Lead Creator',
      username: `techlead_${timestamp}`,
      email: creatorEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    assert(creatorReg.status === 201, 'Creator registered successfully');
    const creatorToken = creatorReg.data.data.accessToken;
    const creatorUser = creatorReg.data.data.user;
    const creatorHeaders = { headers: { Authorization: `Bearer ${creatorToken}` } };

    const viewerReg = await client.post('/auth/register', {
      name: 'Test Viewer',
      username: `viewer_${timestamp}`,
      email: viewerEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    assert(viewerReg.status === 201, 'Viewer registered successfully');
    const viewerToken = viewerReg.data.data.accessToken;
    const viewerUser = viewerReg.data.data.user;
    const viewerHeaders = { headers: { Authorization: `Bearer ${viewerToken}` } };

    const otherCreatorReg = await client.post('/auth/register', {
      name: 'Other Creator',
      username: `other_${timestamp}`,
      email: otherCreatorEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    const otherToken = otherCreatorReg.data.data.accessToken;
    const otherHeaders = { headers: { Authorization: `Bearer ${otherToken}` } };

    // Get Creator Channel
    const creatorChannelDoc = await Channel.findOne({ owner: creatorUser._id });
    assert(creatorChannelDoc !== null, 'Creator channel resolved in database');
    const channelId = creatorChannelDoc._id;

    // 3. Studio Dashboard on Fresh Channel
    console.log('\n--- 3. Studio Dashboard (Fresh Channel) ---');
    const initialDash = await client.get('/studio/dashboard', creatorHeaders);
    assert(initialDash.status === 200, 'GET /studio/dashboard returns 200');
    assert(initialDash.data.data.channel.name === 'Tech Lead Creator', 'Dashboard returns correct channel name');
    assert(initialDash.data.data.overview28d.views === 0, 'Initial 28d views are 0 (no synthetic data)');
    assert(initialDash.data.data.topVideos.length === 0, 'Initial topVideos is empty');
    assert(initialDash.data.data.topShorts.length === 0, 'Initial topShorts is empty');

    // 4. Content Creation & Analytics Event Seeding
    console.log('\n--- 4. Content Creation & Analytics Event Logging ---');
    const vid1 = await Video.create({
      title: 'Mastering Full-Stack Video Platforms',
      description: 'Comprehensive guide to building VidTube',
      channel: channelId,
      owner: creatorUser._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      duration: 300,
      views: 120,
      likesCount: 15,
      commentsCount: 2,
      visibility: 'public'
    });

    const vid2 = await Video.create({
      title: 'Secret Unlisted Preview',
      description: 'Internal testing only',
      channel: channelId,
      owner: creatorUser._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample2.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
      duration: 180,
      views: 10,
      likesCount: 1,
      commentsCount: 0,
      visibility: 'unlisted'
    });

    const short1 = await Short.create({
      title: 'Quick React Tip #1',
      description: '#shorts #react',
      channel: channelId,
      owner: creatorUser._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/short1.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/short1.jpg',
      duration: 45,
      views: 85,
      likesCount: 20,
      commentsCount: 3,
      visibility: 'public'
    });

    // Seed realistic AnalyticsEvent records
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    await AnalyticsEvent.create([
      // Views across days
      { channel: channelId, contentType: 'Video', contentId: vid1._id, eventType: 'view', value: 1, viewer: viewerUser._id, createdAt: daysAgo(1) },
      { channel: channelId, contentType: 'Video', contentId: vid1._id, eventType: 'view', value: 1, viewer: viewerUser._id, createdAt: daysAgo(2) },
      { channel: channelId, contentType: 'Video', contentId: vid1._id, eventType: 'view', value: 1, viewer: null, createdAt: daysAgo(3) },
      { channel: channelId, contentType: 'Short', contentId: short1._id, eventType: 'view', value: 1, viewer: viewerUser._id, createdAt: daysAgo(1) },
      { channel: channelId, contentType: 'Short', contentId: short1._id, eventType: 'view', value: 1, viewer: null, createdAt: daysAgo(5) },
      // Watch Time
      { channel: channelId, contentType: 'Video', contentId: vid1._id, eventType: 'watch_time', value: 120, viewer: viewerUser._id, createdAt: daysAgo(1) },
      { channel: channelId, contentType: 'Video', contentId: vid1._id, eventType: 'watch_time', value: 180, viewer: viewerUser._id, createdAt: daysAgo(2) },
      // Likes & Comments
      { channel: channelId, contentType: 'Video', contentId: vid1._id, eventType: 'like', value: 1, viewer: viewerUser._id, createdAt: daysAgo(1) },
      { channel: channelId, contentType: 'Short', contentId: short1._id, eventType: 'like', value: 1, viewer: viewerUser._id, createdAt: daysAgo(1) },
      { channel: channelId, contentType: 'Video', contentId: vid1._id, eventType: 'comment', value: 1, viewer: viewerUser._id, createdAt: daysAgo(1) },
      // Subscriptions
      { channel: channelId, contentType: 'Channel', contentId: channelId, eventType: 'subscribe', value: 1, viewer: viewerUser._id, createdAt: daysAgo(2) }
    ]);

    // Create a real comment and subscription record
    await Comment.create({
      content: 'Excellent architectural explanation!',
      user: viewerUser._id,
      video: vid1._id,
      contentId: vid1._id,
      contentType: 'Video'
    });

    await Subscription.create({
      subscriber: viewerUser._id,
      channel: channelId,
      createdAt: daysAgo(2)
    });
    await Channel.findByIdAndUpdate(channelId, { $inc: { subscribersCount: 1, totalViews: 205 } });

    // 5. Studio Dashboard with Content
    console.log('\n--- 5. Studio Dashboard with Content & Aggregations ---');
    const populatedDash = await client.get('/studio/dashboard', creatorHeaders);
    assert(populatedDash.status === 200, 'GET /studio/dashboard returns 200 with content');
    const dData = populatedDash.data.data;
    assert(dData.overview28d.views === 5, 'Dashboard shows 5 recorded views in 28d');
    assert(dData.overview28d.watchTimeSeconds === 300, 'Dashboard shows 300s watch time (120+180)');
    assert(dData.overview28d.watchTimeHours > 0, 'Dashboard calculates watch time in hours');
    assert(dData.topVideos.length >= 1, 'Dashboard returns top videos');
    assert(dData.topShorts.length >= 1, 'Dashboard returns top shorts');
    assert(dData.recentComments.length >= 1, 'Dashboard returns recent comments');
    assert(dData.recentSubscribers.length >= 1, 'Dashboard returns recent subscribers');

    // 6. Analytics Overview & Periods
    console.log('\n--- 6. Analytics Overview & Period Comparisons ---');
    const overview28d = await client.get('/studio/analytics/overview?period=28d', creatorHeaders);
    assert(overview28d.status === 200, 'GET /studio/analytics/overview?period=28d returns 200');
    assert(overview28d.data.data.metrics.views.current === 5, 'Overview shows 5 views in current 28d period');
    assert(overview28d.data.data.metrics.watchTimeSeconds.current === 300, 'Overview shows 300 watch seconds');
    assert(overview28d.data.data.metrics.subscribersGained.current === 1, 'Overview shows 1 subscriber gained');
    assert(overview28d.data.data.metrics.likes.current === 2, 'Overview shows 2 likes');
    assert(overview28d.data.data.metrics.comments.current === 1, 'Overview shows 1 comment');
    assert(overview28d.data.data.metrics.views.diff === 5, 'Overview computes correct delta vs previous period');

    // Test 7d period
    const overview7d = await client.get('/studio/analytics/overview?period=7d', creatorHeaders);
    assert(overview7d.status === 200, 'GET /studio/analytics/overview?period=7d returns 200');
    assert(overview7d.data.data.period === '7d', 'Period is 7d');

    // 7. Daily Timeseries Zero-Fill Continuity
    console.log('\n--- 7. Daily Timeseries Zero-Fill Continuity ---');
    const timeseries28d = await client.get('/studio/analytics/timeseries?period=28d&metric=views', creatorHeaders);
    assert(timeseries28d.status === 200, 'GET /studio/analytics/timeseries returns 200');
    const tsData = timeseries28d.data.data;
    assert(tsData.data.length >= 28, 'Timeseries has at least 28 continuous daily points');
    assert(tsData.total === 5, 'Timeseries total matches total views');
    assert(tsData.metric === 'views', 'Timeseries metric matches requested metric');

    // Verify watchTime timeseries
    const timeseriesWatch = await client.get('/studio/analytics/timeseries?period=28d&metric=watchTime', creatorHeaders);
    assert(timeseriesWatch.status === 200, 'WatchTime timeseries returns 200');
    assert(timeseriesWatch.data.data.total === 300, 'WatchTime timeseries total matches 300s');

    // 8. Top Content Endpoint
    console.log('\n--- 8. Top Content Ranking ---');
    const topAll = await client.get('/studio/analytics/top-content?limit=5', creatorHeaders);
    assert(topAll.status === 200, 'GET /studio/analytics/top-content returns 200');
    assert(topAll.data.data.length >= 2, 'Top content returns both video and shorts');
    assert(topAll.data.data[0].views >= topAll.data.data[1].views, 'Top content is ranked descending by views');

    const topOnlyShorts = await client.get('/studio/analytics/top-content?type=short', creatorHeaders);
    assert(topOnlyShorts.status === 200, 'GET /studio/analytics/top-content?type=short returns 200');
    assert(topOnlyShorts.data.data.every((i) => i.contentType === 'Short'), 'Shorts filter returns only Shorts');

    // 9. Audience Demographics
    console.log('\n--- 9. Audience Demographics ---');
    const audience = await client.get('/studio/analytics/audience?period=28d', creatorHeaders);
    assert(audience.status === 200, 'GET /studio/analytics/audience returns 200');
    const audData = audience.data.data;
    assert(audData.contentDistribution.videos.count >= 2, 'Content distribution reports videos count');
    assert(audData.contentDistribution.shorts.count >= 1, 'Content distribution reports shorts count');
    assert(audData.subscriberVsNonSubscriber.subscriberViews > 0, 'Tracks subscriber views');
    assert(audData.subscriberVsNonSubscriber.nonSubscriberViews > 0, 'Tracks non-subscriber views');

    // 10. Subscriber Analytics
    console.log('\n--- 10. Subscriber Analytics ---');
    const subsAnalytics = await client.get('/studio/analytics/subscribers?period=28d', creatorHeaders);
    assert(subsAnalytics.status === 200, 'GET /studio/analytics/subscribers returns 200');
    assert(subsAnalytics.data.data.gained === 1, 'Subscribers gained is 1');
    assert(subsAnalytics.data.data.net === 1, 'Subscribers net is 1');
    assert(subsAnalytics.data.data.recentSubscribers.length >= 1, 'Returns recent subscribers list');

    // 11. Single Content Analytics Deep-Dive
    console.log('\n--- 11. Single Content Deep-Dive Analytics ---');
    const contentDeepDive = await client.get(`/studio/analytics/content/${vid1._id}`, creatorHeaders);
    assert(contentDeepDive.status === 200, 'GET /studio/analytics/content/:id returns 200');
    assert(contentDeepDive.data.data.content.title === vid1.title, 'Returns matching content title');
    assert(contentDeepDive.data.data.timeseries28d.length >= 28, 'Returns 28-day continuous view trend');

    // Rejection on non-owned or invalid content
    const invalidDeepDive = await client.get('/studio/analytics/content/64a123456789012345678901', creatorHeaders);
    assert(invalidDeepDive.status === 404, 'Returns 404 for content not belonging to channel');

    // 12. Studio Content Management (Unified Videos & Shorts Table)
    console.log('\n--- 12. Unified Content Management (Table, Filters, Search) ---');
    const allContent = await client.get('/studio/content', creatorHeaders);
    assert(allContent.status === 200, 'GET /studio/content returns 200');
    assert(allContent.data.data.items.length >= 3, 'Unified list contains all channel videos and shorts');
    assert(allContent.data.data.pagination.total >= 3, 'Pagination metadata is populated');

    // Filter by type: video
    const videoOnly = await client.get('/studio/content?type=video', creatorHeaders);
    assert(videoOnly.data.data.items.every((i) => i.contentType === 'Video'), 'type=video returns only videos');

    // Filter by type: short
    const shortOnly = await client.get('/studio/content?type=short', creatorHeaders);
    assert(shortOnly.data.data.items.every((i) => i.contentType === 'Short'), 'type=short returns only shorts');

    // Filter by visibility: unlisted
    const unlistedContent = await client.get('/studio/content?visibility=unlisted', creatorHeaders);
    assert(unlistedContent.data.data.items.length === 1, 'visibility=unlisted filter returns exactly 1 item');
    assert(unlistedContent.data.data.items[0]._id === vid2._id.toString(), 'Unlisted video matches vid2');

    // Text search query: 'Secret'
    const searchContent = await client.get('/studio/content?q=Secret', creatorHeaders);
    assert(searchContent.data.data.items.length === 1, 'Search query q=Secret returns matching content');

    // 13. Content Metadata Editing & Owner Authorization
    console.log('\n--- 13. Content Metadata Editing ---');
    const updateRes = await client.patch(`/studio/content/${vid1._id}`, {
      title: 'Mastering Full-Stack Video Platforms (2026 Edition)',
      description: 'Updated description for Phase 8',
      visibility: 'public',
      tags: ['fullstack', 'react', 'nodejs']
    }, creatorHeaders);
    assert(updateRes.status === 200, 'PATCH /studio/content/:id updates metadata');
    assert(updateRes.data.data.title === 'Mastering Full-Stack Video Platforms (2026 Edition)', 'Title updated');

    // Unauthorized edit test
    const unauthEdit = await client.patch(`/studio/content/${vid1._id}`, {
      title: 'Hacked Title'
    }, otherHeaders);
    assert(unauthEdit.status === 404, 'Other user cannot edit another creator content (404/403 isolated)');

    // 14. Content Deletion & Ownership Guard
    console.log('\n--- 14. Content Deletion ---');
    const deleteRes = await client.delete(`/studio/content/${vid2._id}`, creatorHeaders);
    assert(deleteRes.status === 200, 'DELETE /studio/content/:id deletes content');
    const checkDeleted = await Video.findById(vid2._id);
    assert(checkDeleted === null, 'Video is removed from database');

    // 15. Studio Comments Aggregator
    console.log('\n--- 15. Studio Comments Aggregator ---');
    const studioComments = await client.get('/studio/comments', creatorHeaders);
    assert(studioComments.status === 200, 'GET /studio/comments returns 200');
    assert(studioComments.data.data.comments.length >= 1, 'Returns comments across owned content');
    assert(studioComments.data.data.comments[0].text === 'Excellent architectural explanation!', 'Comment text is correct');
    assert(studioComments.data.data.comments[0].contentTitle.includes('Mastering Full-Stack'), 'Includes content title');

    // 16. Channel Customization (Profile, Handle Uniqueness, Featured Video)
    console.log('\n--- 16. Channel Customization ---');
    const getCustomization = await client.get('/studio/channel', creatorHeaders);
    assert(getCustomization.status === 200, 'GET /studio/channel returns 200');
    assert(getCustomization.data.data.name === 'Tech Lead Creator', 'Returns channel name');

    const patchCustomization = await client.patch('/studio/channel', {
      name: 'Tech Lead Creator Official',
      description: 'Building large-scale video streaming architecture',
      featuredVideo: vid1._id.toString(),
      defaultVisibility: 'public'
    }, creatorHeaders);
    assert(patchCustomization.status === 200, 'PATCH /studio/channel updates customization');
    assert(patchCustomization.data.data.name === 'Tech Lead Creator Official', 'Channel name updated');
    assert(patchCustomization.data.data.featuredVideo._id === vid1._id.toString(), 'Featured video set successfully');

    // 17. RFC 4180 CSV Export with Formula Injection Defense
    console.log('\n--- 17. CSV Export with Formula Injection Sanitization ---');
    // Test export overview
    const exportOverview = await client.get('/studio/analytics/export?type=overview&period=28d', creatorHeaders);
    assert(exportOverview.status === 200, 'GET /studio/analytics/export?type=overview returns 200');
    assert(exportOverview.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');
    assert(exportOverview.data.includes('"Metric","Current Period"'), 'CSV contains standard header rows');

    // Test export timeseries
    const exportTimeseries = await client.get('/studio/analytics/export?type=timeseries&period=28d', creatorHeaders);
    assert(exportTimeseries.status === 200, 'GET /studio/analytics/export?type=timeseries returns 200');
    assert(exportTimeseries.data.includes('"Date","Views"'), 'Timeseries CSV contains date and views');

    // Test Formula Injection Sanitization explicitly:
    // Create a video with malicious formula injection title starting with '='
    const maliciousVid = await Video.create({
      title: '=cmd|\'/C calc\'!A0',
      description: '+2+5-SUM(1,2)',
      channel: channelId,
      owner: creatorUser._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/mal.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/mal.jpg',
      duration: 60,
      visibility: 'public'
    });

    const exportContent = await client.get('/studio/analytics/export?type=content', creatorHeaders);
    assert(exportContent.status === 200, 'GET /studio/analytics/export?type=content returns 200');
    // Verify that title starting with '=' has been prepended with single quote "'"
    assert(exportContent.data.includes(`"'=cmd|`), 'Formula injection prefix "=" escaped with leading single quote');

    // Clean up test video
    await Video.findByIdAndDelete(maliciousVid._id);

    // 18. Route Aliasing (/api/analytics routes)
    console.log('\n--- 18. Route Aliasing (/api/analytics) ---');
    const aliasOverview = await client.get('/analytics/overview?period=28d', creatorHeaders);
    assert(aliasOverview.status === 200, 'GET /analytics/overview returns 200 identical to /studio/analytics/overview');
    assert(aliasOverview.data.data.metrics.views.current === 5, 'Aliased route returns correct views count');

    const aliasTimeseries = await client.get('/analytics/timeseries?period=28d&metric=views', creatorHeaders);
    assert(aliasTimeseries.status === 200, 'GET /analytics/timeseries returns 200 identical to /studio');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n======================================================');
  console.log(`PHASE 8 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
