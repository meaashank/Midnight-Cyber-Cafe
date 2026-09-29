import React, { useState, useEffect, useRef } from 'react';
import { usePlaylist } from '../PlaylistProvider';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  Disc,
  ListMusic,
  Plus,
  Settings2,
  Star,
  ExternalLink,
} from 'lucide-react';
import { playMouseClick, playWindowsBalloon } from '../../utils/audio';

export const WinampApp: React.FC = () => {
  const {
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
    stop,
    nextTrack,
    prevTrack,
    selectTrack,
    setVolume,
    seekTo,
    setEqBand,
    playlistId,
    playlists,
    activePlaylist,
    defaultPlaylistId,
    sourceType,
    spotifyEmbedUrl,
    setSpotifyController,
    loadPlaylist,
    setAsDefaultPlaylist,
    setIsAddPlaylistModalOpen,
  } = usePlaylist();

  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showEq, setShowEq] = useState(false);
  const [showSpotifyEmbed, setShowSpotifyEmbed] = useState(true);
  const [isIframeApiLoaded, setIsIframeApiLoaded] = useState(false);

  const spotifyHostRef = useRef<HTMLDivElement>(null);
  const isControllerInitializedRef = useRef(false);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCurrentDefault = playlistId === defaultPlaylistId;
  const isSpotify =
    sourceType === 'spotify' ||
    activePlaylist.source === 'spotify' ||
    playlistId.startsWith('spotify_');

  // Spotify Iframe API Controller initialization
  useEffect(() => {
    if (!isSpotify) return;

    let isMounted = true;

    const initController = () => {
      const IFrameAPI = window.SpotifyIFrameAPI;
      const hostEl = spotifyHostRef.current;
      if (!IFrameAPI || !hostEl || isControllerInitializedRef.current) return;

      const uri =
        activePlaylist.spotifyUri ||
        `spotify:playlist:${playlistId.replace('spotify_', '')}`;
      const options = {
        uri,
        width: '100%',
        height: 152,
      };

      try {
        IFrameAPI.createController(hostEl, options, (controller: any) => {
          if (!isMounted) return;
          isControllerInitializedRef.current = true;
          setIsIframeApiLoaded(true);
          window.spotifyEmbedController = controller;
          setSpotifyController?.(controller);

          controller.addListener('playback_update', (e: any) => {
            const { isPaused, position, duration: dur } = e.data || {};
            if (typeof isPaused === 'boolean') {
              // Context will sync via window message listener as well
            }
          });

          controller.addListener('ready', () => {
            if (isMounted) {
              setIsIframeApiLoaded(true);
            }
          });
        });
      } catch (err) {
        console.warn('Failed to create Spotify embed controller:', err);
      }
    };

    // If Spotify Iframe API is already available on window
    if (window.SpotifyIFrameAPI) {
      initController();
    } else {
      // Register listener for Spotify Iframe API Ready
      const prevCallback = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
        window.SpotifyIFrameAPI = IFrameAPI;
        if (typeof prevCallback === 'function') {
          try {
            prevCallback(IFrameAPI);
          } catch {
            //
          }
        }
        if (isMounted) {
          initController();
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isSpotify, activePlaylist, playlistId, setSpotifyController]);

  // Winamp Transport Controls (Guaranteed user gesture execution for Spotify)
  const handlePlay = () => {
    playMouseClick();
    // 1. Fire Provider state and postMessage dispatch
    play();

    // 2. Direct user-gesture execution on active controller or iframes
    if (isSpotify) {
      const ctrl = window.spotifyEmbedController;
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
          console.warn('Error invoking Spotify controller play:', e);
        }
      }

      // Direct postMessage to any Spotify iframe
      const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="spotify.com"]');
      iframes.forEach((frame) => {
        try {
          frame.contentWindow?.postMessage({ command: 'resume' }, '*');
          frame.contentWindow?.postMessage({ command: 'play' }, '*');
          frame.contentWindow?.postMessage({ command: 'toggle' }, '*');
          frame.contentWindow?.postMessage(JSON.stringify({ command: 'resume' }), '*');
          frame.contentWindow?.postMessage(JSON.stringify({ command: 'play' }), '*');
          frame.contentWindow?.postMessage(JSON.stringify({ command: 'toggle' }), '*');
        } catch {
          //
        }
      });
    }
  };

  const handlePause = () => {
    playMouseClick();
    pause();

    if (isSpotify) {
      const ctrl = window.spotifyEmbedController;
      if (ctrl) {
        try {
          if (typeof ctrl.pause === 'function') {
            ctrl.pause();
          } else if (typeof ctrl.togglePlay === 'function') {
            ctrl.togglePlay();
          }
        } catch (e) {
          console.warn('Error invoking Spotify controller pause:', e);
        }
      }

      const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="spotify.com"]');
      iframes.forEach((frame) => {
        try {
          frame.contentWindow?.postMessage({ command: 'pause' }, '*');
          frame.contentWindow?.postMessage({ command: 'toggle' }, '*');
          frame.contentWindow?.postMessage(JSON.stringify({ command: 'pause' }), '*');
          frame.contentWindow?.postMessage(JSON.stringify({ command: 'toggle' }), '*');
        } catch {
          //
        }
      });
    }
  };

  const handleStop = () => {
    playMouseClick();
    stop();

    if (isSpotify) {
      const ctrl = window.spotifyEmbedController;
      if (ctrl) {
        try {
          ctrl.pause?.();
          ctrl.seek?.(0);
        } catch (e) {
          console.warn(e);
        }
      }

      const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="spotify.com"]');
      iframes.forEach((frame) => {
        try {
          frame.contentWindow?.postMessage({ command: 'pause' }, '*');
          frame.contentWindow?.postMessage(JSON.stringify({ command: 'pause' }), '*');
        } catch {
          //
        }
      });
    }
  };

  const handleNext = () => {
    playMouseClick();
    nextTrack();
  };

  const handlePrev = () => {
    playMouseClick();
    prevTrack();
  };

  return (
    <div className="w-full h-full bg-[#1b1c20] text-[#00ff00] font-mono text-[10px] flex flex-col p-1.5 select-none overflow-y-auto">
      {/* Winamp Main Player Head Unit */}
      <div className="bg-gradient-to-b from-[#3a3f47] via-[#24272c] to-[#121315] border-2 border-[#555a64] rounded-xs p-2 shadow-inner">
        {/* Top Header & Track Marquee Screen */}
        <div className="bg-[#000000] border border-[#333a44] p-1.5 rounded-xs flex items-center justify-between mb-2">
          {/* Animated 8-band Green LED Spectrum Analyzer */}
          <div className="flex items-end gap-1 h-7 w-24 bg-[#080808] p-0.5 border border-[#222]">
            {spectrumBars.map((bar, idx) => (
              <div
                key={idx}
                className="w-2.5 bg-gradient-to-t from-[#00aa00] via-[#88ff00] to-[#ffff00] rounded-xs transition-all duration-75"
                style={{ height: `${isPlaying ? Math.max(8, bar) : 5}%` }}
              />
            ))}
          </div>

          {/* Marquee Track Title Display */}
          <div className="flex-1 px-2 overflow-hidden">
            <div className="text-[#00ff44] text-[11px] font-pixel truncate tracking-wider flex items-center gap-1.5">
              {isSpotify ? (
                <span className="text-emerald-400 font-bold">🟢 [SPOTIFY]</span>
              ) : (
                <span className="text-red-400 font-bold">🔴 [YOUTUBE]</span>
              )}
              <span className="truncate">
                {isPlaying
                  ? `▶ ${currentTrackIndex + 1}. ${currentTrack?.artist || 'Unknown'} - ${currentTrack?.title || 'Track'}`
                  : isLoading
                  ? `⌛ CONNECTING TO [${activePlaylist.title.toUpperCase()}]...`
                  : `❚❚ WINAMP 2.91 - [${currentTrackIndex + 1}/${tracks.length}] ${currentTrack?.title || 'IDLE'}`}
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-[#00cc33] font-pixel mt-0.5">
              <span className="truncate max-w-[140px] text-gray-400 flex items-center gap-1">
                {isCurrentDefault && <Star size={8} className="text-amber-400 fill-amber-400 shrink-0" />}
                <span className="truncate">{activePlaylist.title}</span>
              </span>
              <span className="text-yellow-400 font-bold">
                {isSpotify ? (isPlaying ? 'SPOTIFY PLAYING' : 'SPOTIFY IDLE') : isPlaying ? 'STEREO LIVE' : isLoading ? 'BUFFERING' : 'IDLE'}
              </span>
              <span>
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : currentTrack?.duration || (isSpotify ? 'LIVE' : '3:30')}
              </span>
            </div>
          </div>
        </div>

        {/* Track Seek Progress Bar */}
        <div className="mb-2 px-0.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime || 0}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full h-1.5 bg-[#0a0a0a] accent-[#00ff44] rounded cursor-pointer"
          />
        </div>

        {/* Transport & Playback Controls */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {/* Main playback buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSpotify}
              title="Previous Track"
              className="p-1.5 bg-gradient-to-b from-[#555b66] to-[#2b2e34] hover:brightness-125 active:brightness-75 border border-white/30 rounded-xs text-white cursor-pointer shadow-xs disabled:opacity-40"
            >
              <SkipBack size={10} />
            </button>
            <button
              type="button"
              onClick={handlePlay}
              title="Play Winamp (Space)"
              className={`p-1.5 bg-gradient-to-b from-[#555b66] to-[#2b2e34] hover:brightness-125 active:brightness-75 border border-white/30 rounded-xs cursor-pointer shadow-xs ${
                isPlaying ? 'text-[#00ff66] border-green-500' : 'text-white'
              }`}
            >
              <Play size={10} fill={isPlaying ? '#00ff66' : 'currentColor'} />
            </button>
            <button
              type="button"
              onClick={handlePause}
              title="Pause Winamp (Space)"
              className="p-1.5 bg-gradient-to-b from-[#555b66] to-[#2b2e34] hover:brightness-125 active:brightness-75 border border-white/30 rounded-xs text-white cursor-pointer shadow-xs"
            >
              <Pause size={10} />
            </button>
            <button
              type="button"
              onClick={handleStop}
              title="Stop"
              className="p-1.5 bg-gradient-to-b from-[#555b66] to-[#2b2e34] hover:brightness-125 active:brightness-75 border border-white/30 rounded-xs text-white cursor-pointer shadow-xs"
            >
              <Square size={10} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isSpotify}
              title="Next Track"
              className="p-1.5 bg-gradient-to-b from-[#555b66] to-[#2b2e34] hover:brightness-125 active:brightness-75 border border-white/30 rounded-xs text-white cursor-pointer shadow-xs disabled:opacity-40"
            >
              <SkipForward size={10} />
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5 text-gray-300">
            <Volume2 size={11} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 h-1.5 bg-[#111] accent-[#00ff44] rounded cursor-pointer"
            />
          </div>

          {/* Toggle buttons for EQ and Playlist */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                playMouseClick();
                setShowEq(!showEq);
              }}
              className={`px-1.5 py-0.5 rounded-xs border text-[9px] cursor-pointer ${
                showEq ? 'bg-[#00ff44] text-black font-bold border-[#00cc33]' : 'bg-[#2b2e34] text-gray-300 border-gray-600'
              }`}
            >
              EQ
            </button>
            <button
              type="button"
              onClick={() => {
                playMouseClick();
                setShowPlaylist(!showPlaylist);
              }}
              className={`px-1.5 py-0.5 rounded-xs border text-[9px] cursor-pointer ${
                showPlaylist ? 'bg-[#00ff44] text-black font-bold border-[#00cc33]' : 'bg-[#2b2e34] text-gray-300 border-gray-600'
              }`}
            >
              PL
            </button>
          </div>
        </div>
      </div>

      {/* Optional Equalizer Panel */}
      {showEq && (
        <div className="mt-1 bg-gradient-to-b from-[#24272c] to-[#121315] border border-[#555a64] rounded-xs p-1.5">
          <div className="text-[9px] text-[#00ff44] font-pixel mb-1 flex justify-between">
            <span>WINAMP GRAPHIC EQUALIZER</span>
            <span>+12dB — 0 — -12dB</span>
          </div>
          <div className="flex justify-between items-center px-1">
            {['60', '170', '310', '600', '1K', '3K', '6K', '14K'].map((band, idx) => (
              <div key={band} className="flex flex-col items-center gap-1">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={eqValues[idx] || 0}
                  onChange={(e) => setEqBand(idx, Number(e.target.value))}
                  className="h-12 -rotate-90 w-12 accent-[#00ff44] bg-[#111] cursor-pointer"
                />
                <span className="text-[8px] text-gray-400 font-mono">{band}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spotify Embedded Live Player Integration (If Spotify active) */}
      {isSpotify && spotifyEmbedUrl && showSpotifyEmbed && (
        <div className="mt-1 bg-[#000000] border border-[#1db954] rounded-xs p-1 shadow-lg">
          <div className="flex items-center justify-between pb-1 px-1 text-[9px] text-emerald-400 font-pixel">
            <span className="flex items-center gap-1 font-bold">
              🟢 SPOTIFY EMBEDDED CONSOLE
            </span>
            <div className="flex items-center gap-2">
              <a
                href={
                  activePlaylist.canonicalUrl ||
                  `https://open.spotify.com/playlist/${playlistId.replace('spotify_', '')}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-white flex items-center gap-0.5 text-[8.5px]"
              >
                <span>OPEN IN SPOTIFY</span>
                <ExternalLink size={8} />
              </a>
            </div>
          </div>
          <div className="w-full rounded-xs overflow-hidden bg-black min-h-[152px] relative">
            {/* Spotify Iframe API Controller Host */}
            <div id="spotify-embed-controller-element" ref={spotifyHostRef} className="w-full" />

            {/* Standard Spotify Iframe Fallback */}
            {!isIframeApiLoaded && (
              <iframe
                id="spotify-active-embed-iframe"
                src={spotifyEmbedUrl}
                width="100%"
                height="152"
                title="Spotify Winamp Integration"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="border-0 rounded-xs absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Dynamic YouTube / Spotify Playlist Drawer */}
      {showPlaylist && (
        <div className="mt-1 flex-1 bg-[#000000] border border-[#3a3f47] p-1.5 rounded-xs flex flex-col justify-between">
          {/* Playlist Top Toolbar */}
          <div className="text-[9px] text-[#00ff44] font-pixel border-b border-[#222] pb-1 mb-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <ListMusic size={11} className="text-yellow-400 shrink-0" />
                <span className="truncate font-bold">
                  {isSpotify ? 'SPOTIFY:' : 'YOUTUBE:'} {activePlaylist.title.toUpperCase()}
                </span>
                {isCurrentDefault && (
                  <span className="px-1 py-0.2 bg-amber-500 text-black text-[8px] font-bold rounded-xs shrink-0 flex items-center gap-0.5">
                    <Star size={7} fill="currentColor" /> DEFAULT
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isCurrentDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      playMouseClick();
                      setAsDefaultPlaylist(playlistId);
                      playWindowsBalloon();
                    }}
                    className="px-1.5 py-0.5 bg-[#2b2e34] hover:bg-amber-900 text-amber-300 border border-amber-600 rounded-xs flex items-center gap-0.5 text-[8.5px] font-bold cursor-pointer"
                    title="Set this playlist as permanent default"
                  >
                    <Star size={8} className="text-amber-400" />
                    <span>SET DEFAULT</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    playMouseClick();
                    setIsAddPlaylistModalOpen(true);
                  }}
                  className="px-1.5 py-0.5 bg-[#2b2e34] hover:bg-[#3d424b] text-yellow-300 border border-yellow-600 rounded-xs flex items-center gap-1 text-[8.5px] font-bold cursor-pointer"
                  title="Add / Switch Playlists"
                >
                  <Plus size={9} />
                  <span>+ MANAGE PL</span>
                </button>
              </div>
            </div>

            {/* Playlist Quick Switcher Dropdown */}
            {playlists.length > 1 && (
              <div className="flex items-center gap-1 text-[8.5px] text-gray-400">
                <span>SWITCH:</span>
                <select
                  value={playlistId}
                  onChange={(e) => {
                    playMouseClick();
                    loadPlaylist(e.target.value);
                  }}
                  className="flex-1 bg-[#151515] text-[#00ff66] border border-[#333] rounded-xs px-1 py-0.5 font-mono text-[8.5px] focus:outline-hidden"
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.source === 'spotify' || pl.id.startsWith('spotify_') ? '🟢 [Spotify]' : '🔴 [YouTube]'}{' '}
                      {pl.title} {pl.id === defaultPlaylistId ? '★ (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Songs List */}
          <div className="space-y-0.5 overflow-y-auto max-h-44 divide-y divide-[#151515]">
            {tracks.map((track, idx) => (
              <div
                key={`${track.id}_${idx}`}
                onClick={() => {
                  playMouseClick();
                  selectTrack(idx);
                }}
                className={`flex items-center justify-between px-1.5 py-1 cursor-pointer rounded-xs text-[9.5px] font-pixel ${
                  currentTrackIndex === idx
                    ? 'bg-[#002244] text-[#00ff66] font-bold border-l-2 border-[#00ff44]'
                    : 'text-[#88bb88] hover:bg-[#111]'
                }`}
              >
                <div className="truncate pr-2 flex items-center gap-1.5">
                  <span className="text-gray-500 w-4 shrink-0 font-mono">{idx + 1}.</span>
                  {track.thumbnailUrl && (
                    <img
                      src={track.thumbnailUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-5 h-4 object-cover rounded-xs shrink-0 border border-gray-800"
                    />
                  )}
                  <span className="truncate">
                    {track.artist ? `${track.artist} - ` : ''}{track.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {currentTrackIndex === idx && isPlaying && (
                    <span className="text-[8px] bg-green-950 text-green-400 border border-green-700 px-1 rounded-xs">
                      PLAYING
                    </span>
                  )}
                  <span className="text-gray-500 font-mono text-[9px]">{track.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Winamp Playlist Action Bar & Hotkey Hint */}
          <div className="mt-2 pt-1.5 border-t border-[#222] flex items-center justify-between text-[8.5px] text-gray-400 font-pixel">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playMouseClick();
                  setIsAddPlaylistModalOpen(true);
                }}
                className="px-1.5 py-0.5 bg-[#1f2329] hover:bg-[#2e3440] text-gray-300 border border-[#444] rounded-xs cursor-pointer flex items-center gap-1"
              >
                <Settings2 size={9} />
                <span>LOAD LIST</span>
              </button>
              <span className="text-gray-500">HOTKEY: [SPACE] PLAY/PAUSE</span>
            </div>
            <div className="flex items-center gap-1 text-[#00ff44]">
              <Disc size={10} className={isPlaying ? 'animate-spin' : ''} />
              <span>{isSpotify ? 'SPOTIFY' : `${tracks.length} TRACKS`}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
