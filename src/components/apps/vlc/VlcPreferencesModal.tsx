import React, { useState } from 'react';
import { VlcPreferences } from './types';
import { Sliders, Cpu, HardDrive, Wifi, Check, RotateCcw, X, ShieldCheck } from 'lucide-react';
import { playMouseClick } from '../../../utils/audio';

interface VlcPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: VlcPreferences;
  onSave: (newPrefs: VlcPreferences) => void;
}

export const VlcPreferencesModal: React.FC<VlcPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'input_codecs' | 'audio' | 'video' | 'cache'>('input_codecs');

  const [networkCaching, setNetworkCaching] = useState<number>(preferences.networkCachingMs || 20000);
  const [fileCaching, setFileCaching] = useState<number>(preferences.fileCachingMs || 5000);
  const [backBuffer, setBackBuffer] = useState<number>(preferences.backBufferRetainSec || 20);
  const [fastSeek, setFastSeek] = useState<boolean>(preferences.fastSeekEnabled ?? true);
  const [aspectRatio, setAspectRatio] = useState(preferences.aspectRatio || 'default');
  const [suppressErrors, setSuppressErrors] = useState(preferences.suppressErrorModal ?? false);

  if (!isOpen) return null;

  const handleSave = () => {
    playMouseClick();
    onSave({
      ...preferences,
      networkCachingMs: networkCaching,
      fileCachingMs: fileCaching,
      backBufferRetainSec: backBuffer,
      fastSeekEnabled: fastSeek,
      aspectRatio,
      suppressErrorModal: suppressErrors,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    playMouseClick();
    setNetworkCaching(20000);
    setFileCaching(5000);
    setBackBuffer(20);
    setFastSeek(true);
    setAspectRatio('default');
    setSuppressErrors(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none font-tahoma text-[11px]">
      <div className="w-[500px] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#0a64dc] to-[#2888f8] text-white px-2 py-1 flex items-center justify-between font-bold shadow-xs">
          <div className="flex items-center gap-1.5">
            <Sliders size={13} className="text-[#ff9900]" />
            <span>Simple Preferences</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              onClose();
            }}
            className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] active:bg-[#b0101d] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body Container */}
        <div className="p-2.5 flex gap-2">
          {/* Left Category List */}
          <div className="w-[125px] bg-[#fbfbf9] border border-[#7f9db9] p-1 flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                playMouseClick();
                setActiveTab('input_codecs');
              }}
              className={`text-left px-2 py-1.5 flex items-center gap-1.5 rounded-xs cursor-pointer ${
                activeTab === 'input_codecs' ? 'bg-[#316ac5] text-white font-bold' : 'hover:bg-[#e8e4d4] text-[#111]'
              }`}
            >
              <Wifi size={12} />
              <span>Input / Codecs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playMouseClick();
                setActiveTab('cache');
              }}
              className={`text-left px-2 py-1.5 flex items-center gap-1.5 rounded-xs cursor-pointer ${
                activeTab === 'cache' ? 'bg-[#316ac5] text-white font-bold' : 'hover:bg-[#e8e4d4] text-[#111]'
              }`}
            >
              <Cpu size={12} />
              <span>Deep Caching</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playMouseClick();
                setActiveTab('video');
              }}
              className={`text-left px-2 py-1.5 flex items-center gap-1.5 rounded-xs cursor-pointer ${
                activeTab === 'video' ? 'bg-[#316ac5] text-white font-bold' : 'hover:bg-[#e8e4d4] text-[#111]'
              }`}
            >
              <HardDrive size={12} />
              <span>Video & Render</span>
            </button>
          </div>

          {/* Right Settings Panel */}
          <div className="flex-1 bg-white border border-[#7f9db9] p-3 text-[#222]">
            {activeTab === 'input_codecs' && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-[#002266] border-b border-[#d4d0c8] pb-1">
                  Network & Streaming Caching (ms)
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-[11.5px]">Network Caching Buffer:</label>
                    <span className="font-mono text-[#0055ea] font-bold bg-[#e8f0fe] px-1.5 py-0.5 border border-[#7f9db9] rounded-xs">
                      {networkCaching} ms ({(networkCaching / 1000).toFixed(1)}s)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={60000}
                    step={1000}
                    value={networkCaching}
                    onChange={(e) => setNetworkCaching(Number(e.target.value))}
                    className="w-full h-2 bg-[#d8d4c4] accent-[#316ac5] cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>1s (VLC Default)</span>
                    <span className="text-[#0055ea] font-bold">20s (Recommended)</span>
                    <span>60s (Ultra Max)</span>
                  </div>
                </div>

                <div className="p-2 bg-[#f4f7fc] border border-[#b8cde8] rounded-xs text-[10.5px] leading-relaxed text-[#1a3a60]">
                  💡 <strong>Why 20 Seconds?</strong> Standard VLC default is 1000ms (1 sec), which causes stutter when seeking forward/backward. Increasing to <strong>20,000ms (20s)</strong> keeps media preloaded in memory, eliminating connection dropouts.
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold">File Caching (Disk/RAM):</label>
                    <span className="font-mono text-gray-700 font-bold">{fileCaching} ms</span>
                  </div>
                  <input
                    type="range"
                    min={300}
                    max={10000}
                    step={500}
                    value={fileCaching}
                    onChange={(e) => setFileCaching(Number(e.target.value))}
                    className="w-full h-2 bg-[#d8d4c4] accent-[#316ac5] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeTab === 'cache' && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-[#002266] border-b border-[#d4d0c8] pb-1">
                  Deep Memory Buffering & Seek Engine
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold">Back-Buffer Memory Retention:</label>
                    <span className="font-mono text-[#0055ea] font-bold bg-[#e8f0fe] px-1.5 py-0.5 border border-[#7f9db9] rounded-xs">
                      {backBuffer} seconds
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={backBuffer}
                    onChange={(e) => setBackBuffer(Number(e.target.value))}
                    className="w-full h-2 bg-[#d8d4c4] accent-[#316ac5] cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-500">
                    Keeps the past {backBuffer}s in memory so seeking backward is 100% instantaneous with 0 lag.
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={fastSeek}
                    onChange={(e) => setFastSeek(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <span>Enable Keyframe Fast Seek (align with stream I-frames)</span>
                </label>

                <div className="p-2 bg-[#e8f5e9] border border-[#a5d6a7] rounded-xs flex items-center gap-2 text-[#1b5e20] text-[10.5px]">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>HTTP 206 Partial Content (Byte-Range Request) acceleration active.</span>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-[#002266] border-b border-[#d4d0c8] pb-1">
                  Video & Display Options
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold">Default Aspect Ratio:</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="bg-[#fbfbf9] border border-[#7f9db9] px-2 py-1 text-[11px]"
                  >
                    <option value="default">Default (Native Video Ratio)</option>
                    <option value="16:9">16:9 (Widescreen HD)</option>
                    <option value="4:3">4:3 (Classic CRT Monitor)</option>
                    <option value="fill">Fill / Stretch Window</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={suppressErrors}
                    onChange={(e) => setSuppressErrors(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <span>Suppress stream fallback alerts</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#ece9d8] border-t border-[#d4d0c8] px-3 py-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1 bg-[#ece9d8] hover:bg-[#ded9c5] border border-[#7f9db9] rounded-xs flex items-center gap-1 cursor-pointer text-[#333]"
          >
            <RotateCcw size={11} />
            <span>Reset Preferences</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1 bg-[#316ac5] hover:bg-[#2255aa] active:bg-[#1a4488] text-white font-bold border border-[#002266] rounded-xs flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Check size={11} />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playMouseClick();
                onClose();
              }}
              className="px-3 py-1 bg-[#ece9d8] hover:bg-[#ded9c5] border border-[#7f9db9] rounded-xs cursor-pointer text-[#333]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
