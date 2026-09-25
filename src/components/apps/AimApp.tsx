import React, { useState, useEffect, useRef } from 'react';
import { AimBuddy, AimMessage } from '../../types';
import {
  playAimReceive,
  playAimSend,
  playAimBuzz,
  playKeyClick,
  playMouseClick,
} from '../../utils/audio';
import { BellRing, Sparkles, Download, FileDown, Check } from 'lucide-react';
import { AIM_PERSONAS } from '../../config/aimPersonas';
import { downloadAimChatHtml } from '../../utils/aimChatExporter';

interface AimAppProps {
  onTriggerBuzz: () => void;
}

const INITIAL_BUDDIES: AimBuddy[] = [
  {
    screenName: 'xX_bhavya_core_Xx',
    status: 'online',
    statusMessage: AIM_PERSONAS.xX_bhavya_core_Xx.statusMessage,
  },
  {
    screenName: 'Xx_sarah_xX',
    status: 'online',
    statusMessage: AIM_PERSONAS.Xx_sarah_xX.statusMessage,
  },
  {
    screenName: 'CyberCafeAdmin',
    status: 'online',
    statusMessage: AIM_PERSONAS.CyberCafeAdmin.statusMessage,
  },
  {
    screenName: 'sk8rboi2004',
    status: 'online',
    statusMessage: AIM_PERSONAS.sk8rboi2004.statusMessage,
  },
  {
    screenName: 'punkrockgirl',
    status: 'online',
    statusMessage: AIM_PERSONAS.punkrockgirl.statusMessage,
  },
  {
    screenName: 'HaloMaster',
    status: 'away',
    statusMessage: AIM_PERSONAS.HaloMaster.statusMessage,
  },
  {
    screenName: 'Mike',
    status: 'away',
    statusMessage: AIM_PERSONAS.Mike.statusMessage,
  },
];

const STORAGE_AIM_CHATS_KEY = 'cyber_cafe_aim_chat_history_v1';
const STORAGE_AIM_SELECTED_BUDDY_KEY = 'cyber_cafe_aim_selected_buddy_v1';
const STORAGE_AIM_MY_STATUS_KEY = 'cyber_cafe_aim_my_status_v1';
const STORAGE_AIM_CUSTOM_STATUS_MSG_KEY = 'cyber_cafe_aim_custom_status_msg_v1';
const STORAGE_AIM_MY_USERNAME_KEY = 'cyber_cafe_aim_my_username_v1';

const DEFAULT_INITIAL_CHAT_HISTORY: Record<string, AimMessage[]> = {
  xX_bhavya_core_Xx: [
    { id: '1', from: 'xX_bhavya_core_Xx', text: 'hey are you still at Cabin 04?', time: '10:42 PM' },
    { id: '2', from: 'me', text: 'yeah, listening to some songs on Winamp', time: '10:43 PM' },
    { id: '3', from: 'xX_bhavya_core_Xx', text: 'send me that Linkin park track if it finishes! ;)', time: '10:44 PM' },
  ],
  Xx_sarah_xX: [
    { id: '1', from: 'Xx_sarah_xX', text: 'heyy are you still at Cabin 04?', time: '10:45 PM' },
    { id: '2', from: 'me', text: 'yeah, listening to some songs on Winamp', time: '10:46 PM' },
    { id: '3', from: 'Xx_sarah_xX', text: 'send me that Linkin park track if it finishes! ;)', time: '10:47 PM' },
  ],
  CyberCafeAdmin: [
    { id: '1', from: 'CyberCafeAdmin', text: 'Welcome to Cabin 04. Your terminal is active. Please let front desk know if you require laser printing or drinks.', time: '10:15 PM' },
  ],
  sk8rboi2004: [
    { id: '1', from: 'sk8rboi2004', text: 'yo log into Counter-Strike server 192.168.1.104', time: '10:30 PM' },
  ],
};

