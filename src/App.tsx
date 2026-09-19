import React, { useState, useEffect } from 'react';
import { WindowInstance, AppId, StickyNote, FileItem } from './types';
import { CrtEffects } from './components/CrtEffects';
import { Taskbar } from './components/Taskbar';
import { WindowFrame } from './components/WindowFrame';
import { DesktopIcon } from './components/DesktopIcon';
import { StickyNotes } from './components/StickyNotes';
import { BootScreen } from './components/BootScreen';
import { ShutdownScreen } from './components/ShutdownScreen';

// Software Apps
import { AimApp } from './components/apps/AimApp';
import { WinampApp } from './components/apps/WinampApp';
import { InternetExplorerApp } from './components/apps/InternetExplorerApp';
import { LimeWireApp } from './components/apps/LimeWireApp';
import { MyComputerApp } from './components/apps/MyComputerApp';
import { MinesweeperApp } from './components/apps/MinesweeperApp';
import { CounterStrikeTrainer } from './components/apps/CounterStrikeTrainer';
import { NotepadApp } from './components/apps/NotepadApp';
import { PaintApp } from './components/apps/PaintApp';
import { StickyNoteApp } from './components/apps/StickyNoteApp';
import { PlaylistProvider } from './components/PlaylistProvider';
import { MusicPlayerDock } from './components/MusicPlayerDock';
import { PlaylistManagerModal } from './components/PlaylistManagerModal';

import {
  playMouseClick,
  playCrtDegauss,
  playAimBuzz,
  playWindowsBalloon,
  playHddSeek,
} from './utils/audio';

// Default Windows on boot
const INITIAL_WINDOWS: WindowInstance[] = [
  {
    id: 'aim_main',
    appId: 'aim',
    title: 'AIM - Buddy List',
    icon: '🏃',
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    position: { x: 50, y: 40 },
    size: { width: 560, height: 420 },
  },
  {
    id: 'winamp_main',
    appId: 'winamp',
    title: 'Winamp - 2.91',
    icon: '⚡',
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    zIndex: 9,
    position: { x: 640, y: 40 },
    size: { width: 440, height: 400 },
  },
  {
    id: 'ie_main',
    appId: 'internet_explorer',
    title: 'Google - Microsoft Internet Explorer',
    icon: '🌐',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 8,
    position: { x: 120, y: 60 },
    size: { width: 780, height: 500 },
  },
  {
    id: 'limewire_main',
    appId: 'limewire',
    title: 'LimeWire PRO 4.10: Gnutella',
    icon: '🍋',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 7,
    position: { x: 180, y: 90 },
    size: { width: 680, height: 440 },
  },
  {
    id: 'my_computer_main',
    appId: 'my_computer',
    title: 'My Computer',
    icon: '💻',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 6,
    position: { x: 160, y: 80 },
    size: { width: 640, height: 420 },
  },
  {
    id: 'minesweeper_main',
    appId: 'minesweeper',
    title: 'Minesweeper',
    icon: '💣',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 5,
    position: { x: 300, y: 150 },
    size: { width: 280, height: 320 },
  },
  {
    id: 'cs_main',
    appId: 'cs_trainer',
    title: 'Counter-Strike 1.6 LAN Reflex Trainer',
    icon: '🎯',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 4,
    position: { x: 220, y: 100 },
    size: { width: 640, height: 440 },
  },
  {
    id: 'paint_main',
    appId: 'paint',
    title: 'untitled - Paint',
    icon: '🎨',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 3,
    position: { x: 200, y: 70 },
    size: { width: 600, height: 440 },
  },
  {
    id: 'notepad_main',
    appId: 'notepad',
    title: 'GTA_Vice_City_Cheats.txt - Notepad',
    icon: '📄',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 2,
    position: { x: 240, y: 120 },
    size: { width: 480, height: 340 },
  },
  {
    id: 'sticky_app_main',
    appId: 'sticky_note_app',
    title: 'Sticky Notes Studio 2004 (Cabin 04)',
    icon: '📝',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 4,
    position: { x: 240, y: 70 },
    size: { width: 720, height: 480 },
  },
];

