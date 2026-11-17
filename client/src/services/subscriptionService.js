/**
 * Subscriptions API Service
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
import api from './api';

export const subscriptionService = {
  /**
   * Subscribe to a channel
   */
  subscribe: (channelId) => {
    return api.post(`/channels/${channelId}/subscribe`);
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe: (channelId) => {
    return api.delete(`/channels/${channelId}/subscribe`);
  },

  /**
   * Get subscription status and subscriber count for channel
   */
  getSubscriptionStatus: (channelId) => {
    return api.get(`/channels/${channelId}/subscription-status`);
  },

  /**
   * Get channels current user is subscribed to
   */
  getMySubscriptions: (params = {}) => {
    return api.get('/subscriptions/my-subscriptions', { params });
  },

  /**
   * Get subscribers to current user's channel
   */
  getMySubscribers: (params = {}) => {
    return api.get('/subscriptions/my-subscribers', { params });
  },

  /**
   * Get Subscriptions Feed (videos & shorts from subscribed channels)
   */
  getSubscriptionsFeed: (params = {}) => {
    return api.get('/subscriptions/feed', { params });
  }
};

export default subscriptionService;
