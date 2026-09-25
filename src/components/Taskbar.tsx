import React, { useState, useEffect, useRef } from 'react';
import { WindowInstance, AppId } from '../types';
import { playMouseClick, playCrtDegauss } from '../utils/audio';
import {
  Volume2,
  Activity,
  StickyNote as StickyIcon,
  Sparkles,
  Power,
  LogOut,
  Folder,
  Settings,
  HelpCircle,
  PlaySquare,
} from 'lucide-react';
import { VlcConeIcon } from './apps/vlc/VlcConeIcon';

interface TaskbarProps {
  windows: WindowInstance[];
  activeWindowId: string | null;
  onFocusWindow: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  onOpenApp: (appId: AppId) => void;
  onShowDesktop: () => void;
  onTriggerDegauss: () => void;
  onToggleStickyNote: () => void;
  onShutDownRequest: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  activeWindowId,
  onFocusWindow,
  onToggleMinimize,
  onOpenApp,
  onShowDesktop,
  onTriggerDegauss,
  onToggleStickyNote,
  onShutDownRequest,
}) => {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isClockDialogOpen, setIsClockDialogOpen] = useState(false);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const clockDialogRef = useRef<HTMLDivElement>(null);

  // Synchronized system username with AIM and browser cache
  const STORAGE_KEY = 'cyber_cafe_aim_my_username_v1';
  const [username, setUsername] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch {
      // ignore
    }
    return 'Guest_Cabin04';
  });

  const [isUserAccountModalOpen, setIsUserAccountModalOpen] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');

  // Keep username synced in real-time across components
  useEffect(() => {
    const handleUsernameChanged = (e: Event) => {
      const customEvt = e as CustomEvent<string>;
      if (customEvt.detail && typeof customEvt.detail === 'string' && customEvt.detail !== username) {
        setUsername(customEvt.detail);
      }
    };
    window.addEventListener('cybercafe_username_changed', handleUsernameChanged);
    return () => {
      window.removeEventListener('cybercafe_username_changed', handleUsernameChanged);
    };
  }, [username]);

  const handleSaveUsername = () => {
    const cleaned = newUsernameInput.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleaned) {
      setUsername(cleaned);
      try {
        localStorage.setItem(STORAGE_KEY, cleaned);
        window.dispatchEvent(new CustomEvent('cybercafe_username_changed', { detail: cleaned }));
      } catch {
        // ignore
      }
      playMouseClick();
    }
    setIsUserAccountModalOpen(false);
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setTimeStr(`${formattedHours}:${formattedMinutes} ${ampm}`);
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateClock();
    // Minute-level synchronized timer
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close start menu or clock dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        startMenuRef.current &&
        !startMenuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('#start-button')
      ) {
        setIsStartOpen(false);
      }
      if (
        clockDialogRef.current &&
        !clockDialogRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('#taskbar-clock-area')
      ) {
        setIsClockDialogOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* 1. Windows XP Luna Blue Taskbar */}
      <div
        id="xp-taskbar"
        className="fixed bottom-0 left-0 right-0 h-[30px] z-40 flex items-center justify-between select-none border-t border-[#0055ea]"
        style={{
          background: 'linear-gradient(180deg, #245edb 0%, #3f8cf3 9%, #245edb 18%, #245edb 92%, #1941a5 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Left Side: Start Button & Quick Launch */}
        <div className="flex items-center h-full">
          {/* Windows XP Green "start" Button */}
          <button
            id="start-button"
            type="button"
            onClick={() => {
              playMouseClick();
              setIsStartOpen(!isStartOpen);
            }}
            className={`h-full px-3 flex items-center gap-1.5 cursor-pointer rounded-r-md transition-all select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] ${
              isStartOpen
                ? 'bg-gradient-to-b from-[#2e7d32] via-[#388e3c] to-[#1b5e20] brightness-90'
                : 'bg-gradient-to-b from-[#388e3c] via-[#43a047] to-[#2e7d32] hover:brightness-110'
            }`}
            style={{
              clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)',
            }}
          >
            {/* Windows 4-color flag */}
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <div className="bg-[#f25022] rounded-[1px]" />
              <div className="bg-[#7fba00] rounded-[1px]" />
              <div className="bg-[#00a4ef] rounded-[1px]" />
              <div className="bg-[#ffb900] rounded-[1px]" />
            </div>
            <span
              className="text-white font-bold italic text-[14.5px] tracking-tight pr-1"
              style={{ textShadow: '1px 1px 2px #003300' }}
            >
              start
            </span>
          </button>

          {/* Quick Launch Separator & Icons */}
          <div className="h-[20px] border-r border-[#1941a5] mx-1 opacity-70" />
          <div className="flex items-center gap-1 px-1">
            <button
              type="button"
              onClick={onShowDesktop}
              title="Show Desktop"
              className="p-1 hover:bg-white/20 rounded text-xs cursor-pointer text-white"
            >
              🖥️
            </button>
            <button
              type="button"
              onClick={() => onOpenApp('internet_explorer')}
              title="Internet Explorer"
              className="p-1 hover:bg-white/20 rounded text-xs cursor-pointer"
            >
              🌐
            </button>
            <button
              type="button"
              onClick={() => onOpenApp('aim')}
              title="AOL Instant Messenger"
              className="p-1 hover:bg-white/20 rounded text-xs cursor-pointer"
            >
              🏃
            </button>
            <button
              type="button"
              onClick={() => onOpenApp('winamp')}
              title="Winamp"
              className="p-1 hover:bg-white/20 rounded text-xs cursor-pointer"
            >
              ⚡
            </button>
          </div>
          <div className="h-[20px] border-r border-[#1941a5] mx-1 opacity-70" />

          {/* Active / Open Window Tabs */}
          <div className="flex items-center gap-1 px-1 overflow-x-auto max-w-[50vw]">
            {windows
              .filter((w) => w.isOpen)
              .map((win) => {
                const isActive = activeWindowId === win.id && !win.isMinimized;
                return (
                  <button
                    key={win.id}
                    type="button"
                    onClick={() => {
                      playMouseClick();
                      if (isActive) {
                        onToggleMinimize(win.id);
                      } else {
                        onFocusWindow(win.id);
                      }
                    }}
                    className={`h-[24px] max-w-[150px] px-2 flex items-center gap-1.5 text-[11px] font-tahoma rounded-xs cursor-pointer truncate shadow-xs border ${
                      isActive
                        ? 'bg-[#1941a5] text-white border-[#002266] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] font-bold'
                        : 'bg-[#3c81f3] hover:bg-[#5293fb] text-white/90 border-[#1941a5]'
                    }`}
                  >
                    <span className="text-[12px] flex items-center shrink-0">
                      {win.appId === 'vlc' ? <VlcConeIcon size={14} /> : win.icon}
                    </span>
                    <span className="truncate">{win.title}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right Side: System Tray / Notification Area */}
        <div
          className="h-full px-2.5 flex items-center gap-2 text-white border-l border-[#0055ea] shadow-inner select-none"
          style={{
            background: 'linear-gradient(180deg, #0c59b2 0%, #1570d5 10%, #0e5dbb 85%, #0b4e9e 100%)',
          }}
        >
          {/* Quick Sticky Note Button */}
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              onToggleStickyNote();
            }}
            title="Add Sticky Note to Desktop"
            className="p-1 hover:bg-white/20 rounded cursor-pointer text-amber-300 flex items-center gap-0.5 text-[10px]"
          >
            <StickyIcon size={12} />
          </button>

          {/* Degauss Button */}
          <button
            type="button"
            onClick={() => {
              playCrtDegauss();
              onTriggerDegauss();
            }}
            title="CRT Degauss (Demagnetize Tube)"
            className="p-1 hover:bg-white/20 rounded cursor-pointer text-cyan-300 flex items-center gap-0.5 text-[10px]"
          >
            <Sparkles size={11} />
            <span className="font-mono text-[9px] hidden sm:inline">DEGAUSS</span>
          </button>

          {/* Network Flashing Icon */}
          <div className="flex items-center" title="Local Area Connection 100 Mbps (Cabin 04)">
            <Activity size={12} className="text-green-400 animate-pulse" />
          </div>

          {/* Volume */}
          <div className="flex items-center" title="Realtek AC'97 Audio">
            <Volume2 size={12} className="text-white" />
          </div>

          {/* Clock & Notification Tray Date */}
          <div
            id="taskbar-clock-area"
            onClick={() => {
              playMouseClick();
              setIsClockDialogOpen((prev) => !prev);
            }}
            title={dateStr || 'Date and Time'}
            className="flex flex-col items-end pl-1.5 pr-1 border-l border-white/20 font-tahoma text-[11px] leading-tight cursor-pointer hover:bg-white/10 rounded-xs py-0.5"
          >
            <span className="font-semibold tracking-tight">{timeStr || '10:48 PM'}</span>
          </div>
        </div>
      </div>

      {/* 1b. Authentic Windows XP Date and Time Properties Popup */}
      {isClockDialogOpen && (
        <div
          ref={clockDialogRef}
          className="fixed bottom-[34px] right-2 w-[280px] z-50 bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_8px_24px_rgba(0,0,0,0.6)] font-tahoma select-none text-[11px] text-[#111] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11px]">
            <span>Date and Time Properties</span>
            <button
              type="button"
              onClick={() => setIsClockDialogOpen(false)}
              className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-2.5 space-y-2 bg-[#ece9d8]">
            <div className="bg-white border border-[#7f9db9] p-2 rounded-xs shadow-inner">
              <div className="font-bold text-[#002266] text-[11.5px] border-b pb-1 mb-1 text-center">
                {dateStr}
              </div>
              <div className="text-center font-mono text-xl font-bold text-[#003399] py-1">
                {timeStr}
              </div>
              <div className="text-center text-[10px] text-gray-500">
                Local System Clock (Synced)
              </div>
            </div>

            <div className="border border-[#7f9db9] p-2 rounded-xs text-[10px] space-y-1 bg-[#fbfbf9]">
              <div className="font-bold text-[#003399]">Time Zone:</div>
              <div className="text-gray-700 font-mono text-[9.5px]">
                (GMT-07:00) Pacific Time (US & Canada)
              </div>
              <div className="text-gray-500 pt-1 text-[9px] border-t border-gray-200">
                Automatically adjust clock for daylight saving changes
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsClockDialogOpen(false)}
                className="px-3 py-0.5 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs font-bold text-[10.5px] cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Windows XP Start Menu Popup */}
      {isStartOpen && (
        <div
          ref={startMenuRef}
          className="fixed bottom-[30px] left-0 w-[340px] z-50 rounded-t-md overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-2 border-[#0055ea] flex flex-col font-tahoma select-none"
        >
          {/* User Profile Header */}
          <div className="h-[58px] bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] p-2 flex items-center justify-between border-b border-[#0033aa]">
            <div
              className="flex items-center gap-2.5 cursor-pointer hover:brightness-105"
              onClick={() => {
                setNewUsernameInput(username);
                setIsUserAccountModalOpen(true);
              }}
              title="Click to change account username"
            >
              <div className="w-10 h-10 rounded-sm bg-white p-0.5 border border-white/80 shadow-md flex items-center justify-center text-2xl">
                🦆
              </div>
              <div>
                <div className="text-white font-bold text-[13px] leading-tight flex items-center gap-1" style={{ textShadow: '1px 1px 2px #000' }}>
                  <span>{username === 'Guest_Cabin04' ? 'Cabin 04 (Guest)' : `Cabin 04 (${username})`}</span>
                </div>
                <div className="text-blue-100 text-[9.5px] font-mono">User: {username} · 192.168.1.104</div>
              </div>
            </div>

            {/* Prominent Change Username button */}
            <button
              type="button"
              onClick={() => {
                setNewUsernameInput(username);
                setIsUserAccountModalOpen(true);
              }}
              title="Change user account name (e.g. set to 'aashank')"
              className="px-2 py-1 bg-white/20 hover:bg-white text-white hover:text-[#002266] rounded border border-white/60 text-[10px] font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1 shrink-0"
            >
              <span>✏️</span>
              <span>Change User</span>
            </button>
          </div>

          {/* Split Two-Column Program Menu */}
          <div className="flex-1 flex bg-white text-[#111] text-[11px]">
            {/* Left White Column: Frequently Used Apps */}
            <div className="w-[190px] p-1.5 space-y-0.5 border-r border-[#95bdee] flex flex-col justify-between">
              <div className="space-y-0.5">
                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('internet_explorer');
                  }}
                  className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer group"
                >
                  <span className="text-xl">🌐</span>
                  <div>
                    <div className="font-bold">Internet</div>
                    <div className="text-[9.5px] text-gray-500 group-hover:text-blue-100">Internet Explorer</div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('aim');
                  }}
                  className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer group"
                >
                  <span className="text-xl">🏃</span>
                  <div>
                    <div className="font-bold">E-mail / Chat</div>
                    <div className="text-[9.5px] text-gray-500 group-hover:text-blue-100">AIM Messenger</div>
                  </div>
                </div>

                <div className="border-t border-[#d4d0c8] my-1" />

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('winamp');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <span className="text-lg">⚡</span>
                  <span>Winamp Player</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('vlc');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <VlcConeIcon size={18} />
                  <span>VLC Media Player</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('limewire');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <span className="text-lg">🍋</span>
                  <span>LimeWire P2P</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('cs_trainer');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <span className="text-lg">🎯</span>
                  <span>Counter-Strike 1.6</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('minesweeper');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <span className="text-lg">💣</span>
                  <span>Minesweeper</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('paint');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <span className="text-lg">🎨</span>
                  <span>Paint</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('notepad');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <span className="text-lg">📄</span>
                  <span>Notepad</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('sticky_note_app');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <span className="text-lg">📝</span>
                  <span>Sticky Notes Studio</span>
                </div>
              </div>

              {/* All Programs arrow */}
              <div className="pt-2 border-t border-[#d4d0c8] flex items-center justify-between px-2 font-bold cursor-pointer hover:bg-gray-100 py-1">
                <span>All Programs</span>
                <span>▶</span>
              </div>
            </div>

            {/* Right Light Blue Column: System Folders & Settings */}
            <div className="flex-1 bg-[#d3e5fa] p-1.5 space-y-1 text-[#001144] font-medium border-l border-white flex flex-col justify-between">
              <div className="space-y-1">
                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('my_computer');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer font-bold"
                >
                  <Folder size={14} className="text-amber-700" />
                  <span>My Documents</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('my_computer');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <Folder size={14} className="text-blue-700" />
                  <span>My Music</span>
                </div>

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onOpenApp('my_computer');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <Folder size={14} className="text-purple-700" />
                  <span>My Computer</span>
                </div>

                <div className="border-t border-[#a0c4f2] my-1" />

                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    onToggleStickyNote();
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <StickyIcon size={14} className="text-amber-600" />
                  <span>Sticky Note</span>
                </div>

                <div
                  onClick={() => {
                    playCrtDegauss();
                    onTriggerDegauss();
                    setIsStartOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                >
                  <Sparkles size={14} className="text-cyan-700" />
                  <span>CRT Degauss</span>
                </div>
              </div>

              <div className="space-y-0.5 pt-2 border-t border-[#a0c4f2]">
                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    setNewUsernameInput(username);
                    setIsUserAccountModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                  title="Open User Accounts to change username"
                >
                  <Settings size={13} />
                  <span>Control Panel (User Accounts)</span>
                </div>
                <div
                  onClick={() => {
                    setIsStartOpen(false);
                    setNewUsernameInput(username);
                    setIsUserAccountModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
                  title="Run command or change user profile"
                >
                  <PlaySquare size={13} />
                  <span>Run...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Shut Down & Log Off Bar */}
          <div className="h-[38px] bg-gradient-to-r from-[#0055ea] via-[#246edb] to-[#0055ea] px-3 flex items-center justify-end gap-3 text-white text-[11px] font-bold border-t border-[#0033aa]">
            <button
              type="button"
              onClick={() => {
                setIsStartOpen(false);
                onShutDownRequest();
              }}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/20 rounded cursor-pointer"
            >
              <LogOut size={13} />
              <span>Log Off</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsStartOpen(false);
                onShutDownRequest();
              }}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#d32f2f] hover:bg-[#e53935] rounded cursor-pointer shadow-xs"
            >
              <Power size={13} />
              <span>Turn Off Computer</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Windows XP Authentic User Accounts Modal */}
      {isUserAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 font-tahoma text-[11px] select-none p-3">
          <div className="w-[380px] bg-[#ece9d8] border-2 border-[#0055ea] rounded-t-sm shadow-[0_12px_36px_rgba(0,0,0,0.7)] overflow-hidden">
            {/* Titlebar */}
            <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2.5 py-1.5 flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5">
                <span>👤</span>
                <span>User Accounts — Change User Name</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUserAccountModalOpen(false)}
                className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 space-y-3 bg-[#ece9d8]">
              <div className="flex items-start gap-3 bg-white p-2.5 border border-[#7f9db9] rounded-xs shadow-inner">
                <div className="text-3xl p-1 bg-blue-100 rounded-sm">🦆</div>
                <div>
                  <div className="font-bold text-[#002266] text-xs">Cabin 04 Operator Account</div>
                  <div className="text-gray-600 text-[10.5px]">
                    Current Screen Name: <strong className="text-black font-mono">{username}</strong>
                  </div>
                  <div className="text-gray-500 text-[9.5px] mt-0.5">
                    This updates your system user account and AIM Messenger screen name.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">
                  Type a new name for this user account:
                </label>
                <input
                  type="text"
                  value={newUsernameInput}
                  autoFocus
                  maxLength={24}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveUsername();
                    else if (e.key === 'Escape') setIsUserAccountModalOpen(false);
                  }}
                  className="w-full bg-white border border-[#7f9db9] px-2 py-1 text-xs font-mono rounded-xs outline-none focus:border-[#0055ea] text-black"
                  placeholder="e.g. aashank"
                />
                <div className="text-[9.5px] text-[#003399] mt-1 italic">
                  Note: Name is case-sensitive (e.g. &quot;aashank&quot; unlocks Bhavya on AIM).
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d4d0c8]">
                <button
                  type="button"
                  onClick={handleSaveUsername}
                  className="px-4 py-1 bg-[#002266] hover:bg-[#003399] active:bg-[#001144] text-white font-bold rounded-xs cursor-pointer shadow-xs text-[11px]"
                >
                  Change Name
                </button>
                <button
                  type="button"
                  onClick={() => setIsUserAccountModalOpen(false)}
                  className="px-3 py-1 bg-[#ece9d8] hover:bg-[#ded9c5] border border-[#7f9db9] text-[#111] rounded-xs cursor-pointer text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
