import React, { useState, useEffect } from 'react';
import { playCrtPowerOn, playWindowsStartup } from '../utils/audio';

interface BootScreenProps {
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [bootPhase, setBootPhase] = useState<'off' | 'power_flare' | 'bios' | 'xp_boot' | 'welcome'>('off');

  const startBootSequence = () => {
    if (bootPhase !== 'off') return;

    playCrtPowerOn();
    setBootPhase('power_flare');

    // 1. CRT Flash & High-voltage flyback charge
    setTimeout(() => {
      setBootPhase('bios');
    }, 600);

    // 2. BIOS POST Screen
    setTimeout(() => {
      setBootPhase('xp_boot');
    }, 1800);

    // 3. Windows XP Welcome Screen
    setTimeout(() => {
      setBootPhase('welcome');
    }, 3600);

    // 4. Reveal Desktop & Play Authentic Windows XP Startup Sound
    setTimeout(() => {
      onBootComplete();
      playWindowsStartup();
    }, 5000);
  };

  // Listen for Enter key to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        startBootSequence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bootPhase]);

  return (
    <div
      onClick={startBootSequence}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 w-full h-full bg-[#050507] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
    >
      {/* 1. INITIAL TERMINAL OFF STATE */}
      {bootPhase === 'off' && (
        <div className="flex flex-col items-center text-center p-8 max-w-md">
          {/* Subtle Environmental Cabin Indicator */}
          <div className="border border-white/20 bg-black/60 px-4 py-1.5 rounded-xs text-[#888] font-mono text-[11px] mb-8 tracking-widest uppercase">
            MIDNIGHT CYBER CAFÉ — CABIN 04
          </div>

          {/* CRT "NO SIGNAL" Box */}
          <div className="border-2 border-[#555] bg-[#111] px-6 py-4 rounded-xs shadow-2xl mb-8">
            <div className="text-white font-mono text-[14px] font-bold tracking-widest animate-pulse">
              [ NO SIGNAL ]
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-1">RGB ANALOG 1024x768 @ 85Hz</div>
          </div>

          {/* CTA Prompt */}
          <div className="space-y-2">
            <div className="text-white font-mono text-[13px] tracking-wider font-bold">
              PRESS ENTER OR CLICK TO POWER ON
            </div>
            <div className="text-gray-500 font-mono text-[10px]">
              Prepaid LAN Terminal · CRT Tube Warmup Required
            </div>
          </div>
        </div>
      )}

      {/* 2. CRT POWER-ON FLARE */}
      {bootPhase === 'power_flare' && (
        <div className="w-full h-full bg-white animate-crt-on flex items-center justify-center" />
      )}

      {/* 3. BIOS ENERGY STAR POST SCREEN */}
      {bootPhase === 'bios' && (
        <div className="w-full h-full bg-black p-8 font-terminal text-[13px] text-[#ccc] space-y-1.5 text-left flex flex-col justify-start">
          <div className="flex justify-between items-start border-b border-gray-800 pb-2 mb-2">
            <div>
              <div className="text-white font-bold">Award Modular BIOS v6.00PG, An Energy Star Ally</div>
              <div className="text-gray-400">Copyright (C) 1984-2004, Award Software, Inc.</div>
            </div>
            <div className="text-yellow-400 font-pixel text-xl">ENERGY STAR</div>
          </div>
          <div>Main Processor : Intel(R) Pentium(R) 4 CPU 3.00GHz (800MHz FSB)</div>
          <div>Memory Testing : 1048576K OK</div>
          <div>Primary Master : WDC WD800BB-00JHC0 (80GB Ultra ATA/100)</div>
          <div>Primary Slave  : SONY DVD-ROM DDU1612</div>
          <div className="text-green-400 pt-3">Cabin 04 Fast Ethernet LAN Adapter: Link OK (100 Mbps)</div>
          <div className="text-gray-500 pt-6">Press DEL to enter SETUP · 08/15/2004-I865G-6A79AD4AC-00</div>
        </div>
      )}

      {/* 4. WINDOWS XP STARTUP SCREEN */}
      {bootPhase === 'xp_boot' && (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center select-none">
          {/* Windows XP Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="grid grid-cols-2 gap-1 w-8 h-8">
              <div className="bg-[#f25022] rounded-xs" />
              <div className="bg-[#7fba00] rounded-xs" />
              <div className="bg-[#00a4ef] rounded-xs" />
              <div className="bg-[#ffb900] rounded-xs" />
            </div>
            <div className="text-white font-sans text-2xl font-bold tracking-tight">
              Microsoft<span className="text-xs font-normal align-top">®</span> Windows<span className="text-xs font-bold text-amber-500 align-top font-sans">XP</span>
            </div>
          </div>

          {/* Authentic Scrolling 3-Blue-Bar Progress Loader */}
          <div className="w-48 h-3.5 bg-black border border-[#444] rounded-xs p-0.5 overflow-hidden relative">
            <div className="h-full w-10 bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 rounded-xs animate-[pulse_0.8s_ease-in-out_infinite] shadow-sm" />
          </div>
        </div>
      )}

      {/* 5. WINDOWS WELCOME SCREEN */}
      {bootPhase === 'welcome' && (
        <div className="w-full h-full bg-gradient-to-r from-[#002266] via-[#0055cc] to-[#002266] flex items-center justify-center text-white select-none">
          <div className="flex items-center gap-6">
            <div className="text-right border-r-2 border-white/40 pr-6">
              <div className="text-2xl font-bold italic font-sans">welcome</div>
              <div className="text-xs text-blue-200">Cabin 04 · Cyber Café Network</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-white p-0.5 border border-white flex items-center justify-center text-2xl">
                🦆
              </div>
              <div className="text-sm font-bold">Guest_Cabin04</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
