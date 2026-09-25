import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistContextType, YouTubeTrack, PlaylistItem } from '../types';
import { parseYouTubeInput } from '../utils/youtube';

export const DEFAULT_PLAYLIST_ID = 'PLt4QqxffzV0D8YNJ0Xdh34CRifqctJ8ms';
export const DEFAULT_PLAYLIST_TITLE = 'Cabin 04: Classic Gaming & Lo-Fi Chill';

export const DEFAULT_PLAYLIST: PlaylistItem = {
  id: DEFAULT_PLAYLIST_ID,
  title: DEFAULT_PLAYLIST_TITLE,
  isCustom: false,
  type: 'playlist',
};

const SESSION_PLAYLISTS_KEY = 'cabin04_session_playlists';
const SESSION_ACTIVE_ID_KEY = 'cabin04_active_playlist_id';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

// Initial fallback track placeholders while live YouTube metadata loads
const INITIAL_FALLBACK_TRACKS: YouTubeTrack[] = [
  {
    id: 'loading_1',
    title: 'Loading Playlist Track 1...',
    artist: 'YouTube Stream',
    duration: '3:45',
    durationSec: 225,
  },
  {
    id: 'loading_2',
    title: 'Loading Playlist Track 2...',
    artist: 'YouTube Stream',
    duration: '4:10',
    durationSec: 250,
  },
  {
    id: 'loading_3',
    title: 'Loading Playlist Track 3...',
    artist: 'YouTube Stream',
    duration: '3:20',
    durationSec: 200,
  },
];

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Session-based playlists list
  const [playlists, setPlaylists] = useState<PlaylistItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_PLAYLISTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default playlist is always present
          const hasDefault = parsed.some((p: PlaylistItem) => p.id === DEFAULT_PLAYLIST_ID);
          return hasDefault ? parsed : [DEFAULT_PLAYLIST, ...parsed];
        }
      }
    } catch {
      // ignore
    }
    return [DEFAULT_PLAYLIST];
  });

  // 2. Active Playlist ID
  const [playlistId, setPlaylistId] = useState<string>(() => {
    try {
      const storedActive = sessionStorage.getItem(SESSION_ACTIVE_ID_KEY);
      if (storedActive) return storedActive;
    } catch {
      // ignore
    }
    return DEFAULT_PLAYLIST_ID;
  });

  const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
  const [tracks, setTracks] = useState<YouTubeTrack[]>(INITIAL_FALLBACK_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(80);
  const [spectrumBars, setSpectrumBars] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [eqValues, setEqValues] = useState<number[]>([0, 2, 4, 1, -1, 3, 2, 0]);

  const playerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const isApiReadyRef = useRef<boolean>(false);
  const currentVideoDataRef = useRef<{ title: string; author: string; video_id: string } | null>(null);

  // Sync playlists list to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }, [playlists]);

  // Sync active playlist ID to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_ACTIVE_ID_KEY, playlistId);
    } catch {
      // ignore
    }
  }, [playlistId]);

  // Helper: Fetch oEmbed metadata for a single video or track
  const fetchVideoMetadata = async (videoId: string): Promise<{ title: string; artist: string }> => {
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          const rawTitle = data.title;
          const author = data.author_name || 'Various Artists';
          if (rawTitle.includes(' - ')) {
            const [art, ...rest] = rawTitle.split(' - ');
            return {
              artist: art.trim(),
              title: rest.join(' - ').trim(),
            };
          }
          return {
            artist: author,
            title: rawTitle,
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      artist: 'Track Audio',
      title: `YouTube Video (${videoId})`,
    };
  };

  // Populate playlist video IDs and fetch track titles
  const populatePlaylistTracks = useCallback(async (videoIds: string[]) => {
    if (!videoIds || videoIds.length === 0) return;
    setIsLoading(true);

    const loadedTracks: YouTubeTrack[] = [];
    for (let i = 0; i < videoIds.length; i++) {
      const vid = videoIds[i];
      const meta = await fetchVideoMetadata(vid);
      loadedTracks.push({
        id: vid,
        title: meta.title,
        artist: meta.artist,
        duration: '3:30',
        durationSec: 210,
        thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      });
    }

    if (loadedTracks.length > 0) {
      setTracks(loadedTracks);
    }
    setIsLoading(false);
  }, []);

  // Fetch playlist RSS feed for full tracks listing
  const fetchPlaylistRss = useCallback(async (targetPlaylistId: string) => {
    // If it's a single video ID (11 chars and not starting with PL/RD/etc.)
    if (/^[a-zA-Z0-9_-]{11}$/.test(targetPlaylistId) && !targetPlaylistId.startsWith('PL')) {
      const meta = await fetchVideoMetadata(targetPlaylistId);
      setTracks([
        {
          id: targetPlaylistId,
          title: meta.title,
          artist: meta.artist,
          duration: '3:45',
          durationSec: 225,
          thumbnailUrl: `https://i.ytimg.com/vi/${targetPlaylistId}/hqdefault.jpg`,
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${targetPlaylistId}`;
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
      ];

      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy);
          if (res.ok) {
            const text = await res.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            const entries = xmlDoc.getElementsByTagName('entry');
            if (entries && entries.length > 0) {
              const rssTracks: YouTubeTrack[] = [];
              for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const titleNode = entry.getElementsByTagName('title')[0];
                const videoIdNode = entry.getElementsByTagName('yt:videoId')[0];
                const authorNode = entry.getElementsByTagName('name')[0];

                const vid = videoIdNode?.textContent || `vid_${i}`;
                const rawTitle = titleNode?.textContent || `Track ${i + 1}`;
                const authorName = authorNode?.textContent || 'Artist';

                let artist = authorName;
                let title = rawTitle;
                if (rawTitle.includes(' - ')) {
                  const parts = rawTitle.split(' - ');
                  artist = parts[0].trim();
                  title = parts.slice(1).join(' - ').trim();
                }

                rssTracks.push({
                  id: vid,
                  title,
                  artist,
                  duration: '3:30',
                  durationSec: 210,
                  thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                });
              }

              if (rssTracks.length > 0) {
                setTracks(rssTracks);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch {
          // try next proxy
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const currentTrackIndexRef = useRef<number>(0);

  // Update current track info from YouTube player video data
  const syncCurrentTrackFromPlayer = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const idx = playerRef.current.getPlaylistIndex?.() ?? currentTrackIndexRef.current;
      if (typeof idx === 'number' && idx >= 0) {
        currentTrackIndexRef.current = idx;
        setCurrentTrackIndex((prev) => (prev === idx ? prev : idx));
      }

      const videoData = playerRef.current.getVideoData?.();
      if (videoData && videoData.title && videoData.title !== currentVideoDataRef.current?.title) {
        currentVideoDataRef.current = videoData;
        const rawTitle = videoData.title;
        const author = videoData.author || 'Artist';

        let artist = author;
        let title = rawTitle;
        if (rawTitle.includes(' - ')) {
          const parts = rawTitle.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        setTracks((prev) => {
          const next = [...prev];
          if (next[idx]) {
            next[idx] = {
              ...next[idx],
              id: videoData.video_id || next[idx].id,
              title,
              artist,
              thumbnailUrl: videoData.video_id
                ? `https://i.ytimg.com/vi/${videoData.video_id}/hqdefault.jpg`
                : next[idx].thumbnailUrl,
            };
          } else {
            next.push({
              id: videoData.video_id || `vid_${idx}`,
              title,
              artist,
              duration: '3:30',
              durationSec: 210,
            });
          }
          return next;
        });
      }

      const cur = playerRef.current.getCurrentTime?.() || 0;
      const dur = playerRef.current.getDuration?.() || 0;
      setCurrentTime(cur);
      if (dur > 0) setDuration(dur);
    } catch {
      //
    }
  }, []);

  // Load a specified playlist into the player
  const loadPlaylist = useCallback(
    (newPlaylistId: string) => {
      setPlaylistId(newPlaylistId);
      setIsLoading(true);
      setCurrentTrackIndex(0);
      setCurrentTime(0);

      // Fetch RSS feed
      fetchPlaylistRss(newPlaylistId);

      if (playerRef.current && isApiReadyRef.current) {
        try {
          const isSingleVideo = /^[a-zA-Z0-9_-]{11}$/.test(newPlaylistId) && !newPlaylistId.startsWith('PL');
          if (isSingleVideo) {
            if (playerRef.current.loadVideoById) {
              playerRef.current.loadVideoById(newPlaylistId);
            }
          } else {
            if (playerRef.current.loadPlaylist) {
              playerRef.current.loadPlaylist({
                list: newPlaylistId,
                listType: 'playlist',
                index: 0,
              });
            }
          }
          setIsPlaying(true);
          setTimeout(syncCurrentTrackFromPlayer, 800);
        } catch (e) {
          console.warn('Error loading playlist into YT player:', e);
        }
      }
    },
    [fetchPlaylistRss, syncCurrentTrackFromPlayer]
  );

  // Add custom playlist from URL or ID
  const addCustomPlaylist = useCallback(
    async (
      input: string,
      customTitle?: string
    ): Promise<{ success: boolean; message?: string; playlist?: PlaylistItem }> => {
      const parsed = parseYouTubeInput(input);
      if (!parsed) {
        return {
          success: false,
          message: 'Invalid YouTube playlist URL or ID. Please check the link and try again.',
        };
      }

      // Check if already in playlists
      const existing = playlists.find((p) => p.id === parsed.id);
      if (existing) {
        loadPlaylist(existing.id);
        return {
          success: true,
          playlist: existing,
          message: 'Switched to existing playlist.',
        };
      }

      // Determine friendly title
      let title = customTitle?.trim();
      if (!title) {
        if (parsed.type === 'video') {
          const meta = await fetchVideoMetadata(parsed.id);
          title = `${meta.artist} - ${meta.title}`;
        } else {
          title = `Custom Playlist (${parsed.id.slice(0, 8)}...)`;
        }
      }

      const newPlaylistItem: PlaylistItem = {
        id: parsed.id,
        title,
        isCustom: true,
        type: parsed.type,
        addedAt: Date.now(),
      };

      setPlaylists((prev) => [newPlaylistItem, ...prev]);
      loadPlaylist(parsed.id);

      return {
        success: true,
        playlist: newPlaylistItem,
      };
    },
    [playlists, loadPlaylist]
  );

  // Remove custom playlist
  const removeCustomPlaylist = useCallback(
    (idToRemove: string) => {
      if (idToRemove === DEFAULT_PLAYLIST_ID) return; // Prevent removing default

      setPlaylists((prev) => prev.filter((p) => p.id !== idToRemove));

      if (playlistId === idToRemove) {
        loadPlaylist(DEFAULT_PLAYLIST_ID);
      }
    },
    [playlistId, loadPlaylist]
  );

  // Reset to default playlist
  const resetToDefaultPlaylist = useCallback(() => {
    loadPlaylist(DEFAULT_PLAYLIST_ID);
  }, [loadPlaylist]);

  // Initialize YouTube Iframe Player
  useEffect(() => {
    fetchPlaylistRss(playlistId);

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        const container = document.getElementById('youtube-player-hidden-frame');
        if (!container) return;

        try {
          const isSingleVideo = /^[a-zA-Z0-9_-]{11}$/.test(playlistId) && !playlistId.startsWith('PL');

          playerRef.current = new window.YT.Player('youtube-player-hidden-frame', {
            height: '180',
            width: '320',
            playerVars: isSingleVideo
              ? {
                  videoId: playlistId,
                  autoplay: 0,
                  controls: 1,
                  disablekb: 0,
                  enablejsapi: 1,
                  fs: 0,
                  modestbranding: 1,
                  playsinline: 1,
                  rel: 0,
                }
              : {
                  listType: 'playlist',
                  list: playlistId,
                  autoplay: 0,
                  controls: 1,
                  disablekb: 0,
                  enablejsapi: 1,
                  fs: 0,
                  modestbranding: 1,
                  playsinline: 1,
                  rel: 0,
                },
            events: {
              onReady: (event: any) => {
                isApiReadyRef.current = true;
                setIsLoading(false);
                try {
                  event.target.setVolume(volume);
                  const list = event.target.getPlaylist?.();
                  if (list && Array.isArray(list) && list.length > 0) {
                    populatePlaylistTracks(list);
                  }
                  syncCurrentTrackFromPlayer();
                } catch {
                  //
                }
              },
              onStateChange: (event: any) => {
                const state = event.data;
                if (state === 1) {
                  // Playing
                  setIsPlaying(true);
                  setIsLoading(false);
                  syncCurrentTrackFromPlayer();
                } else if (state === 2 || state === 0) {
                  // Paused or Ended
                  setIsPlaying(false);
                } else if (state === 3) {
                  // Buffering
                  setIsLoading(true);
                }
                syncCurrentTrackFromPlayer();
              },
              onError: (err: any) => {
                console.warn('YouTube Player Event Error:', err);
                setIsLoading(false);
              },
            },
          });
        } catch (e) {
          console.warn('Failed to initialize YT Player:', e);
        }
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = 'youtube-iframe-api-script';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, []); // Run once on mount

  // Audio spectrum visualizer physics & time ticker
  useEffect(() => {
    let lastTime = performance.now();

    const updateVisualizerAndProgress = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        const t = now * 0.005;
        const beat1 = Math.sin(t * 2.5) * 0.5 + 0.5;
        const beat2 = Math.cos(t * 3.8) * 0.5 + 0.5;
        const beat3 = Math.sin(t * 5.2 + 1.2) * 0.5 + 0.5;
        const beat4 = Math.cos(t * 1.7 + 0.5) * 0.5 + 0.5;

        setSpectrumBars((prev) => {
          return prev.map((bar, idx) => {
            const eqBonus = (eqValues[idx] || 0) * 2;
            let target = 20;

            if (idx === 0) target = 45 + beat1 * 50 + eqBonus;
            else if (idx === 1) target = 40 + beat2 * 55 + eqBonus;
            else if (idx === 2) target = 35 + beat3 * 50 + eqBonus;
            else if (idx === 3) target = 30 + beat1 * 60 + eqBonus;
            else if (idx === 4) target = 25 + beat4 * 65 + eqBonus;
            else if (idx === 5) target = 20 + beat2 * 60 + eqBonus;
            else if (idx === 6) target = 15 + beat3 * 55 + eqBonus;
            else target = 10 + beat4 * 50 + eqBonus;

            target = Math.max(5, Math.min(100, target + (Math.random() * 15 - 7.5)));
            const speed = target > bar ? 0.4 : 0.15;
            return bar + (target - bar) * speed;
          });
        });
      } else {
        setSpectrumBars((prev) =>
          prev.map((bar) => {
            if (bar <= 2) return 0;
            return Math.max(0, bar - dt * 60);
          })
        );
      }

      animFrameRef.current = requestAnimationFrame(updateVisualizerAndProgress);
    };

    animFrameRef.current = requestAnimationFrame(updateVisualizerAndProgress);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, eqValues]);

  // Periodic polling for player time sync
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = window.setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          try {
            const cur = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            if (dur > 0) setDuration(dur);
            syncCurrentTrackFromPlayer();
          } catch {
            //
          }
        }
      }, 500);
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying, syncCurrentTrackFromPlayer]);

  // Transport control methods
  const play = useCallback(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      try {
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch (e) {
        console.warn('Play error:', e);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      try {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } catch (e) {
        console.warn('Pause error:', e);
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Global Spacebar Hotkey: Pressing Space toggles Play/Pause for YouTube & Winamp in sync
  useEffect(() => {
    const handleGlobalSpaceHotkey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tag = target.tagName ? target.tagName.toUpperCase() : '';
          // Ignore spacebar if user is typing inside text inputs, textareas, selects, or editable fields
          if (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            target.isContentEditable ||
            target.getAttribute('contenteditable') === 'true'
          ) {
            return;
          }
        }
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleGlobalSpaceHotkey);
    return () => window.removeEventListener('keydown', handleGlobalSpaceHotkey);
  }, [togglePlay]);

  const stop = useCallback(() => {
    if (playerRef.current && playerRef.current.stopVideo) {
      try {
        playerRef.current.stopVideo();
        setIsPlaying(false);
        setCurrentTime(0);
      } catch (e) {
        console.warn('Stop error:', e);
      }
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (playerRef.current && playerRef.current.nextVideo) {
      try {
        playerRef.current.nextVideo();
        setTimeout(syncCurrentTrackFromPlayer, 300);
      } catch (e) {
        console.warn('Next track error:', e);
      }
    } else {
      const nextIdx = (currentTrackIndex + 1) % tracks.length;
      setCurrentTrackIndex(nextIdx);
    }
  }, [currentTrackIndex, syncCurrentTrackFromPlayer, tracks.length]);

  const prevTrack = useCallback(() => {
    if (playerRef.current && playerRef.current.previousVideo) {
      try {
        playerRef.current.previousVideo();
        setTimeout(syncCurrentTrackFromPlayer, 300);
      } catch (e) {
        console.warn('Prev track error:', e);
      }
    } else {
      const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      setCurrentTrackIndex(prevIdx);
    }
  }, [currentTrackIndex, syncCurrentTrackFromPlayer, tracks.length]);

  const selectTrack = useCallback(
    (index: number) => {
      setCurrentTrackIndex(index);
      if (playerRef.current && playerRef.current.playVideoAt) {
        try {
          playerRef.current.playVideoAt(index);
          setIsPlaying(true);
          setTimeout(syncCurrentTrackFromPlayer, 300);
        } catch (e) {
          console.warn('Select track error:', e);
        }
      }
    },
    [syncCurrentTrackFromPlayer]
  );

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (playerRef.current && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(vol);
      } catch (e) {
        console.warn('Set volume error:', e);
      }
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      try {
        playerRef.current.seekTo(seconds, true);
        setCurrentTime(seconds);
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
  }, []);

  const setEqBand = useCallback((bandIndex: number, value: number) => {
    setEqValues((prev) => {
      const next = [...prev];
      next[bandIndex] = value;
      return next;
    });
  }, []);

  const activePlaylist: PlaylistItem =
    playlists.find((p) => p.id === playlistId) || {
      id: playlistId,
      title: playlistId === DEFAULT_PLAYLIST_ID ? DEFAULT_PLAYLIST_TITLE : 'Custom YouTube Playlist',
      isCustom: playlistId !== DEFAULT_PLAYLIST_ID,
    };

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || null;

  const value: PlaylistContextType = {
    playlistId,
    playlists,
    activePlaylist,
    tracks,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    spectrumBars,
    eqValues,
    play,
    pause,
    togglePlay,
    stop,
    nextTrack,
    prevTrack,
    selectTrack,
    setVolume,
    seekTo,
    setEqBand,
    loadPlaylist,
    addCustomPlaylist,
    removeCustomPlaylist,
    resetToDefaultPlaylist,
    isAddPlaylistModalOpen,
    setIsAddPlaylistModalOpen,
  };

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
};
