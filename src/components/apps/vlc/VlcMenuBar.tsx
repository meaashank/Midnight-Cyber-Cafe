import React, { useState, useEffect, useRef } from 'react';

interface VlcMenuBarProps {
  isVisible?: boolean;
  onOpenFile: () => void;
  onOpenNetworkStream: () => void;
  onOpenPlaylist: () => void;
  onOpenMediaInfo: () => void;
  onOpenPreferences?: () => void;
  onOpenMessages?: () => void;
  onOpenAbout: () => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onFaster: () => void;
  onSlower: () => void;
  onNormalSpeed: () => void;
  onJumpForward: () => void;
  onJumpBackward: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onSetAspectRatio: (ratio: 'default' | '16:9' | '4:3' | 'fill') => void;
  currentAspectRatio: 'default' | '16:9' | '4:3' | 'fill';
  isPlaying: boolean;
  isMuted: boolean;
  showStatusBar: boolean;
  onToggleStatusBar: () => void;
  onClosePlayer?: () => void;
}

export const VlcMenuBar: React.FC<VlcMenuBarProps> = ({
  isVisible = true,
  onOpenFile,
  onOpenNetworkStream,
  onOpenPlaylist,
  onOpenMediaInfo,
  onOpenPreferences,
  onOpenMessages,
  onOpenAbout,
  onTogglePlay,
  onStop,
  onPrevious,
  onNext,
  onFaster,
  onSlower,
  onNormalSpeed,
  onJumpForward,
  onJumpBackward,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  onToggleFullscreen,
  onSetAspectRatio,
  currentAspectRatio,
  isPlaying,
  isMuted,
  showStatusBar,
  onToggleStatusBar,
  onClosePlayer,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleMouseEnter = (menuName: string) => {
    if (openMenu !== null) {
      setOpenMenu(menuName);
    }
  };

  const handleAction = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  return (
    <div
      ref={menuBarRef}
      className={`bg-[#ece9d8] border-b border-[#d4d0c8] px-1 py-0.5 flex items-center gap-0.5 text-[11px] font-tahoma text-[#111] select-none relative z-30 shrink-0 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100 max-h-12' : '-translate-y-full opacity-0 max-h-0 py-0 border-b-0 overflow-hidden pointer-events-none'
      }`}
    >
      {/* Media Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('media')}
          onMouseEnter={() => handleMouseEnter('media')}
          className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
            openMenu === 'media' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#d8d4c4]'
          }`}
        >
          <span className="underline">M</span>edia
        </button>
        {openMenu === 'media' && (
          <div className="absolute top-full left-0 mt-0.5 w-[200px] bg-white border border-[#7f9db9] shadow-[0_4px_12px_rgba(0,0,0,0.35)] py-0.5 text-[11px] z-50">
            <div
              onClick={() => handleAction(onOpenFile)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Open File...</span>
              <span className="text-gray-400">Ctrl+O</span>
            </div>
            <div
              onClick={() => handleAction(onOpenNetworkStream)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Open Network Stream...</span>
              <span className="text-gray-400">Ctrl+N</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-0.5" />
            <div
              onClick={() => handleAction(onOpenPlaylist)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Playlist</span>
              <span className="text-gray-400">Ctrl+L</span>
            </div>
            <div
              onClick={() => handleAction(onOpenMediaInfo)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Media Information</span>
              <span className="text-gray-400">Ctrl+I</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-0.5" />
            <div
              onClick={() => handleAction(onClosePlayer || onStop)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              Quit
            </div>
          </div>
        )}
      </div>

      {/* Playback Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('playback')}
          onMouseEnter={() => handleMouseEnter('playback')}
          className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
            openMenu === 'playback' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#d8d4c4]'
          }`}
        >
          <span className="underline">P</span>layback
        </button>
        {openMenu === 'playback' && (
          <div className="absolute top-full left-0 mt-0.5 w-[190px] bg-white border border-[#7f9db9] shadow-[0_4px_12px_rgba(0,0,0,0.35)] py-0.5 text-[11px] z-50">
            <div
              onClick={() => handleAction(onTogglePlay)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
              <span className="text-gray-400">Space</span>
            </div>
            <div
              onClick={() => handleAction(onStop)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Stop</span>
              <span className="text-gray-400">S</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-0.5" />
            <div
              onClick={() => handleAction(onPrevious)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Previous</span>
              <span className="text-gray-400">P</span>
            </div>
            <div
              onClick={() => handleAction(onNext)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Next</span>
              <span className="text-gray-400">N</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-0.5" />
            <div
              onClick={() => handleAction(onFaster)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              Faster
            </div>
            <div
              onClick={() => handleAction(onSlower)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              Slower
            </div>
            <div
              onClick={() => handleAction(onNormalSpeed)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              Normal Speed (1.0x)
            </div>
            <div className="border-t border-[#d4d0c8] my-0.5" />
            <div
              onClick={() => handleAction(onJumpForward)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Jump Forward 10s</span>
              <span className="text-gray-400">→</span>
            </div>
            <div
              onClick={() => handleAction(onJumpBackward)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Jump Backward 10s</span>
              <span className="text-gray-400">←</span>
            </div>
          </div>
        )}
      </div>

      {/* Audio Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('audio')}
          onMouseEnter={() => handleMouseEnter('audio')}
          className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
            openMenu === 'audio' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#d8d4c4]'
          }`}
        >
          <span className="underline">A</span>udio
        </button>
        {openMenu === 'audio' && (
          <div className="absolute top-full left-0 mt-0.5 w-[180px] bg-white border border-[#7f9db9] shadow-[0_4px_12px_rgba(0,0,0,0.35)] py-0.5 text-[11px] z-50">
            <div
              onClick={() => handleAction(onToggleMute)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>{isMuted ? '✓ Mute' : 'Mute'}</span>
              <span className="text-gray-400">M</span>
            </div>
            <div
              onClick={() => handleAction(onVolumeUp)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Volume Up</span>
              <span className="text-gray-400">↑</span>
            </div>
            <div
              onClick={() => handleAction(onVolumeDown)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Volume Down</span>
              <span className="text-gray-400">↓</span>
            </div>
          </div>
        )}
      </div>

      {/* Video Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('video')}
          onMouseEnter={() => handleMouseEnter('video')}
          className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
            openMenu === 'video' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#d8d4c4]'
          }`}
        >
          <span className="underline">V</span>ideo
        </button>
        {openMenu === 'video' && (
          <div className="absolute top-full left-0 mt-0.5 w-[180px] bg-white border border-[#7f9db9] shadow-[0_4px_12px_rgba(0,0,0,0.35)] py-0.5 text-[11px] z-50">
            <div
              onClick={() => handleAction(onToggleFullscreen)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Fullscreen</span>
              <span className="text-gray-400">F</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-0.5" />
            <div className="px-4 py-0.5 text-[10px] text-gray-500 font-bold">Aspect Ratio</div>
            <div
              onClick={() => handleAction(() => onSetAspectRatio('default'))}
              className="px-5 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              {currentAspectRatio === 'default' ? '✓ ' : '  '}Default
            </div>
            <div
              onClick={() => handleAction(() => onSetAspectRatio('16:9'))}
              className="px-5 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              {currentAspectRatio === '16:9' ? '✓ ' : '  '}16:9
            </div>
            <div
              onClick={() => handleAction(() => onSetAspectRatio('4:3'))}
              className="px-5 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              {currentAspectRatio === '4:3' ? '✓ ' : '  '}4:3
            </div>
            <div
              onClick={() => handleAction(() => onSetAspectRatio('fill'))}
              className="px-5 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              {currentAspectRatio === 'fill' ? '✓ ' : '  '}Fill / Stretch
            </div>
          </div>
        )}
      </div>

      {/* Tools Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('tools')}
          onMouseEnter={() => handleMouseEnter('tools')}
          className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
            openMenu === 'tools' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#d8d4c4]'
          }`}
        >
          <span className="underline">T</span>ools
        </button>
        {openMenu === 'tools' && (
          <div className="absolute top-full left-0 mt-0.5 w-[190px] bg-white border border-[#7f9db9] shadow-[0_4px_12px_rgba(0,0,0,0.35)] py-0.5 text-[11px] z-50">
            <div
              onClick={() => handleAction(onOpenMediaInfo)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Media Information</span>
              <span className="text-gray-400">Ctrl+I</span>
            </div>
            <div
              onClick={() => handleAction(onOpenMediaInfo)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              Codec Information
            </div>
            <div
              onClick={() => handleAction(() => onOpenMessages && onOpenMessages())}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Messages (Error Log)</span>
              <span className="text-gray-400">Ctrl+M</span>
            </div>
            <div className="border-t border-[#d4d0c8] my-0.5" />
            <div
              onClick={() => handleAction(() => onOpenPreferences && onOpenPreferences())}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Preferences (Buffer & Cache)</span>
              <span className="text-gray-400">Ctrl+P</span>
            </div>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('view')}
          onMouseEnter={() => handleMouseEnter('view')}
          className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
            openMenu === 'view' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#d8d4c4]'
          }`}
        >
          <span className="underline">V</span>iew
        </button>
        {openMenu === 'view' && (
          <div className="absolute top-full left-0 mt-0.5 w-[170px] bg-white border border-[#7f9db9] shadow-[0_4px_12px_rgba(0,0,0,0.35)] py-0.5 text-[11px] z-50">
            <div
              onClick={() => handleAction(onOpenPlaylist)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer flex justify-between"
            >
              <span>Playlist</span>
              <span className="text-gray-400">Ctrl+L</span>
            </div>
            <div
              onClick={() => handleAction(onToggleStatusBar)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              {showStatusBar ? '✓ Status Bar' : '  Status Bar'}
            </div>
          </div>
        )}
      </div>

      {/* Help Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('help')}
          onMouseEnter={() => handleMouseEnter('help')}
          className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
            openMenu === 'help' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#d8d4c4]'
          }`}
        >
          <span className="underline">H</span>elp
        </button>
        {openMenu === 'help' && (
          <div className="absolute top-full left-0 mt-0.5 w-[200px] bg-white border border-[#7f9db9] shadow-[0_4px_12px_rgba(0,0,0,0.35)] py-0.5 text-[11px] z-50">
            <div
              onClick={() => handleAction(onOpenAbout)}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
            >
              About VLC media player...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
