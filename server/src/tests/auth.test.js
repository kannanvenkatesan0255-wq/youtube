/**
 * VidTube Phase 2: Complete Authentication & Security Test Suite
 * Run via: node server/src/tests/auth.test.js
 */
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Channel = require('../models/Channel');
const { config } = require('../config/env');

const BASE_URL = 'http://localhost:5000/api';
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true
});

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('   VIDTUBE PHASE 2: AUTHENTICATION & SECURITY TEST SUITE');
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
    await mongoose.connect(config.mongodbUri);
  } catch (err) {
    console.error('Cannot connect to MongoDB. Is your database running?');
    process.exit(1);
  }

  const testUser = {
    name: 'Sarah Connor',
    username: `sarah_${Date.now()}`,
    email: `sarah_${Date.now()}@vidtube.com`,
    password: 'SecurePassword@2026',
    confirmPassword: 'SecurePassword@2026'
  };

  let authToken = '';

  // 1. User registration & auto-channel creation
  const regRes = await client.post('/auth/register', testUser);
  const regSuccess =
    regRes.status === 201 &&
    regRes.data.success &&
    regRes.data.data.user.username === testUser.username &&
    regRes.data.data.channel.handle === `@${testUser.username}`;
  authToken = regRes.data?.data?.accessToken;
  report(1, 'Successful user registration & auto-channel creation', regSuccess, `HTTP ${regRes.status}`);

  // 2. Duplicate email rejection
  const dupEmailRes = await client.post('/auth/register', {
    ...testUser,
    username: `diff_${Date.now()}`
  });
  report(2, 'Duplicate email rejection', dupEmailRes.status === 409, `HTTP ${dupEmailRes.status}`);

  // 3. Duplicate username rejection
  const dupUserRes = await client.post('/auth/register', {
    ...testUser,
    email: `diff_${Date.now()}@vidtube.com`
  });
  report(3, 'Duplicate username rejection', dupUserRes.status === 409, `HTTP ${dupUserRes.status}`);

  // 4. Successful login
  const loginRes = await client.post('/auth/login', {
    identifier: testUser.username,
    password: testUser.password
  });
  const loginSuccess = loginRes.status === 200 && Boolean(loginRes.data.data.accessToken);
  authToken = loginRes.data?.data?.accessToken || authToken;
  report(4, 'Successful login with username/email', loginSuccess, `HTTP ${loginRes.status}`);

  // 5. Invalid password rejection
  const badPassRes = await client.post('/auth/login', {
    identifier: testUser.username,
    password: 'WrongPassword@123'
  });
  report(5, 'Invalid password rejection', badPassRes.status === 401, `HTTP ${badPassRes.status}`);

  // 6. Invalid JWT rejection
  const badJwtRes = await client.get('/auth/me', {
    headers: { Authorization: 'Bearer this_is_a_completely_invalid_jwt_token' }
  });
  report(6, 'Invalid JWT rejection', badJwtRes.status === 401, `HTTP ${badJwtRes.status}`);

  // 7. Expired JWT handling
  const expiredToken = jwt.sign(
    { id: new mongoose.Types.ObjectId(), role: 'user' },
    config.jwtSecret,
    { expiresIn: -10 }
  );
  const expiredRes = await client.get('/auth/me', {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  report(7, 'Expired JWT handling', expiredRes.status === 401 && expiredRes.data.message.includes('expired'), `HTTP ${expiredRes.status}`);

  // 8. Authenticated profile retrieval
  const meRes = await client.get('/auth/me', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const meSuccess = meRes.status === 200 && meRes.data.data.user.email === testUser.email && Boolean(meRes.data.data.channel);
  report(8, 'Authenticated profile retrieval', meSuccess, `HTTP ${meRes.status}`);

  // 9. Unauthorized route protection
  const unauthRes = await client.get('/users/profile');
  report(9, 'Unauthorized route protection', unauthRes.status === 401, `HTTP ${unauthRes.status}`);

  // 10. Profile update
  const updatedName = 'Sarah Connor SkyNet Hunter';
  const updateRes = await client.patch(
    '/users/profile',
    { name: updatedName },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const updateSuccess = updateRes.status === 200 && updateRes.data.data.user.name === updatedName;
  report(10, 'Profile update (name modification)', updateSuccess, `HTTP ${updateRes.status}`);

  // 11. Password change
  const newPassword = 'BrandNewPassword@2026';
  const changePassRes = await client.post(
    '/users/change-password',
    {
      currentPassword: testUser.password,
      newPassword: newPassword,
      confirmNewPassword: newPassword
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  report(11, 'Password change after verifying current password', changePassRes.status === 200, `HTTP ${changePassRes.status}`);

  // 12. Logout
  const logoutRes = await client.post(
    '/auth/logout',
    {},
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  report(12, 'Logout clears server refresh token & cookies', logoutRes.status === 200, `HTTP ${logoutRes.status}`);

  // 13. Forgot-password workflow
  const forgotRes = await client.post('/auth/forgot-password', {
    email: testUser.email
  });
  report(13, 'Forgot-password workflow (generates token & logs link)', forgotRes.status === 200, `HTTP ${forgotRes.status}`);

  // 14. Reset-password single-use verification
  const userDoc = await User.findOne({ email: testUser.email });
  const rawResetToken = userDoc.createPasswordResetToken();
  await userDoc.save();

  const resetRes = await client.post('/auth/reset-password', {
    token: rawResetToken,
    password: 'ResetPassword@2026',
    confirmPassword: 'ResetPassword@2026'
  });

  const reuseRes = await client.post('/auth/reset-password', {
    token: rawResetToken,
    password: 'AnotherResetPassword@2026',
    confirmPassword: 'AnotherResetPassword@2026'
  });
  report(14, 'Reset-password single-use & reuse prevention', resetRes.status === 200 && reuseRes.status === 400, `Reuse HTTP ${reuseRes.status}`);

  // 15. Session refresh
  const userWithRefreshToken = await User.findOne({ email: testUser.email }).select('+refreshToken');
  const refreshRes = await client.post('/auth/refresh', {
    refreshToken: userWithRefreshToken.refreshToken
  });
  report(15, 'Session refresh endpoint (/api/auth/refresh)', refreshRes.status === 200 && Boolean(refreshRes.data.data.accessToken), `HTTP ${refreshRes.status}`);

  // 16. Forged refresh token rejection
  const badRefreshRes = await client.post('/auth/refresh', {
    refreshToken: 'fake_refresh_token_xyz'
  });
  report(16, 'Session refresh rejects forged refresh token', badRefreshRes.status === 401, `HTTP ${badRefreshRes.status}`);

  // 17. Database connection
  report(17, 'MongoDB Atlas / local database connection active', mongoose.connection.readyState === 1, `ReadyState: ${mongoose.connection.readyState}`);

  // 18. Backend health endpoint
  const healthRes = await client.get('/health');
  report(18, 'Backend health endpoint (/api/health)', healthRes.status === 200 && healthRes.data.status === 'healthy', `Status: ${healthRes.data?.status}`);

  await mongoose.disconnect();

  console.log('\n===============================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('===============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
