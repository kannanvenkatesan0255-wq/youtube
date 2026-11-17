/**
 * Content Reporting Modal Component
 * Phase 9 Content Moderation & Platform Security
 */
import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const REPORT_OPTIONS = [
  { value: 'spam', label: 'Spam or misleading', description: 'Mass-posted, scam, or commercially deceptive content' },
  { value: 'harassment', label: 'Harassment or bullying', description: 'Targeted personal attacks, threats, or intimidation' },
  { value: 'hate_speech', label: 'Hate speech', description: 'Attacking protected groups, dehumanizing slurs, or incitement' },
  { value: 'misinformation', label: 'Misinformation', description: 'Dangerous medical, civic, or deceptive conspiracies' },
  { value: 'violence', label: 'Violent or graphic content', description: 'Sensational brutality, gore, or encouragement of injury' },
  { value: 'copyright', label: 'Copyright infringement', description: 'Unauthorized broadcast of copyrighted materials' },
  { value: 'sexual_content', label: 'Sexually explicit content', description: 'Pornography, explicit imagery, or solicitation' },
  { value: 'other', label: 'Other platform violation', description: 'Other violation of VidTube community guidelines' }
];

export const ReportModal = ({
  isOpen,
  onClose,
  contentType = 'video', // 'video' | 'short' | 'comment' | 'channel' | 'user'
  contentId,
  contentTitle = ''
}) => {
  const { isAuthenticated } = useAuth();
  const [selectedReason, setSelectedReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setSubmitting(true);
    setError('');

    try {
      await adminService.submitReport({
        contentType,
        contentId,
        reason: selectedReason,
        description: description.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 1800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit report. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Report {contentType}</h3>
              {contentTitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[240px]">
                  {contentTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="p-6 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You must be logged in to submit a report to the VidTube moderation team.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>
              <Link
                to="/login"
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-lg">Thank You for Reporting</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Our moderation team will review this content against our Community Guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Select Reason
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {REPORT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition text-left ${
                      selectedReason === opt.value
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.value}
                      checked={selectedReason === opt.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div className="text-xs">
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 leading-snug">
                        {opt.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Provide timestamps or specific context..."
                className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-red-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