// Authentic Classical Windows Sticky Notes on Desktop
const INITIAL_STICKY_NOTES: StickyNote[] = [
  {
    id: 'sticky_1',
    text: `CABIN 04 — Midnight Session\nTime: 10:15 PM - 12:15 AM\nRate: $2.00/hr (Prepaid $4.00)\n\n* Don't forget floppy disk\n* CS 1.6 tournament at 11:30!`,
    color: 'yellow',
    position: { x: 1060, y: 40 },
    rotation: -1.5,
    isPinnedToDesktop: true,
    authorNote: 'LAN Desk Pass',
    zIndex: 15,
  },
  {
    id: 'sticky_2',
    text: `GTA VICE CITY CHEATS:\n- ASPIRINE (Health)\n- PRECIOUSPROTECTION\n- NUTTERTOOLS (Heavy Guns)\n- PANZER (Tank)\n- SEAWAYS (Cars on water)`,
    color: 'pink',
    position: { x: 1080, y: 250 },
    rotation: 2.2,
    isPinnedToDesktop: true,
    authorNote: 'Cheat Sheet',
    zIndex: 16,
  },
  {
    id: 'sticky_3',
    text: `AIM Screen Names:\nxX_bhavya_core_Xx (bestie)\nHaloMaster (LAN partner)\nsk8rboi2004 (Tony Hawk)`,
    color: 'cyan',
    position: { x: 1070, y: 460 },
    rotation: -2.0,
    isPinnedToDesktop: true,
    authorNote: 'AIM Contacts',
    zIndex: 17,
  },
];

