import React from 'react';
import { VlcConeIcon } from './VlcConeIcon';

interface VlcAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VlcAboutModal: React.FC<VlcAboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none font-tahoma">
      <div className="w-[450px] bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-[#111] overflow-hidden text-[11px]">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <VlcConeIcon size={14} />
            <span>About VLC media player</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 bg-white space-y-3">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
            <VlcConeIcon size={48} />
            <div>
              <div className="text-[15px] font-bold text-[#002266]">
                VLC media player
              </div>
              <div className="text-[11px] font-mono text-gray-700 font-bold">
                Version 3.0.21 "Vetinari" (Latest Release)
              </div>
              <div className="text-[10px] text-gray-500">
                Cyber Café Ultimate Edition · 2004 Classic Skin + Modern Core
              </div>
            </div>
          </div>

          <div className="text-[10.5px] text-gray-700 space-y-2 leading-relaxed">
            <p>
              VLC is a free and open-source cross-platform multimedia player and framework developed by the VideoLAN project.
            </p>
            <div className="p-2 bg-[#f4f3ee] border border-[#d4d0c8] rounded-xs text-[10px] space-y-1">
              <div className="font-bold text-[#003399]">Core Engine & Codec Capabilities:</div>
              <p>
                Equipped with modern hardware-accelerated video decoding (H.264/AVC, H.265/HEVC, VP9, AV1), 32-bit float WebAudio DSP, and a real-time FFmpeg stream transmuxer with automatic disconnection recovery and zero-latency seeking.
              </p>
              <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-mono text-gray-600">
                <span className="bg-white px-1.5 py-0.5 border border-gray-300 rounded-xs">MKV / MP4 / TS / AVI / FLV</span>
                <span className="bg-white px-1.5 py-0.5 border border-gray-300 rounded-xs">AAC / AC3 / MP3 / Opus / FLAC</span>
                <span className="bg-white px-1.5 py-0.5 border border-gray-300 rounded-xs">Auto-Reconnect Watchdog</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 text-center">
              Copyright © 1996-2024 VideoLAN and individual contributors.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 bg-[#ece9d8] border-t border-[#c0bca8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="px-5 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] active:bg-[#c4bfad] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold text-[11px] cursor-pointer text-[#002266]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
