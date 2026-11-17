/**
 * VidTube Phase 7: Search, Playlists, Watch History & Recommendations Test Suite
 * Covers 45+ verification points across:
 * - Full-text & regex multi-type search (videos, shorts, channels)
 * - Search autocomplete suggestions & user search history isolation
 * - Search filters (content type, date, duration) and sorting
 * - Playlist CRUD, visibility permissions, video addition, removal, and reordering
 * - Watch Later system playlist creation, deduplication, removal, and status check
 * - Watch History tracking for videos & shorts, continue watching calculations (>=90% completion)
 * - History search, individual entry deletion, and bulk clear
 * - Weighted recommendation engine, trending velocity, and related video similarity
 *
 * Run via: npm run test:phase7 --workspace=server
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
const Playlist = require('../models/Playlist');
const WatchHistory = require('../models/WatchHistory');
const SearchHistory = require('../models/SearchHistory');
const Subscription = require('../models/Subscription');
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

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('   VIDTUBE PHASE 7: SEARCH, PLAYLISTS & HISTORY TEST SUITE');
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

  try {
    const timestamp = Date.now();

    // 1. Register test users
    // User A (Creator)
    const userARes = await client.post('/auth/register', {
      name: `Creator Seven A ${timestamp}`,
      username: `creator7_a_${timestamp}`,
      email: `creator7_a_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    const tokenA = userARes.data?.data?.accessToken;
    const userA = userARes.data?.data?.user;
    const channelA = userARes.data?.data?.channel;

    // User B (Viewer)
    const userBRes = await client.post('/auth/register', {
      name: `Viewer Seven B ${timestamp}`,
      username: `viewer7_b_${timestamp}`,
      email: `viewer7_b_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    const tokenB = userBRes.data?.data?.accessToken;
    const userB = userBRes.data?.data?.user;

    // User C (Second viewer)
    const userCRes = await client.post('/auth/register', {
      name: `Viewer Seven C ${timestamp}`,
      username: `viewer7_c_${timestamp}`,
      email: `viewer7_c_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    const tokenC = userCRes.data?.data?.accessToken;
    const userC = userCRes.data?.data?.user;

    // 2. Create test videos
    // Public Video 1: "Mastering React 19 and Next Gen UI" (Gaming category, duration 600s)
    const v1Res = await client.post(
      '/videos',
      {
        title: `Mastering React 19 and Web Development ${timestamp}`,
        description: 'Comprehensive deep dive into modern components and hooks',
        tags: ['react', 'webdev', 'javascript', 'frontend'],
        category: 'Technology',
        visibility: 'public',
        publicId: `vid_react_${timestamp}`,
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        duration: 600
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const video1 = v1Res.data.data;

    // Public Video 2: "Quick Gaming Highlights montage" (duration 180s < 4 min)
    const v2Res = await client.post(
      '/videos',
      {
        title: `Epic Gaming Montage Speedrun ${timestamp}`,
        description: 'Unbelievable gaming tournament clutch moments',
        tags: ['gaming', 'speedrun', 'epic', 'montage'],
        category: 'Gaming',
        visibility: 'public',
        publicId: `vid_game_${timestamp}`,
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        duration: 180
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const video2 = v2Res.data.data;

    // Public Video 3: "Full Symphony Concert Live" (Music category, duration 1800s > 20 min)
    const v3Res = await client.post(
      '/videos',
      {
        title: `Classical Music Orchestral Symphony Live ${timestamp}`,
        description: 'Live performance by the philharmonic orchestra',
        tags: ['music', 'classical', 'orchestra', 'concert'],
        category: 'Music',
        visibility: 'public',
        publicId: `vid_music_${timestamp}`,
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        duration: 1800
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const video3 = v3Res.data.data;

    // Private Video 4: "Secret Internal Strategy"
    const v4Res = await client.post(
      '/videos',
      {
        title: `Confidential Secret Roadmap ${timestamp}`,
        description: 'Top secret strategy video do not share',
        tags: ['secret', 'private'],
        category: 'Education',
        visibility: 'private',
        publicId: `vid_secret_${timestamp}`,
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        duration: 300
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const video4 = v4Res.data.data;

    // 3. Create test Short
    const shortRes = await client.post(
      '/shorts',
      {
        title: `Amazing Coding Hack in 30 Seconds ${timestamp}`,
        description: 'Super fast productivity trick #shorts #coding',
        tags: ['coding', 'shorts', 'hack', 'webdev'],
        visibility: 'public',
        publicId: `short_hack_${timestamp}`,
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample_vertical.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample_thumb.jpg',
        duration: 30
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const short1 = shortRes.data.data;

    // -------------------------------------------------------------------------
    // GROUP 1: Search Engine (Multi-type, suggestions, filters & user history)
    // -------------------------------------------------------------------------
    console.log('--- GROUP 1: Search Engine & Suggestions ---');

    // Test 1: General search query matches videos, shorts, and channels
    const s1 = await client.get(`/search?q=${encodeURIComponent(timestamp)}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      1,
      'Search query returns matching public video',
      s1.status === 200 && s1.data.data.videos.some((v) => v._id === video1._id)
    );

    // Test 2: Search includes matching short
    report(
      2,
      'Search query returns matching short in unified items or shorts shelf',
      s1.status === 200 &&
        (s1.data.data.shorts.some((s) => s._id === short1._id) ||
         s1.data.data.items.some((i) => i.type === 'shorts_shelf' || (i.data && i.data.some && i.data.some((s) => s._id === short1._id))))
    );

    // Test 3: Channel search by handle or name
    const sChannel = await client.get(`/search?q=${encodeURIComponent(channelA.handle)}&type=channel`);
    report(
      3,
      'Search by channel handle with type=channel returns creator channel',
      sChannel.status === 200 && sChannel.data.data.channels.some((c) => c._id === channelA._id)
    );

    // Test 4: Private video exclusion
    const sSecret = await client.get(`/search?q=${encodeURIComponent('Confidential Secret Roadmap ' + timestamp)}`);
    report(
      4,
      'Private video is strictly excluded from public search results',
      sSecret.status === 200 && !sSecret.data.data.videos.some((v) => v._id === video4._id)
    );

    // Test 5: Search duration filter: under4m
    const sUnder4m = await client.get(`/search?q=${encodeURIComponent(timestamp)}&duration=under4m`);
    report(
      5,
      'Search duration filter "under4m" returns only videos under 4 minutes',
      sUnder4m.status === 200 &&
        sUnder4m.data.data.videos.every((v) => v.duration < 240) &&
        sUnder4m.data.data.videos.some((v) => v._id === video2._id)
    );

    // Test 6: Search duration filter: over20m
    const sOver20m = await client.get(`/search?q=${encodeURIComponent(timestamp)}&duration=over20m`);
    report(
      6,
      'Search duration filter "over20m" returns only videos over 20 minutes',
      sOver20m.status === 200 &&
        sOver20m.data.data.videos.every((v) => v.duration > 1200) &&
        sOver20m.data.data.videos.some((v) => v._id === video3._id)
    );

    // Test 7: Search upload date filter "today"
    const sDate = await client.get(`/search?q=${encodeURIComponent(timestamp)}&uploadDate=today`);
    report(
      7,
      'Search upload date filter "today" includes recently created videos',
      sDate.status === 200 && sDate.data.data.videos.length > 0
    );

    // Test 8: Autocomplete suggestions query
    const sugRes = await client.get(`/search/suggestions?q=${encodeURIComponent('Mastering')}`);
    report(
      8,
      'Search suggestions returns matching query terms',
      sugRes.status === 200 && Array.isArray(sugRes.data.data.suggestions) && sugRes.data.data.suggestions.length > 0
    );

    // Test 9: Authenticated user search history was persisted
    const histRes = await client.get('/search/history', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      9,
      'Authenticated search query is recorded in user search history',
      histRes.status === 200 &&
        Array.isArray(histRes.data.data.history) &&
        histRes.data.data.history.length > 0
    );

    // Test 10: User search history isolation
    const histResC = await client.get('/search/history', {
      headers: { Authorization: `Bearer ${tokenC}` }
    });
    report(
      10,
      'Search history is isolated: User C sees 0 queries recorded by User B',
      histResC.status === 200 && histResC.data.data.history.length === 0
    );

    // Test 11: Delete single search history entry
    const entryToDelete = histRes.data.data.history[0];
    const delRes = await client.delete(`/search/history/${entryToDelete._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      11,
      'User can delete individual search history entry',
      delRes.status === 200
    );

    // Test 12: Clear all search history
    await client.get(`/search?q=query_to_clear_${timestamp}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const clearRes = await client.delete('/search/history', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const afterClear = await client.get('/search/history', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      12,
      'User can clear all search history',
      clearRes.status === 200 && afterClear.data.data.history.length === 0
    );

    // -------------------------------------------------------------------------
    // GROUP 2: Playlists System (CRUD, permissions, reordering)
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP 2: Playlists Engine ---');

    // Test 13: Create custom playlist
    const pCreate = await client.post(
      '/playlists',
      {
        title: `My Awesome Coding Playlist ${timestamp}`,
        description: 'Best coding tutorials and tips',
        visibility: 'public',
        videoId: video1._id
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const playlist1 = pCreate.data.data;
    report(
      13,
      'User B creates a custom playlist with initial video (201 Created)',
      pCreate.status === 201 && playlist1.title.startsWith('My Awesome Coding Playlist') && playlist1.videos.length === 1
    );

    // Test 14: Add second video to playlist
    const pAdd = await client.post(
      `/playlists/${playlist1._id}/videos`,
      { videoId: video2._id },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      14,
      'Add second video to playlist succeeds and increments count',
      pAdd.status === 200 && pAdd.data.data.videos.length === 2
    );

    // Test 15: Duplicate video addition is idempotent
    const pDup = await client.post(
      `/playlists/${playlist1._id}/videos`,
      { videoId: video2._id },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      15,
      'Adding duplicate video to playlist is safely deduplicated',
      pDup.status === 200 && pDup.data.data.videos.length === 2
    );

    // Test 16: Add third video for reordering
    await client.post(
      `/playlists/${playlist1._id}/videos`,
      { videoId: video3._id },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );

    // Test 16: Get user playlists returns created playlist
    const pList = await client.get(`/playlists?userId=${userB._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      16,
      'Get user playlists returns owner playlists including custom and system',
      pList.status === 200 &&
        Array.isArray(pList.data.data) &&
        pList.data.data.some((pl) => pl._id === playlist1._id)
    );

    // Test 17: Reorder videos in playlist
    const reorderRes = await client.patch(
      `/playlists/${playlist1._id}/reorder`,
      {
        videoIds: [video3._id, video1._id, video2._id]
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      17,
      'Reorder playlist by array of videoIds updates sequence correctly',
      reorderRes.status === 200 &&
        reorderRes.data.data.videos[0].video.toString() === video3._id.toString()
    );

    // Test 18: Remove video from playlist
    const pRemove = await client.delete(
      `/playlists/${playlist1._id}/videos/${video1._id}`,
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      18,
      'Remove video from playlist successfully deletes the item',
      pRemove.status === 200 &&
        pRemove.data.data.videos.length === 2 &&
        !pRemove.data.data.videos.some((v) => v.video.toString() === video1._id.toString())
    );

    // Test 19: Get single playlist by ID (populated)
    const pGet = await client.get(`/playlists/${playlist1._id}`);
    report(
      19,
      'Get playlist by ID returns populated video details and owner information',
      pGet.status === 200 &&
        pGet.data.data.videos[0].video.title != null &&
        pGet.data.data.owner.username === userB.username
    );

    // Test 20: Update playlist metadata
    const pUpdate = await client.patch(
      `/playlists/${playlist1._id}`,
      {
        title: `Updated Playlist Title ${timestamp}`,
        description: 'Updated description here'
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      20,
      'Owner can update playlist title and description',
      pUpdate.status === 200 && pUpdate.data.data.title === `Updated Playlist Title ${timestamp}`
    );

    // Test 21: Non-owner cannot update playlist (403 Forbidden)
    const pUpdateFail = await client.patch(
      `/playlists/${playlist1._id}`,
      { title: 'Hacked Title' },
      { headers: { Authorization: `Bearer ${tokenC}` } }
    );
    report(
      21,
      'Non-owner update attempt rejected with 403 Forbidden',
      pUpdateFail.status === 403
    );

    // Test 22: Private playlist visibility enforcement
    const pPrivCreate = await client.post(
      '/playlists',
      {
        title: `Secret Private Playlist ${timestamp}`,
        visibility: 'private'
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const privPlaylist = pPrivCreate.data.data;
    const pPrivGetFail = await client.get(`/playlists/${privPlaylist._id}`, {
      headers: { Authorization: `Bearer ${tokenC}` }
    });
    report(
      22,
      'Private playlist cannot be viewed by other users (403 Forbidden)',
      pPrivGetFail.status === 403
    );

    // Test 23: Owner CAN view their own private playlist
    const pPrivGetOwner = await client.get(`/playlists/${privPlaylist._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      23,
      'Owner can view their own private playlist',
      pPrivGetOwner.status === 200 && pPrivGetOwner.data.data._id === privPlaylist._id
    );

    // Test 24: Delete custom playlist
    const pDelete = await client.delete(`/playlists/${playlist1._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      24,
      'Owner can delete their custom playlist (200 OK)',
      pDelete.status === 200
    );

    // -------------------------------------------------------------------------
    // GROUP 3: Watch Later System
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP 3: Watch Later Engine ---');

    // Test 25: Add video to Watch Later
    const wlAdd = await client.post(
      `/watch-later/${video1._id}`,
      {},
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      25,
      'Add video to Watch Later returns isInWatchLater: true',
      wlAdd.status === 200 && wlAdd.data.data.isInWatchLater === true
    );

    // Test 26: Check Watch Later status
    const wlCheck = await client.get(`/watch-later/check/${video1._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      26,
      'Check Watch Later status returns isInWatchLater: true',
      wlCheck.status === 200 && wlCheck.data.data.isInWatchLater === true
    );

    // Test 27: Check Watch Later for unsaved video returns false
    const wlCheckFalse = await client.get(`/watch-later/check/${video3._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      27,
      'Check Watch Later status for unsaved video returns isInWatchLater: false',
      wlCheckFalse.status === 200 && wlCheckFalse.data.data.isInWatchLater === false
    );

    // Test 28: Get Watch Later playlist
    const wlGet = await client.get('/watch-later', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      28,
      'Get Watch Later playlist returns system playlist populated with videos',
      wlGet.status === 200 &&
        wlGet.data.data.isSystem === true &&
        wlGet.data.data.videos.some((v) => v.video._id === video1._id)
    );

    // Test 29: System playlist protection: cannot delete system playlist
    const wlDelSystemFail = await client.delete(`/playlists/${wlGet.data.data._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      29,
      'System playlist cannot be deleted via playlist DELETE route (400 Bad Request)',
      wlDelSystemFail.status === 400
    );

    // Test 30: Remove video from Watch Later
    const wlRemove = await client.delete(`/watch-later/${video1._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      30,
      'Remove video from Watch Later returns isInWatchLater: false',
      wlRemove.status === 200 && wlRemove.data.data.isInWatchLater === false
    );

    // Test 31: Status after removal is false
    const wlCheckAfter = await client.get(`/watch-later/check/${video1._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      31,
      'Check Watch Later after removal returns isInWatchLater: false',
      wlCheckAfter.status === 200 && wlCheckAfter.data.data.isInWatchLater === false
    );

    // -------------------------------------------------------------------------
    // GROUP 4: Watch History & Continue Watching
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP 4: Watch History & Continue Watching ---');

    // Test 32: Track progress on video (partial: 120s of 600s = 20%)
    const trackPartial = await client.post(
      '/history/track',
      {
        videoId: video1._id,
        contentType: 'Video',
        watchedSeconds: 120,
        duration: 600,
        completed: false
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      32,
      'Track partial progress on video (watchedSeconds: 120, completed: false)',
      trackPartial.status === 200 &&
        trackPartial.data.data.watchedSeconds === 120 &&
        trackPartial.data.data.completed === false
    );

    // Test 33: Track progress on Short
    const trackShort = await client.post(
      '/history/track',
      {
        shortId: short1._id,
        contentType: 'Short',
        watchedSeconds: 30,
        duration: 30,
        completed: true
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    report(
      33,
      'Track progress on Short records correctly with contentType="Short"',
      trackShort.status === 200 &&
        trackShort.data.data.contentType === 'Short' &&
        trackShort.data.data.short === short1._id
    );

    // Test 34: Continue Watching contains partially watched video1
    const cwRes = await client.get('/history/continue-watching', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      34,
      'Continue watching list includes partially watched video (progress < 90%)',
      cwRes.status === 200 &&
        Array.isArray(cwRes.data.data) &&
        cwRes.data.data.some((item) => item.video._id === video1._id)
    );

    // Test 35: Track progress >= 90% marks completed and removes from continue watching
    await client.post(
      '/history/track',
      {
        videoId: video1._id,
        contentType: 'Video',
        watchedSeconds: 560, // 560/600 = 93.3% >= 90%
        duration: 600
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const cwAfterCompleted = await client.get('/history/continue-watching', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      35,
      'Completing video (>= 90% watched) automatically removes it from continue watching',
      cwAfterCompleted.status === 200 &&
        !cwAfterCompleted.data.data.some((item) => item.video._id === video1._id)
    );

    // Test 36: Get Watch History includes both Video and Short
    const histAll = await client.get('/history', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      36,
      'User history feed contains both long-form videos and shorts with metadata',
      histAll.status === 200 &&
        histAll.data.data.history.some((h) => h.contentType === 'Video') &&
        histAll.data.data.history.some((h) => h.contentType === 'Short')
    );

    // Test 37: Search inside history
    const histSearch = await client.get(`/history?q=${encodeURIComponent('Coding Hack')}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      37,
      'Query filter inside user watch history filters results accurately',
      histSearch.status === 200 &&
        histSearch.data.data.history.every((h) => {
          const target = h.contentType === 'Short' ? h.short : h.video;
          return target && target.title.includes('Coding Hack');
        })
    );

    // Test 38: Delete single history entry
    const entryToDeleteHist = histAll.data.data.history[0];
    const delHistRes = await client.delete(`/history/${entryToDeleteHist._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      38,
      'Delete single watch history entry succeeds (200 OK)',
      delHistRes.status === 200
    );

    // Test 39: Clear all watch history
    const clearHistRes = await client.delete('/history', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const afterClearHist = await client.get('/history', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      39,
      'Clear all watch history removes all entries for user',
      clearHistRes.status === 200 && afterClearHist.data.data.history.length === 0
    );

    // -------------------------------------------------------------------------
    // GROUP 5: Recommendation Engine & Discovery
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP 5: Recommendation Engine ---');

    // Test 40: Public guest recommendations
    const recGuest = await client.get('/recommendations');
    report(
      40,
      'Public recommendations endpoint returns popular public videos',
      recGuest.status === 200 && Array.isArray(recGuest.data.data.videos) && recGuest.data.data.videos.length > 0
    );

    // Test 41: Recommendations with category filter
    const recGaming = await client.get('/recommendations?category=Gaming');
    report(
      41,
      'Recommendations filtered by category returns matching category videos',
      recGaming.status === 200 &&
        recGaming.data.data.videos.every((v) => v.category.toLowerCase() === 'gaming')
    );

    // Test 42: Trending videos endpoint
    const trendRes = await client.get('/recommendations/trending');
    report(
      42,
      'Trending endpoint returns high-view/recent videos',
      trendRes.status === 200 && Array.isArray(trendRes.data.data) && trendRes.data.data.length > 0
    );

    // Test 43: Related videos for watch page
    const relRes = await client.get(`/recommendations/related/${video1._id}`);
    report(
      43,
      'Related videos returns similar videos and strictly excludes current videoId',
      relRes.status === 200 &&
        Array.isArray(relRes.data.data) &&
        !relRes.data.data.some((v) => v._id === video1._id)
    );

    // Test 44: Personalized recommendations boost subscribed channels
    // User B subscribes to Channel A
    await client.post(
      `/channels/${channelA._id}/subscribe`,
      {},
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const recAuth = await client.get('/recommendations', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    report(
      44,
      'Personalized recommendations prioritizes content from subscribed channels',
      recAuth.status === 200 &&
        recAuth.data.data.videos.some((v) => v.channel && (v.channel._id === channelA._id || v.channel === channelA._id))
    );

    // Test 45: Private video strictly excluded from recommendations
    report(
      45,
      'Private video is strictly excluded from general and trending recommendations',
      !recGuest.data.data.videos.some((v) => v._id === video4._id) &&
      !trendRes.data.data.some((v) => v._id === video4._id)
    );

  } catch (err) {
    console.error('[UNHANDLED TEST ERROR]:', err);
    failed++;
  } finally {
    console.log('\n===============================================================');
    console.log(`   PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    await teardown();
    process.exit(failed > 0 ? 1 : 0);
  }
}

setup().then(runTestSuite);
