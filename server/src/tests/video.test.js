/**
 * VidTube Phase 3: Complete Video Upload, Storage & Management Engine Test Suite
 * Covers 22 critical verification points across authentication, validation, authorization,
 * public discovery, unlisted direct access, private security, updates, and deletion.
 *
 * Run via: node server/src/tests/video.test.js
 */
const axios = require('axios');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const { config } = require('../config/env');

let serverInstance = null;
let client = null;

async function setup() {
  // Connect to DB if not connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(config.mongodbUri);
  }

  // Start temporary server listener on ephemeral port
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
  console.log('   VIDTUBE PHASE 3: VIDEO UPLOAD & MANAGEMENT TEST SUITE');
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
    console.log(`Test server running at: ${testBaseUrl}\n`);
  } catch (err) {
    console.error('Failed to setup test environment:', err.message);
    process.exit(1);
  }

  try {
    // 1. Health check & DB connection
    const healthRes = await client.get('/health');
    report(
      1,
      'Health check endpoint returns healthy and connected database',
      healthRes.status === 200 &&
        healthRes.data?.status === 'healthy' &&
        (healthRes.data?.database?.connected === true || healthRes.data?.database?.status === 'connected')
    );

    // 2. Unauthenticated user rejected from POST /api/videos
    const unauthCreate = await client.post('/videos', { title: 'Unauthorized' });
    report(
      2,
      'Unauthenticated request to POST /api/videos rejected with HTTP 401',
      unauthCreate.status === 401
    );

    // 3. Unauthenticated user rejected from POST /api/videos/upload-signature
    const unauthSig = await client.post('/videos/upload-signature');
    report(
      3,
      'Unauthenticated request to upload signature rejected with HTTP 401',
      unauthSig.status === 401
    );

    // 4. Unauthenticated user rejected from GET /api/videos/my-videos
    const unauthMyVideos = await client.get('/videos/my-videos');
    report(
      4,
      'Unauthenticated request to GET /api/videos/my-videos rejected with HTTP 401',
      unauthMyVideos.status === 401
    );

    // 5. Register Alice (Creator A)
    const aliceData = {
      name: 'Alice Creator',
      username: `alice_${Date.now()}`,
      email: `alice_${Date.now()}@vidtube.com`,
      password: 'SecurePassword@2026',
      confirmPassword: 'SecurePassword@2026'
    };
    const aliceReg = await client.post('/auth/register', aliceData);
    const aliceToken = aliceReg.data?.data?.accessToken;
    const aliceHeaders = { headers: { Authorization: `Bearer ${aliceToken}` } };
    const aliceChannelId = aliceReg.data?.data?.channel?._id;

    report(
      5,
      'User A (Alice) registered with auto-created channel',
      aliceReg.status === 201 && Boolean(aliceToken) && Boolean(aliceChannelId)
    );

    // 6. Register Bob (User B)
    const bobData = {
      name: 'Bob Viewer',
      username: `bob_${Date.now()}`,
      email: `bob_${Date.now()}@vidtube.com`,
      password: 'SecurePassword@2026',
      confirmPassword: 'SecurePassword@2026'
    };
    const bobReg = await client.post('/auth/register', bobData);
    const bobToken = bobReg.data?.data?.accessToken;
    const bobHeaders = { headers: { Authorization: `Bearer ${bobToken}` } };

    report(
      6,
      'User B (Bob) registered for authorization isolation tests',
      bobReg.status === 201 && Boolean(bobToken)
    );

    // 7. Authenticated upload signature request
    const sigRes = await client.post('/videos/upload-signature', { folder: 'vidtube/videos' }, aliceHeaders);
    report(
      7,
      'Authenticated user can request Cloudinary upload signature',
      sigRes.status === 200 && sigRes.data?.success === true
    );

    // 8. Validation: Missing title rejected
    const invalidTitleRes = await client.post('/videos', { description: 'No title' }, aliceHeaders);
    report(
      8,
      'Validation: Missing video title rejected with HTTP 400',
      invalidTitleRes.status === 400
    );

    // 9. Validation: Invalid visibility rejected
    const invalidVisRes = await client.post(
      '/videos',
      { title: 'Bad Visibility', visibility: 'secret-classified' },
      aliceHeaders
    );
    report(
      9,
      'Validation: Invalid visibility setting rejected with HTTP 400',
      invalidVisRes.status === 400
    );

    // 10. Validation: Malformed Mongo ID param rejected
    const invalidIdRes = await client.get('/videos/not-a-valid-mongo-id');
    report(
      10,
      'Validation: Malformed MongoDB ID param rejected with HTTP 400',
      invalidIdRes.status === 400
    );

    // 11. Alice creates Video 1 (Public)
    const createVid1 = await client.post(
      '/videos',
      {
        title: 'Full-Stack React 19 & Node Masterclass',
        description: 'Complete hands-on guide to building scalable full-stack applications.',
        category: 'Technology',
        tags: ['react', 'node', 'express'],
        visibility: 'public'
      },
      aliceHeaders
    );
    const vid1Id = createVid1.data?.data?._id;
    report(
      11,
      'Alice creates Public Video metadata (POST /api/videos)',
      createVid1.status === 201 && Boolean(vid1Id)
    );

    // 12. Alice confirms completion of Video 1
    const completeVid1 = await client.post(
      `/videos/${vid1Id}/complete`,
      {
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample_masterclass.mp4',
        publicId: 'vidtube/videos/sample_masterclass_123',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
        duration: 1845,
        format: 'mp4',
        processingStatus: 'ready'
      },
      aliceHeaders
    );
    const updatedChannel = await Channel.findById(aliceChannelId);
    report(
      12,
      'Alice completes video upload: status set to ready & channel videosCount incremented',
      completeVid1.status === 200 &&
        completeVid1.data?.data?.processingStatus === 'ready' &&
        updatedChannel.videosCount >= 1
    );

    // 13. Alice creates and completes Video 2 (Private)
    const createVid2 = await client.post(
      '/videos',
      {
        title: 'Alice Private Vault Recording',
        description: 'Personal diary video, strictly confidential.',
        category: 'Personal',
        visibility: 'private'
      },
      aliceHeaders
    );
    const vid2Id = createVid2.data?.data?._id;
    await client.post(
      `/videos/${vid2Id}/complete`,
      {
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/private_vault.mp4',
        publicId: 'vidtube/videos/private_vault_456',
        duration: 300,
        processingStatus: 'ready'
      },
      aliceHeaders
    );
    report(
      13,
      'Alice creates and completes Private Video (visibility: private)',
      createVid2.status === 201 && Boolean(vid2Id)
    );

    // 14. Alice creates and completes Video 3 (Unlisted)
    const createVid3 = await client.post(
      '/videos',
      {
        title: 'Alice Unlisted Direct Share',
        description: 'Only accessible via direct URL link.',
        category: 'Education',
        visibility: 'unlisted'
      },
      aliceHeaders
    );
    const vid3Id = createVid3.data?.data?._id;
    await client.post(
      `/videos/${vid3Id}/complete`,
      {
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/unlisted_demo.mp4',
        publicId: 'vidtube/videos/unlisted_demo_789',
        duration: 620,
        processingStatus: 'ready'
      },
      aliceHeaders
    );
    report(
      14,
      'Alice creates and completes Unlisted Video (visibility: unlisted)',
      createVid3.status === 201 && Boolean(vid3Id)
    );

    // 15. Public Discovery (GET /api/videos)
    const publicList = await client.get('/videos');
    const returnedIds = (publicList.data?.data?.videos || []).map((v) => v._id);
    const hasVid1 = returnedIds.includes(vid1Id);
    const hasVid2 = returnedIds.includes(vid2Id);
    const hasVid3 = returnedIds.includes(vid3Id);
    report(
      15,
      'Public listing includes public video but strictly excludes private and unlisted videos',
      publicList.status === 200 && hasVid1 && !hasVid2 && !hasVid3
    );

    // 16. Unlisted video direct link access
    const directUnlisted = await client.get(`/videos/${vid3Id}`);
    report(
      16,
      'Unlisted video accessible directly via link without authentication',
      directUnlisted.status === 200 && directUnlisted.data?.data?._id === vid3Id
    );

    // 17. Private video authorization: Bob rejected, Alice allowed
    const bobAccessPrivate = await client.get(`/videos/${vid2Id}`, bobHeaders);
    const anonAccessPrivate = await client.get(`/videos/${vid2Id}`);
    const aliceAccessPrivate = await client.get(`/videos/${vid2Id}`, aliceHeaders);
    report(
      17,
      'Private video rejected with HTTP 403 for other users/guests, allowed for owner',
      bobAccessPrivate.status === 403 &&
        anonAccessPrivate.status === 403 &&
        aliceAccessPrivate.status === 200
    );

    // 18. Creator video management (GET /api/videos/my-videos)
    const aliceMyVideos = await client.get('/videos/my-videos', aliceHeaders);
    const bobMyVideos = await client.get('/videos/my-videos', bobHeaders);
    const aliceVideoList = aliceMyVideos.data?.data?.videos || [];
    report(
      18,
      'Creator dashboard returns all owner videos (public+unlisted+private) and isolates other users',
      aliceMyVideos.status === 200 &&
        aliceVideoList.length >= 3 &&
        bobMyVideos.data?.data?.videos?.length === 0
    );

    // 19. Unauthorized video update rejected (Bob cannot edit Alice video)
    const bobUpdate = await client.patch(
      `/videos/${vid1Id}`,
      { title: 'Bob Hijacked Title' },
      bobHeaders
    );
    report(
      19,
      'Non-owner is rejected with HTTP 403 when attempting to update video',
      bobUpdate.status === 403
    );

    // 20. Owner video details & thumbnail update
    const aliceUpdate = await client.patch(
      `/videos/${vid1Id}`,
      {
        title: 'Full-Stack React 19 Masterclass (Updated Edition)',
        category: 'Education'
      },
      aliceHeaders
    );
    const aliceThumbUpdate = await client.patch(
      `/videos/${vid1Id}/thumbnail`,
      { thumbnailUrl: 'https://images.unsplash.com/photo-custom-new.jpg' },
      aliceHeaders
    );
    report(
      20,
      'Owner can update video metadata details and custom thumbnail',
      aliceUpdate.status === 200 &&
        aliceUpdate.data?.data?.title.includes('Updated Edition') &&
        aliceThumbUpdate.status === 200 &&
        aliceThumbUpdate.data?.data?.thumbnailUrl.includes('photo-custom-new.jpg')
    );

    // 21. Owner visibility toggle
    const aliceVisToggle = await client.patch(
      `/videos/${vid2Id}/visibility`,
      { visibility: 'public' },
      aliceHeaders
    );
    report(
      21,
      'Owner can toggle video visibility (private -> public)',
      aliceVisToggle.status === 200 &&
        aliceVisToggle.data?.data?.visibility === 'public'
    );

    // 22. Video deletion & channel videosCount decrement
    const bobDelete = await client.delete(`/videos/${vid3Id}`, bobHeaders);
    const countBeforeDelete = (await Channel.findById(aliceChannelId)).videosCount;
    const aliceDelete = await client.delete(`/videos/${vid3Id}`, aliceHeaders);
    const countAfterDelete = (await Channel.findById(aliceChannelId)).videosCount;
    const checkDeleted = await client.get(`/videos/${vid3Id}`);

    report(
      22,
      'Video deletion enforced: non-owner rejected (403), owner deletes, channel count decrements',
      bobDelete.status === 403 &&
        aliceDelete.status === 200 &&
        countAfterDelete === countBeforeDelete - 1 &&
        checkDeleted.status === 404
    );

    // Clean up created test videos
    await Video.deleteMany({ _id: { $in: [vid1Id, vid2Id, vid3Id] } });
    await User.deleteMany({ _id: { $in: [aliceReg.data?.data?.user?._id, bobReg.data?.data?.user?._id] } });
    await Channel.deleteMany({ _id: { $in: [aliceChannelId, bobReg.data?.data?.channel?._id] } });

    console.log('\n---------------------------------------------------------------');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('---------------------------------------------------------------\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (testErr) {
    console.error('Unexpected error in test execution:', testErr);
    process.exit(1);
  } finally {
    await teardown();
  }
}

runTestSuite();
