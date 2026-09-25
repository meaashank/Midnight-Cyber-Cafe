import React from 'react';
import { MediaTrack } from './types';
import { VlcConeIcon } from './VlcConeIcon';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FolderOpen,
  Globe,
  Repeat,
  Shuffle,
  Play,
  FileVideo,
  FileAudio,
} from 'lucide-react';

interface VlcPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: MediaTrack[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (id: string) => void;
  onMoveTrack: (index: number, direction: 'up' | 'down') => void;
  onClearPlaylist: () => void;
  onOpenNetworkModal: () => void;
  onTriggerFileInput: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  isShuffled: boolean;
  onToggleShuffle: () => void;
}

export const VlcPlaylistModal: React.FC<VlcPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist,
  currentIndex,
  onSelectTrack,
  onRemoveTrack,
  onMoveTrack,
  onClearPlaylist,
  onOpenNetworkModal,
  onTriggerFileInput,
  repeatMode,
  onToggleRepeat,
  isShuffled,
  onToggleShuffle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none font-tahoma">
      <div className="w-[580px] bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-[#111] overflow-hidden text-[11px] flex flex-col h-[420px]">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11.5px] shrink-0">
          <div className="flex items-center gap-1.5">
            <VlcConeIcon size={14} />
            <span>VLC media player - Playlist</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-1.5 bg-[#ece9d8] border-b border-[#7f9db9] flex items-center justify-between shrink-0 gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onTriggerFileInput}
              className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
              title="Add local file"
            >
              <FolderOpen size={12} className="text-amber-700" />
              <span>Add File...</span>
            </button>

            <button
              type="button"
              onClick={onOpenNetworkModal}
              className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
              title="Add network URL stream"
            >
              <Globe size={12} className="text-blue-700" />
              <span>Add URL...</span>
            </button>

            <div className="w-[1px] h-4 bg-gray-400 mx-1" />

            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => onMoveTrack(currentIndex, 'up')}
              className={`p-1 border rounded-xs ${
                currentIndex > 0
                  ? 'bg-[#ece9d8] hover:bg-[#d8d4c4] border-[#7f9db9] cursor-pointer'
                  : 'opacity-40 border-gray-300 cursor-not-allowed'
              }`}
              title="Move Up"
            >
              <ChevronUp size={12} />
            </button>

            <button
              type="button"
              disabled={currentIndex >= playlist.length - 1 || currentIndex < 0}
              onClick={() => onMoveTrack(currentIndex, 'down')}
              className={`p-1 border rounded-xs ${
                currentIndex >= 0 && currentIndex < playlist.length - 1
                  ? 'bg-[#ece9d8] hover:bg-[#d8d4c4] border-[#7f9db9] cursor-pointer'
                  : 'opacity-40 border-gray-300 cursor-not-allowed'
              }`}
              title="Move Down"
            >
              <ChevronDown size={12} />
            </button>

            <button
              type="button"
              disabled={playlist.length === 0 || currentIndex < 0}
              onClick={() => {
                if (playlist[currentIndex]) {
                  onRemoveTrack(playlist[currentIndex].id);
                }
              }}
              className={`px-2 py-0.5 border rounded-xs text-[10px] flex items-center gap-1 ${
                playlist.length > 0 && currentIndex >= 0
                  ? 'bg-[#ece9d8] hover:bg-[#f8d7da] border-[#7f9db9] cursor-pointer text-red-700'
                  : 'opacity-40 border-gray-300 cursor-not-allowed'
              }`}
              title="Remove selected item"
            >
              <Trash2 size={11} />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleRepeat}
              className={`px-2 py-0.5 border rounded-xs text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                repeatMode !== 'off'
                  ? 'bg-[#316ac5] text-white border-[#002266]'
                  : 'bg-[#ece9d8] hover:bg-[#d8d4c4] border-[#7f9db9]'
              }`}
              title={`Repeat Mode: ${repeatMode}`}
            >
              <Repeat size={11} />
              <span>{repeatMode === 'all' ? 'All' : repeatMode === 'one' ? '1' : 'Off'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleShuffle}
              className={`px-2 py-0.5 border rounded-xs text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                isShuffled
                  ? 'bg-[#316ac5] text-white border-[#002266]'
                  : 'bg-[#ece9d8] hover:bg-[#d8d4c4] border-[#7f9db9]'
              }`}
              title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
            >
              <Shuffle size={11} />
              <span>{isShuffled ? 'On' : 'Off'}</span>
            </button>

            <button
              type="button"
              onClick={onClearPlaylist}
              className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#e0dcd0] border border-[#7f9db9] rounded-xs text-[10px] text-gray-700 cursor-pointer"
              title="Clear all items from playlist"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Playlist Table Area */}
        <div className="flex-1 bg-white border border-[#7f9db9] m-2 overflow-y-auto font-tahoma shadow-inner">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#f0ece0] border-b border-[#7f9db9] sticky top-0 text-[10.5px] text-gray-700">
                <th className="p-1 w-8 text-center border-r border-[#d4d0c8]">#</th>
                <th className="p-1 border-r border-[#d4d0c8]">Title / Location</th>
                <th className="p-1 w-20 border-r border-[#d4d0c8]">Type</th>
                <th className="p-1 w-16 text-right pr-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {playlist.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                    Playlist is empty. Click "Add File..." or "Add URL..." to queue media.
                  </td>
                </tr>
              ) : (
                playlist.map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <tr
                      key={track.id}
                      onDoubleClick={() => onSelectTrack(idx)}
                      onClick={() => onSelectTrack(idx)}
                      className={`border-b border-[#eae6da] cursor-pointer ${
                        isCurrent
                          ? 'bg-[#316ac5] text-white font-semibold'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-[#e8f0fe]'
                          : 'bg-[#faf9f6] hover:bg-[#e8f0fe]'
                      }`}
                    >
                      <td className="p-1 text-center font-mono text-[10px]">
                        {isCurrent ? <Play size={10} className="inline fill-current" /> : idx + 1}
                      </td>
                      <td className="p-1 truncate max-w-[280px]">
                        <div className="flex items-center gap-1.5">
                          {track.format === 'video' ? (
                            <FileVideo size={12} className={isCurrent ? 'text-blue-200' : 'text-blue-600'} />
                          ) : (
                            <FileAudio size={12} className={isCurrent ? 'text-amber-200' : 'text-amber-600'} />
                          )}
                          <span className="truncate">{track.title}</span>
                        </div>
                      </td>
                      <td className="p-1 capitalize text-[10px]">
                        <span className={isCurrent ? 'text-blue-100' : 'text-gray-500'}>
                          {track.type} ({track.format})
                        </span>
                      </td>
                      <td className="p-1 text-right font-mono text-[10.5px] pr-2">
                        {track.durationStr || '--:--'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Status Bar */}
        <div className="p-2 bg-[#ece9d8] border-t border-[#c0bca8] flex items-center justify-between text-[10.5px] text-gray-700 shrink-0">
          <div>
            Total: <span className="font-bold">{playlist.length}</span> item(s)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] active:bg-[#c4bfad] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold text-[10.5px] cursor-pointer text-[#002266]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
