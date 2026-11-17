/**
 * Comment Input Component
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export const CommentInput = ({
  onSubmit,
  placeholder = 'Add a comment...',
  buttonLabel = 'Comment',
  initialText = '',
  onCancel,
  autoFocus = false,
  isReply = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState(initialText);
  const [isFocused, setIsFocused] = useState(autoFocus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(text.trim());
      setText('');
      if (!isReply) {
        setIsFocused(false);
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setIsFocused(false);
    if (onCancel) onCancel();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-400">
        <Avatar size="sm" />
        <div className="flex-1">
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Sign in
          </Link>{' '}
          to add a comment or join the discussion.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 text-sm">
      <Avatar src={user?.avatar} name={user?.name || 'User'} size={isReply ? 'xs' : 'sm'} className="mt-1 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <textarea
          rows={isFocused || text ? (isReply ? 2 : 3) : 1}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          maxLength={2000}
          className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-[#0f0f0f] dark:focus:border-[#f1f1f1] outline-none text-[#0f0f0f] dark:text-[#f1f1f1] text-xs sm:text-sm py-1.5 resize-none transition-all duration-150"
        />

        {(isFocused || text || isReply) && (
          <div className="flex items-center justify-between mt-2 animate-in fade-in duration-100">
            <span className="text-[11px] text-neutral-400">
              {text.length > 1500 ? `${text.length}/2000` : ''}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!text.trim() || isSubmitting}
                isLoading={isSubmitting}
                className="rounded-full text-xs font-semibold px-4"
              >
                {buttonLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default CommentInput;
