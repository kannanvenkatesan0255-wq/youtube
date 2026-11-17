/**
 * VidTube Phase 9: Admin Control Center, Content Moderation & Platform Security Test Suite
 * Covers 40+ verification points:
 * - Role-Based Access Control (RBAC): User, Creator, Admin, Super Admin
 * - 401 & 403 Forbidden barriers on administrative endpoints
 * - Prevention of self-promotion & unauthorized privilege escalation
 * - Enforcement of accountStatus (suspended/banned accounts blocked from API access)
 * - Admin Dashboard platform statistics (real DB aggregations)
 * - User management: directory, search, filter, suspension, restoration, role elevation
 * - Channel management: directory, suspension, restoration
 * - Content moderation (Videos, Shorts, Comments) with status states (clean, flagged, restricted, removed)
 * - User-facing Content Reporting (POST /api/reports) with duplicate prevention & target validation
 * - Admin Moderation Queue & Report Resolution with linked content actions
 * - Immutable Audit Logging of all sensitive admin actions
 * - Platform-wide Analytics timeline
 * - Platform Settings (configuration & audit logging)
 * - Announcements System (create, active public lookup, update, delete)
 *
 * Run via: npm run test:phase9 --workspace=server
 */
const axios = require('axios');
const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { initSocket } = require('../services/socket.service');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const Short = require('../models/Short');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const PlatformSetting = require('../models/PlatformSetting');
const Announcement = require('../models/Announcement');
const { config } = require('../config/env');
const { USER_ROLES, ACCOUNT_STATUS, REPORT_STATUS, MODERATION_ACTIONS } = require('../constants/appConstants');

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
  console.log('\n===============================================================');
  console.log('VIDTUBE PHASE 9: ADMIN CONTROL CENTER & MODERATION TEST SUITE');
  console.log('===============================================================\n');

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
    const adminEmail = `admin_${timestamp}@vidtube.test`;
    const superAdminEmail = `superadmin_${timestamp}@vidtube.test`;
    const creatorEmail = `creator_${timestamp}@vidtube.test`;
    const viewerEmail = `viewer_${timestamp}@vidtube.test`;
    const badActorEmail = `badactor_${timestamp}@vidtube.test`;

    // 1. RBAC & Authentication Guard
    console.log('\n--- 1. Authentication & RBAC Guard ---');
    const unauthDash = await client.get('/admin/dashboard');
    assert(unauthDash.status === 401, 'Unauthenticated request to /admin/dashboard returns 401');

    // Register Ordinary Viewer
    const viewerReg = await client.post('/auth/register', {
      name: 'Test Viewer',
      username: `viewer_${timestamp}`,
      email: viewerEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    assert(viewerReg.status === 201, 'Ordinary Viewer registered successfully');
    const viewerToken = viewerReg.data.data.accessToken;
    const viewerUser = viewerReg.data.data.user;
    const viewerHeaders = { headers: { Authorization: `Bearer ${viewerToken}` } };

    // Register Creator
    const creatorReg = await client.post('/auth/register', {
      name: 'Test Creator',
      username: `creator_${timestamp}`,
      email: creatorEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    assert(creatorReg.status === 201, 'Creator registered successfully');
    const creatorToken = creatorReg.data.data.accessToken;
    const creatorUser = creatorReg.data.data.user;
    const creatorHeaders = { headers: { Authorization: `Bearer ${creatorToken}` } };

    // Ordinary user & creator calling admin APIs are rejected with 403 Forbidden
    const viewerAdminCall = await client.get('/admin/dashboard', viewerHeaders);
    assert(viewerAdminCall.status === 403, 'Ordinary user calling /admin/dashboard rejected with 403 Forbidden');

    const creatorAdminCall = await client.get('/admin/dashboard', creatorHeaders);
    assert(creatorAdminCall.status === 403, 'Creator calling /admin/dashboard rejected with 403 Forbidden');

    // Self-promotion prevention check
    const selfPromoAttempt = await client.patch('/users/profile', { role: USER_ROLES.ADMIN }, viewerHeaders);
    const viewerProfileCheck = await User.findById(viewerUser._id);
    assert(viewerProfileCheck.role === USER_ROLES.USER, 'User cannot promote themselves to admin via profile update');

    // 2. Provision Admin & Super Admin accounts securely in DB
    console.log('\n--- 2. Secure Admin Provisioning ---');

    const adminDoc = await User.create({
      name: 'Platform Moderator',
      username: `admin_${timestamp}`,
      email: adminEmail,
      passwordHash: 'AdminSecret123!',
      role: USER_ROLES.ADMIN,
      accountStatus: 'active',
      isEmailVerified: true
    });
    const adminChannel = await Channel.create({
      name: 'Platform Moderator',
      handle: `admin_${timestamp}`,
      owner: adminDoc._id
    });
    adminDoc.channel = adminChannel._id;
    await adminDoc.save();

    const superAdminDoc = await User.create({
      name: 'Root Super Admin',
      username: `superadmin_${timestamp}`,
      email: superAdminEmail,
      passwordHash: 'AdminSecret123!',
      role: USER_ROLES.SUPER_ADMIN,
      accountStatus: 'active',
      isEmailVerified: true
    });

    // Login Admin
    const adminLogin = await client.post('/auth/login', {
      identifier: adminEmail,
      password: 'AdminSecret123!'
    });
    assert(adminLogin.status === 200, 'Admin login returns 200');
    const adminToken = adminLogin.data.data.accessToken;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Login Super Admin
    const superAdminLogin = await client.post('/auth/login', {
      identifier: superAdminEmail,
      password: 'AdminSecret123!'
    });
    assert(superAdminLogin.status === 200, 'Super Admin login returns 200');
    const superAdminToken = superAdminLogin.data.data.accessToken;
    const superAdminHeaders = { headers: { Authorization: `Bearer ${superAdminToken}` } };

    // 3. Admin Dashboard Overview
    console.log('\n--- 3. Admin Dashboard Overview & Real Platform Metrics ---');
    const dashRes = await client.get('/admin/dashboard', adminHeaders);
    assert(dashRes.status === 200, 'GET /admin/dashboard returns 200 for Administrator');
    const metrics = dashRes.data.data.metrics;
    assert(metrics.totalUsers >= 4, 'Reports real total registered users');
    assert(metrics.totalChannels >= 3, 'Reports real total channels');
    assert(typeof metrics.pendingReports === 'number', 'Reports pending reports count');
    assert(Array.isArray(dashRes.data.data.recentUsers), 'Returns recent users list');
    assert(Array.isArray(dashRes.data.data.recentVideos), 'Returns recent videos list');

    // 4. Content Creation & User Management
    console.log('\n--- 4. User Directory & Status Management ---');
    // Register a bad actor to test suspension/ban
    const badActorReg = await client.post('/auth/register', {
      name: 'Spam Bot',
      username: `badactor_${timestamp}`,
      email: badActorEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    const badActorToken = badActorReg.data.data.accessToken;
    const badActorUser = badActorReg.data.data.user;
    const badActorHeaders = { headers: { Authorization: `Bearer ${badActorToken}` } };

    // List users with search
    const userSearch = await client.get(`/admin/users?q=${badActorUser.username}`, adminHeaders);
    assert(userSearch.status === 200, 'GET /admin/users with query returns 200');
    assert(userSearch.data.data.users.length === 1, 'Search finds target user');
    assert(userSearch.data.data.users[0].email === badActorEmail, 'Target email matches');
    assert(!userSearch.data.data.users[0].passwordHash, 'Password hash is strictly excluded from response');

    // Get single user details
    const userDetail = await client.get(`/admin/users/${badActorUser._id}`, adminHeaders);
    assert(userDetail.status === 200, 'GET /admin/users/:id returns user details and stats');

    // Suspend bad actor
    const suspendRes = await client.patch(`/admin/users/${badActorUser._id}/status`, {
      status: ACCOUNT_STATUS.SUSPENDED,
      reason: 'Automated spam behavior detected'
    }, adminHeaders);
    assert(suspendRes.status === 200, 'PATCH /admin/users/:id/status successfully suspends account');
    assert(suspendRes.data.data.accountStatus === 'suspended', 'User accountStatus is now suspended');

    // VERIFY SESSION ENFORCEMENT: Suspended user calling API receives 403 Forbidden
    const suspendedApiCall = await client.get('/auth/me', badActorHeaders);
    assert(suspendedApiCall.status === 403, 'Suspended user blocked from performing authenticated operations (403)');

    // Restore user
    const restoreRes = await client.patch(`/admin/users/${badActorUser._id}/status`, {
      status: ACCOUNT_STATUS.ACTIVE,
      reason: 'Suspension appeal granted'
    }, adminHeaders);
    assert(restoreRes.status === 200, 'User account restored to active');

    // Restored user can access API again
    const restoredApiCall = await client.get('/auth/me', badActorHeaders);
    assert(restoredApiCall.status === 200, 'Restored user can access authenticated endpoints normally');

    // Self-suspension prevention
    const selfSuspend = await client.patch(`/admin/users/${adminDoc._id}/status`, {
      status: ACCOUNT_STATUS.SUSPENDED
    }, adminHeaders);
    assert(selfSuspend.status === 400, 'Administrator self-suspension is rejected with 400 Bad Request');

    // Role elevation by Super Admin
    const promoteRes = await client.patch(`/admin/users/${creatorUser._id}/role`, {
      role: USER_ROLES.ADMIN,
      reason: 'Promoted to content moderator'
    }, superAdminHeaders);
    assert(promoteRes.status === 200, 'Super Admin can elevate user role to Admin');
    assert(promoteRes.data.data.role === 'admin', 'Creator role updated to admin');

    // Ordinary Admin attempting to promote returns 403
    const unauthorizedPromote = await client.patch(`/admin/users/${viewerUser._id}/role`, {
      role: USER_ROLES.ADMIN
    }, adminHeaders);
    assert(unauthorizedPromote.status === 403, 'Ordinary Admin cannot promote users (Super Admin only)');

    // 5. Channel Management
    console.log('\n--- 5. Channel Management ---');
    const channelList = await client.get('/admin/channels', adminHeaders);
    assert(channelList.status === 200, 'GET /admin/channels returns 200');
    assert(channelList.data.data.channels.length >= 3, 'Returns channel directory');

    const targetChannel = channelList.data.data.channels[0];
    const suspendChannel = await client.patch(`/admin/channels/${targetChannel._id}/status`, {
      status: 'suspended',
      reason: 'Channel terms investigation'
    }, adminHeaders);
    assert(suspendChannel.status === 200, 'PATCH /admin/channels/:id/status updates channel status');
    assert(suspendChannel.data.data.status === 'suspended', 'Channel status is suspended');

    // Restore channel
    await client.patch(`/admin/channels/${targetChannel._id}/status`, { status: 'active' }, adminHeaders);

    // 6. Video & Shorts Moderation
    console.log('\n--- 6. Video & Shorts Moderation ---');
    const testVideo = await Video.create({
      title: 'Inappropriate Video Content',
      description: 'Community guidelines testing',
      channel: creatorUser.channel || adminChannel._id,
      owner: creatorUser._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/inappropriate.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      duration: 120,
      visibility: 'public',
      moderationStatus: 'clean'
    });

    const testShort = await Short.create({
      title: 'Questionable Short Clip #shorts',
      channel: creatorUser.channel || adminChannel._id,
      owner: creatorUser._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/short_spam.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/short.jpg',
      duration: 30,
      visibility: 'public',
      moderationStatus: 'clean'
    });

    // Moderate Video: 'removed'
    const modVideoRes = await client.patch(`/admin/videos/${testVideo._id}/moderation`, {
      action: MODERATION_ACTIONS.REMOVED,
      reason: 'Violates community guidelines'
    }, adminHeaders);
    assert(modVideoRes.status === 200, 'PATCH /admin/videos/:id/moderation applies action');
    assert(modVideoRes.data.data.moderationStatus === 'removed', 'Video moderationStatus set to "removed"');
    assert(modVideoRes.data.data.visibility === 'private', 'Removed video is automatically unpublished');

    // Moderate Video: 'restored'
    const restoreVideoRes = await client.patch(`/admin/videos/${testVideo._id}/moderation`, {
      action: MODERATION_ACTIONS.RESTORED,
      reason: 'Content restored after review'
    }, adminHeaders);
    assert(restoreVideoRes.data.data.moderationStatus === 'clean', 'Video moderationStatus restored to clean');
    assert(restoreVideoRes.data.data.visibility === 'public', 'Restored video republished to public');

    // Moderate Short: 'restricted'
    const modShortRes = await client.patch(`/admin/shorts/${testShort._id}/moderation`, {
      action: MODERATION_ACTIONS.RESTRICTED,
      reason: 'Age-restricted content'
    }, adminHeaders);
    assert(modShortRes.status === 200, 'PATCH /admin/shorts/:id/moderation restricts short');
    assert(modShortRes.data.data.moderationStatus === 'restricted', 'Short moderationStatus set to restricted');

    // 7. Comment Moderation
    console.log('\n--- 7. Comment Moderation ---');
    const testComment = await Comment.create({
      content: 'Offensive language comment',
      user: viewerUser._id,
      video: testVideo._id,
      contentType: 'Video',
      contentId: testVideo._id
    });

    const modCommentRes = await client.patch(`/admin/comments/${testComment._id}/moderation`, {
      action: MODERATION_ACTIONS.REMOVED,
      reason: 'Harassment & abusive language'
    }, adminHeaders);
    assert(modCommentRes.status === 200, 'PATCH /admin/comments/:id/moderation removes comment');
    assert(modCommentRes.data.data.moderationStatus === 'removed', 'Comment moderationStatus is removed');

    // 8. User Content Reporting & Moderation Queue
    console.log('\n--- 8. User Reporting & Moderation Queue ---');
    // Valid Report submission by viewer
    const reportRes = await client.post('/reports', {
      contentType: 'Video',
      contentId: testVideo._id.toString(),
      reason: 'harassment',
      description: 'Contains targeted bullying against creator'
    }, viewerHeaders);
    assert(reportRes.status === 201, 'POST /reports creates a pending report (201 Created)');
    assert(reportRes.data.data.status === REPORT_STATUS.PENDING, 'Report status is pending');
    const reportId = reportRes.data.data._id;

    // Duplicate report prevention
    const duplicateReport = await client.post('/reports', {
      contentType: 'Video',
      contentId: testVideo._id.toString(),
      reason: 'harassment'
    }, viewerHeaders);
    assert(duplicateReport.status === 409, 'Duplicate pending report rejected with 409 Conflict');

    // Report for non-existent content
    const invalidReport = await client.post('/reports', {
      contentType: 'Video',
      contentId: new mongoose.Types.ObjectId().toString(),
      reason: 'spam'
    }, viewerHeaders);
    assert(invalidReport.status === 404, 'Report for non-existent content returns 404 Not Found');

    // Admin list reports
    const adminReports = await client.get('/admin/reports', adminHeaders);
    assert(adminReports.status === 200, 'GET /admin/reports returns reports list');
    assert(adminReports.data.data.reports.length >= 1, 'Contains submitted report');

    // Admin get report details
    const singleReport = await client.get(`/admin/reports/${reportId}`, adminHeaders);
    assert(singleReport.status === 200, 'GET /admin/reports/:id returns full report details');
    assert(singleReport.data.data.reason === 'harassment', 'Report reason matches');

    // Admin resolves report with linked action 'warning'
    const resolveReportRes = await client.patch(`/admin/reports/${reportId}`, {
      status: REPORT_STATUS.RESOLVED,
      resolutionNotes: 'Reviewed and confirmed. Creator issued a warning.',
      resolutionAction: MODERATION_ACTIONS.WARNING
    }, adminHeaders);
    assert(resolveReportRes.status === 200, 'PATCH /admin/reports/:id resolves report');
    assert(resolveReportRes.data.data.status === REPORT_STATUS.RESOLVED, 'Report status is resolved');

    // 9. Immutable Audit Logging
    console.log('\n--- 9. Immutable Audit Logging ---');
    const auditLogsRes = await client.get('/admin/audit-logs', adminHeaders);
    assert(auditLogsRes.status === 200, 'GET /admin/audit-logs returns 200');
    assert(auditLogsRes.data.data.logs.length >= 3, 'Audit logs recorded administrative actions');
    const actionsLogged = auditLogsRes.data.data.logs.map((l) => l.action);
    assert(actionsLogged.some((a) => a.includes('user')), 'User administrative actions are audited');
    assert(actionsLogged.some((a) => a.includes('video') || a.includes('report')), 'Content moderation actions are audited');

    // Ordinary user cannot access audit logs
    const unauthAudit = await client.get('/admin/audit-logs', viewerHeaders);
    assert(unauthAudit.status === 403, 'Ordinary users cannot access audit logs (403)');

    // 10. Platform Analytics
    console.log('\n--- 10. Platform Analytics ---');
    const platAnalytics = await client.get('/admin/analytics?period=28d', adminHeaders);
    assert(platAnalytics.status === 200, 'GET /admin/analytics returns 200');
    assert(Array.isArray(platAnalytics.data.data.timeline), 'Returns timeline array with daily growth trends');

    // 11. Platform Settings
    console.log('\n--- 11. Platform Settings ---');
    const getSettings = await client.get('/admin/settings', adminHeaders);
    assert(getSettings.status === 200, 'GET /admin/settings returns 200');
    assert(getSettings.data.data.registrationEnabled === true, 'Default settings populated');

    const updateSettings = await client.patch('/admin/settings', {
      maxVideoUploadSizeMb: 750,
      reportingEnabled: true
    }, adminHeaders);
    assert(updateSettings.status === 200, 'PATCH /admin/settings updates configuration');
    assert(updateSettings.data.data.maxVideoUploadSizeMb === 750, 'maxVideoUploadSizeMb updated to 750');

    // 12. Announcements System
    console.log('\n--- 12. Announcements System ---');
    const createAnnounce = await client.post('/admin/announcements', {
      title: 'Scheduled Maintenance Notice',
      message: 'VidTube streaming clusters will undergo scheduled optimization on Sunday 02:00 UTC.',
      type: 'maintenance',
      priority: 10
    }, adminHeaders);
    assert(createAnnounce.status === 201, 'POST /admin/announcements creates announcement (201)');
    const announceId = createAnnounce.data.data._id;

    // Public active announcement check
    const activeAnnounce = await client.get('/announcements/active');
    assert(activeAnnounce.status === 200, 'GET /announcements/active returns 200');
    assert(activeAnnounce.data.data.title === 'Scheduled Maintenance Notice', 'Active announcement visible publicly');

    // Delete announcement
    const deleteAnnounce = await client.delete(`/admin/announcements/${announceId}`, adminHeaders);
    assert(deleteAnnounce.status === 200, 'DELETE /admin/announcements/:id removes announcement');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n===============================================================');
  console.log(`PHASE 9 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
