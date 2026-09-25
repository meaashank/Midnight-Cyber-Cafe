export type AppId =
  | 'my_computer'
  | 'internet_explorer'
  | 'aim'
  | 'winamp'
  | 'vlc'
  | 'limewire'
  | 'minesweeper'
  | 'cs_trainer'
  | 'notepad'
  | 'paint'
  | 'control_panel'
  | 'sticky_notes_manager'
  | 'sticky_note_app'
  | 'file_viewer'
  | 'recycle_bin';

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  extraData?: Record<string, any>;
}

export interface StickyNote {
  id: string;
  text: string;
  color: 'yellow' | 'pink' | 'cyan' | 'green' | 'orange';
  position: { x: number; y: number };
  rotation: number; // slight realistic tilt in degrees e.g. -2.5 to 3
  isPinnedToDesktop: boolean;
  authorNote?: string;
  zIndex: number;
}

export interface AimBuddy {
  screenName: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  statusMessage?: string;
  avatarBg?: string;
  isUnread?: boolean;
}

export interface AimMessage {
  id: string;
  from: string; // 'me' or screenName
  text: string;
  time: string;
  isBuzz?: boolean;
}

export interface LimeWireItem {
  id: string;
  title: string;
  category: 'audio' | 'video' | 'software' | 'document';
  size: string;
  speed: string;
  status: 'downloading' | 'completed' | 'paused' | 'failed' | 'queued';
  progress: number;
  sources: number;
  eta: string;
}

export interface WinampTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  audioNotes?: string; // synthesis tune pattern
}

export interface YouTubeTrack {
  id: string; // YouTube video ID
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  thumbnailUrl?: string;
}

export interface PlaylistItem {
  id: string; // The YouTube playlist ID or single video ID
  title: string;
  isCustom?: boolean;
  type?: 'playlist' | 'video';
  itemCount?: number;
  addedAt?: number;
}

export interface PlaylistContextType {
  playlistId: string;
  playlists: PlaylistItem[];
  activePlaylist: PlaylistItem;
  tracks: YouTubeTrack[];
  currentTrackIndex: number;
  currentTrack: YouTubeTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  spectrumBars: number[];
  eqValues: number[];
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (index: number) => void;
  setVolume: (volume: number) => void;
  seekTo: (seconds: number) => void;
  setEqBand: (bandIndex: number, value: number) => void;
  // Playlist Management
  loadPlaylist: (playlistId: string) => void;
  addCustomPlaylist: (
    input: string,
    customTitle?: string
  ) => Promise<{ success: boolean; message?: string; playlist?: PlaylistItem }>;
  removeCustomPlaylist: (playlistId: string) => void;
  resetToDefaultPlaylist: () => void;
  isAddPlaylistModalOpen: boolean;
  setIsAddPlaylistModalOpen: (open: boolean) => void;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'txt' | 'doc' | 'mp3' | 'mp4' | 'avi' | 'wmv' | 'jpg' | 'exe' | 'zip' | 'html';
  size?: string;
  modified?: string;
  content?: string;
  subItems?: FileItem[];
}
