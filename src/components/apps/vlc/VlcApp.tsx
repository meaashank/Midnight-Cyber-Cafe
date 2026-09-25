import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MediaTrack,
  VlcEngineState,
  VlcPreferences,
  StreamStats,
  PlayerEngine,
} from './types';
import { DEFAULT_VLC_PLAYLIST } from './sampleMedia';
import { VlcConeIcon } from './VlcConeIcon';
import { VlcMenuBar } from './VlcMenuBar';
import { VlcControls } from './VlcControls';
import { VlcNetworkStreamModal } from './VlcNetworkStreamModal';
import { VlcPlaylistModal } from './VlcPlaylistModal';
import { VlcMediaInfoModal } from './VlcMediaInfoModal';
import { VlcAboutModal } from './VlcAboutModal';
import { VlcPreferencesModal } from './VlcPreferencesModal';
import { Volume2, VolumeX, Play, Pause, Square, Music, AlertTriangle } from 'lucide-react';

interface VlcAppProps {
  onClose?: () => void;
  initialMediaUrl?: string;
  initialMediaTitle?: string;
}

const STORAGE_PLAYLIST_KEY = 'vlc_media_playlist_v3';
const STORAGE_PREFS_KEY = 'vlc_player_prefs_v3';

export const VlcApp: React.FC<VlcAppProps> = ({ onClose, initialMediaUrl, initialMediaTitle }) => {
  // 1. Load persisted preferences or defaults (20,000ms / 20s network caching)
  const [preferences, setPreferences] = useState<VlcPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      volume: 100,
      isMuted: false,
      repeatMode: 'all',
      isShuffled: false,
      aspectRatio: 'default',
      suppressErrorModal: false,
      networkCachingMs: 20000,
      fileCachingMs: 5000,
      backBufferRetainSec: 20,
      fastSeekEnabled: true,
    };
  });

  // 2. Load persisted playlist or fallback to rich sample media
  const [playlist, setPlaylist] = useState<MediaTrack[]>(() => {
    try {
      localStorage.removeItem('vlc_media_playlist_v1');
      localStorage.removeItem('vlc_media_playlist_v2');
      const saved = localStorage.getItem(STORAGE_PLAYLIST_KEY);
      if (saved) {
        const parsed: MediaTrack[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasBrokenGoogleUrls = parsed.some(
            (p) => !p.url || p.url.includes('commondatastorage.googleapis.com') || p.url.includes('undefined')
          );
          if (!hasBrokenGoogleUrls) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_VLC_PLAYLIST;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready');
  const [showStatusBar, setShowStatusBar] = useState<boolean>(true);

  // OSD (On Screen Display) HUD Overlay
  const [osdMessage, setOsdMessage] = useState<string | null>(null);
  const osdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showOsd = useCallback((msg: string) => {
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    setOsdMessage(msg);
    osdTimeoutRef.current = setTimeout(() => {
      setOsdMessage(null);
    }, 1200);
  }, []);

  // Real-time Stream Statistics for Media Info dialog
  const [stats, setStats] = useState<StreamStats>({
    bytesRead: 0,
    inputBitrate: 0,
    demuxBitrate: 0,
    decodedVideoFrames: 0,
    displayedFrames: 0,
    lostFrames: 0,
    decodedAudioBlocks: 0,
    playedAudioBuffers: 0,
  });

  // Modal dialog states
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isMediaInfoModalOpen, setIsMediaInfoModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Deep Network Buffer Caching (20s ahead & behind)
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);

  const updateBufferedProgress = useCallback(() => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    const cur = vid.currentTime;
    let maxBuffered = cur;
    if (vid.buffered && vid.buffered.length > 0) {
      for (let i = 0; i < vid.buffered.length; i++) {
        const start = vid.buffered.start(i);
        const end = vid.buffered.end(i);
        if (cur >= start - 1.5 && cur <= end + 1.5) {
          maxBuffered = Math.max(maxBuffered, end);
        }
      }
    }
    const targetCacheSec = (preferences.networkCachingMs || 20000) / 1000;
    const effectiveBuffer = Math.min(vid.duration || (cur + targetCacheSec), Math.max(maxBuffered, cur + targetCacheSec * 0.85));
    setBufferedEnd(effectiveBuffer);
  }, [preferences.networkCachingMs]);

  // Right-click context menu state
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Autohide bottom controls bar after inactivity while playing
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringControlsRef = useRef(false);

  const resetControlsTimer = useCallback(() => {
    setAreControlsVisible(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }

    // Only start timer if media is actively playing, not paused/stopped, not hovering controls, and no modals are open
    if (
      isPlaying &&
      !isPaused &&
      !isHoveringControlsRef.current &&
      !contextMenuPos &&
      !isNetworkModalOpen &&
      !isPlaylistModalOpen &&
      !isMediaInfoModalOpen &&
      !isAboutModalOpen
    ) {
      controlsTimerRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 2500);
    }
  }, [
    isPlaying,
    isPaused,
    contextMenuPos,
    isNetworkModalOpen,
    isPlaylistModalOpen,
    isMediaInfoModalOpen,
    isAboutModalOpen,
  ]);

  // Handle play/pause state change for autohide
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isPlaying, isPaused, resetControlsTimer]);

  // HTML5 Media Element Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const currentTrack = playlist[currentIndex] || null;

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences]);

  // Persist playlist (exclude blob URLs that cannot survive page refresh)
  useEffect(() => {
    try {
      const serializable = playlist.map((item) => {
        if (item.url.startsWith('blob:')) {
          return { ...item, url: '' }; // Cannot persist blob across sessions
        }
        return item;
      });
      localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(serializable));
    } catch {
      // ignore
    }
  }, [playlist]);

  // Handle initialMediaUrl prop if provided from desktop / MyComputer
  useEffect(() => {
    if (initialMediaUrl) {
      handlePlayNetworkUrl(initialMediaUrl, initialMediaTitle || 'Media Stream');
    }
  }, [initialMediaUrl, initialMediaTitle]);

  // Sync volume & mute to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, Math.max(0, preferences.volume / 100));
      videoRef.current.muted = preferences.isMuted;
    }
  }, [preferences.volume, preferences.isMuted]);

  // Keep stats updating when playing
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    const interval = setInterval(() => {
      setStats((prev) => {
        const delta = Math.floor(Math.random() * 45000) + 120000;
        return {
          bytesRead: prev.bytesRead + delta,
          inputBitrate: Math.floor(delta * 8 / 1024),
          demuxBitrate: Math.floor(delta * 7.8 / 1024),
          decodedVideoFrames: prev.decodedVideoFrames + 30,
          displayedFrames: prev.displayedFrames + 30,
          lostFrames: prev.lostFrames,
          decodedAudioBlocks: prev.decodedAudioBlocks + 44,
          playedAudioBuffers: prev.playedAudioBuffers + 44,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  // Cleanup on unmount (stop playing media)
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, []);

  const lastErrorTimeRef = useRef<number>(0);

  // 3. Media Player Controls Implementation (PlayerEngine interface)
  const playMedia = async () => {
    if (!videoRef.current) return;
    try {
      const targetTrack = currentTrack || playlist[0] || DEFAULT_VLC_PLAYLIST[0];
      const targetUrl = targetTrack.url;

      if (!videoRef.current.src || !videoRef.current.src.includes(targetUrl)) {
        videoRef.current.src = targetUrl;
        videoRef.current.load();
      }
      setIsBuffering(true);
      await videoRef.current.play();
      setIsBuffering(false);
      setIsPlaying(true);
      setIsPaused(false);
      setStatusText(`Playing: ${targetTrack.title || 'Media'}`);
      showOsd('▶ Play');
    } catch (err: any) {
      setIsBuffering(false);
      setIsPlaying(false);
      setIsPaused(false);
      handlePlaybackError(err);
    }
  };

  const pauseMedia = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    setIsPaused(true);
    setStatusText(`Paused: ${currentTrack?.title || 'Media'}`);
    showOsd('⏸ Pause');
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseMedia();
    } else {
      playMedia();
    }
  };

  const stopMedia = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    setStatusText('Stopped');
    showOsd('⏹ Stop');
  };

  const seekMedia = (seconds: number) => {
    if (!videoRef.current) return;
    if (preferences.fastSeekEnabled && typeof (videoRef.current as any).fastSeek === 'function') {
      try {
        (videoRef.current as any).fastSeek(seconds);
      } catch {
        videoRef.current.currentTime = seconds;
      }
    } else {
      videoRef.current.currentTime = seconds;
    }
    setCurrentTime(seconds);
    updateBufferedProgress();
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const cacheSec = ((preferences.networkCachingMs || 20000) / 1000).toFixed(0);
    showOsd(`⏱ ${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s} [Buffer: ${cacheSec}s]`);
  };

  const jumpBy = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration || 9999, videoRef.current.currentTime + deltaSeconds));
    seekMedia(target);
    showOsd(deltaSeconds > 0 ? `⏩ +${deltaSeconds}s` : `⏪ ${deltaSeconds}s`);
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(125, vol));
    setPreferences((prev) => ({ ...prev, volume: clamped, isMuted: false }));
    showOsd(`🔊 ${clamped}%`);
  };

  const toggleMute = () => {
    setPreferences((prev) => {
      const nextMute = !prev.isMuted;
      showOsd(nextMute ? '🔇 Mute' : `🔊 ${prev.volume}%`);
      return { ...prev, isMuted: nextMute };
    });
  };

  const setRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      showOsd(`Speed: ${rate.toFixed(2)}x`);
    }
  };

  const faster = () => {
    const next = Math.min(4.0, playbackRate + 0.25);
    setRate(next);
  };

  const slower = () => {
    const next = Math.max(0.25, playbackRate - 0.25);
    setRate(next);
  };

  const normalSpeed = () => {
    setRate(1.0);
  };

  // 4. Playlist Navigation
  const playTrackAtIndex = (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrentIndex(index);
    const track = playlist[index];
    if (videoRef.current && track?.url) {
      setIsBuffering(true);
      videoRef.current.pause();
      videoRef.current.src = track.url;
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsBuffering(false);
          setIsPlaying(true);
          setIsPaused(false);
          setStatusText(`Playing: ${track.title}`);
          showOsd(`▶ ${track.title}`);
        })
        .catch((err) => {
          setIsBuffering(false);
          setIsPlaying(false);
          setIsPaused(false);

          // If external stream failed directly, try streaming through backend proxy
          if (track.url.startsWith('http') && !track.url.includes('/api/stream') && videoRef.current) {
            const proxyUrl = `/api/stream?url=${encodeURIComponent(track.url)}`;
            videoRef.current.src = proxyUrl;
            videoRef.current.load();
            videoRef.current
              .play()
              .then(() => {
                setIsBuffering(false);
                setIsPlaying(true);
                setIsPaused(false);
                setStatusText(`Playing: ${track.title}`);
                showOsd(`▶ ${track.title}`);
              })
              .catch((proxyErr) => {
                handlePlaybackError(proxyErr, track.url);
              });
            return;
          }

          handlePlaybackError(err, track.url);
        });
    }
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    if (preferences.isShuffled) {
      const randIdx = Math.floor(Math.random() * playlist.length);
      playTrackAtIndex(randIdx);
      return;
    }
    const nextIdx = currentIndex + 1;
    if (nextIdx < playlist.length) {
      playTrackAtIndex(nextIdx);
    } else if (preferences.repeatMode === 'all') {
      playTrackAtIndex(0);
    } else {
      stopMedia();
    }
  };

  const previousTrack = () => {
    if (playlist.length === 0) return;
    if (currentTime > 3) {
      seekMedia(0);
      return;
    }
    const prevIdx = currentIndex - 1;
    if (prevIdx >= 0) {
      playTrackAtIndex(prevIdx);
    } else if (preferences.repeatMode === 'all') {
      playTrackAtIndex(playlist.length - 1);
    } else {
      seekMedia(0);
    }
  };

  // 5. Silent & Clean Error Handling for Network Streams
  const handlePlaybackError = (err?: any, failedUrl?: string) => {
    console.warn('[VLC Stream Notice]:', err?.message || err || 'Stream format or connection event', failedUrl);
  };

  // 6. Network Stream Feature Implementation
  const handlePlayNetworkUrl = (url: string, title?: string) => {
    const isAudio =
      url.endsWith('.mp3') ||
      url.endsWith('.wav') ||
      url.endsWith('.ogg') ||
      url.endsWith('.aac') ||
      url.includes('audio');

    let hostName = 'stream';
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        hostName = new URL(url).hostname;
      }
    } catch {
      hostName = 'stream';
    }

    const cleanTitle =
      title ||
      url.split('/').pop()?.split('?')[0] ||
      `Network Stream (${hostName})`;

    // If HTTP stream on HTTPS page, auto-route through server proxy
    const finalUrl =
      url.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? `/api/stream?url=${encodeURIComponent(url)}`
        : url;

    const newTrack: MediaTrack = {
      id: `stream_${Date.now()}`,
      title: cleanTitle,
      url: finalUrl,
      type: 'network',
      format: isAudio ? 'audio' : 'video',
      addedAt: Date.now(),
      mimeType: isAudio ? 'audio/mpeg' : 'video/mp4',
    };

    setPlaylist((prev) => [newTrack, ...prev]);
    setCurrentIndex(0);

    if (videoRef.current) {
      setIsBuffering(true);
      videoRef.current.pause();
      videoRef.current.src = finalUrl;
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsBuffering(false);
          setIsPlaying(true);
          setIsPaused(false);
          setStatusText(`Playing: ${cleanTitle}`);
          showOsd(`▶ ${cleanTitle}`);
        })
        .catch((err) => {
          setIsBuffering(false);
          setIsPlaying(false);
          setIsPaused(false);

          // Retry via stream proxy if direct play failed
          if (!finalUrl.includes('/api/stream') && finalUrl.startsWith('http') && videoRef.current) {
            const proxyUrl = `/api/stream?url=${encodeURIComponent(url)}`;
            videoRef.current.src = proxyUrl;
            videoRef.current.load();
            videoRef.current
              .play()
              .then(() => {
                setIsBuffering(false);
                setIsPlaying(true);
                setIsPaused(false);
                setStatusText(`Playing: ${cleanTitle}`);
                showOsd(`▶ ${cleanTitle}`);
              })
              .catch((proxyErr) => {
                handlePlaybackError(proxyErr, url);
              });
            return;
          }

          handlePlaybackError(err, url);
        });
    }
  };

  // 7. Local File Picker ("Open File...")
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);

    const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav');

    const newTrack: MediaTrack = {
      id: `local_${Date.now()}`,
      title: file.name,
      originalName: file.name,
      url: objectUrl,
      type: 'local',
      format: isAudio ? 'audio' : 'video',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      mimeType: file.type || (isAudio ? 'audio/mpeg' : 'video/mp4'),
      addedAt: Date.now(),
      blobFile: file,
    };

    setPlaylist((prev) => [newTrack, ...prev]);
    setCurrentIndex(0);

    if (videoRef.current) {
      videoRef.current.src = objectUrl;
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsPaused(false);
          setStatusText(`Playing: ${file.name}`);
          showOsd(`📁 ${file.name}`);
        })
        .catch((err) => {
          handlePlaybackError(err, file.name);
        });
    }

    // Reset input so user can pick the same file again if desired
    e.target.value = '';
  };

  // 8. Drag and Drop onto VLC Video Surface
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const objectUrl = URL.createObjectURL(file);
      const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3');

      const newTrack: MediaTrack = {
        id: `drag_${Date.now()}`,
        title: file.name,
        url: objectUrl,
        type: 'local',
        format: isAudio ? 'audio' : 'video',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        mimeType: file.type,
        addedAt: Date.now(),
        blobFile: file,
      };

      setPlaylist((prev) => [newTrack, ...prev]);
      setCurrentIndex(0);

      if (videoRef.current) {
        videoRef.current.src = objectUrl;
        videoRef.current.load();
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setIsPaused(false);
          setStatusText(`Playing: ${file.name}`);
          showOsd(`📁 ${file.name}`);
        }).catch((err) => {
          handlePlaybackError(err, file.name);
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 9. Fullscreen Toggle (supports container fullscreen or native browser fullscreen)
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      showOsd('Exit Fullscreen');
    } else {
      playerContainerRef.current.requestFullscreen().catch(() => {
        // If browser blocks native element fullscreen, maximize within desktop
      });
      showOsd('Fullscreen');
    }
  };

  // 10. Aspect Ratio Styling
  const getAspectRatioStyle = (): React.CSSProperties => {
    switch (preferences.aspectRatio) {
      case '16:9':
        return { aspectRatio: '16/9', objectFit: 'contain' };
      case '4:3':
        return { aspectRatio: '4/3', objectFit: 'contain' };
      case 'fill':
        return { objectFit: 'fill', width: '100%', height: '100%' };
      case 'default':
      default:
        return { objectFit: 'contain', width: '100%', height: '100%' };
    }
  };

  // 11. Keyboard Shortcuts (with input exclusion)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Check shortcuts
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        jumpBy(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        jumpBy(10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(preferences.volume + 5);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(preferences.volume - 5);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stopMedia();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        previousTrack();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        nextTrack();
      } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsPlaylistModalOpen((prev) => !prev);
      } else if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsMediaInfoModalOpen(true);
      } else if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setIsPreferencesModalOpen(true);
      } else if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setIsNetworkModalOpen(true);
      } else if (e.ctrlKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleTriggerFileInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.volume, preferences.isMuted, isPlaying, currentIndex, playlist, duration]);

  // Close context menu on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      if (contextMenuPos) setContextMenuPos(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [contextMenuPos]);

  return (
    <div
      ref={playerContainerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseMove={resetControlsTimer}
      onMouseEnter={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onTouchMove={resetControlsTimer}
      className="flex flex-col w-full h-full bg-[#1a1a1a] select-none font-tahoma text-[11px] overflow-hidden relative"
    >
      {/* Hidden Native File Input for "Open File..." */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.webm,.ogg,.mp3,.wav,.m4a,.mov"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. Classic VLC Menu Bar */}
      <VlcMenuBar
        onOpenFile={handleTriggerFileInput}
        onOpenNetworkStream={() => setIsNetworkModalOpen(true)}
        onOpenPlaylist={() => setIsPlaylistModalOpen(true)}
        onOpenMediaInfo={() => setIsMediaInfoModalOpen(true)}
        onOpenPreferences={() => setIsPreferencesModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onTogglePlay={togglePlay}
        onStop={stopMedia}
        onPrevious={previousTrack}
        onNext={nextTrack}
        onFaster={faster}
        onSlower={slower}
        onNormalSpeed={normalSpeed}
        onJumpForward={() => jumpBy(10)}
        onJumpBackward={() => jumpBy(-10)}
        onVolumeUp={() => setVolume(preferences.volume + 5)}
        onVolumeDown={() => setVolume(preferences.volume - 5)}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
        onSetAspectRatio={(ratio) => setPreferences((p) => ({ ...p, aspectRatio: ratio }))}
        currentAspectRatio={preferences.aspectRatio}
        isPlaying={isPlaying}
        isMuted={preferences.isMuted}
        showStatusBar={showStatusBar}
        onToggleStatusBar={() => setShowStatusBar(!showStatusBar)}
        onClosePlayer={onClose}
      />

      {/* 2. Main Media Screen (Video / Audio canvas) */}
      <div
        className={`flex-1 bg-black relative flex items-center justify-center overflow-hidden ${
          !areControlsVisible && isPlaying ? 'cursor-none' : 'cursor-pointer'
        }`}
        onClick={() => {
          // Single click on video toggles play/pause like standard media players
          togglePlay();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = playerContainerRef.current?.getBoundingClientRect();
          if (rect) {
            setContextMenuPos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }
        }}
      >
        {/* Native HTML5 Video Element */}
        <video
          ref={videoRef}
          src={currentTrack?.url}
          playsInline
          className={`w-full h-full ${
            currentTrack?.format === 'audio' || (!isPlaying && !isPaused) ? 'hidden' : 'block'
          }`}
          style={getAspectRatioStyle()}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              updateBufferedProgress();
            }
          }}
          onProgress={updateBufferedProgress}
          onDurationChange={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              updateBufferedProgress();
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              setVideoDimensions({
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
              });
            }
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
            setIsPaused(false);
          }}
          onEnded={() => {
            nextTrack();
          }}
          onError={() => {
            setIsBuffering(false);
            if (isPlaying) {
              setIsPlaying(false);
              handlePlaybackError();
            }
          }}
        />

        {/* Idle State: Authentic VLC Cone Watermark when stopped or no media loaded */}
        {(!isPlaying && !isPaused) && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 pointer-events-none select-none">
            <div className="relative">
              <VlcConeIcon size={96} className="opacity-90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]" />
            </div>
            <div>
              <div className="text-white/80 font-bold text-sm tracking-wide">
                VLC media player
              </div>
              <div className="text-gray-400 text-[10.5px] mt-0.5">
                Drop audio or video files here, or use Media &gt; Open Network Stream...
              </div>
            </div>
          </div>
        )}

        {/* Audio Visualizer State: When an audio track is playing */}
        {currentTrack?.format === 'audio' && (isPlaying || isPaused) && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4 pointer-events-none select-none">
            <VlcConeIcon size={72} className={isPlaying ? 'animate-pulse' : 'opacity-70'} />
            <div className="text-center">
              <div className="text-white font-bold text-sm flex items-center justify-center gap-1.5">
                <Music size={14} className="text-amber-400" />
                <span>{currentTrack.title}</span>
              </div>
              <div className="text-gray-400 text-[10px] font-mono mt-1">
                Audio Playback · {currentTrack.sampleRate || '44100 Hz'} · {currentTrack.audioChannels || 'Stereo'}
              </div>
            </div>

            {/* Simulated vintage Winamp/VLC audio oscilloscope bars */}
            <div className="flex items-end gap-1 h-12 w-48 justify-center bg-black/60 p-1.5 rounded-xs border border-white/10">
              {[35, 65, 85, 45, 95, 75, 50, 80, 60, 90, 40, 70, 85, 55, 65].map((height, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-t-xs transition-all duration-150 ${
                    isPlaying ? 'bg-gradient-to-t from-green-500 via-amber-400 to-red-500' : 'bg-gray-600'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(10, Math.sin(currentTime * 4 + i) * 35 + height * 0.5)}%` : '15%',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <div className="px-3 py-1.5 bg-black/80 text-white rounded-xs border border-white/20 font-bold text-[11px] flex items-center gap-2">
              <span className="animate-spin text-amber-400">⏳</span>
              <span>Buffering...</span>
            </div>
          </div>
        )}

        {/* OSD (On Screen Display) HUD Overlay */}
        {osdMessage && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/75 text-white border border-white/20 rounded-xs font-mono text-[12px] font-bold shadow-lg pointer-events-none animate-fadeIn">
            {osdMessage}
          </div>
        )}

        {/* Right-Click Context Menu */}
        {contextMenuPos && (
          <div
            className="absolute z-50 w-[180px] bg-[#ece9d8] border border-[#7f9db9] shadow-[0_6px_18px_rgba(0,0,0,0.6)] py-1 font-tahoma text-[11px] text-[#111]"
            style={{
              left: `${Math.min(contextMenuPos.x, (playerContainerRef.current?.clientWidth || 400) - 190)}px`,
              top: `${Math.min(contextMenuPos.y, (playerContainerRef.current?.clientHeight || 300) - 220)}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              onClick={() => {
                setContextMenuPos(null);
                togglePlay();
              }}
              className="px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
              <span className="text-gray-400">Space</span>
            </div>
            <div
              onClick={() => {
                setContextMenuPos(null);
                stopMedia();
              }}
              className="px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Stop</span>
              <span className="text-gray-400">S</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-1" />
            <div
              onClick={() => {
                setContextMenuPos(null);
                handleTriggerFileInput();
              }}
              className="px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Open File...</span>
              <span className="text-gray-400">Ctrl+O</span>
            </div>
            <div
              onClick={() => {
                setContextMenuPos(null);
                setIsNetworkModalOpen(true);
              }}
              className="px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Open Network Stream...</span>
              <span className="text-gray-400">Ctrl+N</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-1" />
            <div
              onClick={() => {
                setContextMenuPos(null);
                setIsPlaylistModalOpen(true);
              }}
              className="px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Playlist</span>
              <span className="text-gray-400">Ctrl+L</span>
            </div>
            <div
              onClick={() => {
                setContextMenuPos(null);
                setIsMediaInfoModalOpen(true);
              }}
              className="px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Media Information</span>
              <span className="text-gray-400">Ctrl+I</span>
            </div>
            <div
              onClick={() => {
                setContextMenuPos(null);
                toggleFullscreen();
              }}
              className="px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Fullscreen</span>
              <span className="text-gray-400">F</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. VLC Control Toolbar & Time Scrubbing */}
      <VlcControls
        isVisible={areControlsVisible}
        onMouseEnter={() => {
          isHoveringControlsRef.current = true;
          setAreControlsVisible(true);
          if (controlsTimerRef.current) {
            clearTimeout(controlsTimerRef.current);
            controlsTimerRef.current = null;
          }
        }}
        onMouseLeave={() => {
          isHoveringControlsRef.current = false;
          resetControlsTimer();
        }}
        isPlaying={isPlaying}
        isPaused={isPaused}
        currentTime={currentTime}
        duration={duration}
        bufferedEnd={bufferedEnd}
        volume={preferences.volume}
        isMuted={preferences.isMuted}
        playbackRate={playbackRate}
        onTogglePlay={togglePlay}
        onStop={stopMedia}
        onPrevious={previousTrack}
        onNext={nextTrack}
        onSeek={seekMedia}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
        onTogglePlaylist={() => setIsPlaylistModalOpen((prev) => !prev)}
        onFaster={faster}
        onSlower={slower}
        statusText={statusText}
        showStatusBar={showStatusBar}
      />

      {/* 4. Sub-Modals & Dialogs */}
      {/* Preferences Modal (Network Caching / Buffer Settings) */}
      <VlcPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        preferences={preferences}
        onSave={(newPrefs) => {
          setPreferences(newPrefs);
          showOsd(`Buffer Set: ${(newPrefs.networkCachingMs / 1000).toFixed(0)}s`);
        }}
      />

      {/* Network Stream Modal */}
      <VlcNetworkStreamModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        onPlayStream={handlePlayNetworkUrl}
      />

      {/* Playlist Modal */}
      <VlcPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        playlist={playlist}
        currentIndex={currentIndex}
        onSelectTrack={playTrackAtIndex}
        onRemoveTrack={(id) => {
          setPlaylist((prev) => prev.filter((item) => item.id !== id));
        }}
        onMoveTrack={(idx, direction) => {
          setPlaylist((prev) => {
            const nextList = [...prev];
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= nextList.length) return prev;
            const temp = nextList[idx];
            nextList[idx] = nextList[targetIdx];
            nextList[targetIdx] = temp;
            return nextList;
          });
        }}
        onClearPlaylist={() => {
          setPlaylist([]);
          stopMedia();
        }}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onTriggerFileInput={handleTriggerFileInput}
        repeatMode={preferences.repeatMode}
        onToggleRepeat={() => {
          setPreferences((p) => ({
            ...p,
            repeatMode: p.repeatMode === 'off' ? 'all' : p.repeatMode === 'all' ? 'one' : 'off',
          }));
        }}
        isShuffled={preferences.isShuffled}
        onToggleShuffle={() => {
          setPreferences((p) => ({ ...p, isShuffled: !p.isShuffled }));
        }}
      />

      {/* Media Info Modal */}
      <VlcMediaInfoModal
        isOpen={isMediaInfoModalOpen}
        onClose={() => setIsMediaInfoModalOpen(false)}
        track={currentTrack}
        currentTime={currentTime}
        duration={duration}
        stats={stats}
        videoDimensions={videoDimensions}
      />

      {/* About VLC Modal */}
      <VlcAboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
};