export const AimApp: React.FC<AimAppProps> = ({ onTriggerBuzz }) => {
  const [buddies] = useState<AimBuddy[]>(INITIAL_BUDDIES);

  // 1. Persistent username/screen name from browser cache
  const [myUsername, setMyUsername] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AIM_MY_USERNAME_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch {
      // ignore
    }
    return 'Guest_Cabin04';
  });

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  // 2. Persistent selected buddy from browser cache
  const [selectedBuddy, setSelectedBuddy] = useState<string>(() => {
    let initialUser = 'Guest_Cabin04';
    try {
      const savedUser = localStorage.getItem(STORAGE_AIM_MY_USERNAME_KEY);
      if (savedUser && savedUser.trim()) initialUser = savedUser.trim();
    } catch {
      // ignore
    }
    const isAashankUser = initialUser === 'aashank';
    const fallbackBuddy = isAashankUser ? 'xX_bhavya_core_Xx' : 'Xx_sarah_xX';

    try {
      const saved = localStorage.getItem(STORAGE_AIM_SELECTED_BUDDY_KEY);
      if (saved && INITIAL_BUDDIES.some((b) => b.screenName === saved)) {
        if (saved === 'xX_bhavya_core_Xx' && !isAashankUser) return fallbackBuddy;
        if (saved === 'Xx_sarah_xX' && isAashankUser) return fallbackBuddy;
        return saved;
      }
    } catch {
      // ignore
    }
    return fallbackBuddy;
  });

  // Strict case-sensitive check for "aashank"
  const isAashank = myUsername === 'aashank';

  // Mutual exclusion: only Bhavya is visible when username is "aashank", otherwise only Sarah is visible
  const visibleBuddies = buddies.filter((b) => {
    if (b.screenName === 'xX_bhavya_core_Xx') return isAashank;
    if (b.screenName === 'Xx_sarah_xX') return !isAashank;
    return true;
  });

  // Automatically switch selected buddy if current selection becomes hidden due to username change
  useEffect(() => {
    if (myUsername === 'aashank') {
      if (selectedBuddy === 'Xx_sarah_xX') {
        setSelectedBuddy('xX_bhavya_core_Xx');
      }
    } else {
      if (selectedBuddy === 'xX_bhavya_core_Xx') {
        setSelectedBuddy('Xx_sarah_xX');
      }
    }
  }, [myUsername, selectedBuddy]);

  // 3. Persistent status message from browser cache
  const [myStatusMessage, setMyStatusMessage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AIM_CUSTOM_STATUS_MSG_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'listening to music @ cabin 04';
  });

  // 4. Persistent online/away status from browser cache
  const [myStatus, setMyStatus] = useState<'online' | 'away'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AIM_MY_STATUS_KEY);
      if (saved === 'online' || saved === 'away') return saved;
    } catch {
      // ignore
    }
    return 'online';
  });

  const [inputText, setInputText] = useState('');
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [isBuddyTyping, setIsBuddyTyping] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatusText, setTempStatusText] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 5. Persistent chat history from browser cache (retained across tabs, reloads, and visits)
  const [chatHistory, setChatHistory] = useState<Record<string, AimMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AIM_CHATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_INITIAL_CHAT_HISTORY,
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached AIM chats:', e);
    }
    return DEFAULT_INITIAL_CHAT_HISTORY;
  });

  const saveUsername = () => {
    const cleaned = tempUsername.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleaned) {
      setMyUsername(cleaned);
      playMouseClick();
      setExportNotice(`Screen Name changed to "${cleaned}" (Saved)`);
      setTimeout(() => setExportNotice(null), 3500);
    }
    setIsEditingUsername(false);
  };

  // Export chat function
  const handleExportChat = (exportAll = false) => {
    playMouseClick();
    const currentMsgs = chatHistory[selectedBuddy] || [];
    downloadAimChatHtml({
      buddyScreenName: selectedBuddy,
      messages: currentMsgs,
      allChats: chatHistory,
      buddies: visibleBuddies,
      exportAll,
      myUserName: myUsername,
    });

    const noticeText = exportAll
      ? 'All chat logs exported as .html!'
      : `Chat with ${selectedBuddy} exported as .html!`;
    setExportNotice(noticeText);
    setTimeout(() => {
      setExportNotice(null);
    }, 4000);
  };

  // Automatically save username to browser cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AIM_MY_USERNAME_KEY, myUsername);
    } catch {
      // ignore
    }
  }, [myUsername]);

  // Automatically save chat history to browser cache whenever messages update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AIM_CHATS_KEY, JSON.stringify(chatHistory));
    } catch (err) {
      console.warn('Failed to save AIM chat history to browser cache:', err);
    }
  }, [chatHistory]);

  // Save selected buddy to browser cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AIM_SELECTED_BUDDY_KEY, selectedBuddy);
    } catch {
      // ignore
    }
  }, [selectedBuddy]);

  // Save user status to browser cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AIM_MY_STATUS_KEY, myStatus);
    } catch {
      // ignore
    }
  }, [myStatus]);

  // Save custom status message to browser cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AIM_CUSTOM_STATUS_MSG_KEY, myStatusMessage);
    } catch {
      // ignore
    }
  }, [myStatusMessage]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll the internal chat container, never scroll parent containers or window
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, selectedBuddy, isBuddyTyping]);

  const handleSendMessage = async () => {
    const textSent = inputText.trim();
    if (!textSent) return;

    playAimSend();
    setInputText('');

    const newMsg: AimMessage = {
      id: Date.now().toString(),
      from: 'me',
      text: textSent,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => ({
      ...prev,
      [selectedBuddy]: [...(prev[selectedBuddy] || []), newMsg],
    }));

    // Realistic typing indicator delay (1.2s to 2.4s)
    setIsBuddyTyping(true);

    try {
      const historyContext = (chatHistory[selectedBuddy] || []).slice(-6);

      const res = await fetch('/api/aim/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buddy: selectedBuddy,
          message: textSent,
          history: historyContext,
        }),
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply;
      }

      // If backend returned empty or network failed, fallback gracefully
      if (!replyText) {
        const persona = AIM_PERSONAS[selectedBuddy];
        const fallbacks = persona?.sampleResponses || ['lol nice', 'brb', 'k'];
        replyText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      // Simulate human response pause
      setTimeout(() => {
        setIsBuddyTyping(false);
        playAimReceive();

        const replyMsg: AimMessage = {
          id: (Date.now() + 1).toString(),
          from: selectedBuddy,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatHistory((prev) => ({
          ...prev,
          [selectedBuddy]: [...(prev[selectedBuddy] || []), replyMsg],
        }));
      }, 1200 + Math.random() * 800);
    } catch {
      setTimeout(() => {
        setIsBuddyTyping(false);
        const persona = AIM_PERSONAS[selectedBuddy];
        const fallbacks = persona?.sampleResponses || ['lol nice', 'brb', 'k'];
        const fallbackReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        playAimReceive();
        const replyMsg: AimMessage = {
          id: (Date.now() + 1).toString(),
          from: selectedBuddy,
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatHistory((prev) => ({
          ...prev,
          [selectedBuddy]: [...(prev[selectedBuddy] || []), replyMsg],
        }));
      }, 1200);
    }
  };

  const handleSendBuzz = async () => {
    playAimBuzz();
    onTriggerBuzz();
    setIsBuzzing(true);
    setTimeout(() => setIsBuzzing(false), 700);

    const buzzMsg: AimMessage = {
      id: Date.now().toString(),
      from: 'me',
      text: '⚠️ You sent a BUZZ!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBuzz: true,
    };

    setChatHistory((prev) => ({
      ...prev,
      [selectedBuddy]: [...(prev[selectedBuddy] || []), buzzMsg],
    }));

    setIsBuddyTyping(true);

    try {
      const res = await fetch('/api/aim/buzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buddy: selectedBuddy }),
      });

      let reactionText = '';
      if (res.ok) {
        const data = await res.json();
        reactionText = data.reply;
      }

      if (!reactionText) {
        const persona = AIM_PERSONAS[selectedBuddy];
        const buzzFallbacks = persona?.buzzResponses || ['whoa why did you buzz me haha!'];
        reactionText = buzzFallbacks[Math.floor(Math.random() * buzzFallbacks.length)];
      }

      setTimeout(() => {
        setIsBuddyTyping(false);
        playAimReceive();
        const reaction: AimMessage = {
          id: (Date.now() + 1).toString(),
          from: selectedBuddy,
          text: reactionText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatHistory((prev) => ({
          ...prev,
          [selectedBuddy]: [...(prev[selectedBuddy] || []), reaction],
        }));
      }, 1400);
    } catch {
      setTimeout(() => {
        setIsBuddyTyping(false);
        playAimReceive();
        const persona = AIM_PERSONAS[selectedBuddy];
        const reactionText = persona?.buzzResponses?.[0] || 'whoa why did you buzz me haha!';
        const reaction: AimMessage = {
          id: (Date.now() + 1).toString(),
          from: selectedBuddy,
          text: reactionText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatHistory((prev) => ({
          ...prev,
          [selectedBuddy]: [...(prev[selectedBuddy] || []), reaction],
        }));
      }, 1400);
    }
  };

  const currentChat = chatHistory[selectedBuddy] || [];
  const activePersona = AIM_PERSONAS[selectedBuddy];

  return (
    <div
      className={`w-full h-full flex flex-col bg-[#ece9d8] text-[#111] font-tahoma text-[11px] select-text ${
        isBuzzing ? 'animate-aim-buzz' : ''
      }`}
    >
      {/* AIM Classic Yellow Running Man Banner */}
      <div className="bg-[#ffcc00] border-b border-[#cca000] px-3 py-1.5 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#002266] rounded-full flex items-center justify-center text-white font-bold text-[11px]">
            🏃
          </div>
          <div>
            <div className="font-bold text-[#002266] text-[12px] leading-tight flex items-center gap-1.5">
              <span>AOL Instant Messenger</span>
              <span className="text-[9px] bg-[#002266] text-yellow-300 font-mono px-1 py-0.2 rounded-xs font-bold">
                2004
              </span>
            </div>
            {isEditingUsername ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-[#444] font-mono">SN:</span>
                <input
                  type="text"
                  value={tempUsername}
                  autoFocus
                  maxLength={24}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveUsername();
                    } else if (e.key === 'Escape') {
                      setIsEditingUsername(false);
                    }
                  }}
                  className="bg-white border border-[#7f9db9] px-1 py-0.5 text-[9.5px] font-mono rounded-xs outline-none w-28 text-black"
                  placeholder="New Screen Name"
                />
                <button
                  type="button"
                  onClick={saveUsername}
                  className="bg-[#002266] text-white px-1.5 py-0.5 text-[9px] font-bold rounded-xs cursor-pointer hover:bg-[#003399]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="bg-gray-200 text-gray-800 px-1 py-0.5 text-[9px] rounded-xs cursor-pointer hover:bg-gray-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#444] font-mono">
                  Screen Name: <strong className="text-[#002266]">{myUsername}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempUsername(myUsername);
                    setIsEditingUsername(true);
                  }}
                  title="Rename your AIM Screen Name (Cached in browser)"
                  className="text-[9px] bg-white/70 hover:bg-white text-[#002266] px-1 py-0.2 rounded border border-[#cca000] cursor-pointer font-bold flex items-center gap-0.5"
                >
                  <span>✏️</span>
                  <span>Rename</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Export All Conversations Button */}
          <button
            type="button"
            onClick={() => handleExportChat(true)}
            title="Export all AIM buddy chat transcripts into a single multi-tab .html log file"
            className="flex items-center gap-1 px-2 py-0.5 bg-[#002266] hover:bg-[#003399] active:bg-[#001133] text-white rounded text-[10px] font-bold cursor-pointer border border-[#001144] shadow-xs"
          >
            <Download size={11} className="text-yellow-300" />
            <span>Export All (.html)</span>
          </button>

          <select
            value={myStatus}
            onChange={(e) => {
              playMouseClick();
              setMyStatus(e.target.value as 'online' | 'away');
            }}
            className="text-[10px] bg-white border border-[#7f9db9] px-1 py-0.5 rounded cursor-pointer font-medium"
          >
            <option value="online">🟢 Online</option>
            <option value="away">🟡 Away</option>
          </select>
        </div>
      </div>

      {/* Main split: Buddy List (Left) and Active Chat (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Buddy List Drawer */}
        <div className="w-[180px] bg-white border-r border-[#7f9db9] flex flex-col shrink-0 select-none">
          <div className="bg-[#f0ede0] px-2 py-1 border-b border-[#d4d0c8] font-bold text-[10.5px] text-[#003399] flex items-center justify-between">
            <span>Buddies ({visibleBuddies.filter((b) => b.status === 'online').length} Online)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-1 divide-y divide-gray-100">
            {/* Online Group */}
            <div className="py-1">
              <div className="text-[9.5px] font-bold text-gray-500 uppercase px-1 pb-1">Online</div>
              {visibleBuddies
                .filter((b) => b.status === 'online')
                .map((buddy) => (
                  <div
                    key={buddy.screenName}
                    onClick={() => {
                      playMouseClick();
                      setSelectedBuddy(buddy.screenName);
                    }}
                    className={`flex flex-col px-1.5 py-1 rounded cursor-pointer transition-colors ${
                      selectedBuddy === buddy.screenName
                        ? 'bg-[#316ac5] text-white font-bold'
                        : 'hover:bg-[#eef2f8] text-[#111]'
                    }`}
                  >
                    <div className="truncate flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="truncate">{buddy.screenName}</span>
                      </div>
                      {(buddy.screenName === 'xX_bhavya_core_Xx' || buddy.screenName === 'Xx_sarah_xX') && (
                        <span className="text-[9px] text-pink-300">💖</span>
                      )}
                      {buddy.screenName === 'CyberCafeAdmin' && (
                        <span className="text-[9px] opacity-75">🏢</span>
                      )}
                    </div>
                    <div
                      className={`text-[8.5px] truncate pl-2.5 ${
                        selectedBuddy === buddy.screenName ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {buddy.statusMessage}
                    </div>
                  </div>
                ))}
            </div>

            {/* Away Group */}
            <div className="py-1">
              <div className="text-[9.5px] font-bold text-gray-500 uppercase px-1 pb-1">Away</div>
              {visibleBuddies
                .filter((b) => b.status === 'away')
                .map((buddy) => (
                  <div
                    key={buddy.screenName}
                    onClick={() => {
                      playMouseClick();
                      setSelectedBuddy(buddy.screenName);
                    }}
                    className={`flex flex-col px-1.5 py-1 rounded cursor-pointer opacity-75 ${
                      selectedBuddy === buddy.screenName
                        ? 'bg-[#316ac5] text-white font-bold opacity-100'
                        : 'hover:bg-[#eef2f8] text-[#333]'
                    }`}
                  >
                    <div className="truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{buddy.screenName}</span>
                    </div>
                    <div
                      className={`text-[8.5px] truncate pl-2.5 ${
                        selectedBuddy === buddy.screenName ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {buddy.statusMessage}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Away message status bar */}
          <div className="p-1.5 bg-[#f6f6f2] border-t border-[#d4d0c8] text-[9.5px] text-gray-600 truncate flex items-center justify-between">
            {isEditingStatus ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  value={tempStatusText}
                  autoFocus
                  onChange={(e) => setTempStatusText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (tempStatusText.trim()) {
                        setMyStatusMessage(tempStatusText.trim());
                      }
                      setIsEditingStatus(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingStatus(false);
                    }
                  }}
                  className="flex-1 bg-white border border-[#7f9db9] px-1 py-0.5 text-[9px] rounded-xs outline-none"
                  placeholder="Type status message..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tempStatusText.trim()) {
                      setMyStatusMessage(tempStatusText.trim());
                    }
                    setIsEditingStatus(false);
                  }}
                  className="bg-[#ece9d8] px-1.5 py-0.5 border border-gray-400 text-[8.5px] font-bold"
                >
                  OK
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTempStatusText(myStatusMessage);
                  setIsEditingStatus(true);
                }}
                className="cursor-pointer hover:text-blue-700 truncate flex items-center gap-1 w-full"
                title="Click to edit custom status message (saved in browser cache)"
              >
                <span className="font-bold">Status:</span>
                <span className="truncate italic">{myStatusMessage}</span>
                <span className="text-[8px] text-gray-400 ml-auto shrink-0">✏️</span>
              </div>
            )}
          </div>
        </div>

        {/* Active Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="bg-[#f0ede0] px-3 py-1.5 border-b border-[#7f9db9] flex items-center justify-between select-none">
            <div className="flex flex-col max-w-[70%] truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#002266] text-[12px]">{selectedBuddy}</span>
                {activePersona && (
                  <span className="text-[9.5px] bg-[#dfdcc8] text-[#333] px-1.5 py-0.2 rounded-xs border border-gray-400 truncate">
                    {activePersona.displayName} ({activePersona.role.split('(')[0].trim()})
                  </span>
                )}
              </div>
              <span className="text-[9.5px] text-gray-500 truncate">
                {activePersona?.statusMessage || 'Instant Message'}
              </span>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Export Active Chat .HTML Button */}
              <button
                type="button"
                onClick={() => handleExportChat(false)}
                title={`Export this chat with ${selectedBuddy} as a standalone formatted .html file`}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#ece9d8] hover:bg-[#ded9c5] active:bg-[#ccc6b0] border border-[#7f9db9] rounded text-[10px] font-bold text-[#111] cursor-pointer shadow-xs"
              >
                <FileDown size={11} className="text-blue-700" />
                <span>Export .html</span>
              </button>

              {/* BUZZ Button */}
              <button
                type="button"
                onClick={handleSendBuzz}
                title="Send a Buzz! (Shakes both screens with sound)"
                className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-b from-[#fff2a8] to-[#ffd040] hover:brightness-105 active:brightness-95 border border-[#c49a00] rounded text-[10px] font-bold text-[#664d00] cursor-pointer shadow-xs"
              >
                <BellRing size={11} />
                <span>BUZZ</span>
              </button>

              {/* Clear Chat Button */}
              <button
                type="button"
                onClick={() => {
                  playMouseClick();
                  if (window.confirm(`Clear chat history with ${selectedBuddy}?`)) {
                    setChatHistory((prev) => ({
                      ...prev,
                      [selectedBuddy]: [],
                    }));
                  }
                }}
                title="Clear Chat History (Only clears when you confirm)"
                className="w-4 h-4 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[#555] hover:text-[#000] flex items-center justify-center text-[10px] font-bold cursor-pointer"
                aria-label="Clear chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Export Success Toast Notification */}
          {exportNotice && (
            <div className="bg-emerald-600 text-white px-3 py-1 text-[10px] font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <Check size={12} />
                <span>{exportNotice} (Ready to share or open in any browser)</span>
              </div>
              <button
                type="button"
                onClick={() => setExportNotice(null)}
                className="text-emerald-100 hover:text-white text-[10px] cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Persona Role Banner & Browser Cache Sync indicator */}
          <div className="bg-[#fbfbf8] border-b border-[#ebe8dc] px-3 py-1 text-[9.5px] text-gray-500 flex items-center justify-between select-none">
            <span className="truncate italic">
              Tone: {activePersona?.toneDescription || 'Standard AIM Friend'}
            </span>
            <span
              className="text-[9px] text-emerald-700 font-mono flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200"
              title="All chat messages and conversations remain cached until browser cache is cleared"
            >
              <span>💾</span>
              <span>Chats Cached</span>
            </span>
          </div>

          {/* Message Stream */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-3 overflow-y-auto bg-[#ffffff] space-y-2 select-text"
          >
            {currentChat.map((msg) => (
              <div
                key={msg.id}
                className={`text-[11px] leading-relaxed ${
                  msg.isBuzz
                    ? 'p-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded font-bold text-center'
                    : ''
                }`}
              >
                {!msg.isBuzz && (
                  <div className="font-bold">
                    <span className={msg.from === 'me' ? 'text-[#c00000]' : 'text-[#0000cc]'}>
                      {msg.from === 'me' ? myUsername : msg.from}:
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal ml-1.5">{msg.time}</span>
                  </div>
                )}
                <div
                  className={`mt-0.5 font-tahoma whitespace-pre-wrap ${
                    msg.isBuzz ? 'text-center' : 'text-[#111]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Buddy Typing Indicator */}
            {isBuddyTyping && (
              <div className="text-[10px] text-gray-500 italic flex items-center gap-1.5 pt-1 animate-pulse">
                <span>💬</span>
                <span>{selectedBuddy} is typing a message...</span>
              </div>
            )}
          </div>

          {/* Formatting Bar */}
          <div className="h-6 bg-[#ece9d8] border-t border-b border-[#d4d0c8] px-2 flex items-center gap-3 text-[10px] text-gray-700 select-none">
            <span className="font-bold cursor-pointer hover:underline">B</span>
            <span className="italic cursor-pointer hover:underline">I</span>
            <span className="underline cursor-pointer">U</span>
            <span className="border-l border-gray-300 h-3" />
            <span className="text-blue-600 cursor-pointer">A</span>
            <span className="text-red-600 cursor-pointer">Link</span>
            <span className="text-gray-500 text-[9px] ml-auto">Direct Connection ({myUsername})</span>
          </div>

          {/* Text Input Area & Send Button */}
          <div className="p-2 bg-[#ece9d8] flex items-end gap-2 select-none">
            <textarea
              value={inputText}
              rows={2}
              placeholder={`Send message to ${selectedBuddy}... (Press Enter)`}
              onChange={(e) => {
                playKeyClick();
                setInputText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-white border border-[#7f9db9] p-1.5 text-[11.5px] rounded-xs resize-none outline-none focus:border-[#316ac5] select-text font-tahoma"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="px-3 py-2.5 bg-[#ece9d8] hover:bg-[#dfdbcc] active:bg-[#ccc7b6] border-t border-l border-white border-r border-b border-[#808080] font-bold text-[11px] cursor-pointer shadow-xs select-none"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
