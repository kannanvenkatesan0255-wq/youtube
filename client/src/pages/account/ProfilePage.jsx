/**
 * VidTube Account Profile & Settings Page
 * Phase 2 - User Account & Profile Foundation
 */
import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  Camera,
  CheckCircle2,
  AlertCircle,
  Tv,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import PasswordStrength from '../../components/common/PasswordStrength';

export const ProfilePage = () => {
  const {
    user,
    channel,
    updateProfile,
    changePassword,
    updateAvatar,
    logout
  } = useAuth();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [profileMessage, setProfileMessage] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarMessage, setAvatarMessage] = useState(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sample quick avatars
  const QUICK_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=160&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'
  ];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsUpdatingProfile(true);

    const result = await updateProfile({ name, username });
    setIsUpdatingProfile(false);

    if (result.success) {
      setProfileMessage({ type: 'success', text: result.message || 'Profile updated successfully.' });
    } else {
      setProfileMessage({ type: 'error', text: result.error });
    }
  };

  const handleUpdateAvatar = async (urlToUse) => {
    const targetUrl = urlToUse || avatarUrl;
    if (!targetUrl.trim()) return;

    setAvatarMessage(null);
    setIsUpdatingAvatar(true);

    const result = await updateAvatar(targetUrl.trim());
    setIsUpdatingAvatar(false);

    if (result.success) {
      setAvatarMessage({ type: 'success', text: 'Profile picture updated.' });
    } else {
      setAvatarMessage({ type: 'error', text: result.error });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword, confirmNewPassword);
    setIsChangingPassword(false);

    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: result.error });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 select-none">
      {/* Top Banner / Account Header */}
      <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar
            src={user?.avatar}
            name={user?.name || 'User'}
            size="xl"
            className="ring-4 ring-neutral-100 dark:ring-neutral-800"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
                {user?.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {user?.role || 'user'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                {user?.accountStatus || 'active'}
              </span>
            </div>
            <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-0.5">
              @{user?.username} • {user?.email}
            </p>

            {/* Linked Channel Details */}
            {channel && (
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Tv className="w-4 h-4 text-[#FF0033]" />
                  Channel: <span className="text-[#0f0f0f] dark:text-[#f1f1f1]">{channel.name}</span> ({channel.handle})
                </span>
              </div>
            )}
          </div>

          {/* Quick Sign Out Action */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-2 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Edit Profile Information */}
        <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <User className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
              Profile Details
            </h2>
          </div>

          {profileMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Username / Handle
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUpdatingProfile}
                className="w-full justify-center"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Section 2: Avatar / Profile Picture */}
        <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <Camera className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
              Profile Picture
            </h2>
          </div>

          {avatarMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                avatarMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{avatarMessage.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                Quick Preset Avatars
              </label>
              <div className="flex items-center gap-2.5">
                {QUICK_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(url);
                      handleUpdateAvatar(url);
                    }}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#FF0033] hover:scale-110 transition focus:outline-none"
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                isLoading={isUpdatingAvatar}
                onClick={() => handleUpdateAvatar()}
                className="w-full justify-center"
              >
                Update Avatar
              </Button>
            </div>
          </div>
        </div>

        {/* Section 3: Password & Security */}
        <div className="md:col-span-2 bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <Shield className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
              Change Password
            </h2>
          </div>

          {passwordMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
              />
              <PasswordStrength password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isChangingPassword}
                className="justify-center"
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
