/**
 * VidTube Video Player Controls Overlay
 * Exact YouTube player control bar with volume slider, menus, theater mode, and full-screen controls
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RectangleHorizontal,
  Settings,
  PictureInPicture2,
  SkipForward,
  Check
} from 'lucide-react';
import ProgressBar from './ProgressBar';
import { formatDuration } from '../../utils/formatters';

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const PlayerControls = ({
  isPlaying = false,
  isEnded = false,
  currentTime = 0,
  duration = 0,
  bufferedTime = 0,
  volume = 1,
  isMuted = false,
  playbackSpeed = 1,
  qualityLevels = [],
  currentQuality = -1, // -1 means Auto
  isTheaterMode = false,
  isFullscreen = false,
  isPipSupported = false,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onQualityChange,
  onToggleTheater,
  onToggleFullscreen,
  onTogglePip,
  onNextVideo
}) => {
  const [activeMenu, setActiveMenu] = useState(null); // 'settings' | 'speed' | 'quality' | null
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const menuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5 text-white" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5 text-white" />;
    return <Volume2 className="w-5 h-5 text-white" />;
  };

  const getQualityLabel = () => {
    if (currentQuality === -1) return 'Auto';
    const found = qualityLevels.find((q) => q.levelIndex === currentQuality);
    return found ? found.label : 'Auto';
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end px-3 pb-2 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300">
      {/* Interactive Progress Bar */}
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        bufferedTime={bufferedTime}
        onSeek={onSeek}
      />

      {/* Control Buttons Row */}
      <div className="flex items-center justify-between text-white select-none mt-1">
        {/* Left Controls: Play, Skip, Volume, Time */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Play / Pause / Replay Button */}
          <button
            type="button"
            onClick={onPlayPause}
            aria-label={isEnded ? 'Replay' : isPlaying ? 'Pause (k)' : 'Play (k)'}
            title={isEnded ? 'Replay' : isPlaying ? 'Pause (k)' : 'Play (k)'}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition"
          >
            {isEnded ? (
              <RotateCcw className="w-5 h-5 text-white" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white" />
            )}
          </button>

          {/* Next Video Button (if available) */}
          {onNextVideo && (
            <button
              type="button"
              onClick={onNextVideo}
              aria-label="Next video (Shift+N)"
              title="Next video (Shift+N)"
              className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition"
            >
              <SkipForward className="w-5 h-5 fill-white text-white" />
            </button>
          )}

          {/* Volume Control Group */}
          <div
            className="flex items-center group/vol"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute (m)' : 'Mute (m)'}
              title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
              className="p-1.5 rounded-full hover:bg-white/10 transition"
            >
              {getVolumeIcon()}
            </button>

            {/* Expandable Volume Slider */}
            <div
              className={`flex items-center overflow-hidden transition-all duration-200 ${
                showVolumeSlider ? 'w-16 sm:w-20 opacity-100 ml-1' : 'w-0 opacity-0'
              }`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                aria-label="Volume slider"
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:accent-[#FF0033]"
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="text-[12px] sm:text-[13px] font-mono tracking-tight ml-2 text-white/90">
            <span>{formatDuration(currentTime)}</span>
            <span className="mx-1 text-white/60">/</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right Controls: Settings, PiP, Theater, Fullscreen */}
        <div className="relative flex items-center gap-1 sm:gap-1.5" ref={menuRef}>
          {/* Settings Menu Button */}
          <button
            type="button"
            onClick={() => setActiveMenu((prev) => (prev ? null : 'settings'))}
            aria-label="Playback Settings"
            title="Settings"
            className={`p-1.5 rounded-full hover:bg-white/10 transition ${
              activeMenu ? 'bg-white/20' : ''
            }`}
          >
            <Settings className="w-5 h-5 text-white" />
          </button>

          {/* Settings Popover Menu */}
          {activeMenu === 'settings' && (
            <div className="absolute right-0 bottom-11 w-56 rounded-xl bg-[#212121]/95 backdrop-blur-md border border-neutral-700/80 shadow-2xl py-1 text-xs text-white z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-neutral-700/60 font-semibold text-neutral-400 text-[11px] uppercase tracking-wider">
                Playback Settings
              </div>

              {/* Speed Option */}
              <button
                type="button"
                onClick={() => setActiveMenu('speed')}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/10 transition text-left"
              >
                <span>Playback speed</span>
                <span className="text-neutral-400 flex items-center gap-1">
                  {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
                  <span className="text-xs">&rsaquo;</span>
                </span>
              </button>

              {/* Quality Option */}
              <button
                type="button"
                onClick={() => setActiveMenu('quality')}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/10 transition text-left"
              >
                <span>Quality</span>
                <span className="text-neutral-400 flex items-center gap-1">
                  {getQualityLabel()}
                  <span className="text-xs">&rsaquo;</span>
                </span>
              </button>
            </div>
          )}

          {/* Playback Speed Sub-Menu */}
          {activeMenu === 'speed' && (
            <div className="absolute right-0 bottom-11 w-52 rounded-xl bg-[#212121]/95 backdrop-blur-md border border-neutral-700/80 shadow-2xl py-1 text-xs text-white z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setActiveMenu('settings')}
                className="w-full flex items-center gap-2 px-3 py-2 border-b border-neutral-700/60 font-semibold text-neutral-300 hover:bg-white/10 text-left"
              >
                <span>&lsaquo;</span>
                <span>Playback speed</span>
              </button>
              <div className="max-h-60 overflow-y-auto py-1">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => {
                      onSpeedChange(speed);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition text-left"
                  >
                    <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                    {playbackSpeed === speed && <Check className="w-4 h-4 text-[#FF0033]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Sub-Menu */}
          {activeMenu === 'quality' && (
            <div className="absolute right-0 bottom-11 w-52 rounded-xl bg-[#212121]/95 backdrop-blur-md border border-neutral-700/80 shadow-2xl py-1 text-xs text-white z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setActiveMenu('settings')}
                className="w-full flex items-center gap-2 px-3 py-2 border-b border-neutral-700/60 font-semibold text-neutral-300 hover:bg-white/10 text-left"
              >
                <span>&lsaquo;</span>
                <span>Quality</span>
              </button>
              <div className="max-h-60 overflow-y-auto py-1">
                {/* Auto Option */}
                <button
                  type="button"
                  onClick={() => {
                    onQualityChange(-1);
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition text-left"
                >
                  <div className="flex flex-col">
                    <span>Auto</span>
                    <span className="text-[10px] text-neutral-400">Adaptive multi-bitrate</span>
                  </div>
                  {currentQuality === -1 && <Check className="w-4 h-4 text-[#FF0033]" />}
                </button>

                {/* Specific Resolutions */}
                {qualityLevels.length > 0 ? (
                  qualityLevels.map((lvl) => (
                    <button
                      key={lvl.levelIndex}
                      type="button"
                      onClick={() => {
                        onQualityChange(lvl.levelIndex);
                        setActiveMenu(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition text-left"
                    >
                      <span>{lvl.label}</span>
                      {currentQuality === lvl.levelIndex && (
                        <Check className="w-4 h-4 text-[#FF0033]" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-[11px] text-neutral-400">
                    Standard high-definition stream
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Picture in Picture Button */}
          {isPipSupported && (
            <button
              type="button"
              onClick={onTogglePip}
              aria-label="Picture in picture (i)"
              title="Miniplayer (i)"
              className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition"
            >
              <PictureInPicture2 className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Theater Mode Button */}
          <button
            type="button"
            onClick={onToggleTheater}
            aria-label={isTheaterMode ? 'Default view (t)' : 'Theater mode (t)'}
            title={isTheaterMode ? 'Default view (t)' : 'Theater mode (t)'}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition hidden sm:inline-flex"
          >
            <RectangleHorizontal
              className={`w-5 h-5 ${isTheaterMode ? 'text-[#FF0033]' : 'text-white'}`}
            />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)'}
            title={isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)'}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
