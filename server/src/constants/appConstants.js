/**
 * Core Application Constants
 * VidTube Platform Architecture
 */

const USER_ROLES = Object.freeze({
  USER: 'user',
  CREATOR: 'creator',
  ADMIN: 'admin'
});

const VIDEO_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
  PRIVATE: 'private'
});

const VIDEO_CATEGORIES = Object.freeze([
  'All',
  'Gaming',
  'Music',
  'Web Development',
  'Programming',
  'JavaScript',
  'React',
  'Node.js',
  'Podcasts',
  'Tech & Gadgets',
  'AI & Machine Learning',
  'News & Politics',
  'Sports',
  'Entertainment',
  'Science & Education'
]);

const LIKE_TYPES = Object.freeze({
  LIKE: 'like',
  DISLIKE: 'dislike'
});

const NOTIFICATION_TYPES = Object.freeze({
  NEW_VIDEO: 'new_video',
  NEW_SHORT: 'new_short',
  NEW_COMMENT: 'new_comment',
  COMMENT_REPLY: 'comment_reply',
  NEW_SUBSCRIBER: 'new_subscriber',
  SYSTEM: 'system'
});

module.exports = {
  USER_ROLES,
  VIDEO_VISIBILITY,
  VIDEO_CATEGORIES,
  LIKE_TYPES,
  NOTIFICATION_TYPES
};

