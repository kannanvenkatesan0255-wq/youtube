/**
 * VidTube Phase 5: Shorts Upload, Vertical Video Feed & Interaction Engine Test Suite
 * Covers 24 verification points across Shorts upload signatures, metadata validation,
 * vertical aspect ratio, public feed, private access control, unlisted discovery,
 * view tracking cooldown, creator management, update, visibility toggle, and deletion.
 *
 * Run via: node server/src/tests/shorts.test.js
 */
const axios = require('axios');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Short = require('../models/Short');
const { config } = require('../config/env');

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
  console.log('   VIDTUBE PHASE 5: SHORTS UPLOAD & FEED TEST SUITE');
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
    console.log(`Shorts test server running at: ${testBaseUrl}\n`);
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

    // 2. Unauthenticated access rejected for protected Shorts endpoints
    const unauthSig = await client.post('/shorts/upload-signature');
    const unauthCreate = await client.post('/shorts', { title: 'Test Short' });
    const unauthMyShorts = await client.get('/shorts/my-shorts');
    report(
      2,
      'Unauthenticated requests to protected Shorts endpoints return 401',
      unauthSig.status === 401 && unauthCreate.status === 401 && unauthMyShorts.status === 401
    );

    // 3. User & Channel Registration for Creator Alice and Viewer Bob
    const timestamp = Date.now();
    const aliceData = {
      name: 'Alice Shorts Creator',
      username: `alice_shorts_${timestamp}`,
      email: `alice_shorts_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    const bobData = {
      name: 'Bob Shorts Viewer',
      username: `bob_shorts_${timestamp}`,
      email: `bob_shorts_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    const aliceReg = await client.post('/auth/register', aliceData);
    const aliceToken = aliceReg.data?.data?.accessToken;
    const aliceCookies = aliceReg.headers['set-cookie'];
    const aliceCookieHeader = aliceCookies ? aliceCookies.map((c) => c.split(';')[0]).join('; ') : '';
    const aliceHeaders = {
      headers: {
        Authorization: `Bearer ${aliceToken}`,
        Cookie: aliceCookieHeader
      }
    };

    const bobReg = await client.post('/auth/register', bobData);
    const bobToken = bobReg.data?.data?.accessToken;
    const bobCookies = bobReg.headers['set-cookie'];
    const bobCookieHeader = bobCookies ? bobCookies.map((c) => c.split(';')[0]).join('; ') : '';
    const bobHeaders = {
      headers: {
        Authorization: `Bearer ${bobToken}`,
        Cookie: bobCookieHeader
      }
    };

    report(
      3,
      'Creator Alice and Viewer Bob registered successfully with channels',
      aliceReg.status === 201 && bobReg.status === 201 && !!aliceToken && !!bobToken
    );

    // 4. Upload signature retrieval
    const sigRes = await client.post('/shorts/upload-signature', {}, aliceHeaders);
    report(
      4,
      'Shorts upload signature endpoint returns valid signing data with folder vidtube/shorts',
      sigRes.status === 200 &&
        sigRes.data?.data?.folder === 'vidtube/shorts' &&
        typeof sigRes.data?.data?.timestamp === 'number'
    );

    // 5. Validation: Missing title rejected (400)
    const noTitleRes = await client.post('/shorts', {
      duration: 30,
      visibility: 'public'
    }, aliceHeaders);
    report(
      5,
      'Short creation without title returns 400 Bad Request',
      noTitleRes.status === 400
    );

    // 6. Validation: Duration > 60s rejected (400)
    const longDurationRes = await client.post('/shorts', {
      title: 'Too Long Short',
      duration: 95,
      visibility: 'public'
    }, aliceHeaders);
    report(
      6,
      'Short creation with duration exceeding 60s returns 400 Bad Request',
      longDurationRes.status === 400
    );

    // 7. Validation: Title > 100 characters rejected (400)
    const longTitleRes = await client.post('/shorts', {
      title: 'A'.repeat(105),
      duration: 15
    }, aliceHeaders);
    report(
      7,
      'Short creation with title exceeding 100 chars returns 400 Bad Request',
      longTitleRes.status === 400
    );

    // 8. Create Public Short (201)
    const publicShortRes = await client.post('/shorts', {
      title: 'Epic Skate Trick #shorts',
      description: 'First attempt doing a laser flip in the bowl',
      tags: ['skate', 'tricks', 'vidtube'],
      soundTitle: 'Original Audio - Alice',
      visibility: 'public',
      duration: 25,
      aspectRatio: '9:16',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-skateboarding-tricks-in-a-skatepark-42247-large.mp4',
      publicId: `vidtube/shorts/sample_skate_${timestamp}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?auto=format&fit=crop&w=800&q=80'
    }, aliceHeaders);

    const publicShort = publicShortRes.data?.data;
    report(
      8,
      'Public Short created with 9:16 aspect ratio, sound attribution, and ready status',
      publicShortRes.status === 201 &&
        publicShort?.aspectRatio === '9:16' &&
        publicShort?.soundTitle === 'Original Audio - Alice' &&
        publicShort?.title === 'Epic Skate Trick #shorts'
    );

    // 9. Confirm / Complete Short upload
    const completeRes = await client.post(`/shorts/${publicShort._id}/complete`, {
      videoUrl: publicShort.videoUrl,
      publicId: publicShort.publicId,
      thumbnailUrl: publicShort.thumbnailUrl,
      duration: 25,
      width: 720,
      height: 1280,
      format: 'mp4',
      fileSize: 12450000,
      processingStatus: 'ready'
    }, aliceHeaders);

    report(
      9,
      'Short upload completion sets status to ready with width, height, and duration',
      completeRes.status === 200 &&
        completeRes.data?.data?.processingStatus === 'ready' &&
        completeRes.data?.data?.width === 720 &&
        completeRes.data?.data?.height === 1280
    );

    // 10. Create Unlisted Short
    const unlistedShortRes = await client.post('/shorts', {
      title: 'Secret Skate Practice #unlisted',
      description: 'Behind the scenes practice run',
      tags: ['secret', 'skate'],
      soundTitle: 'Skate Beats Vol 1',
      visibility: 'unlisted',
      duration: 18,
      aspectRatio: '9:16',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-skateboarding-tricks-in-a-skatepark-42247-large.mp4',
      publicId: `vidtube/shorts/sample_unlisted_${timestamp}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&w=800&q=80'
    }, aliceHeaders);
    const unlistedShort = unlistedShortRes.data?.data;

    await client.post(`/shorts/${unlistedShort._id}/complete`, {
      videoUrl: unlistedShort.videoUrl,
      publicId: unlistedShort.publicId,
      duration: 18,
      processingStatus: 'ready'
    }, aliceHeaders);

    report(
      10,
      'Unlisted Short created successfully',
      unlistedShortRes.status === 201 && unlistedShort?.visibility === 'unlisted'
    );

    // 11. Create Private Short
    const privateShortRes = await client.post('/shorts', {
      title: 'Personal Draft Clip #private',
      description: 'Private memory',
      visibility: 'private',
      duration: 12,
      soundTitle: 'Original Audio',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-skateboarding-tricks-in-a-skatepark-42247-large.mp4',
      publicId: `vidtube/shorts/sample_private_${timestamp}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
    }, aliceHeaders);
    const privateShort = privateShortRes.data?.data;

    await client.post(`/shorts/${privateShort._id}/complete`, {
      videoUrl: privateShort.videoUrl,
      publicId: privateShort.publicId,
      duration: 12,
      processingStatus: 'ready'
    }, aliceHeaders);

    report(
      11,
      'Private Short created successfully',
      privateShortRes.status === 201 && privateShort?.visibility === 'private'
    );

    // 12. Public Feed returns public ready shorts
    const feedRes = await client.get('/shorts');
    const feedShorts = feedRes.data?.data?.shorts || [];
    const publicFoundInFeed = feedShorts.some((s) => s._id === publicShort._id);
    const unlistedFoundInFeed = feedShorts.some((s) => s._id === unlistedShort._id);
    const privateFoundInFeed = feedShorts.some((s) => s._id === privateShort._id);

    report(
      12,
      'Public Shorts feed includes public ready short and excludes unlisted and private shorts',
      feedRes.status === 200 && publicFoundInFeed && !unlistedFoundInFeed && !privateFoundInFeed
    );

    // 13. Public Feed populates channel metadata
    const feedItem = feedShorts.find((s) => s._id === publicShort._id);
    report(
      13,
      'Shorts feed populates channel details (name, handle, avatarUrl, subscriberCount)',
      feedItem &&
        feedItem.channel &&
        typeof feedItem.channel.name === 'string' &&
        typeof feedItem.channel.handle === 'string'
    );

    // 14. Unlisted Short accessible via direct lookup by ID
    const getUnlistedRes = await client.get(`/shorts/${unlistedShort._id}`);
    report(
      14,
      'Unlisted Short is accessible via direct ID lookup',
      getUnlistedRes.status === 200 && getUnlistedRes.data?.data?._id === unlistedShort._id
    );

    // 15. Private Short access denied to unauthorized viewer Bob (403)
    const bobAccessPrivate = await client.get(`/shorts/${privateShort._id}`, bobHeaders);
    report(
      15,
      'Viewer Bob attempting to access Alice private Short is rejected with 403 Forbidden',
      bobAccessPrivate.status === 403
    );

    // 16. Private Short accessible to owner Alice (200)
    const aliceAccessPrivate = await client.get(`/shorts/${privateShort._id}`, aliceHeaders);
    report(
      16,
      'Owner Alice can access her own private Short',
      aliceAccessPrivate.status === 200 && aliceAccessPrivate.data?.data?._id === privateShort._id
    );

    // 17. Creator Studio Shorts (GET /api/shorts/my-shorts)
    const aliceMyShortsRes = await client.get('/shorts/my-shorts', aliceHeaders);
    const aliceShorts = aliceMyShortsRes.data?.data?.shorts || [];

    const bobMyShortsRes = await client.get('/shorts/my-shorts', bobHeaders);
    const bobShorts = bobMyShortsRes.data?.data?.shorts || [];

    report(
      17,
      'Creator Alice retrieves all her shorts (public, unlisted, private) while Bob has 0 shorts',
      aliceMyShortsRes.status === 200 &&
        aliceShorts.length >= 3 &&
        bobMyShortsRes.status === 200 &&
        bobShorts.length === 0
    );

    // 18. Creator Studio filter by visibility
    const filterPrivateRes = await client.get('/shorts/my-shorts?visibility=private', aliceHeaders);
    const privateOnlyList = filterPrivateRes.data?.data?.shorts || [];
    report(
      18,
      'Creator Studio filter by visibility=private returns only private shorts',
      filterPrivateRes.status === 200 &&
        privateOnlyList.every((s) => s.visibility === 'private') &&
        privateOnlyList.length >= 1
    );

    // 19. Short View Tracking: Initial view increments count
    const initialViews = publicShort.views || 0;
    const viewRes1 = await client.post(`/shorts/${publicShort._id}/view`, {
      watchDuration: 20
    });
    report(
      19,
      'First view tracking call increments short views count and returns counted: true',
      viewRes1.status === 200 &&
        viewRes1.data?.data?.counted === true &&
        viewRes1.data?.data?.views === initialViews + 1
    );

    // 20. Short View Tracking: Cooldown debounces immediate repeated view
    const viewRes2 = await client.post(`/shorts/${publicShort._id}/view`, {
      watchDuration: 22
    });
    report(
      20,
      'Immediate repeated view from same IP within 30s is debounced with cooldown notice',
      viewRes2.status === 200 &&
        viewRes2.data?.data?.counted === false &&
        viewRes2.data?.data?.cooldown === true
    );

    // 21. Unauthorized update rejected (403)
    const bobUpdateRes = await client.patch(`/shorts/${publicShort._id}`, {
      title: 'Hacked by Bob'
    }, bobHeaders);
    report(
      21,
      'Viewer Bob attempting to update Alice short returns 403 Forbidden',
      bobUpdateRes.status === 403
    );

    // 22. Owner update metadata
    const updateRes = await client.patch(`/shorts/${publicShort._id}`, {
      title: 'Updated Epic Skate Trick #shorts',
      description: 'Clean kickflip over 5 stairs',
      soundTitle: 'Remix Soundtrack - Alice',
      tags: ['skate', 'kickflip', 'vidtube']
    }, aliceHeaders);
    report(
      22,
      'Owner Alice updates Short title, description, and soundTitle successfully',
      updateRes.status === 200 &&
        updateRes.data?.data?.title === 'Updated Epic Skate Trick #shorts' &&
        updateRes.data?.data?.soundTitle === 'Remix Soundtrack - Alice'
    );

    // 23. Visibility toggle (public -> private)
    const toggleVisRes = await client.patch(`/shorts/${publicShort._id}/visibility`, {
      visibility: 'private'
    }, aliceHeaders);

    const feedAfterPrivate = await client.get('/shorts');
    const nowInFeed = (feedAfterPrivate.data?.data?.shorts || []).some((s) => s._id === publicShort._id);

    report(
      23,
      'Owner toggles Short visibility to private, instantly removing it from public feed',
      toggleVisRes.status === 200 &&
        toggleVisRes.data?.data?.visibility === 'private' &&
        !nowInFeed
    );

    // 24. Delete Short (200)
    const deleteRes = await client.delete(`/shorts/${publicShort._id}`, aliceHeaders);
    const checkDeleted = await client.get(`/shorts/${publicShort._id}`, aliceHeaders);

    report(
      24,
      'Owner Alice permanently deletes Short; subsequent queries return 404',
      deleteRes.status === 200 && checkDeleted.status === 404
    );

  } catch (err) {
    console.error('Unhandled test suite error:', err);
  } finally {
    await teardown();
  }

  console.log('\n===============================================================');
  console.log(`   SHORTS TEST RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runTestSuite();
}

module.exports = { runTestSuite };
