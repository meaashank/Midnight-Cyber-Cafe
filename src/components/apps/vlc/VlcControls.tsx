import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  ListMusic,
  Sliders,
} from 'lucide-react';

interface VlcControlsProps {
  isVisible?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  bufferedEnd?: number;
  volume: number; // 0 to 125
  isMuted: boolean;
  playbackRate: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onJumpBackward?: () => void;
  onJumpForward?: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePlaylist: () => void;
  onFaster: () => void;
  onSlower: () => void;
  statusText: string;
  showStatusBar: boolean;
}

export const VlcControls: React.FC<VlcControlsProps> = ({
  isVisible = true,
  onMouseEnter,
  onMouseLeave,
  isPlaying,
  isPaused,
  currentTime,
  duration,
  bufferedEnd = 0,
  volume,
  isMuted,
  playbackRate,
  onTogglePlay,
  onStop,
  onPrevious,
  onNext,
  onJumpBackward,
  onJumpForward,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onTogglePlaylist,
  onFaster,
  onSlower,
  statusText,
  showStatusBar,
}) => {
  const [showRemaining, setShowRemaining] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const totalSecs = Math.floor(secs);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (h > 0) {
      return `${pad(h)}:${pad(remainingM)}:${pad(s)}`;
    }
    return `${pad(remainingM)}:${pad(s)}`;
  };

  const effectiveTime = isSeeking ? seekVal : currentTime;
  const progressPercent = duration > 0 ? (effectiveTime / duration) * 100 : 0;
  const effectiveBuffered = Math.max(effectiveTime, bufferedEnd);
  const bufferedPercent = duration > 0 ? Math.min(100, (effectiveBuffered / duration) * 100) : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekVal(val);
    if (!isSeeking) setIsSeeking(true);
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    onSeek(seekVal);
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`bg-[#ece9d8] border-t border-[#d4d0c8] select-none text-[#111] font-tahoma text-[11px] shrink-0 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100 max-h-40' : 'translate-y-full opacity-0 max-h-0 py-0 border-t-0 overflow-hidden pointer-events-none'
      }`}
    >
      {/* 1. Time Slider Bar */}
      <div className="px-2 pt-1 pb-0.5 flex items-center gap-2">
        <div className="relative flex-1 flex items-center group">
          {/* Custom Seek Track */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={effectiveTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            disabled={!duration}
            className="w-full h-2.5 bg-[#d8d4c4] rounded-none border border-[#7f9db9] appearance-none cursor-pointer accent-[#2266bb] focus:outline-none disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #316ac5 0%, #4a8bf5 ${progressPercent}%, #9bbce6 ${progressPercent}%, #9bbce6 ${bufferedPercent}%, #dcd8c8 ${bufferedPercent}%, #dcd8c8 100%)`,
            }}
          />
        </div>

        {/* Elapsed and Total / Remaining Time display */}
        <div
          onClick={() => setShowRemaining(!showRemaining)}
          title="Click to toggle elapsed / remaining time"
          className="font-mono text-[10.5px] tracking-tight shrink-0 px-1 py-0.5 bg-[#fbfbf9] border border-[#7f9db9] rounded-xs cursor-pointer text-[#002266] hover:bg-white min-w-[96px] text-center"
        >
          {formatTime(effectiveTime)} /{' '}
          {showRemaining && duration > 0
            ? `-${formatTime(Math.max(0, duration - effectiveTime))}`
            : formatTime(duration)}
        </div>
      </div>

      {/* 2. Classic Control Buttons Bar */}
      <div className="px-1.5 py-1 flex items-center justify-between gap-1 border-t border-[#f4f2e6]">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-0.5">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="w-7 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center justify-center rounded-xs cursor-pointer text-[#002266]"
          >
            {isPlaying ? (
              <Pause size={12} className="fill-current" />
            ) : (
              <Play size={12} className="fill-current text-[#ff6600]" />
            )}
          </button>

          {/* Stop Button */}
          <button
            type="button"
            onClick={onStop}
            title="Stop (S)"
            className="w-6 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center justify-center rounded-xs cursor-pointer text-gray-800"
          >
            <Square size={10} className="fill-current" />
          </button>

          {/* Previous Track */}
          <button
            type="button"
            onClick={onPrevious}
            title="Previous track (P)"
            className="w-6 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center justify-center rounded-xs cursor-pointer text-gray-700"
          >
            <SkipBack size={11} />
          </button>

          {/* Next Track */}
          <button
            type="button"
            onClick={onNext}
            title="Next track (N)"
            className="w-6 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center justify-center rounded-xs cursor-pointer text-gray-700"
          >
            <SkipForward size={11} />
          </button>

          <div className="w-[1px] h-4 bg-gray-400 mx-0.5" />

          {/* Jump Backward 10s */}
          <button
            type="button"
            onClick={onJumpBackward}
            title="Jump back 10 seconds (Left Arrow / Double-tap Left)"
            className="px-1.5 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center gap-0.5 rounded-xs cursor-pointer text-[#002266] font-bold text-[10px]"
          >
            <span>⏪</span>
            <span>10s</span>
          </button>

          {/* Jump Forward 10s */}
          <button
            type="button"
            onClick={onJumpForward}
            title="Jump forward 10 seconds (Right Arrow / Double-tap Right)"
            className="px-1.5 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center gap-0.5 rounded-xs cursor-pointer text-[#002266] font-bold text-[10px]"
          >
            <span>10s</span>
            <span>⏩</span>
          </button>

          <div className="w-[1px] h-4 bg-gray-400 mx-0.5" />

          {/* Slower */}
          <button
            type="button"
            onClick={onSlower}
            title="Play slower"
            className="w-6 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] flex items-center justify-center rounded-xs cursor-pointer text-gray-700"
          >
            <Rewind size={10} />
          </button>

          {/* Speed Indicator */}
          <div
            title="Playback Speed"
            className="px-1 text-[9.5px] font-mono text-gray-600 select-none min-w-[32px] text-center"
          >
            {playbackRate.toFixed(2)}x
          </div>

          {/* Faster */}
          <button
            type="button"
            onClick={onFaster}
            title="Play faster"
            className="w-6 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] flex items-center justify-center rounded-xs cursor-pointer text-gray-700"
          >
            <FastForward size={10} />
          </button>

          <div className="w-[1px] h-4 bg-gray-400 mx-0.5" />

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen (F)"
            className="w-6 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center justify-center rounded-xs cursor-pointer text-gray-700"
          >
            <Maximize2 size={11} />
          </button>

          {/* Playlist Toggle Button */}
          <button
            type="button"
            onClick={onTogglePlaylist}
            title="Toggle Playlist (Ctrl+L)"
            className="px-1.5 h-6 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#c9c4b0] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] active:border-t-[#7f9db9] active:border-l-[#7f9db9] active:border-b-white active:border-r-white flex items-center gap-1 rounded-xs cursor-pointer text-gray-700 text-[10px] font-bold"
          >
            <ListMusic size={11} />
            <span className="hidden sm:inline">Playlist</span>
          </button>
        </div>

        {/* Right: Volume & Mute */}
        <div className="flex items-center gap-1.5 pr-1">
          {/* Mute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            className="p-1 hover:bg-[#ded9c5] rounded-xs cursor-pointer text-[#002266]"
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={13} className="text-red-600" />
            ) : volume < 50 ? (
              <Volume1 size={13} />
            ) : (
              <Volume2 size={13} />
            )}
          </button>

          {/* Volume Slider: 0 - 125% (VLC classic) */}
          <div className="flex items-center gap-1">
            <input
              type="range"
              min={0}
              max={125}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
              title={`Volume: ${isMuted ? 'Muted' : `${volume}%`}`}
              className="w-16 h-2 bg-[#d8d4c4] border border-[#7f9db9] appearance-none cursor-pointer accent-[#2266bb]"
              style={{
                background: `linear-gradient(to right, #316ac5 0%, #316ac5 ${
                  isMuted ? 0 : (volume / 125) * 100
                }%, #dcd8c8 ${isMuted ? 0 : (volume / 125) * 100}%, #dcd8c8 100%)`,
              }}
            />
            <span className="font-mono text-[9.5px] text-gray-600 min-w-[28px] text-right">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Bar */}
      {showStatusBar && (
        <div className="px-2 py-0.5 bg-[#dfdbcc] border-t border-[#b8b4a4] flex items-center justify-between text-[10px] text-gray-700">
          <div className="truncate flex items-center gap-1.5 max-w-[70%]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying ? 'bg-green-500 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-gray-400'
              }`}
            />
            <span className="truncate">{statusText || 'Ready'}</span>
          </div>
          <div className="font-mono text-[9px] text-gray-500 shrink-0">
            {effectiveTime > 0 ? formatTime(effectiveTime) : 'VLC 0.8.6'}
          </div>
        </div>
      )}
    </div>
  );
};
