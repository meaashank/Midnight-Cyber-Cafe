export type MediaSourceType = 'local' | 'network' | 'sample';
export type MediaFormat = 'video' | 'audio' | 'stream';

export interface MediaTrack {
  id: string;
  title: string;
  url: string;
  originalName?: string;
  type: MediaSourceType;
  format: MediaFormat;
  duration?: number;
  durationStr?: string;
  size?: string;
  mimeType?: string;
  resolution?: string;
  codec?: string;
  audioCodec?: string;
  audioChannels?: string;
  sampleRate?: string;
  addedAt: number;
  blobFile?: File;
}

export interface StreamStats {
  bytesRead: number;
  inputBitrate: number;
  demuxBitrate: number;
  decodedVideoFrames: number;
  displayedFrames: number;
  lostFrames: number;
  decodedAudioBlocks: number;
  playedAudioBuffers: number;
}

export interface VlcEngineState {
  currentTrack: MediaTrack | null;
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 125 (classic VLC can boost past 100%)
  isMuted: boolean;
  playbackRate: number; // 0.25, 0.5, 1.0, 1.25, 1.5, 2.0
  isBuffering: boolean;
  error: {
    title: string;
    message: string;
    details?: string;
    url?: string;
  } | null;
  videoDimensions: { width: number; height: number } | null;
  aspectRatio: 'default' | '16:9' | '4:3' | 'fill';
  stats: StreamStats;
}

export interface VlcPreferences {
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isShuffled: boolean;
  aspectRatio: 'default' | '16:9' | '4:3' | 'fill';
  suppressErrorModal?: boolean;
}

/**
 * PlayerEngine Interface:
 * Decouples the UI controls from the underlying playback implementation.
 * Currently uses HTML5 browser-native <video>/<audio> elements.
 * Can be plugged into a future WebAssembly libVLC or server-side transcoding stream without rewriting the UI.
 */
export interface PlayerEngine {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setAspectRatio: (ratio: 'default' | '16:9' | '4:3' | 'fill') => void;
}