export default function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [isDegaussing, setIsDegaussing] = useState(false);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [isShuttingDownModal, setIsShuttingDownModal] = useState(false);

  const [windows, setWindows] = useState<WindowInstance[]>(INITIAL_WINDOWS);
  const [activeWindowId, setActiveWindowId] = useState<string | null>('aim_main');
  
  // Load persisted sticky notes from sessionStorage if available
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => {
    try {
      const saved = sessionStorage.getItem('cyber_cafe_sticky_notes');
      if (saved) {
        const parsed: StickyNote[] = JSON.parse(saved);
        // Ensure any existing stored sticky notes get migrated to the new creative username
        return parsed.map((note) => {
          if (note.text && (note.text.includes('Sarah') || note.text.includes('xXSarahXx'))) {
            return {
              ...note,
              text: note.text
                .replace(/xXSarahXx/g, 'xX_bhavya_core_Xx')
                .replace(/Sarah/g, 'bhavya'),
            };
          }
          return note;
        });
      }
    } catch {
      // ignore
    }
    return INITIAL_STICKY_NOTES;
  });

  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(25);

  // Sync sticky notes with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('cyber_cafe_sticky_notes', JSON.stringify(stickyNotes));
    } catch {
      // ignore
    }
  }, [stickyNotes]);

  // Guarantee browser window/document viewport is strictly pinned to 0,0
  useEffect(() => {
    const lockScroll = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const surface = document.getElementById('desktop-surface');
      if (surface) surface.scrollTop = 0;
    };
    lockScroll();
    window.addEventListener('resize', lockScroll);
    window.addEventListener('scroll', lockScroll, { passive: false });
    return () => {
      window.removeEventListener('resize', lockScroll);
      window.removeEventListener('scroll', lockScroll);
    };
  }, [isBooted]);

  // Easter egg keyboard sequence buffer
  const [keyBuffer, setKeyBuffer] = useState('');

  // Handle global shortcuts and disable context menu (anti-right click)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape or Alt+F4 -> Close active window
      if ((e.key === 'Escape' || (e.altKey && e.key === 'F4')) && activeWindowId) {
        e.preventDefault();
        closeWindow(activeWindowId);
        return;
      }

      // D key -> Degauss
      if (e.key === 'd' || e.key === 'D') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          triggerDegauss();
        }
      }
      // B key -> AIM Buzz
      if (e.key === 'b' || e.key === 'B') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          triggerBuzz();
        }
      }

      // Track cheat code sequences like IDDQD
      if (e.key.length === 1) {
        setKeyBuffer((prev) => {
          const next = (prev + e.key.toUpperCase()).slice(-10);
          if (next.endsWith('IDDQD')) {
            playWindowsBalloon();
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const triggerDegauss = () => {
    playCrtDegauss();
    setIsDegaussing(true);
    setTimeout(() => setIsDegaussing(false), 1100);
  };

  const triggerBuzz = () => {
    playAimBuzz();
    setIsBuzzing(true);
    setTimeout(() => setIsBuzzing(false), 700);
  };

  const focusWindow = (id: string) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setActiveWindowId(id);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZ } : w))
    );
  };

  const toggleMinimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  const closeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: false } : w))
    );
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const maximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const updateWindowPosition = (id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position: { x, y } } : w))
    );
  };

  const openApp = (appId: AppId, extraData?: Record<string, any>) => {
    playHddSeek();
    playMouseClick();
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      const nextZ = maxZIndex + 1;
      setMaxZIndex(nextZ);
      setActiveWindowId(existing.id);
      setWindows((prev) =>
        prev.map((w) =>
          w.id === existing.id
            ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZ, extraData: extraData || w.extraData }
            : w
        )
      );
    }
  };

  const showDesktop = () => {
    playMouseClick();
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
    setActiveWindowId(null);
  };

  // Sticky Note handlers
  const updateStickyNote = (id: string, updates: Partial<StickyNote>) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const addStickyNote = () => {
    playMouseClick();
    const colors: ('yellow' | 'pink' | 'cyan' | 'green' | 'orange')[] = ['yellow', 'pink', 'cyan', 'green', 'orange'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newNote: StickyNote = {
      id: `sticky_${Date.now()}`,
      text: 'New note...\nDouble click to edit text.',
      color: randomColor,
      position: {
        x: Math.min(window.innerWidth - 260, 400 + Math.floor(Math.random() * 200)),
        y: Math.min(window.innerHeight - 240, 150 + Math.floor(Math.random() * 150)),
      },
      rotation: Number((Math.random() * 5 - 2.5).toFixed(1)),
      isPinnedToDesktop: true,
      authorNote: 'Post-it® Note',
      zIndex: maxZIndex + 1,
    };
    setMaxZIndex(maxZIndex + 1);
    setStickyNotes((prev) => [...prev, newNote]);
  };

  const bringStickyToFront = (id: string) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setStickyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, zIndex: nextZ } : n))
    );
  };

  // If not booted, show initial boot sequence
  if (!isBooted) {
    return <BootScreen onBootComplete={() => setIsBooted(true)} />;
  }

  return (
    <PlaylistProvider>
      <div
        id="midnight-cyber-cafe-terminal"
        onContextMenu={(e) => e.preventDefault()}
        className={`fixed inset-0 w-screen h-screen overflow-hidden select-none bg-[#0a1e3f] ${
          isDegaussing ? 'animate-degauss' : ''
        } ${isBuzzing ? 'animate-aim-buzz' : ''}`}
        onClick={(e) => {
          // Deselect icons when clicking empty desktop
          if ((e.target as HTMLElement).id === 'desktop-surface') {
            setSelectedIconId(null);
          }
        }}
      >
        {/* 1. Subtle Edge-to-Edge CRT Shaders (Curved Glass, Scanlines, Phosphor subtle glow) */}
        <CrtEffects isDegaussing={isDegaussing} scanlinesEnabled={true} />

        {/* 2. Classic 2004 Serene Landscape Desktop Wallpaper (Edge-to-Edge Fullscreen) */}
        <div
          id="desktop-surface"
          className="absolute inset-0 w-full h-full pb-[30px] overflow-hidden"
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).id === 'desktop-surface') {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              } else {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }
          }}
          style={{
            backgroundImage: `
              linear-gradient(180deg, rgba(20, 60, 130, 0.4) 0%, rgba(30, 90, 180, 0.2) 40%, rgba(34, 110, 60, 0.3) 70%, rgba(15, 60, 30, 0.6) 100%),
              radial-gradient(ellipse at 50% 30%, #5b92e5 0%, #295aa6 45%, #102a5c 100%)
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Environmental Subtle Stamp */}
          <div className="absolute top-3 right-4 pointer-events-none text-right opacity-30 select-none font-mono text-[10px] text-white">
            <div>CABIN 04 · LAN 100Mbps</div>
            <div>MIDNIGHT CYBER CAFÉ</div>
          </div>

          {/* 3. Classical Windows Desktop Sticky Notes (Pinned directly to screen!) */}
          <StickyNotes
            notes={stickyNotes}
            onUpdateNote={updateStickyNote}
            onDeleteNote={deleteStickyNote}
            onAddNote={addStickyNote}
            onBringToFront={bringStickyToFront}
          />

          {/* 4. Desktop Icons Column (Left side of screen) */}
          <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
            <DesktopIcon
              id="my_computer"
              title="My Computer"
              icon="💻"
              isSelected={selectedIconId === 'my_computer'}
              onClick={() => setSelectedIconId('my_computer')}
              onDoubleClick={() => openApp('my_computer')}
            />

            <DesktopIcon
              id="my_docs"
              title="My Documents"
              icon="📁"
              isSelected={selectedIconId === 'my_docs'}
              onClick={() => setSelectedIconId('my_docs')}
              onDoubleClick={() => openApp('my_computer')}
            />

            <DesktopIcon
              id="ie"
              title="Internet Explorer"
              icon="🌐"
              isSelected={selectedIconId === 'ie'}
              onClick={() => setSelectedIconId('ie')}
              onDoubleClick={() => openApp('internet_explorer')}
            />

            <DesktopIcon
              id="aim"
              title="AIM"
              icon="🏃"
              isSelected={selectedIconId === 'aim'}
              onClick={() => setSelectedIconId('aim')}
              onDoubleClick={() => openApp('aim')}
            />

            <DesktopIcon
              id="limewire"
              title="LimeWire"
              icon="🍋"
              isSelected={selectedIconId === 'limewire'}
              onClick={() => setSelectedIconId('limewire')}
              onDoubleClick={() => openApp('limewire')}
            />

            <DesktopIcon
              id="winamp"
              title="Winamp"
              icon="⚡"
              isSelected={selectedIconId === 'winamp'}
              onClick={() => setSelectedIconId('winamp')}
              onDoubleClick={() => openApp('winamp')}
            />

            <DesktopIcon
              id="cs"
              title="Counter-Strike 1.6"
              icon="🎯"
              isSelected={selectedIconId === 'cs'}
              onClick={() => setSelectedIconId('cs')}
              onDoubleClick={() => openApp('cs_trainer')}
            />

            <DesktopIcon
              id="minesweeper"
              title="Minesweeper"
              icon="💣"
              isSelected={selectedIconId === 'minesweeper'}
              onClick={() => setSelectedIconId('minesweeper')}
              onDoubleClick={() => openApp('minesweeper')}
            />

            <DesktopIcon
              id="cheats"
              title="GTA Cheats.txt"
              icon="📄"
              isSelected={selectedIconId === 'cheats'}
              onClick={() => setSelectedIconId('cheats')}
              onDoubleClick={() => openApp('notepad')}
            />

            <DesktopIcon
              id="recycle"
              title="Recycle Bin"
              icon="🗑️"
              isSelected={selectedIconId === 'recycle'}
              onClick={() => setSelectedIconId('recycle')}
              onDoubleClick={() => playMouseClick()}
            />
          </div>

          {/* 5. Window Manager Rendering */}
          {windows.map((win) => (
            <WindowFrame
              key={win.id}
              instance={win}
              isActive={activeWindowId === win.id}
              onFocus={() => focusWindow(win.id)}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => toggleMinimizeWindow(win.id)}
              onMaximize={() => maximizeWindow(win.id)}
              onUpdatePosition={(x, y) => updateWindowPosition(win.id, x, y)}
            >
              {win.appId === 'aim' && <AimApp onTriggerBuzz={triggerBuzz} />}
              {win.appId === 'winamp' && <WinampApp />}
              {win.appId === 'internet_explorer' && <InternetExplorerApp />}
              {win.appId === 'limewire' && <LimeWireApp />}
              {win.appId === 'my_computer' && (
                <MyComputerApp
                  onOpenFile={(file: FileItem) => {
                    if (file.id === 'sticky_editor_app') {
                      openApp('sticky_note_app');
                    } else if (file.type === 'txt' || file.type === 'doc') {
                      openApp('notepad', { initialContent: file.content });
                    } else if (file.type === 'mp3') {
                      openApp('winamp');
                    } else if (file.type === 'exe') {
                      if (file.id.includes('cs')) openApp('cs_trainer');
                      else openApp('minesweeper');
                    } else if (file.type === 'html') {
                      openApp('internet_explorer');
                    }
                  }}
                />
              )}
              {win.appId === 'minesweeper' && <MinesweeperApp />}
              {win.appId === 'cs_trainer' && <CounterStrikeTrainer />}
              {win.appId === 'notepad' && (
                <NotepadApp initialContent={win.extraData?.initialContent} />
              )}
              {win.appId === 'paint' && <PaintApp />}
              {win.appId === 'sticky_note_app' && (
                <StickyNoteApp
                  notes={stickyNotes}
                  onAddStickyNote={(noteDraft) => {
                    const newNote: StickyNote = {
                      ...noteDraft,
                      id: `sticky_${Date.now()}`,
                      zIndex: maxZIndex + 1,
                    };
                    setMaxZIndex(maxZIndex + 1);
                    setStickyNotes((prev) => [...prev, newNote]);
                  }}
                  onUpdateNote={updateStickyNote}
                  onDeleteNote={deleteStickyNote}
                />
              )}
            </WindowFrame>
          ))}
        </div>

        {/* Music Player YouTube Stream Dock */}
        <MusicPlayerDock />

        {/* Playlist Manager Modal (Winamp & YouTube Stream) */}
        <PlaylistManagerModal />

        {/* 6. Authentic Windows XP Taskbar */}
        <Taskbar
          windows={windows}
          activeWindowId={activeWindowId}
          onFocusWindow={focusWindow}
          onToggleMinimize={toggleMinimizeWindow}
          onOpenApp={openApp}
          onShowDesktop={showDesktop}
          onTriggerDegauss={triggerDegauss}
          onToggleStickyNote={addStickyNote}
          onShutDownRequest={() => setIsShuttingDownModal(true)}
        />

        {/* 7. Authentic Shut Down Dialog Overlay */}
        {isShuttingDownModal && (
          <ShutdownScreen
            onCancel={() => setIsShuttingDownModal(false)}
            onRestart={() => {
              setIsShuttingDownModal(false);
              setIsBooted(false);
            }}
          />
        )}
      </div>
    </PlaylistProvider>
  );
}
