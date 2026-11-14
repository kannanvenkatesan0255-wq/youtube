/**
 * VidTube Shorts Comments Drawer
 * YouTube Shorts slide-in comments drawer with responsive layout, comment input, and Phase 6 integration state
 */
import React, { useState } from 'react';
import { X, Send, ThumbsUp, Sparkles, MessageSquare } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';

export const ShortsCommentsDrawer = ({
  isOpen = false,
  onClose,
  commentsCount = 0,
  shortTitle = 'Short'
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([
    {
      id: 'sc-1',
      author: 'Alex River',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80',
      text: 'This trick saved me so much time in my latest project! 🔥',
      timeAgo: '2 hours ago',
      likes: 42
    },
    {
      id: 'sc-2',
      author: 'CodeCrafter',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
      text: 'Super clean explanation. Subscribed! Please do more videos like this.',
      timeAgo: '5 hours ago',
      likes: 19
    }
  ]);

  if (!isOpen) return null;

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `local-${Date.now()}`,
      author: user?.name || 'You',
      avatar: user?.avatar || '',
      text: commentText.trim(),
      timeAgo: 'Just now',
      likes: 0
    };

    setCommentsList([newComment, ...commentsList]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Semi-transparent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#181818] shadow-2xl flex flex-col text-[#0f0f0f] dark:text-[#f1f1f1] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">Comments</h3>
            <span className="text-xs text-neutral-500 font-medium">
              {commentsCount + (commentsList.length - 2)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comments"
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase 6 Architecture Notice */}
        <div className="mx-4 mt-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#FF0033] flex-shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-[#0f0f0f] dark:text-white block mb-0.5">
              Phase 6 Integration Point
            </span>
            Full persistent backend comments, nested thread replies, and sentiment counters will activate in Phase 6.
          </div>
        </div>

        {/* Comments Scrollable Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {commentsList.map((c) => (
            <div key={c.id} className="flex items-start gap-3 text-xs sm:text-sm">
              <Avatar src={c.avatar} name={c.author} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-xs text-[#0f0f0f] dark:text-[#f1f1f1]">
                    {c.author}
                  </span>
                  <span className="text-[11px] text-neutral-500">{c.timeAgo}</span>
                </div>
                <p className="text-neutral-800 dark:text-neutral-200 leading-snug">{c.text}</p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-neutral-500">
                  <button type="button" className="flex items-center gap-1 hover:text-[#FF0033] transition">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{c.likes > 0 ? c.likes : ''}</span>
                  </button>
                  <button type="button" className="text-[11px] font-semibold hover:underline">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input Footer */}
        <form
          onSubmit={handleAddComment}
          className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5 bg-neutral-50 dark:bg-[#121212]"
        >
          <Avatar src={user?.avatar} name={user?.name || 'You'} size="sm" />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-neutral-200/80 dark:bg-neutral-800 text-xs sm:text-sm px-3.5 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-[#FF0033] text-[#0f0f0f] dark:text-white"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 rounded-full bg-[#FF0033] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d9002c] transition flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShortsCommentsDrawer;
