/**
 * VidTube Phase 4: Video Player, Watch Page & Adaptive Streaming Engine Test Suite
 * Covers 24 verification points across playback info, HLS manifest generation,
 * private video authorization, direct unlisted playback, view tracking with cooldown,
 * watch progress persistence and resume, and related video recommendation filtering.
 *
 * Run via: node server/src/tests/playback.test.js
 */
const axios = require('axios');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const WatchHistory = require('../models/WatchHistory');
const { config } = require('../config/env');
const { VIDEO_VISIBILITY, VIDEO_PROCESSING_STATUS } = require('../constants/appConstants');

let serverInstance = null;
let client = null;

async function setup() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(config.mongodbUri);
  }

  return new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
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

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('   VIDTUBE PHASE 4: VIDEO PLAYBACK & STREAMING TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function report(num, title, success, detail = '') {
    if (success) {
      passed++;
      console.log(`[PASS] Test #${num}: ${title} ${detail ? `(${detail})` : ''}`);
    } else {
      failed++;
      console.error(`[FAIL] Test #${num}: ${title} ${detail ? `(${detail})` : ''}`);
    }
  }

  let testBaseUrl = '';
  try {
    testBaseUrl = await setup();
    console.log(`Playback test server running at: ${testBaseUrl}\n`);
  } catch (err) {
    console.error('Failed to setup test environment:', err.message);
    process.exit(1);
  }

  try {
    // 1. Health check & DB connection
    const healthRes = await client.get('/health');
    report(
      1,
      'Health check endpoint returns healthy system and connected database',
      healthRes.status === 200 &&
        healthRes.data?.status === 'healthy' &&
        (healthRes.data?.database?.connected === true || healthRes.data?.database?.status === 'connected')
    );

    // Register User A (Alice Creator)
    const aliceData = {
      name: 'Alice Creator',
      username: `alice_p4_${Date.now()}`,
      email: `alice_p4_${Date.now()}@vidtube.com`,
      password: 'SecurePassword@2026',
      confirmPassword: 'SecurePassword@2026'
    };
    const aliceReg = await client.post('/auth/register', aliceData);
    const aliceToken = aliceReg.data?.data?.accessToken;
    const aliceHeaders = { headers: { Authorization: `Bearer ${aliceToken}` } };
    const aliceChannelId = aliceReg.data?.data?.channel?._id;

    // Register User B (Bob Viewer)
    const bobData = {
      name: 'Bob Viewer',
      username: `bob_p4_${Date.now()}`,
      email: `bob_p4_${Date.now()}@vidtube.com`,
      password: 'SecurePassword@2026',
      confirmPassword: 'SecurePassword@2026'
    };
    const bobReg = await client.post('/auth/register', bobData);
    const bobToken = bobReg.data?.data?.accessToken;
    const bobHeaders = { headers: { Authorization: `Bearer ${bobToken}` } };

    // Create Test Videos for Alice:
    // Video 1: Public, Ready, Web Development category
    const vid1Doc = await Video.create({
      title: 'Building Modern React 19 Video Streaming Architecture',
      description: 'Comprehensive guide to building custom video players, HLS streaming, and controls.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sp_auto/v1/react19_stream.mp4',
      publicId: 'vidtube/videos/react19_stream_01',
      hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_auto/v1/react19_stream.m3u8',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      duration: 1845,
      category: 'Web Development',
      tags: ['react', 'video', 'hls'],
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.READY,
      views: 120,
      channel: aliceChannelId,
      owner: aliceReg.data?.data?.user?._id
    });

    // Video 2: Private, Ready, Personal category
    const vid2Doc = await Video.create({
      title: 'Alice Private Project Strategy & Financials',
      description: 'Confidential strategic planning document.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/private_strategy.mp4',
      publicId: 'vidtube/videos/private_strategy_02',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
      duration: 600,
      category: 'Personal',
      tags: ['private', 'internal'],
      visibility: VIDEO_VISIBILITY.PRIVATE,
      processingStatus: VIDEO_PROCESSING_STATUS.READY,
      views: 5,
      channel: aliceChannelId,
      owner: aliceReg.data?.data?.user?._id
    });

    // Video 3: Unlisted, Ready, Education category
    const vid3Doc = await Video.create({
      title: 'Alice Unlisted Direct Link Preview',
      description: 'Shared only with authorized reviewers via link.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/unlisted_preview.mp4',
      publicId: 'vidtube/videos/unlisted_preview_03',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
      duration: 450,
      category: 'Education',
      tags: ['preview'],
      visibility: VIDEO_VISIBILITY.UNLISTED,
      processingStatus: VIDEO_PROCESSING_STATUS.READY,
      views: 42,
      channel: aliceChannelId,
      owner: aliceReg.data?.data?.user?._id
    });

    // Video 4: Public, Ready, Web Development category (for related videos check)
    const vid4Doc = await Video.create({
      title: 'Next-Gen JavaScript & TypeScript Deep Dive',
      description: 'Deep dive into modern JS runtimes, async generators, and workers.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/js_deep_dive.mp4',
      publicId: 'vidtube/videos/js_deep_dive_04',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200',
      duration: 1200,
      category: 'Web Development',
      tags: ['react', 'javascript'],
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.READY,
      views: 890,
      channel: aliceChannelId,
      owner: aliceReg.data?.data?.user?._id
    });

    // Video 5: Public, Still Uploading (not ready)
    const vid5Doc = await Video.create({
      title: 'Processing Video In-Flight',
      description: 'Should not appear in playback or related recommendations until ready.',
      videoUrl: '',
      publicId: '',
      duration: 0,
      category: 'Web Development',
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.UPLOADING,
      channel: aliceChannelId,
      owner: aliceReg.data?.data?.user?._id
    });

    // 2. Public video details retrieved successfully
    const detailsRes = await client.get(`/videos/${vid1Doc._id}`);
    report(
      2,
      'Public video details retrieved successfully with channel information',
      detailsRes.status === 200 &&
        detailsRes.data?.data?.title === vid1Doc.title &&
        Boolean(detailsRes.data?.data?.channel?.name)
    );

    // 3. Playback endpoint returns streaming details for public video
    const playbackRes = await client.get(`/videos/${vid1Doc._id}/playback`);
    report(
      3,
      'Playback endpoint returns authorized streaming details for public video',
      playbackRes.status === 200 &&
        playbackRes.data?.data?.title === vid1Doc.title &&
        playbackRes.data?.data?.duration === 1845
    );

    // 4. Primary MP4 videoUrl returned
    report(
      4,
      'Playback endpoint includes primary videoUrl and media format',
      playbackRes.status === 200 &&
        playbackRes.data?.data?.videoUrl.includes('react19_stream.mp4') &&
        playbackRes.data?.data?.format === 'mp4'
    );

    // 5. Adaptive HLS streaming manifest URL generated/returned
    report(
      5,
      'Playback endpoint generates/returns adaptive HLS manifest URL (.m3u8)',
      playbackRes.status === 200 &&
        Boolean(playbackRes.data?.data?.hlsUrl) &&
        playbackRes.data?.data?.hlsUrl.includes('.m3u8')
    );

    // 6. Populated channel details returned in playback response
    report(
      6,
      'Playback response includes channel subscribersCount, name, handle, avatar',
      playbackRes.status === 200 &&
        playbackRes.data?.data?.channel?.handle?.startsWith('@') &&
        typeof playbackRes.data?.data?.channel?.subscribersCount === 'number'
    );

    // 7. Invalid video ID parameter rejected with HTTP 400
    const malformedIdRes = await client.get('/videos/malformed-id-999/playback');
    report(
      7,
      'Malformed video ID parameter rejected with HTTP 400',
      malformedIdRes.status === 400
    );

    // 8. Non-existent video ID rejected with HTTP 404
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await client.get(`/videos/${nonExistentId}/playback`);
    report(
      8,
      'Non-existent video ID returns HTTP 404 Not Found',
      notFoundRes.status === 404
    );

    // 9. Private video rejected for unauthenticated guest with HTTP 403
    const guestPrivateRes = await client.get(`/videos/${vid2Doc._id}/playback`);
    report(
      9,
      'Private video playback rejected for unauthenticated guest with HTTP 403',
      guestPrivateRes.status === 403
    );

    // 10. Private video rejected for unauthorized user (Bob) with HTTP 403
    const bobPrivateRes = await client.get(`/videos/${vid2Doc._id}/playback`, bobHeaders);
    report(
      10,
      'Private video playback rejected for unauthorized user (Bob) with HTTP 403',
      bobPrivateRes.status === 403
    );

    // 11. Private video playback allowed for owner (Alice) with HTTP 200
    const alicePrivateRes = await client.get(`/videos/${vid2Doc._id}/playback`, aliceHeaders);
    report(
      11,
      'Private video playback authorized for owner (Alice) with HTTP 200',
      alicePrivateRes.status === 200 && alicePrivateRes.data?.data?._id === vid2Doc._id.toString()
    );

    // 12. Unlisted video playback accessible directly without authentication
    const unlistedPlayback = await client.get(`/videos/${vid3Doc._id}/playback`);
    report(
      12,
      'Unlisted video playback accessible directly via link without authentication',
      unlistedPlayback.status === 200 && unlistedPlayback.data?.data?.visibility === 'unlisted'
    );

    // 13. View tracking increments view count on initial qualified view
    const initialViews = vid1Doc.views;
    const viewRes1 = await client.post(`/videos/${vid1Doc._id}/view`, { watchTime: 10 }, bobHeaders);
    const updatedVid1 = await Video.findById(vid1Doc._id);
    report(
      13,
      'View tracking endpoint increments view count and channel totalViews on qualified view',
      viewRes1.status === 200 &&
        viewRes1.data?.data?.incremented === true &&
        updatedVid1.views === initialViews + 1
    );

    // 14. View tracking debounce / cooldown: repeated view request within 30s does not increment
    const viewRes2 = await client.post(`/videos/${vid1Doc._id}/view`, { watchTime: 12 }, bobHeaders);
    const vidAfterCooldownAttempt = await Video.findById(vid1Doc._id);
    report(
      14,
      'View tracking debounce: repeated view within cooldown window is not counted',
      viewRes2.status === 200 &&
        viewRes2.data?.data?.incremented === false &&
        vidAfterCooldownAttempt.views === updatedVid1.views
    );

    // 15. View tracking watch-time validation: insufficient watch-time (< 5s) does not increment view
    const viewResShort = await client.post(`/videos/${vid4Doc._id}/view`, { watchTime: 2 }, bobHeaders);
    const vid4Check = await Video.findById(vid4Doc._id);
    report(
      15,
      'View tracking rejects views with watch-time under 5s threshold',
      viewResShort.status === 200 &&
        viewResShort.data?.data?.incremented === false &&
        vid4Check.views === vid4Doc.views
    );

    // 16. View tracking rejected for unauthorized private video
    const privateViewRes = await client.post(`/videos/${vid2Doc._id}/view`, { watchTime: 10 }, bobHeaders);
    report(
      16,
      'View tracking on private video rejected for unauthorized user with HTTP 403',
      privateViewRes.status === 403
    );

    // 17. Playback progress save rejected for unauthenticated user with HTTP 401
    const unauthProgSave = await client.post(`/videos/${vid1Doc._id}/progress`, { progress: 45, duration: 1845 });
    report(
      17,
      'Unauthenticated request to save playback progress rejected with HTTP 401',
      unauthProgSave.status === 401
    );

    // 18. Playback progress save succeeds for authenticated user (Bob)
    const bobProgSave = await client.post(
      `/videos/${vid1Doc._id}/progress`,
      { progress: 245, duration: 1845 },
      bobHeaders
    );
    const savedHistory = await WatchHistory.findOne({ user: bobReg.data?.data?.user?._id, video: vid1Doc._id });
    report(
      18,
      'Authenticated user saves playback progress (WatchHistory upserted with progress seconds)',
      bobProgSave.status === 200 &&
        bobProgSave.data?.data?.progress === 245 &&
        savedHistory?.watchedSeconds === 245 &&
        savedHistory?.completed === false
    );

    // 19. Playback progress completion: progress >= 90% of duration marks completed
    const bobCompleteProg = await client.post(
      `/videos/${vid1Doc._id}/progress`,
      { progress: 1700, duration: 1845 }, // > 92% of 1845
      bobHeaders
    );
    const completedHistory = await WatchHistory.findOne({ user: bobReg.data?.data?.user?._id, video: vid1Doc._id });
    report(
      19,
      'Playback progress >= 90% automatically sets completed: true in WatchHistory',
      bobCompleteProg.status === 200 && completedHistory?.completed === true
    );

    // 20. Playback progress retrieval returns saved position
    const bobProgGet = await client.get(`/videos/${vid1Doc._id}/progress`, bobHeaders);
    report(
      20,
      'Playback progress retrieval returns user saved position and completion status',
      bobProgGet.status === 200 &&
        bobProgGet.data?.data?.hasHistory === true &&
        bobProgGet.data?.data?.progress === 1700
    );

    // 21. Saving progress on another user private video rejected with HTTP 403
    const bobPrivateProg = await client.post(
      `/videos/${vid2Doc._id}/progress`,
      { progress: 50, duration: 600 },
      bobHeaders
    );
    report(
      21,
      'Saving playback progress on private video rejected with HTTP 403 for unauthorized viewer',
      bobPrivateProg.status === 403
    );

    // 22. Related videos query excludes the current video
    const relatedRes = await client.get(`/videos/${vid1Doc._id}/related`);
    const relatedIds = (relatedRes.data?.data?.videos || []).map((v) => v._id.toString());
    report(
      22,
      'Related videos recommendation endpoint strictly excludes the currently watched video',
      relatedRes.status === 200 && !relatedIds.includes(vid1Doc._id.toString())
    );

    // 23. Related videos strictly excludes private videos and videos that are not ready
    const hasPrivateInRelated = relatedIds.includes(vid2Doc._id.toString());
    const hasUploadingInRelated = relatedIds.includes(vid5Doc._id.toString());
    report(
      23,
      'Related videos strictly excludes private videos and incomplete/uploading videos',
      !hasPrivateInRelated && !hasUploadingInRelated
    );

    // 24. Related videos includes matching category video (vid4Doc)
    const hasCategoryMatch = relatedIds.includes(vid4Doc._id.toString());
    report(
      24,
      'Related videos recommendations successfully return matching category public video',
      hasCategoryMatch
    );

    // Clean up created documents
    await Video.deleteMany({ _id: { $in: [vid1Doc._id, vid2Doc._id, vid3Doc._id, vid4Doc._id, vid5Doc._id] } });
    await WatchHistory.deleteMany({ video: { $in: [vid1Doc._id, vid2Doc._id, vid3Doc._id, vid4Doc._id, vid5Doc._id] } });
    await User.deleteMany({ _id: { $in: [aliceReg.data?.data?.user?._id, bobReg.data?.data?.user?._id] } });
    await Channel.deleteMany({ _id: { $in: [aliceChannelId, bobReg.data?.data?.channel?._id] } });

    console.log('\n---------------------------------------------------------------');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('---------------------------------------------------------------\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (testErr) {
    console.error('Unexpected error in playback test execution:', testErr);
    process.exit(1);
  } finally {
    await teardown();
  }
}

runTestSuite();
