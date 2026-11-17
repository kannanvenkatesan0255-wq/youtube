/**
 * Initial Administrator Provisioning Script
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 * Usage: node src/scripts/seedAdmin.js [email] [password] [username] [name]
 * Or configure ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME in server/.env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Channel = require('../models/Channel');
const { logAudit } = require('../services/audit.service');
const { config } = require('../config/env');
const { USER_ROLES, AUDIT_ACTIONS } = require('../constants/appConstants');

async function seedAdmin() {
  const email = process.argv[2] || process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@vidtube.com';
  const password = process.argv[3] || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'AdminPass123!';
  const username = process.argv[4] || process.env.ADMIN_BOOTSTRAP_USERNAME || 'vidtube_admin';
  const name = process.argv[5] || process.env.ADMIN_BOOTSTRAP_NAME || 'VidTube Super Admin';

  console.log(`[SeedAdmin] Connecting to MongoDB: ${config.mongodbUri}...`);
  await mongoose.connect(config.mongodbUri);

  try {
    let user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });

    if (user) {
      console.log(`[SeedAdmin] Found existing user: ${user.username} (${user.email}). Promoting to SUPER_ADMIN...`);
      user.role = USER_ROLES.SUPER_ADMIN;
      user.accountStatus = 'active';
      await user.save();
      console.log(`[SeedAdmin] User promoted to role: ${user.role}`);
    } else {
      console.log(`[SeedAdmin] Creating new SUPER_ADMIN user: ${username} (${email})...`);

      user = await User.create({
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: password,
        role: USER_ROLES.SUPER_ADMIN,
        accountStatus: 'active',
        isEmailVerified: true
      });

      const channel = await Channel.create({
        name,
        handle: username.toLowerCase(),
        owner: user._id,
        description: 'Official VidTube Administration Channel',
        defaultVisibility: 'public'
      });

      user.channel = channel._id;
      await user.save();
      console.log(`[SeedAdmin] Created Super Admin account and official channel successfully.`);
    }

    await logAudit({
      adminId: user._id,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
      targetType: 'User',
      targetId: user._id,
      reason: 'Initial Super Admin provisioned via seed script',
      metadata: { role: user.role, email: user.email }
    });

    console.log(`[SeedAdmin] Provisioning completed successfully.`);
  } catch (err) {
    console.error(`[SeedAdmin Error]:`, err);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = { seedAdmin };
