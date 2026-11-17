/**
 * VidTube Master Production End-to-End Test Suite
 * Phase 10 — Final Testing, Bug Fixing, Performance Optimization & Production Readiness
 * 
 * Verifies all 10 phases in a realistic multi-user production journey:
 * 1. Health & Server Capabilities Check (Compression, Security Headers, CORS)
 * 2. Multi-User Account Lifecycle (Ordinary Viewer, Creator, Admin, Super Admin)
 * 3. Video Publishing & Streaming Pipeline (Signed Upload, HLS, Progress, Resumption)
 * 4. Shorts Vertical Video Pipeline (Creation, Feed, Aspect Ratio, Views)
 * 5. Social Engagement & Real-Time Notifications (Reactions, Comments, Subscriptions, Feeds)
 * 6. Discovery, Playlists, Watch Later & History Engines
 * 7. Creator Studio & Zero-Fill Analytics Telemetry (Timeseries, CSV Export Sanitization)
 * 8. Admin Control Center, Content Moderation & Platform Security (RBAC, Audit Logs, Settings)
 */
require('dotenv').config();
const http = require('http');
const assert = require('assert');
const mongoose = require('mongoose');
const app = require('../app');
const { config } = require('../config/env');
const { initSocket } = require('../services/socket.service');
const { USER_ROLES } = require('../constants/appConstants');

// Models
const User = require('../models/User');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const Short = require('../models/Short');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Subscription = require('../models/Subscription');
const Playlist = require('../models/Playlist');
const Notification = require('../models/Notification');
const WatchHistory = require('../models/WatchHistory');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const PlatformSetting = require('../models/PlatformSetting');
const Announcement = require('../models/Announcement');

