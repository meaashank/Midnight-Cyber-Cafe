import React, { useState } from 'react';
import { MediaTrack, StreamStats } from './types';
import { VlcConeIcon } from './VlcConeIcon';
import { Info, Film, Activity } from 'lucide-react';

interface VlcMediaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: MediaTrack | null;
  currentTime: number;
  duration: number;
  stats: StreamStats;
  videoDimensions: { width: number; height: number } | null;
}

export const VlcMediaInfoModal: React.FC<VlcMediaInfoModalProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  duration,
  stats,
  videoDimensions,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'codec' | 'stats'>('general');

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none font-tahoma">
      <div className="w-[520px] bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-[#111] overflow-hidden text-[11px]">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <VlcConeIcon size={14} />
            <span>Current Media Information</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Strip */}
        <div className="bg-[#ece9d8] pt-2 px-2.5 border-b border-[#7f9db9] flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1 text-[11px] font-bold rounded-t-xs border-t-2 border-x cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white border-t-[#0055ea] border-x-[#7f9db9] text-[#002266]'
                : 'bg-[#dedac7] border-transparent text-gray-700 hover:bg-[#e5e1d0]'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('codec')}
            className={`px-3 py-1 text-[11px] font-bold rounded-t-xs border-t-2 border-x cursor-pointer ${
              activeTab === 'codec'
                ? 'bg-white border-t-[#0055ea] border-x-[#7f9db9] text-[#002266]'
                : 'bg-[#dedac7] border-transparent text-gray-700 hover:bg-[#e5e1d0]'
            }`}
          >
            Codec Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1 text-[11px] font-bold rounded-t-xs border-t-2 border-x cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-white border-t-[#0055ea] border-x-[#7f9db9] text-[#002266]'
                : 'bg-[#dedac7] border-transparent text-gray-700 hover:bg-[#e5e1d0]'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Content Pane */}
        <div className="p-3 bg-white min-h-[220px] max-h-[300px] overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-2">
              <div className="font-bold text-[#003399] border-b pb-1">Metadata</div>
              <div className="grid grid-cols-[100px_1fr] gap-1.5 text-[11px]">
                <div className="text-gray-500 font-bold">Title:</div>
                <div className="font-semibold text-black">{track?.title || 'No media loaded'}</div>

                <div className="text-gray-500 font-bold">Location:</div>
                <div className="text-[10px] font-mono break-all text-blue-800">
                  {track?.url || 'None'}
                </div>

                <div className="text-gray-500 font-bold">Type:</div>
                <div className="capitalize">{track?.type || 'N/A'} ({track?.format || 'N/A'})</div>

                <div className="text-gray-500 font-bold">Duration:</div>
                <div className="font-mono">{track?.durationStr || (duration ? `${Math.floor(duration)}s` : 'Unknown')}</div>

                <div className="text-gray-500 font-bold">File Size:</div>
                <div>{track?.size || 'Streaming / Unknown'}</div>

                <div className="text-gray-500 font-bold">MIME / Container:</div>
                <div className="font-mono text-[10px]">{track?.mimeType || (track?.format === 'video' ? 'video/mp4' : 'audio/mpeg')}</div>
              </div>
            </div>
          )}

          {activeTab === 'codec' && (
            <div className="space-y-3">
              {/* Stream 0: Video */}
              <div className="border border-[#7f9db9] p-2 rounded-xs bg-[#fbfbf9]">
                <div className="font-bold text-[#003399] text-[11px] mb-1 flex items-center gap-1">
                  <Film size={12} />
                  <span>Stream 0 (Video)</span>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-1 text-[10.5px]">
                  <span className="text-gray-500">Codec:</span>
                  <span className="font-semibold">{track?.codec || 'H264 - MPEG-4 AVC (part 10) (avc1)'}</span>

                  <span className="text-gray-500">Resolution:</span>
                  <span className="font-mono">
                    {videoDimensions
                      ? `${videoDimensions.width}x${videoDimensions.height}`
                      : track?.resolution || '1280x720 (Estimated)'}
                  </span>

                  <span className="text-gray-500">Frame Rate:</span>
                  <span className="font-mono">29.970000 fps</span>

                  <span className="text-gray-500">Decoded Format:</span>
                  <span className="font-mono">Planar 4:2:0 YUV</span>
                </div>
              </div>

              {/* Stream 1: Audio */}
              <div className="border border-[#7f9db9] p-2 rounded-xs bg-[#fbfbf9]">
                <div className="font-bold text-[#003399] text-[11px] mb-1 flex items-center gap-1">
                  <Activity size={12} />
                  <span>Stream 1 (Audio)</span>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-1 text-[10.5px]">
                  <span className="text-gray-500">Codec:</span>
                  <span className="font-semibold">{track?.audioCodec || 'MPEG AAC Audio (mp4a) / MP3'}</span>

                  <span className="text-gray-500">Channels:</span>
                  <span>{track?.audioChannels || 'Stereo'}</span>

                  <span className="text-gray-500">Sample Rate:</span>
                  <span className="font-mono">{track?.sampleRate || '44100 Hz'}</span>

                  <span className="text-gray-500">Bits per Sample:</span>
                  <span className="font-mono">32</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-3">
              <div className="border border-[#7f9db9] p-2 rounded-xs bg-[#fbfbf9]">
                <div className="font-bold text-[#003399] mb-1">Input / Demux</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px]">
                  <div>
                    <span className="text-gray-500">Read at media: </span>
                    <span className="font-mono font-bold">{formatBytes(stats.bytesRead)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Input bitrate: </span>
                    <span className="font-mono font-bold">{stats.inputBitrate} kb/s</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Demux bitrate: </span>
                    <span className="font-mono">{stats.demuxBitrate} kb/s</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#7f9db9] p-2 rounded-xs bg-[#fbfbf9]">
                <div className="font-bold text-[#003399] mb-1">Video Stream Performance</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px]">
                  <div>
                    <span className="text-gray-500">Decoded frames: </span>
                    <span className="font-mono font-bold text-green-700">{stats.decodedVideoFrames}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Displayed frames: </span>
                    <span className="font-mono font-bold">{stats.displayedFrames}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Lost frames: </span>
                    <span className="font-mono text-red-600">{stats.lostFrames}</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#7f9db9] p-2 rounded-xs bg-[#fbfbf9]">
                <div className="font-bold text-[#003399] mb-1">Audio Buffers</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px]">
                  <div>
                    <span className="text-gray-500">Decoded blocks: </span>
                    <span className="font-mono">{stats.decodedAudioBlocks}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Played buffers: </span>
                    <span className="font-mono">{stats.playedAudioBuffers}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 bg-[#ece9d8] border-t border-[#d4d0c8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] active:bg-[#c4bfad] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold text-[11px] cursor-pointer text-[#002266]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
