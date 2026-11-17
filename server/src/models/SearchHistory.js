/**
 * Search History Model
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    query: {
      type: String,
      required: [true, 'Search query cannot be empty'],
      trim: true,
      maxlength: [100, 'Search query cannot exceed 100 characters']
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for user search history lookup and upsert deduplication
searchHistorySchema.index({ user: 1, query: 1 }, { unique: true });
searchHistorySchema.index({ user: 1, lastSearchedAt: -1 });

const SearchHistory = mongoose.models.SearchHistory || mongoose.model('SearchHistory', searchHistorySchema);
module.exports = SearchHistory;
