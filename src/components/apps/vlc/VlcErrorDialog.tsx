import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, Terminal, ExternalLink, X } from 'lucide-react';
import { VlcConeIcon } from './VlcConeIcon';
import { playMouseClick } from '../../../utils/audio';

export interface VlcErrorInfo {
  title: string;
  message: string;
  details?: string;
  url?: string;
  errorCode?: number | string;
  errorName?: string;
  statusCode?: number;
  timestamp?: string;
}

interface VlcErrorDialogProps {
  error: VlcErrorInfo | null;
  onClose: () => void;
  onPlayDemo?: () => void;
  onOpenMessages?: () => void;
  onDisableAutoPopups?: () => void;
}

export const VlcErrorDialog: React.FC<VlcErrorDialogProps> = ({
  error,
  onClose,
  onPlayDemo,
  onOpenMessages,
  onDisableAutoPopups,
}) => {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const handleCopyLog = () => {
    playMouseClick();
    const fullLog = `=== VLC STREAM DIAGNOSTIC LOG ===
Time: ${error.timestamp || new Date().toISOString()}
Title: ${error.title}
Error Summary: ${error.message}
Error Code: ${error.errorCode || 'N/A'} (${error.errorName || 'Generic Error'})
Stream URL: ${error.url || 'N/A'}
Diagnostic Details:
${error.details || 'No extended stack trace available'}
=================================`;

    navigator.clipboard?.writeText(fullLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none font-tahoma">
      <div className="w-[580px] max-w-[95vw] max-h-[90vh] bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_16px_48px_rgba(0,0,0,0.85)] text-[#111] flex flex-col overflow-hidden text-[11px]">
        {/* Windows XP / VLC Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2.5 py-1.5 flex items-center justify-between font-bold text-[11.5px] shrink-0">
          <div className="flex items-center gap-1.5">
            <VlcConeIcon size={15} />
            <span>{error.title || 'VLC (v0.8.6) - Stream Connection Error'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 bg-[#ece9d8] flex-1 overflow-y-auto space-y-3">
          {/* Header Banner */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d13438] flex items-center justify-center shrink-0 shadow-sm border border-[#9b1c1f]">
              <span className="text-white text-2xl font-bold font-mono">✕</span>
            </div>

            <div className="flex-1">
              <div className="font-bold text-[13px] text-[#900] leading-snug">
                {error.message}
              </div>
              <div className="text-[10.5px] text-gray-600 mt-0.5">
                VLC could not open this network stream. Detailed diagnostic logs below:
              </div>
            </div>
          </div>

          {/* Full Detailed Log Box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-gray-700">
              <span>Diagnostic Error Output:</span>
              <button
                type="button"
                onClick={handleCopyLog}
                className="px-2 py-0.5 bg-[#f0ece0] hover:bg-[#e2dcce] border border-[#7f9db9] rounded-xs flex items-center gap-1 cursor-pointer text-[#003399] font-normal text-[10px]"
              >
                {copied ? <Check size={11} className="text-green-700" /> : <Copy size={11} />}
                <span>{copied ? '✓ Copied Log!' : 'Copy Error Log'}</span>
              </button>
            </div>

            <div className="p-2.5 bg-[#1a1a1a] text-[#f1f1f1] border border-[#7f9db9] rounded-xs text-[10.5px] font-mono whitespace-pre-wrap select-text max-h-[160px] overflow-y-auto shadow-inner break-all leading-relaxed">
              {error.details || `${error.message}\nStream URL: ${error.url || 'N/A'}`}
            </div>
          </div>

          {/* Stream URL Box */}
          {error.url && (
            <div className="p-2 bg-white border border-[#d4d0c8] rounded-xs text-[10px] space-y-1 select-text break-all">
              <div className="text-gray-500 font-bold text-[9.5px] uppercase tracking-wider">
                Target Stream URL:
              </div>
              <div className="font-mono text-blue-900 bg-blue-50/50 p-1 rounded-xs border border-blue-200/60 break-all">
                {error.url}
              </div>
            </div>
          )}

          {/* Troubleshooting Advice */}
          <div className="p-2 bg-[#fffbf0] border border-[#e5d595] rounded-xs text-[10px] text-[#6d5000] space-y-0.5">
            <div className="font-bold flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-600 shrink-0" />
              <span>Common reasons for network stream errors:</span>
            </div>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-[9.5px] text-gray-700">
              <li>Cross-Origin (CORS) restriction or authorization token expired on remote host</li>
              <li>Unsupported audio/video codec (e.g. HEVC/H.265 in non-supported browser containers)</li>
              <li>Web page URL entered instead of direct media link (.mp4, .webm, .m3u8, .mp3, .ogg)</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-2.5 bg-[#dedac7] border-t border-[#c0bca8] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onOpenMessages && (
              <button
                type="button"
                onClick={() => {
                  playMouseClick();
                  onOpenMessages();
                }}
                className="px-2.5 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs flex items-center gap-1 text-[10.5px] font-bold text-[#003399] cursor-pointer"
                title="View complete real-time VLC subsystem messages log"
              >
                <Terminal size={12} />
                <span>VLC Messages (Ctrl+M)</span>
              </button>
            )}

            {onDisableAutoPopups && (
              <button
                type="button"
                onClick={onDisableAutoPopups}
                className="text-[10px] text-gray-600 hover:text-black underline cursor-pointer text-left"
              >
                Don't show dialogs
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPlayDemo && (
              <button
                type="button"
                onClick={onPlayDemo}
                className="px-3 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] active:bg-[#c4bfad] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold text-[11px] cursor-pointer text-emerald-800"
              >
                ▶ Play Working Demo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="px-4 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] active:bg-[#c4bfad] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold text-[11px] cursor-pointer text-[#002266]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
