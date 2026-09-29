import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistContextType, YouTubeTrack, PlaylistItem } from '../types';
import { parseMediaInput, fetchSpotifyMetadata } from '../utils/mediaUrlParser';

export const USER_SPOTIFY_PLAYLIST_ID = 'spotify_4LttUvcLoTtv3Ue54lyqkI';
export const USER_SPOTIFY_PLAYLIST_TITLE = 'Forr aashii 🎀✨️';

export const USER_SPOTIFY_PLAYLIST: PlaylistItem = {
  id: USER_SPOTIFY_PLAYLIST_ID,
  title: USER_SPOTIFY_PLAYLIST_TITLE,
  isCustom: false,
  type: 'playlist',
  source: 'spotify',
  spotifyUri: 'spotify:playlist:4LttUvcLoTtv3Ue54lyqkI',
  canonicalUrl: 'https://open.spotify.com/playlist/4LttUvcLoTtv3Ue54lyqkI',
  embedUrl: 'https://open.spotify.com/embed/playlist/4LttUvcLoTtv3Ue54lyqkI?utm_source=generator&theme=0',
};

export const INITIAL_DEFAULT_PLAYLIST_ID = 'PLt4QqxffzV0D8YNJ0Xdh34CRifqctJ8ms';
export const INITIAL_DEFAULT_PLAYLIST_TITLE = 'Cabin 04: Classic Gaming & Lo-Fi Chill';

export const INITIAL_DEFAULT_PLAYLIST: PlaylistItem = {
  id: INITIAL_DEFAULT_PLAYLIST_ID,
  title: INITIAL_DEFAULT_PLAYLIST_TITLE,
  isCustom: false,
  type: 'playlist',
  source: 'youtube',
};

const SESSION_PLAYLISTS_KEY = 'cabin04_session_playlists';
const SESSION_ACTIVE_ID_KEY = 'cabin04_active_playlist_id';
const STORAGE_CUSTOM_DEFAULT_ID_KEY = 'cabin04_custom_default_playlist_id';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    onSpotifyIframeApiReady?: (IFrameAPI: any) => void;
    SpotifyIFrameAPI?: any;
    spotifyEmbedController?: any;
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

