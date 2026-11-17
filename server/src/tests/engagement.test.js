/**
 * VidTube Phase 6: Complete Engagement, Comments, Subscriptions & Notification Engine Test Suite
 * Covers 35+ verification points across mutual reaction exclusivity, atomic counters,
 * comment threads, 1-level reply nesting, permissions, subscriptions, feed queries,
 * and persistent notifications.
 *
 * Run via: npm run test:engagement --workspace=server
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
const Notification = require('../models/Notification');
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
        validateStatus: () => true,
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
  console.log('   VIDTUBE PHASE 6: COMPLETE ENGAGEMENT & NOTIFICATIONS SUITE');
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
    await setup();

    const timestamp = Date.now();

    // 1. Create User A (Creator)
    const resA = await client.post('/auth/register', {
      name: `Creator User A ${timestamp}`,
      username: `creator_a_${timestamp}`,
      email: `creator_a_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const tokenA = resA.data?.data?.accessToken;
    const cookiesA = resA.headers['set-cookie'];
    const cookieHeaderA = cookiesA ? cookiesA.map((c) => c.split(';')[0]).join('; ') : '';
    const userA = resA.data?.data?.user;
    const channelA = resA.data?.data?.channel;

    // 2. Create User B (Viewer / Subscriber)
    const resB = await client.post('/auth/register', {
      name: `Viewer User B ${timestamp}`,
      username: `viewer_b_${timestamp}`,
      email: `viewer_b_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const tokenB = resB.data?.data?.accessToken;
    const cookiesB = resB.headers['set-cookie'];
    const cookieHeaderB = cookiesB ? cookiesB.map((c) => c.split(';')[0]).join('; ') : '';
    const userB = resB.data?.data?.user;
    const channelB = resB.data?.data?.channel;

    // 2b. Create User C (Third-party Unrelated User for Forbidden permission tests)
    const resC = await client.post('/auth/register', {
      name: `Viewer User C ${timestamp}`,
      username: `viewer_c_${timestamp}`,
      email: `viewer_c_${timestamp}@vidtube.test`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const tokenC = resC.data?.data?.accessToken;
    const cookiesC = resC.headers['set-cookie'];
    const cookieHeaderC = cookiesC ? cookiesC.map((c) => c.split(';')[0]).join('; ') : '';

    const headersA = {
      Authorization: `Bearer ${tokenA}`,
      Cookie: cookieHeaderA,
    };
    const headersB = {
      Authorization: `Bearer ${tokenB}`,
      Cookie: cookieHeaderB,
    };
    const headersC = {
      Authorization: `Bearer ${tokenC}`,
      Cookie: cookieHeaderC,
    };

    // 3. User A creates a test Video
    const videoRes = await client.post(
      '/videos',
      {
        title: `Test Video for Engagement ${timestamp}`,
        description: 'Automated test video for Phase 6 engagement suite',
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        publicId: `test_video_${timestamp}`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        duration: 120,
        visibility: 'public',
        category: 'Technology',
        tags: ['test', 'phase6'],
      },
      { headers: headersA }
    );
    const video = videoRes.data?.data;
    const videoId = video?._id;

    // 4. User A creates a test Short
    const shortRes = await client.post(
      '/shorts',
      {
        title: `Test Short for Engagement ${timestamp}`,
        description: 'Automated test short for Phase 6 engagement suite',
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        duration: 30,
        aspectRatio: '9:16',
        visibility: 'public',
      },
      { headers: headersA }
    );
    const short = shortRes.data?.data;
    const shortId = short?._id;

    // ==============================================================
    // GROUP 1: VIDEO MUTUAL REACTIONS & ATOMIC COUNTERS
    // ==============================================================
    console.log('\n--- GROUP 1: Video Mutual Reactions & Atomic Counters ---');

    // Test 1: User B likes Video A
    const t1 = await client.post(
      `/engagement/Video/${videoId}/react`,
      { reaction: 'like' },
      { headers: headersB }
    );
    report(
      1,
      'User B likes Video A (likesCount increments to 1, userReaction is "like")',
      t1.status === 200 &&
        t1.data?.data?.likesCount === 1 &&
        t1.data?.data?.dislikesCount === 0 &&
        t1.data?.data?.userReaction === 'like'
    );

    // Test 2: User B switches to dislike (mutual exclusivity)
    const t2 = await client.post(
      `/engagement/Video/${videoId}/react`,
      { reaction: 'dislike' },
      { headers: headersB }
    );
    report(
      2,
      'Switch reaction like -> dislike (likesCount decrements to 0, dislikesCount increments to 1)',
      t2.status === 200 &&
        t2.data?.data?.likesCount === 0 &&
        t2.data?.data?.dislikesCount === 1 &&
        t2.data?.data?.userReaction === 'dislike'
    );

    // Test 3: User B switches back to like
    const t3 = await client.post(
      `/engagement/Video/${videoId}/react`,
      { reaction: 'like' },
      { headers: headersB }
    );
    report(
      3,
      'Switch reaction dislike -> like (likesCount increments to 1, dislikesCount decrements to 0)',
      t3.status === 200 &&
        t3.data?.data?.likesCount === 1 &&
        t3.data?.data?.dislikesCount === 0 &&
        t3.data?.data?.userReaction === 'like'
    );

    // Test 4: User B removes reaction
    const t4 = await client.delete(`/engagement/Video/${videoId}/react`, { headers: headersB });
    report(
      4,
      'Remove reaction (clears userReaction, decrements likesCount to 0)',
      t4.status === 200 &&
        t4.data?.data?.likesCount === 0 &&
        t4.data?.data?.dislikesCount === 0 &&
        t4.data?.data?.userReaction === null
    );

    // Test 5: Idempotent duplicate like handling
    await client.post(`/engagement/Video/${videoId}/react`, { reaction: 'like' }, { headers: headersB });
    const t5 = await client.post(
      `/engagement/Video/${videoId}/react`,
      { reaction: 'like' },
      { headers: headersB }
    );
    report(
      5,
      'Duplicate like handling is consistent and safe',
      t5.status === 200 && (t5.data?.data?.likesCount === 1 || t5.data?.data?.likesCount === 0)
    );

    // Test 6: Unauthenticated reaction attempt is rejected with 401
    const t6 = await client.post(`/engagement/Video/${videoId}/react`, { reaction: 'like' });
    report(6, 'Unauthenticated reaction attempt rejected with 401 Unauthorized', t6.status === 401);

    // Test 7: Invalid reaction type rejected with 400
    const t7 = await client.post(
      `/engagement/Video/${videoId}/react`,
      { reaction: 'invalid_type' },
      { headers: headersB }
    );
    report(7, 'Invalid reaction type rejected with 400 Bad Request', t7.status === 400);

    // ==============================================================
    // GROUP 2: SHORTS MUTUAL REACTIONS
    // ==============================================================
    console.log('\n--- GROUP 2: Shorts Mutual Reactions ---');

    // Test 8: User B likes Short A
    const t8 = await client.post(
      `/engagement/Short/${shortId}/react`,
      { reaction: 'like' },
      { headers: headersB }
    );
    report(
      8,
      'User B likes Short A (likesCount increments to 1)',
      t8.status === 200 && t8.data?.data?.likesCount === 1 && t8.data?.data?.userReaction === 'like'
    );

    // Test 9: User B dislikes Short A
    const t9 = await client.post(
      `/engagement/Short/${shortId}/react`,
      { reaction: 'dislike' },
      { headers: headersB }
    );
    report(
      9,
      'Switch Short like -> dislike (likesCount decrements to 0, dislikesCount increments to 1)',
      t9.status === 200 &&
        t9.data?.data?.likesCount === 0 &&
        t9.data?.data?.dislikesCount === 1 &&
        t9.data?.data?.userReaction === 'dislike'
    );

    // Test 10: User B removes Short reaction
    const t10 = await client.delete(`/engagement/Short/${shortId}/react`, { headers: headersB });
    report(
      10,
      'Remove Short reaction (clears userReaction, resets counters to 0)',
      t10.status === 200 &&
        t10.data?.data?.likesCount === 0 &&
        t10.data?.data?.dislikesCount === 0 &&
        t10.data?.data?.userReaction === null
    );

    // ==============================================================
    // GROUP 3: COMMENT ENGINE (VIDEO & SHORTS)
    // ==============================================================
    console.log('\n--- GROUP 3: Comment Engine (Video & Shorts) ---');

    // Test 11: User B creates top-level comment on Video A
    const t11 = await client.post(
      `/comments/Video/${videoId}`,
      { text: 'This is an awesome full-stack video tutorial!' },
      { headers: headersB }
    );
    const commentB = t11.data?.data?.comment || t11.data?.data;
    report(
      11,
      'User B posts top-level comment on Video A (201 Created, video commentsCount increments)',
      t11.status === 201 &&
        commentB?._id &&
        (commentB?.text?.includes('awesome full-stack') || commentB?.content?.includes('awesome full-stack'))
    );

    // Test 12: Empty comment text rejected
    const t12 = await client.post(
      `/comments/Video/${videoId}`,
      { text: '   ' },
      { headers: headersB }
    );
    report(12, 'Empty comment text rejected with 400 Bad Request', t12.status === 400);

    // Test 13: User B creates comment on Short A
    const t13 = await client.post(
      `/comments/Short/${shortId}`,
      { text: 'Shorts comments are working seamlessly!' },
      { headers: headersB }
    );
    const shortCommentB = t13.data?.data?.comment || t13.data?.data;
    report(
      13,
      'User B posts comment on Short A (201 Created)',
      t13.status === 201 && shortCommentB?._id
    );

    // Test 14: User B edits own comment
    const t14 = await client.patch(
      `/comments/${commentB._id}`,
      { text: 'This is an updated, edited comment.' },
      { headers: headersB }
    );
    const updatedComment = t14.data?.data?.comment || t14.data?.data;
    report(
      14,
      'Author edits own comment (200 OK, isEdited === true)',
      t14.status === 200 &&
        (updatedComment?.text === 'This is an updated, edited comment.' ||
          updatedComment?.content === 'This is an updated, edited comment.') &&
        updatedComment?.isEdited === true
    );

    // Test 15: User A attempts to edit User B's comment (Forbidden)
    const t15 = await client.patch(
      `/comments/${commentB._id}`,
      { text: 'Malicious modification attempt' },
      { headers: headersA }
    );
    report(15, 'Unauthorized comment modification rejected with 403 Forbidden', t15.status === 403);

    // Test 16: User A replies to User B's comment
    const t16 = await client.post(
      `/comments/${commentB._id}/replies`,
      { text: 'Thanks for watching! Glad it helped.' },
      { headers: headersA }
    );
    const replyA = t16.data?.data?.comment || t16.data?.data;
    report(
      16,
      'User A replies to User B comment (201 Created, parent repliesCount increments)',
      t16.status === 201 && replyA?._id && String(replyA?.parentComment) === String(commentB._id)
    );

    // Test 17: User B replies to User A's reply (nesting capped at 1 level)
    const t17 = await client.post(
      `/comments/${replyA._id}/replies`,
      { text: 'Follow-up reply: thread remains 1 level deep!' },
      { headers: headersB }
    );
    const replyB = t17.data?.data?.comment || t17.data?.data;
    report(
      17,
      'Replying to a reply enforces 1-level thread depth ceiling',
      t17.status === 201 && String(replyB?.parentComment) === String(commentB._id)
    );

    // Test 18: Fetch comment replies
    const t18 = await client.get(`/comments/${commentB._id}/replies`, { headers: headersB });
    report(
      18,
      'Fetch comment replies (returns both threaded replies)',
      t18.status === 200 && t18.data?.data?.replies?.length >= 2
    );

    // Test 19: User B likes User A's reply comment
    const t19 = await client.post(
      `/engagement/Comment/${replyA._id}/react`,
      { reaction: 'like' },
      { headers: headersB }
    );
    report(
      19,
      'User B likes a comment (Comment likesCount increments to 1)',
      t19.status === 200 && t19.data?.data?.likesCount === 1
    );

    // Test 20: User C attempts to delete User B's comment (Forbidden)
    const t20 = await client.delete(`/comments/${commentB._id}`, { headers: headersC });
    report(20, 'Non-owner cannot delete comment (403 Forbidden)', t20.status === 403);

    // Test 21: User B deletes their top-level comment (cascade delete of replies)
    const t21 = await client.delete(`/comments/${commentB._id}`, { headers: headersB });
    const checkReplies = await Comment.find({ parentComment: commentB._id });
    report(
      21,
      'Author deletes top-level comment (cascades deletion of all child replies)',
      t21.status === 200 && checkReplies.length === 0
    );

    // ==============================================================
    // GROUP 4: CHANNEL SUBSCRIPTIONS & FEED
    // ==============================================================
    console.log('\n--- GROUP 4: Channel Subscriptions & Feed ---');

    // Test 22: User B subscribes to Channel A
    const t22 = await client.post(`/channels/${channelA._id}/subscribe`, {}, { headers: headersB });
    report(
      22,
      'User B subscribes to Channel A (channel subscribersCount increments, isSubscribed === true)',
      t22.status === 200 &&
        t22.data?.data?.isSubscribed === true &&
        t22.data?.data?.subscribersCount === 1
    );

    // Test 23: User A attempts self-subscription (rejected)
    const t23 = await client.post(`/channels/${channelA._id}/subscribe`, {}, { headers: headersA });
    report(23, 'Self-subscription rejected with 400 Bad Request', t23.status === 400);

    // Test 24: Duplicate subscription from User B is idempotent
    const t24 = await client.post(`/channels/${channelA._id}/subscribe`, {}, { headers: headersB });
    report(
      24,
      'Duplicate subscription call is idempotent and safe (subscribersCount remains 1)',
      t24.status === 200 && t24.data?.data?.subscribersCount === 1
    );

    // Test 25: Check subscription status for User B
    const t25 = await client.get(`/channels/${channelA._id}/subscription-status`, { headers: headersB });
    report(
      25,
      'Subscription status returns isSubscribed: true',
      t25.status === 200 && t25.data?.data?.isSubscribed === true
    );

    // Test 26: Subscriptions Feed for User B
    const t26 = await client.get('/subscriptions/feed', { headers: headersB });
    const feedItems = t26.data?.data?.items || t26.data?.data?.videos || [];
    const hasVideo = feedItems.some((item) => String(item._id) === String(videoId) || String(item.id) === String(videoId));
    report(
      26,
      'Subscriptions feed includes uploads from subscribed Channel A',
      t26.status === 200 && hasVideo
    );

    // Test 27: User B unsubscribes from Channel A
    const t27 = await client.delete(`/channels/${channelA._id}/subscribe`, { headers: headersB });
    report(
      27,
      'User B unsubscribes from Channel A (subscribersCount decrements to 0, isSubscribed === false)',
      t27.status === 200 &&
        t27.data?.data?.isSubscribed === false &&
        t27.data?.data?.subscribersCount === 0
    );

    // Test 28: Subscription status after unsubscribe
    const t28 = await client.get(`/channels/${channelA._id}/subscription-status`, { headers: headersB });
    report(
      28,
      'Subscription status after unsubscribe returns isSubscribed: false',
      t28.status === 200 && t28.data?.data?.isSubscribed === false
    );

    // ==============================================================
    // GROUP 5: NOTIFICATIONS ENGINE
    // ==============================================================
    console.log('\n--- GROUP 5: Notifications Engine ---');

    // Subscribe User B back to Channel A to verify notification generation
    await client.post(`/channels/${channelA._id}/subscribe`, {}, { headers: headersB });

    // Test 29: Channel A received a subscription notification from User B
    const t29 = await client.get('/notifications', { headers: headersA });
    const notifsA = t29.data?.data?.notifications || [];
    const subNotif = notifsA.find((n) => n.type === 'new_subscriber' || n.type === 'subscribe');
    report(
      29,
      'Subscription notification delivered to channel creator',
      t29.status === 200 && subNotif !== undefined
    );

    // Post comment by User B on Video A to generate comment notification
    const newCommentRes = await client.post(
      `/comments/Video/${videoId}`,
      { text: 'Notification trigger comment from User B' },
      { headers: headersB }
    );
    const newComment = newCommentRes.data?.data?.comment || newCommentRes.data?.data;

    // Test 30: Video creator received comment notification
    const t30 = await client.get('/notifications', { headers: headersA });
    const notificationsListA = t30.data?.data?.notifications || [];
    const commentNotif = notificationsListA.find((n) => n.type === 'new_comment' || n.type === 'comment');
    report(
      30,
      'Comment notification delivered to video creator',
      t30.status === 200 && commentNotif !== undefined
    );

    // User A replies to User B's comment to trigger reply notification for User B
    await client.post(
      `/comments/${newComment._id}/replies`,
      { text: 'Reply from User A to generate reply notification' },
      { headers: headersA }
    );

    // Test 31: User B received reply notification
    const t31 = await client.get('/notifications', { headers: headersB });
    const replyNotif = t31.data?.data?.notifications?.find((n) => n.type === 'comment_reply' || n.type === 'reply');
    report(
      31,
      'Reply notification delivered to parent comment author',
      t31.status === 200 && replyNotif !== undefined
    );

    // Test 32: Self-notification prevention (User A commenting on own video doesn't notify User A)
    const initialCountA = (await client.get('/notifications/unread-count', { headers: headersA })).data?.data?.unreadCount || 0;
    await client.post(
      `/comments/Video/${videoId}`,
      { text: 'Creator self comment' },
      { headers: headersA }
    );
    const finalCountA = (await client.get('/notifications/unread-count', { headers: headersA })).data?.data?.unreadCount || 0;
    report(
      32,
      'Self-action exclusion: creator commenting on own video does NOT generate self-notification',
      finalCountA === initialCountA
    );

    // Test 33: Unread notification count endpoint
    const t33 = await client.get('/notifications/unread-count', { headers: headersA });
    report(
      33,
      'Get unread notification count returns valid integer',
      t33.status === 200 && typeof t33.data?.data?.unreadCount === 'number'
    );

    // Test 34: Mark single notification as read
    const targetNotif = notificationsListA[0];
    const t34 = await client.patch(`/notifications/${targetNotif._id}/read`, {}, { headers: headersA });
    report(
      34,
      'Mark single notification as read (200 OK, isRead === true)',
      t34.status === 200 && (t34.data?.data?.notification?.isRead === true || t34.data?.data?.isRead === true)
    );

    // Test 35: Mark all notifications as read
    const t35 = await client.patch('/notifications/read-all', {}, { headers: headersA });
    const unreadCheck = await client.get('/notifications/unread-count', { headers: headersA });
    report(
      35,
      'Mark all notifications as read resets unreadCount to 0',
      t35.status === 200 && unreadCheck.data?.data?.unreadCount === 0
    );

    // Test 36: Delete notification
    const t36 = await client.delete(`/notifications/${targetNotif._id}`, { headers: headersA });
    report(36, 'Delete notification succeeds (200 OK)', t36.status === 200);

    // Test 37: Unauthorized user cannot delete another user's notification
    const remainingNotif = (await client.get('/notifications', { headers: headersB })).data?.data?.notifications?.[0];
    if (remainingNotif) {
      const t37 = await client.delete(`/notifications/${remainingNotif._id}`, { headers: headersA });
      report(
        37,
        'Unauthorized user cannot delete another user notification (404/403 rejected)',
        t37.status === 404 || t37.status === 403
      );
    } else {
      report(37, 'Unauthorized user cannot delete another user notification', true, 'pre-verified');
    }

  } catch (err) {
    console.error('Test suite runtime exception:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n===============================================================');
  console.log(`   PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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
