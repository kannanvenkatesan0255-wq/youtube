/**
 * Model Index
 * VidTube Platform Architecture
 */
const User = require('./User');
const Channel = require('./Channel');
const Video = require('./Video');
const Short = require('./Short');
const Comment = require('./Comment');
const Like = require('./Like');
const Subscription = require('./Subscription');
const Playlist = require('./Playlist');
const Notification = require('./Notification');
const WatchHistory = require('./WatchHistory');
const SearchHistory = require('./SearchHistory');
const AnalyticsEvent = require('./AnalyticsEvent');
const Report = require('./Report');
const AuditLog = require('./AuditLog');
const PlatformSetting = require('./PlatformSetting');
const Announcement = require('./Announcement');

module.exports = {
  User,
  Channel,
  Video,
  Short,
  Comment,
  Like,
  Subscription,
  Playlist,
  Notification,
  WatchHistory,
  SearchHistory,
  AnalyticsEvent,
  Report,
  AuditLog,
  PlatformSetting,
  Announcement
};