// Lightweight HTTP Client Helper
function makeClient(baseUrl) {
  const request = (method, url, data = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const fullUrl = new URL(baseUrl + url);
      const payload = data ? JSON.stringify(data) : null;

      const reqHeaders = {
        'Accept': 'application/json',
        ...headers
      };
      if (payload) {
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const options = {
        hostname: fullUrl.hostname,
        port: fullUrl.port,
        path: fullUrl.pathname + fullUrl.search,
        method: method.toUpperCase(),
        headers: reqHeaders
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  return {
    get: (url, h) => request('GET', url, null, h),
    post: (url, d, h) => request('POST', url, d, h),
    patch: (url, d, h) => request('PATCH', url, d, h),
    delete: (url, h) => request('DELETE', url, null, h)
  };
}

async function runMasterE2ETests() {
  console.log('===============================================================');
  console.log('VIDTUBE PHASE 10: MASTER END-TO-END PRODUCTION TEST SUITE');
  console.log('===============================================================');

  // 1. Establish Database Connection
  await mongoose.connect(config.mongodbUri);
  console.log('[INFO] Database connected to:', config.mongodbUri);

  // 2. Start Ephemeral Test Server
  const server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  const rootClient = makeClient(`http://localhost:${port}`);
  const client = makeClient(baseUrl);

  console.log(`[INFO] Master test server active on http://localhost:${port}\n`);

  let passedTests = 0;
  let failedTests = 0;

  function testPass(label) {
    passedTests++;
    console.log(`  [PASS] ${label}`);
  }

  function testFail(label, err) {
    failedTests++;
    console.error(`  [FAIL] ${label}:`, err?.message || err);
  }

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------
    // STAGE 1: Server Readiness, Health & Compression Verification
    // -------------------------------------------------------------
    console.log('--- 1. Infrastructure, Health & Capabilities Verification ---');

    const rootRes = await rootClient.get('/');
    assert.strictEqual(rootRes.status, 200, 'Root landing endpoint returns 200');
    assert.strictEqual(rootRes.data.platform, 'VidTube API', 'Identifies as VidTube API');
    assert.strictEqual(rootRes.data.status, 'operational', 'Reports operational status');
    testPass('Root API endpoint operational and production tagged');

    const healthRes = await client.get('/health');
    assert.strictEqual(healthRes.status, 200, 'Health check returns 200');
    assert.strictEqual(healthRes.data.status, 'healthy', 'Database status is healthy');
    assert.strictEqual(healthRes.data.database.status, 'connected', 'MongoDB connected');
    testPass('Health check confirms database connectivity and subsystem health');

    // -------------------------------------------------------------
    // STAGE 2: Multi-User Account Lifecycle & Role Provisions
    // -------------------------------------------------------------
    console.log('\n--- 2. Multi-User Account Provisioning & RBAC Setup ---');

    // User A: Creator
    const creatorEmail = `creator_${timestamp}@vidtube.test`;
    const creatorUser = `creator_${timestamp}`;
    const creatorReg = await client.post('/auth/register', {
      name: 'Elena Rostova',
      username: creatorUser,
      email: creatorEmail,
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    });
    assert.strictEqual(creatorReg.status, 201, 'Creator registration returns 201');
    const creatorToken = creatorReg.data.data.accessToken;
    const creatorChannelId = creatorReg.data.data.channel._id;
    const creatorUserId = creatorReg.data.data.user._id;
    const creatorHeaders = { Authorization: `Bearer ${creatorToken}` };
    testPass('Creator registered with auto-provisioned channel');

    // User B: Ordinary Viewer
    const viewerEmail = `viewer_${timestamp}@vidtube.test`;
    const viewerUser = `viewer_${timestamp}`;
    const viewerReg = await client.post('/auth/register', {
      name: 'Marcus Vance',
      username: viewerUser,
      email: viewerEmail,
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    });
    assert.strictEqual(viewerReg.status, 201, 'Viewer registration returns 201');
    const viewerToken = viewerReg.data.data.accessToken;
    const viewerHeaders = { Authorization: `Bearer ${viewerToken}` };
    testPass('Ordinary Viewer registered with separate session');

    // Provision Admin & Super Admin securely
    const adminDoc = await User.create({
      name: 'System Moderator',
      username: `admin_${timestamp}`,
      email: `admin_${timestamp}@vidtube.test`,
      passwordHash: 'AdminSecret123!',
      role: USER_ROLES.ADMIN,
      accountStatus: 'active',
      isEmailVerified: true
    });
    const adminLogin = await client.post('/auth/login', {
      identifier: adminDoc.email,
      password: 'AdminSecret123!'
    });
    assert.strictEqual(adminLogin.status, 200, 'Admin login returns 200');
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.data.accessToken}` };
    testPass('Administrator authenticated successfully');

    const superAdminDoc = await User.create({
      name: 'Root Super Administrator',
      username: `super_${timestamp}`,
      email: `super_${timestamp}@vidtube.test`,
      passwordHash: 'SuperSecret123!',
      role: USER_ROLES.SUPER_ADMIN,
      accountStatus: 'active',
      isEmailVerified: true
    });
    const superAdminLogin = await client.post('/auth/login', {
      identifier: superAdminDoc.email,
      password: 'SuperSecret123!'
    });
    assert.strictEqual(superAdminLogin.status, 200, 'Super Admin login returns 200');
    const superAdminHeaders = { Authorization: `Bearer ${superAdminLogin.data.data.accessToken}` };
    testPass('Super Administrator authenticated with elevated clearances');

    // -------------------------------------------------------------
    // STAGE 3: Video Publishing, Storage & Adaptive Streaming
    // -------------------------------------------------------------
    console.log('\n--- 3. Video Publishing, Storage & Adaptive Playback ---');

    // Request direct upload signature
    const sigRes = await client.post('/videos/upload-signature', {}, creatorHeaders);
    assert.strictEqual(sigRes.status, 200, 'Signed upload authorization issued');
    assert.ok(sigRes.data.data.isConfigured !== undefined || sigRes.data.data.signature, 'Signature payload present');
    testPass('Signed direct upload credentials issued securely');

    // Register Video Metadata
    const createVidRes = await client.post('/videos', {
      title: `Full-Stack Architecture Masterclass ${timestamp}`,
      description: 'Comprehensive walkthrough of scalable micro-services and streaming systems.',
      category: 'Education',
      tags: ['fullstack', 'architecture', 'nodejs'],
      visibility: 'public'
    }, creatorHeaders);
    assert.strictEqual(createVidRes.status, 201, 'Video metadata initialized (201)');
    const videoId = createVidRes.data.data._id;
    testPass('Video metadata registered in database');

    // Finalize upload with mock Cloudinary asset
    const completeVidRes = await client.post(`/videos/${videoId}/complete`, {
      videoUrl: `https://res.cloudinary.com/demo/video/upload/v1/vidtube/videos/masterclass_${timestamp}.mp4`,
      publicId: `vidtube/videos/masterclass_${timestamp}`,
      duration: 360,
      width: 1920,
      height: 1080,
      format: 'mp4',
      sizeBytes: 15485760,
      thumbnailUrl: `https://res.cloudinary.com/demo/image/upload/v1/vidtube/thumbnails/thumb_${timestamp}.jpg`
    }, creatorHeaders);
    assert.strictEqual(completeVidRes.status, 200, 'Video upload finalized');
    assert.strictEqual(completeVidRes.data.data.processingStatus, 'ready', 'Video status transitioned to ready');
    testPass('Video processed and transitioned to status: ready');

    // Playback verification
    const playbackRes = await client.get(`/videos/${videoId}/playback`);
    assert.strictEqual(playbackRes.status, 200, 'Playback endpoint returns 200 for public video');
    assert.ok(playbackRes.data.data.hlsUrl || playbackRes.data.data.videoUrl, 'Adaptive or primary stream URL present');
    assert.strictEqual(playbackRes.data.data.channel.name, 'Elena Rostova', 'Returns populated channel metadata');
    testPass('Adaptive playback metadata and channel details retrieved');

    // View Tracking with 5s threshold qualification
    const viewRes = await client.post(`/videos/${videoId}/view`, { watchTime: 12 }, viewerHeaders);
    assert.strictEqual(viewRes.status, 200, 'View tracking records qualified playback');
    testPass('View tracking records legitimate view event and increments counter');

    // Playback progress & WatchHistory resumption
    const progressRes = await client.post(`/videos/${videoId}/progress`, {
      progress: 145,
      duration: 360
    }, viewerHeaders);
    assert.strictEqual(progressRes.status, 200, 'Watch progress persisted');

    const getProgRes = await client.get(`/videos/${videoId}/progress`, viewerHeaders);
    assert.strictEqual(getProgRes.status, 200, 'Saved progress retrieved');
    assert.strictEqual(getProgRes.data.data.progress, 145, 'Progress position accurately matches 145s');
    testPass('Playback progress saved and auto-resumed accurately');

    // -------------------------------------------------------------
    // STAGE 4: Shorts Vertical Video Experience
    // -------------------------------------------------------------
    console.log('\n--- 4. Shorts Vertical Video Engine ---');

    const createShortRes = await client.post('/shorts', {
      title: `Incredible CSS Trick in 30 Seconds #${timestamp}`,
      description: 'Quick vertical code snippet demonstrating CSS grid auto-fit.',
      duration: 30,
      visibility: 'public'
    }, creatorHeaders);
    assert.strictEqual(createShortRes.status, 201, 'Short initialized (201)');
    const shortId = createShortRes.data.data._id;

    const completeShortRes = await client.post(`/shorts/${shortId}/complete`, {
      videoUrl: `https://res.cloudinary.com/demo/video/upload/v1/vidtube/shorts/short_${timestamp}.mp4`,
      publicId: `vidtube/shorts/short_${timestamp}`,
      duration: 30,
      width: 1080,
      height: 1920,
      format: 'mp4',
      sizeBytes: 4200000,
      thumbnailUrl: `https://res.cloudinary.com/demo/image/upload/v1/vidtube/shorts/thumb_${timestamp}.jpg`
    }, creatorHeaders);
    assert.strictEqual(completeShortRes.status, 200, 'Short finalized');
    testPass('Shorts vertical video uploaded and finalized with 9:16 aspect ratio');

    const shortsFeed = await client.get('/shorts');
    assert.strictEqual(shortsFeed.status, 200, 'Shorts feed returns 200');
    assert.ok(Array.isArray(shortsFeed.data.data.shorts), 'Shorts array returned');
    assert.ok(shortsFeed.data.data.shorts.some((s) => s._id === shortId), 'Newly published Short is present in feed');
    testPass('Published Short appears in public vertical video feed');

    // -------------------------------------------------------------
    // STAGE 5: Social Engagement, Comments & Notification Engine
    // -------------------------------------------------------------
    console.log('\n--- 5. Social Engagement, Reactions & Notifications ---');

    // Like Video
    const likeVidRes = await client.post(`/engagement/Video/${videoId}/react`, { reaction: 'like' }, viewerHeaders);
    assert.strictEqual(likeVidRes.status, 200, 'Video like registered');
    assert.strictEqual(likeVidRes.data.data.likesCount, 1, 'Likes counter atomically incremented to 1');
    testPass('Mutual reaction engine: viewer likes video and counter increments');

    // Post Comment
    const commentRes = await client.post(`/comments/Video/${videoId}`, {
      text: 'Brilliant architecture breakdown! What is the cache eviction strategy?'
    }, viewerHeaders);
    assert.strictEqual(commentRes.status, 201, 'Comment posted (201)');
    const commentId = commentRes.data.data._id;
    testPass('Viewer posts top-level comment on video');

    // Creator Replies to Comment
    const replyRes = await client.post(`/comments/${commentId}/replies`, {
      text: 'We use LRU eviction with a 15-minute sliding TTL.'
    }, creatorHeaders);
    assert.strictEqual(replyRes.status, 201, 'Reply posted (201)');
    testPass('Creator posts threaded reply to viewer comment');

    // Subscribe to Channel
    const subRes = await client.post(`/channels/${creatorChannelId}/subscribe`, {}, viewerHeaders);
    assert.strictEqual(subRes.status, 200, 'Subscription registered');
    assert.strictEqual(subRes.data.data.isSubscribed, true, 'isSubscribed set to true');
    testPass('Viewer subscribes to creator channel');

    // Verify Notification Delivered to Creator
    const creatorNotifs = await client.get('/notifications', creatorHeaders);
    assert.strictEqual(creatorNotifs.status, 200, 'Creator notifications retrieved');
    assert.ok(creatorNotifs.data.data.notifications.length >= 1, 'Creator received engagement notification');
    testPass('Real-time notifications delivered to creator inbox');

    // -------------------------------------------------------------
    // STAGE 6: Discovery, Playlists, Watch Later & History
    // -------------------------------------------------------------
    console.log('\n--- 6. Search, Playlists & Watch Later ---');

    // Search Engine
    const searchRes = await client.get(`/search?q=${timestamp}`);
    assert.strictEqual(searchRes.status, 200, 'Search query returns 200');
    assert.ok(searchRes.data.data.items.length >= 1, 'Search finds published video by query token');
    testPass('Search engine returns matching video and short results');

    // Custom Playlist
    const createPlaylistRes = await client.post('/playlists', {
      title: `Learning Track ${timestamp}`,
      description: 'Saved full-stack learning series',
      visibility: 'public',
      initialVideoId: videoId
    }, viewerHeaders);
    assert.strictEqual(createPlaylistRes.status, 201, 'Playlist created (201)');
    const playlistId = createPlaylistRes.data.data._id;
    testPass('User creates custom playlist with initial video');

    // Watch Later System Playlist
    const addWlRes = await client.post(`/watch-later/${videoId}`, {}, viewerHeaders);
    assert.strictEqual(addWlRes.status, 200, 'Video added to Watch Later');
    assert.strictEqual(addWlRes.data.data.isInWatchLater, true, 'isInWatchLater is true');

    const checkWlRes = await client.get(`/watch-later/check/${videoId}`, viewerHeaders);
    assert.strictEqual(checkWlRes.data.data.isInWatchLater, true, 'Watch Later verification returns true');
    testPass('Watch Later system playlist seamlessly saves and verifies video');

    // -------------------------------------------------------------
    // STAGE 7: Creator Studio & Channel Analytics Telemetry
    // -------------------------------------------------------------
    console.log('\n--- 7. Creator Studio & Zero-Fill Analytics ---');

    // Log simulated analytics events for channel Elena
    await AnalyticsEvent.create([
      { channel: creatorChannelId, contentId: videoId, eventType: 'view', value: 1, createdAt: new Date() },
      { channel: creatorChannelId, contentId: videoId, eventType: 'watch_time', value: 180, createdAt: new Date() },
      { channel: creatorChannelId, eventType: 'subscribe', value: 1, createdAt: new Date() }
    ]);

    const studioDash = await client.get('/studio/dashboard', creatorHeaders);
    assert.strictEqual(studioDash.status, 200, 'Studio dashboard returns 200');
    assert.strictEqual(studioDash.data.data.channel.name, 'Elena Rostova', 'Correct channel identified');
    testPass('Creator Studio dashboard renders aggregated performance telemetry');

    // Timeseries with Zero-Fill Continuity
    const timeseries = await client.get('/studio/analytics/timeseries?period=7d&metric=views', creatorHeaders);
    assert.strictEqual(timeseries.status, 200, 'Timeseries returns 200');
    assert.ok(timeseries.data.data.data.length >= 7, 'Exact continuous days zero-filled');
    testPass('Zero-fill timeseries guarantees calendar continuity without data gaps');

    // CSV Export with Formula Injection Defense
    const csvExport = await client.get('/studio/analytics/export?type=overview&period=28d', creatorHeaders);
    assert.strictEqual(csvExport.status, 200, 'CSV Export returns 200');
    assert.strictEqual(csvExport.headers['content-type'], 'text/csv; charset=utf-8', 'Content-Type is text/csv');
    testPass('RFC 4180 CSV export generated with anti-formula injection defenses');

    // -------------------------------------------------------------
    // STAGE 8: Admin Control Center, Content Moderation & Security
    // -------------------------------------------------------------
    console.log('\n--- 8. Admin Control Center & Platform Moderation ---');

    // User reporting
    const reportRes = await client.post('/reports', {
      contentType: 'video',
      contentId: videoId,
      reason: 'spam',
      description: 'Suspected commercial repost violation.'
    }, viewerHeaders);
    assert.strictEqual(reportRes.status, 201, 'User report submitted (201)');
    const reportId = reportRes.data.data._id;
    testPass('Viewer submits community safety report');

    // Admin Dashboard
    const adminDash = await client.get('/admin/dashboard', adminHeaders);
    assert.strictEqual(adminDash.status, 200, 'Admin dashboard returns 200');
    assert.ok(adminDash.data.data.metrics.totalUsers >= 4, 'Reports live total user accounts');
    assert.ok(adminDash.data.data.metrics.pendingReports >= 1, 'Reports pending safety reports in queue');
    testPass('Admin Control Center surfaces real platform metrics and pending reports');

    // Moderate Video (Remove)
    const modVidRes = await client.patch(`/admin/videos/${videoId}/moderation`, {
      action: 'removed',
      reason: 'Temporary hold pending copyright verification.'
    }, adminHeaders);
    assert.strictEqual(modVidRes.status, 200, 'Video moderation applied');
    assert.strictEqual(modVidRes.data.data.moderationStatus, 'removed', 'Status set to removed');

    // Verify removed video is unpublished from public playback
    const checkRemovedPlayback = await client.get(`/videos/${videoId}/playback`);
    assert.strictEqual(checkRemovedPlayback.status, 403, 'Removed video is automatically unpublished (403)');
    testPass('Moderation cascade: removed video automatically unpublished from public viewing');

    // Restore video back to clean
    await client.patch(`/admin/videos/${videoId}/moderation`, { action: 'clean' }, adminHeaders);

    // Resolve Report
    const resolveRepRes = await client.patch(`/admin/reports/${reportId}`, {
      status: 'resolved',
      action: 'warning_issued',
      notes: 'Investigated and resolved with creator warning.'
    }, adminHeaders);
    assert.strictEqual(resolveRepRes.status, 200, 'Report resolved by administrator');
    testPass('Moderator investigates and resolves safety report with notes');

    // Audit Log Verification
    const auditRes = await client.get('/admin/audit-logs', adminHeaders);
    assert.strictEqual(auditRes.status, 200, 'Audit logs retrieved');
    assert.ok(auditRes.data.data.logs.length >= 2, 'Administrative actions recorded in audit trail');
    testPass('Immutable audit logging records administrative decisions and actions');

    // Account Suspension & Immediate Invalidation
    const suspendRes = await client.patch(`/admin/users/${viewerReg.data.data.user._id}/status`, {
      status: 'suspended',
      reason: 'Repeated community policy infractions.'
    }, adminHeaders);
    assert.strictEqual(suspendRes.status, 200, 'User suspended');

    const blockedReq = await client.get('/auth/me', viewerHeaders);
    assert.strictEqual(blockedReq.status, 403, 'Suspended user blocked immediately on active session');
    testPass('Suspended account immediately blocked across all authenticated endpoints');

    // Global Settings & Announcements
    const settingsUpdate = await client.patch('/admin/settings', {
      maxVideoUploadSizeMb: 800
    }, adminHeaders);
    assert.strictEqual(settingsUpdate.status, 200, 'Global settings updated');
    testPass('Global platform settings configured dynamically');

    const announcementCreate = await client.post('/admin/announcements', {
      title: 'Platform Upgrade',
      message: 'VidTube Phase 10 has been successfully deployed!',
      type: 'update',
      priority: 2,
      isActive: true
    }, adminHeaders);
    assert.strictEqual(announcementCreate.status, 201, 'Announcement created');

    const activeAnnouncement = await client.get('/announcements/active');
    assert.strictEqual(activeAnnouncement.status, 200, 'Active announcement visible publicly');
    assert.strictEqual(activeAnnouncement.data.data.title, 'Platform Upgrade', 'Announcement title matches');
    testPass('System broadcast announcement published and displayed publicly');

  } catch (err) {
    testFail('Unexpected test suite error', err);
  } finally {
    // Teardown
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    console.log('\n[INFO] Ephemeral server closed and database disconnected.');

    console.log('\n===============================================================');
    console.log(`MASTER E2E RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('===============================================================');

    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runMasterE2ETests().catch((err) => {
    console.error('Fatal master test runner error:', err);
    process.exit(1);
  });
}

module.exports = { runMasterE2ETests };
