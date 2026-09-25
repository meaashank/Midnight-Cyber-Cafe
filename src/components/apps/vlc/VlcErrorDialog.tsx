import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { VlcConeIcon } from './VlcConeIcon';

interface VlcErrorDialogProps {
  error: {
    title: string;
    message: string;
    details?: string;
    url?: string;
  } | null;
  onClose: () => void;
  onPlayDemo?: () => void;
  onDisableAutoPopups?: () => void;
}

export const VlcErrorDialog: React.FC<VlcErrorDialogProps> = ({
  error,
  onClose,
  onPlayDemo,
  onDisableAutoPopups,
}) => {
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none font-tahoma">
      <div className="w-[460px] bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-[#111] overflow-hidden text-[11px]">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <VlcConeIcon size={14} />
            <span>{error.title || 'VLC media player - Error'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 bg-[#ece9d8] flex items-start gap-3">
          {/* Classic Windows/VLC Critical Stop Icon */}
          <div className="w-9 h-9 rounded-full bg-[#d13438] flex items-center justify-center shrink-0 shadow-sm border border-[#9b1c1f]">
            <span className="text-white text-xl font-bold font-mono">✕</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="font-bold text-[12px] text-[#900]">
              {error.message}
            </div>

            {error.details && (
              <div className="p-2 bg-white border border-[#7f9db9] rounded-xs text-[10px] text-gray-700 font-mono break-all leading-tight shadow-inner">
                {error.details}
              </div>
            )}

            {error.url && (
              <div className="text-[9.5px] text-gray-500 truncate" title={error.url}>
                Source: <span className="font-mono">{error.url}</span>
              </div>
            )}

            <div className="text-[10px] text-gray-600">
              VLC provides verified built-in clips that play instantly without network or codec errors.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#dedac7] border-t border-[#c0bca8] flex items-center justify-between gap-2">
          {onDisableAutoPopups ? (
            <button
              type="button"
              onClick={onDisableAutoPopups}
              className="text-[10px] text-gray-600 hover:text-black underline cursor-pointer text-left"
            >
              Don't show error dialogs
            </button>
          ) : <div />}

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
