/**
 * Active Platform Announcement Banner Component
 * Phase 9 Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, AlertCircle, Wrench, X } from 'lucide-react';
import adminService from '../../services/adminService';

export const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchActive = async () => {
      try {
        const res = await adminService.getActiveAnnouncement();
        if (isMounted && res?.data) {
          const storedDismiss = sessionStorage.getItem(`dismiss_announcement_${res.data._id}`);
          if (!storedDismiss) {
            setAnnouncement(res.data);
          }
        }
      } catch (err) {
        // Silently skip if none active
      }
    };

    fetchActive();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(`dismiss_announcement_${announcement._id}`, 'true');
    setDismissed(true);
  };

  const getStyle = () => {
    switch (announcement.type) {
      case 'warning':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        };
      case 'critical':
      case 'maintenance':
        return {
          bg: 'bg-red-500/15 border-red-500/30 text-red-900 dark:text-red-200',
          icon: <Wrench className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        };
      case 'feature':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
          icon: <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-900 dark:text-blue-200',
          icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`w-full border-b py-2.5 px-4 text-xs transition-all flex items-center justify-between gap-3 ${style.bg}`}>
      <div className="flex items-center gap-2.5 mx-auto max-w-7xl">
        {style.icon}
        <div>
          <span className="font-semibold mr-1.5">{announcement.title}:</span>
          <span className="opacity-90">{announcement.message}</span>
        </div>
      </div>
      {announcement.dismissible !== false && (
        <button
          onClick={handleDismiss}
          className="p-1 hover:opacity-75 rounded-md transition shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AnnouncementBanner;
