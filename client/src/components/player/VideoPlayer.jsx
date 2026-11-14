/**
 * VidTube Advanced Video Player
 * Complete YouTube-exact custom player supporting HLS adaptive multi-bitrate streaming (via Hls.js),
 * native HLS fallback, direct MP4 playback, keyboard shortcuts, theater mode, and full controls.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  RotateCcw,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import PlayerControls from './PlayerControls';

export const VideoPlayer = ({
  src,
  hlsUrl,
  poster,
  title = 'VidTube Video',
  initialTime = 0,
  isTheaterMode = false,
  onToggleTheater,
  onTimeUpdate,
  onEnded,
  onNextVideo
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const initialSeekDoneRef = useRef(false);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);

  // Preference Settings
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('vidtube_player_volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('vidtube_player_muted') === 'true';
  });
  const [playbackSpeed, setPlaybackSpeed] = useState(() => {
    const saved = localStorage.getItem('vidtube_player_speed');
    return saved !== null ? parseFloat(saved) : 1;
  });

  // Streaming & Quality
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [hasAdaptiveHls, setHasAdaptiveHls] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);

  // Layout & UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const isPipSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document;

  // Reset initial seek on src/hls change
  useEffect(() => {
    initialSeekDoneRef.current = false;
    setPlaybackError(null);
  }, [src, hlsUrl]);

  /**
   * Initialize Video Source (HLS.js -> Native HLS -> MP4 Fallback)
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset existing Hls instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setQualityLevels([]);
    setHasAdaptiveHls(false);
    setIsLoading(true);

    const targetHls = hlsUrl && hlsUrl.trim().length > 0 ? hlsUrl : null;
    const targetMp4 = src && src.trim().length > 0 ? src : null;

    if (!targetHls && !targetMp4) {
      setIsLoading(false);
      setPlaybackError('No valid media stream URL provided for this video.');
      return;
    }

    // 1. Try HLS.js if adaptive manifest is provided and supported
    if (targetHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(targetHls);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        setHasAdaptiveHls(true);

        // Map parsed HLS renditions to quality selector options
        if (data.levels && data.levels.length > 0) {
          const formattedLevels = data.levels.map((level, idx) => ({
            label: level.height ? `${level.height}p` : `Level ${idx + 1}`,
            levelIndex: idx,
            height: level.height || 0,
            bitrate: level.bitrate
          }));
          // Sort descending by height
          formattedLevels.sort((a, b) => b.height - a.height);
          setQualityLevels(formattedLevels);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        // If manifest fails to load or HLS produces fatal error, fall back to MP4
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (targetMp4) {
              console.warn('[VidTube Player] HLS manifest network failure, falling back to MP4 stream:', targetMp4);
              hls.destroy();
              hlsRef.current = null;
              setHasAdaptiveHls(false);
              video.src = targetMp4;
              video.load();
            } else {
              hls.startLoad();
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            if (targetMp4) {
              hls.destroy();
              hlsRef.current = null;
              setHasAdaptiveHls(false);
              video.src = targetMp4;
              video.load();
            } else {
              hls.destroy();
              setPlaybackError('Media playback failed. Please check your connection.');
            }
          }
        }
      });
    }
    // 2. Native HLS for Safari / iOS
    else if (targetHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = targetHls;
      setHasAdaptiveHls(true);
      setIsLoading(false);
    }
    // 3. Direct HTML5 MP4 Stream
    else if (targetMp4) {
      video.src = targetMp4;
      setHasAdaptiveHls(false);
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, hlsUrl]);

  /**
   * Apply Volume, Mute, and Speed changes to video element
   */
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = isMuted ? 0 : volume;
    videoRef.current.muted = isMuted;
    localStorage.setItem('vidtube_player_volume', String(volume));
    localStorage.setItem('vidtube_player_muted', String(isMuted));
  }, [volume, isMuted]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackSpeed;
    localStorage.setItem('vidtube_player_speed', String(playbackSpeed));
  }, [playbackSpeed]);

  /**
   * Auto-hide controls timer
   */
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying]);

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  /**
   * Video Event Listeners
   */
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime, video.duration || duration);
    }

    // Compute buffered range
    if (video.buffered && video.buffered.length > 0) {
      for (let i = video.buffered.length - 1; i >= 0; i--) {
        if (video.buffered.start(i) <= video.currentTime) {
          setBufferedTime(video.buffered.end(i));
          break;
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration || 0);
    setIsLoading(false);

    // Initial Resume Seek if requested
    if (!initialSeekDoneRef.current && initialTime > 0 && initialTime < video.duration - 5) {
      video.currentTime = initialTime;
      setCurrentTime(initialTime);
      initialSeekDoneRef.current = true;
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsEnded(false);
    resetControlsTimer();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handlePlaying = () => {
    setIsBuffering(false);
    setIsLoading(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    setControlsVisible(true);
    if (onEnded) onEnded();
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setIsBuffering(false);
    if (!hasAdaptiveHls && src) {
      // Direct source fallback error
      setPlaybackError('An error occurred while loading this video stream.');
    }
  };

  /**
   * Action Handlers
   */
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isEnded) {
      video.currentTime = 0;
      video.play().catch(console.error);
      setIsEnded(false);
      return;
    }

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const handleSeek = (targetTime) => {
    const video = videoRef.current;
    if (!video) return;
    const clampedTime = Math.max(0, Math.min(targetTime, duration || video.duration || 0));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
    setIsEnded(false);
    resetControlsTimer();
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const handleQualityChange = (levelIndex) => {
    setCurrentQuality(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(console.error);
    } else {
      document.exitFullscreen?.().catch(console.error);
    }
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video || !isPipSupported) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('[VidTube] Picture in Picture error:', err);
    }
  };

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  /**
   * Global Keyboard Shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not trigger player shortcuts when user is typing in inputs or textareas
      const tag = document.activeElement?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlayPause();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(video.currentTime - 5);
          break;

        case 'ArrowRight':
          e.preventDefault();
          handleSeek(video.currentTime + 5);
          break;

        case 'j':
        case 'J':
          e.preventDefault();
          handleSeek(video.currentTime - 10);
          break;

        case 'l':
        case 'L':
          e.preventDefault();
          handleSeek(video.currentTime + 10);
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(1, parseFloat((v + 0.1).toFixed(2))));
          if (isMuted) setIsMuted(false);
          resetControlsTimer();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, parseFloat((v - 0.1).toFixed(2))));
          resetControlsTimer();
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 't':
        case 'T':
          if (onToggleTheater) {
            e.preventDefault();
            onToggleTheater();
          }
          break;

        case 'i':
        case 'I':
          if (isPipSupported) {
            e.preventDefault();
            togglePip();
          }
          break;

        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          e.preventDefault();
          const targetPct = parseInt(e.key, 10) / 10;
          handleSeek(targetPct * (video.duration || duration));
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isMuted, isPipSupported, onToggleTheater, togglePlayPause]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      className={`relative w-full bg-black select-none overflow-hidden group ${
        isFullscreen
          ? 'h-screen w-screen'
          : isTheaterMode
          ? 'aspect-video max-h-[80vh] w-full'
          : 'aspect-video w-full rounded-2xl shadow-xl'
      }`}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        onClick={togglePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        className="w-full h-full object-contain cursor-pointer"
        aria-label={title}
      />

      {/* Loading & Buffering Spinner */}
      {(isLoading || isBuffering) && !playbackError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-[#FF0033] animate-spin" />
          </div>
        </div>
      )}

      {/* Replay State Overlay */}
      {isEnded && (
        <div
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer backdrop-blur-xs transition-opacity"
        >
          <div className="p-4 rounded-full bg-[#FF0033] text-white hover:scale-110 active:scale-95 transition shadow-2xl">
            <RotateCcw className="w-8 h-8" />
          </div>
        </div>
      )}

      {/* Playback Error Message */}
      {playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-[#FF0033] mb-3" />
          <h3 className="text-base font-semibold mb-1">Playback Error</h3>
          <p className="text-xs text-neutral-400 max-w-md mb-4">{playbackError}</p>
          <button
            type="button"
            onClick={() => {
              setPlaybackError(null);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="px-4 py-2 text-xs font-semibold rounded-full bg-[#FF0033] text-white hover:bg-[#d9002c] transition shadow-md"
          >
            Retry Playback
          </button>
        </div>
      )}

      {/* Center Big Play/Pause Splash Icon on Pause */}
      {!isPlaying && !isLoading && !isBuffering && !isEnded && !playbackError && (
        <div
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer pointer-events-auto"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition backdrop-blur-sm">
            <Play className="w-8 h-8 fill-white ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Controls Overlay Bar */}
      <div
        className={`transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <PlayerControls
          isPlaying={isPlaying}
          isEnded={isEnded}
          currentTime={currentTime}
          duration={duration}
          bufferedTime={bufferedTime}
          volume={volume}
          isMuted={isMuted}
          playbackSpeed={playbackSpeed}
          qualityLevels={qualityLevels}
          currentQuality={currentQuality}
          isTheaterMode={isTheaterMode}
          isFullscreen={isFullscreen}
          isPipSupported={isPipSupported}
          onPlayPause={togglePlayPause}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onSpeedChange={handleSpeedChange}
          onQualityChange={handleQualityChange}
          onToggleTheater={onToggleTheater}
          onToggleFullscreen={toggleFullscreen}
          onTogglePip={togglePip}
          onNextVideo={onNextVideo}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
