import React, { useState } from 'react';
import { Globe, Play, X, AlertCircle } from 'lucide-react';
import { VlcConeIcon } from './VlcConeIcon';

interface VlcNetworkStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayStream: (url: string, title?: string) => void;
}

export const VlcNetworkStreamModal: React.FC<VlcNetworkStreamModalProps> = ({
  isOpen,
  onClose,
  onPlayStream,
}) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    const trimmed = streamUrl.trim();
    if (!trimmed) {
      setValidationError('Please enter a media stream URL.');
      return;
    }

    // Protocol check
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('rtsp://') ||
      lower.startsWith('rtmp://') ||
      lower.startsWith('mms://') ||
      lower.startsWith('udp://') ||
      lower.startsWith('dshow://')
    ) {
      setValidationError(
        `VLC could not open the stream directly: The '${lower.split(':')[0]}' protocol requires native libVLC network sockets and is not supported in client-side web browsers.`
      );
      return;
    }

    if (lower.includes('drive.google.com/file') || lower.includes('drive.google.com/open')) {
      setValidationError(
        'Google Drive sharing links (drive.google.com/file/d/...) are web pages, not direct streamable media. For large files or MKV videos, please download the file to your device and drag-and-drop it into VLC, or provide a direct MP4/WebM/MP3 streaming URL.'
      );
      return;
    }

    if (
      !lower.startsWith('http://') &&
      !lower.startsWith('https://') &&
      !lower.startsWith('blob:') &&
      !lower.startsWith('/')
    ) {
      setValidationError('URL must begin with http://, https://, or a valid path (/samples/...).');
      return;
    }

    onPlayStream(trimmed, streamTitle.trim() || undefined);
    onClose();
  };

  const handleQuickSelect = (url: string, title: string) => {
    setStreamUrl(url);
    setStreamTitle(title);
    setValidationError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none font-tahoma">
      <div className="w-[490px] bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_12px_32px_rgba(0,0,0,0.8)] text-[#111] overflow-hidden text-[11px]">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <VlcConeIcon size={14} />
            <span>Open Network Stream...</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Header (Classic VLC Open Media tabs) */}
        <div className="bg-[#ece9d8] pt-2 px-2.5 border-b border-[#7f9db9] flex gap-1">
          <div className="px-3 py-1 bg-white border-t-2 border-x border-t-[#0055ea] border-x-[#7f9db9] font-bold rounded-t-xs text-[#002266] flex items-center gap-1">
            <Globe size={12} className="text-blue-600" />
            <span>Network</span>
          </div>
          <div className="px-3 py-1 bg-[#dedac7] text-gray-500 rounded-t-xs border border-transparent">
            File
          </div>
          <div className="px-3 py-1 bg-[#dedac7] text-gray-500 rounded-t-xs border border-transparent">
            Disc
          </div>
          <div className="px-3 py-1 bg-[#dedac7] text-gray-500 rounded-t-xs border border-transparent">
            Capture Device
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-3 bg-white space-y-3">
          <div className="border border-[#7f9db9] p-2.5 rounded-xs bg-[#fbfbf9] space-y-2">
            <div className="font-bold text-[#003399] flex items-center gap-1">
              <span>Network Protocol</span>
            </div>
            <p className="text-[10px] text-gray-600 leading-tight">
              Please enter a network URL (HTTP, HTTPS progressive media like MP4, WebM, MP3, WAV, or compatible stream):
            </p>

            <div>
              <label className="block text-[10.5px] font-bold text-gray-800 mb-0.5">
                Network URL:
              </label>
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => {
                  setStreamUrl(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="https://example.com/stream.mp4"
                className="w-full px-2 py-1 bg-white border border-[#7f9db9] font-mono text-[11px] text-black focus:outline-none focus:border-[#0055ea] shadow-inner select-text"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-600 mb-0.5">
                Optional Title / Label:
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="e.g. Live Radio / High-Bitrate Video"
                className="w-full px-2 py-0.5 bg-white border border-[#7f9db9] text-[10.5px] text-black focus:outline-none focus:border-[#0055ea] select-text"
              />
            </div>

            {validationError && (
              <div className="p-1.5 bg-[#fff1f0] border border-[#ffccc7] text-[#a8071a] text-[10px] flex items-start gap-1.5 rounded-xs leading-snug">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Quick preset URLs for user convenience */}
          <div className="border border-[#d0cbb8] p-2 rounded-xs bg-[#f5f4ef] space-y-1">
            <div className="font-bold text-[10px] text-gray-700">Quick Test Streams:</div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    '/samples/cyber_cafe_sample.mp4',
                    'Cyber Café 2004 Intro Reel (MP4)'
                  )
                }
                className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[9.5px] cursor-pointer"
              >
                🎬 Cyber Café Reel (MP4)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
                    'Mozilla CC0 High-Definition Stream (MP4)'
                  )
                }
                className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[9.5px] cursor-pointer"
              >
                🌸 Mozilla CC0 Stream (MP4)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    'https://ice1.somafm.com/groovesalad-128-mp3',
                    'SomaFM Groove Salad (Live 24/7 Radio Stream)'
                  )
                }
                className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[9.5px] cursor-pointer"
              >
                📻 Live 24/7 Radio (MP3)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
                    'Open Web Media Stream (WebM / VP8)'
                  )
                }
                className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[9.5px] cursor-pointer"
              >
                🎥 WebM VP8 Stream
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    '/samples/retro_groove.mp3',
                    'Midnight Cyber Café Theme (MP3)'
                  )
                }
                className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[9.5px] cursor-pointer"
              >
                🎵 Retro Audio Sample (MP3)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-2.5 bg-[#ece9d8] border-t border-[#d4d0c8] flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-4 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] active:bg-[#c4bfad] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white font-bold text-[11px] flex items-center gap-1 cursor-pointer text-[#002266]"
          >
            <Play size={11} className="fill-current text-[#ff6600]" />
            <span>Play</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] active:bg-[#c4bfad] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] text-[11px] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
