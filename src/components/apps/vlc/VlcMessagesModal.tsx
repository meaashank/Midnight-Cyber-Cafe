import React from 'react';
import { Terminal, Trash2, Copy, X } from 'lucide-react';
import { playMouseClick } from '../../../utils/audio';

export interface VlcLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
}

interface VlcMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: VlcLogEntry[];
  onClearLogs: () => void;
}

export const VlcMessagesModal: React.FC<VlcMessagesModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    playMouseClick();
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.module}] [${l.level.toUpperCase()}]: ${l.message}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none font-tahoma text-[11px]">
      <div className="w-[560px] h-[380px] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#0a64dc] to-[#2888f8] text-white px-2 py-1 flex items-center justify-between font-bold shadow-xs">
          <div className="flex items-center gap-1.5">
            <Terminal size={13} className="text-[#ffd700]" />
            <span>VLC - Messages & Stream Error Log</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              onClose();
            }}
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-[#f0ece0] border-b border-[#d4d0c8] px-2 py-1.5 flex items-center justify-between">
          <div className="text-[10.5px] text-gray-700">
            Log Verbosity: <strong className="text-[#002266]">Level 2 (Debug & Streaming)</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#ded9c5] border border-[#7f9db9] rounded-xs flex items-center gap-1 cursor-pointer text-[#222]"
            >
              <Copy size={11} />
              <span>Copy Log</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playMouseClick();
                onClearLogs();
              }}
              className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#ded9c5] border border-[#7f9db9] rounded-xs flex items-center gap-1 cursor-pointer text-[#900]"
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Log Viewer Console */}
        <div className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[10.5px] p-2.5 overflow-y-auto space-y-1 select-text">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic p-2">-- No logs or error messages recorded --</div>
          ) : (
            logs.map((log, idx) => {
              let color = 'text-[#d4d4d4]';
              if (log.level === 'error') color = 'text-[#f48771] font-bold';
              if (log.level === 'warn') color = 'text-[#cca700]';
              if (log.level === 'info') color = 'text-[#75beff]';
              if (log.level === 'debug') color = 'text-[#b5cea8]';

              return (
                <div key={idx} className="leading-tight break-all">
                  <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                  <span className="text-[#ce9178]">[{log.module}]</span>{' '}
                  <span className={color}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#ece9d8] border-t border-[#d4d0c8] px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">{logs.length} message entries</span>
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              onClose();
            }}
            className="px-4 py-1 bg-[#ece9d8] hover:bg-[#ded9c5] border border-[#7f9db9] rounded-xs cursor-pointer font-bold text-[#002266]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