// Initial fallback track placeholders while live metadata loads
const INITIAL_FALLBACK_TRACKS: YouTubeTrack[] = [
  {
    id: 'spotify_live',
    title: 'Forr aashii 🎀✨️',
    artist: 'Spotify Stream',
    duration: 'Live',
    durationSec: 0,
  },
];

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User-customized default playlist ID (saved persistently in localStorage)
  const [defaultPlaylistId, setDefaultPlaylistIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_DEFAULT_ID_KEY);
      if (stored) return stored;
    } catch {
      // ignore
    }
    return USER_SPOTIFY_PLAYLIST_ID;
  });

  // 2. Playlists collection
  const [playlists, setPlaylists] = useState<PlaylistItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_PLAYLISTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasSpotify = parsed.some((p: PlaylistItem) => p.id === USER_SPOTIFY_PLAYLIST_ID);
          const hasYouTube = parsed.some((p: PlaylistItem) => p.id === INITIAL_DEFAULT_PLAYLIST_ID);
          let list = parsed;
          if (!hasSpotify) list = [USER_SPOTIFY_PLAYLIST, ...list];
          if (!hasYouTube) list = [...list, INITIAL_DEFAULT_PLAYLIST];
          return list;
        }
      }
    } catch {
      // ignore
    }
    return [USER_SPOTIFY_PLAYLIST, INITIAL_DEFAULT_PLAYLIST];
  });

  // 3. Active Playlist ID
  const [playlistId, setPlaylistId] = useState<string>(() => {
    try {
      const storedActive = sessionStorage.getItem(SESSION_ACTIVE_ID_KEY);
      if (storedActive) return storedActive;
      const customDefault = localStorage.getItem(STORAGE_CUSTOM_DEFAULT_ID_KEY);
      if (customDefault) return customDefault;
    } catch {
      // ignore
    }
    return USER_SPOTIFY_PLAYLIST_ID;
  });

  const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
  const [tracks, setTracks] = useState<YouTubeTrack[]>(INITIAL_FALLBACK_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(80);
  const [spectrumBars, setSpectrumBars] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [eqValues, setEqValues] = useState<number[]>([0, 2, 4, 1, -1, 3, 2, 0]);

  // Spotify integration state
  const [sourceType, setSourceType] = useState<'youtube' | 'spotify'>('spotify');
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState<string | null>(
    'https://open.spotify.com/embed/playlist/4LttUvcLoTtv3Ue54lyqkI?utm_source=generator&theme=0'
  );
  const [spotifyController, setSpotifyControllerState] = useState<any>(null);
  const spotifyControllerRef = useRef<any>(null);

  const playerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const isApiReadyRef = useRef<boolean>(false);
  const currentVideoDataRef = useRef<{ title: string; author: string; video_id: string } | null>(null);
  const currentTrackIndexRef = useRef<number>(0);

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

  // Expose controller setter
  const setSpotifyController = useCallback((ctrl: any) => {
    spotifyControllerRef.current = ctrl;
    setSpotifyControllerState(ctrl);
    window.spotifyEmbedController = ctrl;
  }, []);

  // PostMessage broadcaster to any Spotify iframes
  const sendSpotifyCommand = useCallback((cmd: 'toggle' | 'play' | 'pause' | 'resume') => {
    try {
      const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="spotify.com"]');
      iframes.forEach((frame) => {
        try {
          frame.contentWindow?.postMessage({ command: cmd }, '*');
          frame.contentWindow?.postMessage({ type: 'command', command: cmd }, '*');
          frame.contentWindow?.postMessage(JSON.stringify({ command: cmd }), '*');
          frame.contentWindow?.postMessage(JSON.stringify({ type: 'command', command: cmd }), '*');
        } catch {
          // ignore cross-origin security errors
        }
      });
    } catch {
      // ignore
    }
  }, []);

  // Listen to postMessage events from Spotify iframe
  useEffect(() => {
    const handleSpotifyMessage = (event: MessageEvent) => {
      if (!event.origin || !event.origin.includes('spotify.com')) return;
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }
        if (!data) return;

        const update = data.payload || data.data || data;
        if (
          data.type === 'playback_update' ||
          update.type === 'playback_update' ||
          typeof update.isPaused === 'boolean'
        ) {
          if (typeof update.isPaused === 'boolean') {
            setIsPlaying(!update.isPaused);
          }
          if (typeof update.position === 'number') {
            setCurrentTime(update.position / 1000);
          }
          if (typeof update.duration === 'number' && update.duration > 0) {
            setDuration(update.duration / 1000);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handleSpotifyMessage);
    return () => window.removeEventListener('message', handleSpotifyMessage);
  }, []);

  // Helper: Fetch oEmbed metadata for a single YouTube video or track
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
    for (let i = 0; i < Math.min(videoIds.length, 50); i++) {
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

  // Load a specified playlist into the player (Supports YouTube & Spotify)
  const loadPlaylist = useCallback(
    async (newPlaylistId: string) => {
      setPlaylistId(newPlaylistId);
      setIsLoading(true);
      setCurrentTrackIndex(0);
      setCurrentTime(0);

      // Check if this item is a Spotify item
      const item = playlists.find((p) => p.id === newPlaylistId);
      const isSpotify =
        item?.source === 'spotify' ||
        newPlaylistId.startsWith('spotify_') ||
        (item?.embedUrl && item.embedUrl.includes('spotify.com'));

      if (isSpotify) {
        setSourceType('spotify');
        const embedUrl =
          item?.embedUrl ||
          `https://open.spotify.com/embed/${item?.type || 'playlist'}/${newPlaylistId.replace(
            'spotify_',
            ''
          )}?utm_source=generator&theme=0`;
        setSpotifyEmbedUrl(embedUrl);

        // Pause YouTube player if active
        if (playerRef.current && playerRef.current.pauseVideo) {
          try {
            playerRef.current.pauseVideo();
          } catch {
            //
          }
        }

        // If Spotify controller is already initialized, switch to new URI
        const uri =
          item?.spotifyUri ||
          `spotify:${item?.type || 'playlist'}:${newPlaylistId.replace('spotify_', '')}`;
        const ctrl = spotifyControllerRef.current || window.spotifyEmbedController;
        if (ctrl?.loadUri) {
          try {
            ctrl.loadUri(uri);
          } catch (e) {
            console.warn('Error calling loadUri on controller:', e);
          }
        }

        setTracks([
          {
            id: newPlaylistId,
            title: item?.title || 'Spotify Playlist',
            artist: 'Spotify Stream',
            duration: 'Live',
            durationSec: 0,
          },
        ]);
        setIsPlaying(true);
        setIsLoading(false);
        return;
      }

      // YouTube stream handling
      setSourceType('youtube');
      setSpotifyEmbedUrl(null);
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
    [playlists, fetchPlaylistRss, syncCurrentTrackFromPlayer]
  );

  // Set any playlist as the persistent default playlist
  const setAsDefaultPlaylist = useCallback((targetId: string) => {
    setDefaultPlaylistIdState(targetId);
    try {
      localStorage.setItem(STORAGE_CUSTOM_DEFAULT_ID_KEY, targetId);
    } catch {
      // ignore
    }
  }, []);

  // Add custom playlist from YouTube or Spotify URL / ID
  const addCustomPlaylist = useCallback(
    async (
      input: string,
      customTitle?: string
    ): Promise<{ success: boolean; message?: string; playlist?: PlaylistItem }> => {
      const parsed = parseMediaInput(input);
      if (!parsed) {
        return {
          success: false,
          message: 'Invalid URL. Please enter a valid YouTube (playlist/video) or Spotify (playlist/album/track) link.',
        };
      }

      // Spotify Playlist / Album / Track handling
      if (parsed.source === 'spotify') {
        const spotifyKey = `spotify_${parsed.id}`;
        const existing = playlists.find((p) => p.id === spotifyKey || p.id === parsed.id);
        if (existing) {
          loadPlaylist(existing.id);
          return {
            success: true,
            playlist: existing,
            message: 'Switched to existing Spotify playlist.',
          };
        }

        let title = customTitle?.trim();
        let author = 'Spotify';
        let thumbnail: string | undefined;

        try {
          const meta = await fetchSpotifyMetadata(parsed.canonicalUrl || parsed.originalInput, parsed.type);
          if (!title) title = meta.title;
          author = meta.artist;
          thumbnail = meta.thumbnailUrl;
        } catch {
          if (!title) title = `Spotify ${parsed.type.toUpperCase()} (${parsed.id.slice(0, 8)})`;
        }

        const newPlaylistItem: PlaylistItem = {
          id: spotifyKey,
          title: title || `Spotify ${parsed.type}`,
          isCustom: true,
          source: 'spotify',
          type: parsed.type,
          spotifyUri: parsed.spotifyUri || `spotify:${parsed.type}:${parsed.id}`,
          embedUrl: parsed.embedUrl,
          canonicalUrl: parsed.canonicalUrl,
          addedAt: Date.now(),
        };

        setPlaylists((prev) => [newPlaylistItem, ...prev]);
        loadPlaylist(spotifyKey);

        return {
          success: true,
          playlist: newPlaylistItem,
          message: `Loaded Spotify ${parsed.type}: "${newPlaylistItem.title}"`,
        };
      }

      // YouTube Playlist / Video handling
      const existing = playlists.find((p) => p.id === parsed.id);
      if (existing) {
        loadPlaylist(existing.id);
        return {
          success: true,
          playlist: existing,
          message: 'Switched to existing YouTube playlist.',
        };
      }

      let title = customTitle?.trim();
      if (!title) {
        if (parsed.type === 'video') {
          const meta = await fetchVideoMetadata(parsed.id);
          title = `${meta.artist} - ${meta.title}`;
        } else {
          title = `YouTube Playlist (${parsed.id.slice(0, 8)}...)`;
        }
      }

      const newPlaylistItem: PlaylistItem = {
        id: parsed.id,
        title,
        isCustom: true,
        source: 'youtube',
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
      if (idToRemove === INITIAL_DEFAULT_PLAYLIST_ID || idToRemove === USER_SPOTIFY_PLAYLIST_ID) {
        return; // Prevent removing factory defaults
      }

      setPlaylists((prev) => prev.filter((p) => p.id !== idToRemove));

      // If removing the currently chosen default, reset default to factory
      if (defaultPlaylistId === idToRemove) {
        setDefaultPlaylistIdState(USER_SPOTIFY_PLAYLIST_ID);
        try {
          localStorage.removeItem(STORAGE_CUSTOM_DEFAULT_ID_KEY);
        } catch {
          // ignore
        }
      }

      if (playlistId === idToRemove) {
        loadPlaylist(USER_SPOTIFY_PLAYLIST_ID);
      }
    },
    [defaultPlaylistId, playlistId, loadPlaylist]
  );

  // Reset to default playlist
  const resetToDefaultPlaylist = useCallback(() => {
    loadPlaylist(defaultPlaylistId || USER_SPOTIFY_PLAYLIST_ID);
  }, [defaultPlaylistId, loadPlaylist]);

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
    if (isPlaying && sourceType === 'youtube') {
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
  }, [isPlaying, sourceType, syncCurrentTrackFromPlayer]);

  // Transport control methods
  const play = useCallback(() => {
    if (sourceType === 'spotify') {
      setIsPlaying(true);
      const ctrl = spotifyControllerRef.current || window.spotifyEmbedController;
      if (ctrl) {
        try {
          if (typeof ctrl.resume === 'function') {
            ctrl.resume();
          } else if (typeof ctrl.play === 'function') {
            ctrl.play();
          } else if (typeof ctrl.togglePlay === 'function') {
            ctrl.togglePlay();
          }
        } catch (e) {
          console.warn('Spotify controller play error:', e);
        }
      }
      sendSpotifyCommand('resume');
      sendSpotifyCommand('play');
      sendSpotifyCommand('toggle');
      return;
    }
    if (playerRef.current && playerRef.current.playVideo) {
      try {
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch (e) {
        console.warn('Play error:', e);
      }
    }
  }, [sourceType, sendSpotifyCommand]);

  const pause = useCallback(() => {
    if (sourceType === 'spotify') {
      setIsPlaying(false);
      const ctrl = spotifyControllerRef.current || window.spotifyEmbedController;
      if (ctrl) {
        try {
          if (typeof ctrl.pause === 'function') {
            ctrl.pause();
          } else if (typeof ctrl.togglePlay === 'function') {
            ctrl.togglePlay();
          }
        } catch (e) {
          console.warn('Spotify controller pause error:', e);
        }
      }
      sendSpotifyCommand('pause');
      sendSpotifyCommand('toggle');
      return;
    }
    if (playerRef.current && playerRef.current.pauseVideo) {
      try {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } catch (e) {
        console.warn('Pause error:', e);
      }
    }
  }, [sourceType, sendSpotifyCommand]);

  const togglePlay = useCallback(() => {
    if (sourceType === 'spotify') {
      const ctrl = spotifyControllerRef.current || window.spotifyEmbedController;
      if (ctrl) {
        try {
          if (typeof ctrl.togglePlay === 'function') {
            ctrl.togglePlay();
          } else if (isPlaying) {
            ctrl.pause?.();
          } else {
            ctrl.resume?.() || ctrl.play?.();
          }
        } catch (e) {
          console.warn('Spotify togglePlay error:', e);
        }
      }
      sendSpotifyCommand('toggle');
      setIsPlaying((prev) => !prev);
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, sourceType, play, pause, sendSpotifyCommand]);

  // Global Spacebar Hotkey: Pressing Space toggles Play/Pause for stream in sync
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
    if (sourceType === 'spotify') {
      setIsPlaying(false);
      setCurrentTime(0);
      const ctrl = spotifyControllerRef.current || window.spotifyEmbedController;
      if (ctrl) {
        try {
          ctrl.pause?.();
          ctrl.seek?.(0);
        } catch (e) {
          console.warn('Spotify stop error:', e);
        }
      }
      sendSpotifyCommand('pause');
      return;
    }
    if (playerRef.current && playerRef.current.stopVideo) {
      try {
        playerRef.current.stopVideo();
        setIsPlaying(false);
        setCurrentTime(0);
      } catch (e) {
        console.warn('Stop error:', e);
      }
    }
  }, [sourceType, sendSpotifyCommand]);

  const nextTrack = useCallback(() => {
    if (sourceType === 'spotify') return;
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
  }, [sourceType, currentTrackIndex, syncCurrentTrackFromPlayer, tracks.length]);

  const prevTrack = useCallback(() => {
    if (sourceType === 'spotify') return;
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
  }, [sourceType, currentTrackIndex, syncCurrentTrackFromPlayer, tracks.length]);

  const selectTrack = useCallback(
    (index: number) => {
      setCurrentTrackIndex(index);
      if (sourceType === 'youtube' && playerRef.current && playerRef.current.playVideoAt) {
        try {
          playerRef.current.playVideoAt(index);
          setIsPlaying(true);
          setTimeout(syncCurrentTrackFromPlayer, 300);
        } catch (e) {
          console.warn('Select track error:', e);
        }
      }
    },
    [sourceType, syncCurrentTrackFromPlayer]
  );

  const setVolume = useCallback(
    (vol: number) => {
      setVolumeState(vol);
      if (sourceType === 'youtube' && playerRef.current && playerRef.current.setVolume) {
        try {
          playerRef.current.setVolume(vol);
        } catch (e) {
          console.warn('Set volume error:', e);
        }
      }
    },
    [sourceType]
  );

  const seekTo = useCallback(
    (seconds: number) => {
      if (sourceType === 'spotify') {
        const ctrl = spotifyControllerRef.current || window.spotifyEmbedController;
        if (ctrl?.seek) {
          try {
            ctrl.seek(seconds);
            setCurrentTime(seconds);
          } catch (e) {
            console.warn('Spotify seek error:', e);
          }
        }
        return;
      }
      if (playerRef.current && playerRef.current.seekTo) {
        try {
          playerRef.current.seekTo(seconds, true);
          setCurrentTime(seconds);
        } catch (e) {
          console.warn('Seek error:', e);
        }
      }
    },
    [sourceType]
  );

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
      title:
        playlistId === INITIAL_DEFAULT_PLAYLIST_ID
          ? INITIAL_DEFAULT_PLAYLIST_TITLE
          : playlistId === USER_SPOTIFY_PLAYLIST_ID
          ? USER_SPOTIFY_PLAYLIST_TITLE
          : playlistId.startsWith('spotify_')
          ? 'Custom Spotify Playlist'
          : 'Custom YouTube Playlist',
      isCustom: playlistId !== INITIAL_DEFAULT_PLAYLIST_ID && playlistId !== USER_SPOTIFY_PLAYLIST_ID,
      source: playlistId.startsWith('spotify_') ? 'spotify' : 'youtube',
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
    defaultPlaylistId,
    sourceType,
    spotifyEmbedUrl,
    spotifyController,
    setSpotifyController,
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
    setAsDefaultPlaylist,
    addCustomPlaylist,
    removeCustomPlaylist,
    resetToDefaultPlaylist,
    isAddPlaylistModalOpen,
    setIsAddPlaylistModalOpen,
  };

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
};
