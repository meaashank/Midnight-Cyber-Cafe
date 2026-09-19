import React, { useState, useEffect, useRef } from 'react';
import { AimBuddy, AimMessage } from '../../types';
import {
  playAimReceive,
  playAimSend,
  playAimBuzz,
  playAimDoor,
  playKeyClick,
  playMouseClick,
} from '../../utils/audio';
import { Send, BellRing, UserCheck, MessageSquare, AlertCircle } from 'lucide-react';

interface AimAppProps {
  onTriggerBuzz: () => void;
}

const INITIAL_BUDDIES: AimBuddy[] = [
  { screenName: 'sk8rboi2004', status: 'online', statusMessage: 'landing kickflips at the park later' },
  { screenName: 'xX_bhavya_core_Xx', status: 'online', statusMessage: 'listening to Evanescence 🎵' },
  { screenName: 'HaloMaster', status: 'away', statusMessage: 'playing Halo 2 on Xbox Live brb' },
  { screenName: 'punkrockgirl', status: 'online', statusMessage: 'homework is so annoying' },
  { screenName: 'Mike', status: 'away', statusMessage: 'eating dinner / afk' },
  { screenName: 'CyberCafeAdmin', status: 'online', statusMessage: 'Cabin 04 session active' },
];

const BOT_RESPONSES: Record<string, string[]> = {
  sk8rboi2004: [
    'yo what up! are you at the LAN cafe right now?',
    'tell the clerk if they got any Bawls guarana drinks left',
    'im coming over around 11 for some Counter-Strike 1.6',
    'did you see that crazy Tony Hawk trick on MTV?',
    'gtg mom needs the phone line lol'
  ],
  xX_bhavya_core_Xx: [
    'heyyy! did you do the chemistry worksheet?',
    'omg winamp is playing my favorite song right now',
    'check out my new MySpace background layout I coded it with HTML tables haha',
    'brb making a mixtape for Friday'
  ],
  HaloMaster: [
    '(Auto-Response): playing Halo 2 on Xbox Live brb',
    'yo 2v2 on Lockout later? grab a controller',
    'BXR combo is so overpowered'
  ],
  punkrockgirl: [
    'Green Day American Idiot album is so good',
    'did LimeWire finish downloading that song?',
    'make sure you don\'t download a virus lol'
  ],
  CyberCafeAdmin: [
    'System Alert: Cabin 04 session is active. Rate is $2.00/hour.',
    'Please do not disconnect the blue Ethernet cable.',
    'Printing is $0.10 per black and white page at the front counter.'
  ]
};

export const AimApp: React.FC<AimAppProps> = ({ onTriggerBuzz }) => {
  const [buddies] = useState<AimBuddy[]>(INITIAL_BUDDIES);
  const [selectedBuddy, setSelectedBuddy] = useState<string>('xX_bhavya_core_Xx');
  const [myStatusMessage, setMyStatusMessage] = useState<string>('listening to music @ cyber cafe');
  const [myStatus, setMyStatus] = useState<'online' | 'away'>('online');
  const [inputText, setInputText] = useState('');
  const [isBuzzing, setIsBuzzing] = useState(false);

  const [chatHistory, setChatHistory] = useState<Record<string, AimMessage[]>>({
    xX_bhavya_core_Xx: [
      { id: '1', from: 'xX_bhavya_core_Xx', text: 'hey are you still at Cabin 04?', time: '10:42 PM' },
      { id: '2', from: 'me', text: 'yeah, downloaded some songs on Winamp', time: '10:43 PM' },
      { id: '3', from: 'xX_bhavya_core_Xx', text: 'send me that Linkin park track if it finishes!', time: '10:44 PM' },
    ],
    sk8rboi2004: [
      { id: '1', from: 'sk8rboi2004', text: 'yo log into Counter-Strike server 192.168.1.104', time: '10:30 PM' },
    ],
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, selectedBuddy]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    playAimSend();

    const newMsg: AimMessage = {
      id: Date.now().toString(),
      from: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => ({
      ...prev,
      [selectedBuddy]: [...(prev[selectedBuddy] || []), newMsg],
    }));

    const textSent = inputText;
    setInputText('');

    // Simulate authentic response after 1.5 - 3.5 seconds
    setTimeout(() => {
      const responses = BOT_RESPONSES[selectedBuddy] || ['lol cool', 'brb', 'nice'];
      const replyText = responses[Math.floor(Math.random() * responses.length)];
      
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
    }, 1800 + Math.random() * 1500);
  };

  const handleSendBuzz = () => {
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

    // Bot reacts to buzz
    setTimeout(() => {
      playAimReceive();
      const reaction: AimMessage = {
        id: (Date.now() + 1).toString(),
        from: selectedBuddy,
        text: 'whoa why did you buzz me my screen shook haha!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory((prev) => ({
        ...prev,
        [selectedBuddy]: [...(prev[selectedBuddy] || []), reaction],
      }));
    }, 2000);
  };

  const currentChat = chatHistory[selectedBuddy] || [];

  return (
    <div className={`w-full h-full flex flex-col bg-[#ece9d8] text-[#111] font-tahoma text-[11px] select-text ${
      isBuzzing ? 'animate-aim-buzz' : ''
    }`}>
      {/* AIM Classic Yellow Running Man Banner */}
      <div className="bg-[#ffcc00] border-b border-[#cca000] px-3 py-1.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#002266] rounded-full flex items-center justify-center text-white font-bold text-[11px]">
            🏃
          </div>
          <div>
            <div className="font-bold text-[#002266] text-[12px] leading-tight">AOL Instant Messenger</div>
            <div className="text-[10px] text-[#444] font-mono">Screen Name: Guest_Cabin04</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={myStatus}
            onChange={(e) => {
              playMouseClick();
              setMyStatus(e.target.value as 'online' | 'away');
            }}
            className="text-[10px] bg-white border border-[#7f9db9] px-1 py-0.5 rounded cursor-pointer"
          >
            <option value="online">🟢 Online</option>
            <option value="away">🟡 Away</option>
          </select>
        </div>
      </div>

      {/* Main split: Buddy List (Left) and Active Chat (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Buddy List Drawer */}
        <div className="w-[170px] bg-white border-r border-[#7f9db9] flex flex-col shrink-0">
          <div className="bg-[#f0ede0] px-2 py-1 border-b border-[#d4d0c8] font-bold text-[10.5px] text-[#003399] flex items-center justify-between">
            <span>Buddies ({buddies.filter(b => b.status === 'online').length} Online)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-1 divide-y divide-gray-100">
            {/* Online Group */}
            <div className="py-1">
              <div className="text-[9.5px] font-bold text-gray-500 uppercase px-1 pb-1">Online</div>
              {buddies
                .filter((b) => b.status === 'online')
                .map((buddy) => (
                  <div
                    key={buddy.screenName}
                    onClick={() => {
                      playMouseClick();
                      setSelectedBuddy(buddy.screenName);
                    }}
                    className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer transition-colors ${
                      selectedBuddy === buddy.screenName
                        ? 'bg-[#316ac5] text-white font-bold'
                        : 'hover:bg-[#eef2f8] text-[#111]'
                    }`}
                  >
                    <div className="truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <span className="truncate">{buddy.screenName}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Away Group */}
            <div className="py-1">
              <div className="text-[9.5px] font-bold text-gray-500 uppercase px-1 pb-1">Away</div>
              {buddies
                .filter((b) => b.status === 'away')
                .map((buddy) => (
                  <div
                    key={buddy.screenName}
                    onClick={() => {
                      playMouseClick();
                      setSelectedBuddy(buddy.screenName);
                    }}
                    className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer opacity-70 ${
                      selectedBuddy === buddy.screenName
                        ? 'bg-[#316ac5] text-white font-bold opacity-100'
                        : 'hover:bg-[#eef2f8] text-[#333]'
                    }`}
                  >
                    <div className="truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{buddy.screenName}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Away message status bar */}
          <div className="p-1.5 bg-[#f6f6f2] border-t border-[#d4d0c8] text-[9.5px] text-gray-600 truncate">
            Status: {myStatusMessage}
          </div>
        </div>

        {/* Active Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="bg-[#f0ede0] px-3 py-1.5 border-b border-[#7f9db9] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#002266] text-[12px]">{selectedBuddy}</span>
              <span className="text-[10px] text-gray-500">
                — {buddies.find((b) => b.screenName === selectedBuddy)?.statusMessage || 'Instant Message'}
              </span>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1.5">
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

              {/* Close / Clear Chat Button */}
              <button
                type="button"
                onClick={() => {
                  playMouseClick();
                  setChatHistory((prev) => ({
                    ...prev,
                    [selectedBuddy]: [],
                  }));
                }}
                title="Clear Chat History"
                className="w-4 h-4 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#7f9db9] rounded-xs text-[#555] hover:text-[#000] flex items-center justify-center text-[10px] font-bold cursor-pointer"
                aria-label="Clear chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-3 overflow-y-auto bg-[#ffffff] space-y-2 select-text">
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
                      {msg.from === 'me' ? 'Guest_Cabin04' : msg.from}:
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal ml-1.5">{msg.time}</span>
                  </div>
                )}
                <div className={`mt-0.5 font-tahoma ${msg.isBuzz ? 'text-center' : 'text-[#111]'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Formatting Bar */}
          <div className="h-6 bg-[#ece9d8] border-t border-b border-[#d4d0c8] px-2 flex items-center gap-3 text-[10px] text-gray-700">
            <span className="font-bold cursor-pointer hover:underline">B</span>
            <span className="italic cursor-pointer hover:underline">I</span>
            <span className="underline cursor-pointer">U</span>
            <span className="border-l border-gray-300 h-3" />
            <span className="text-blue-600 cursor-pointer">A</span>
            <span className="text-red-600 cursor-pointer">Link</span>
            <span className="text-gray-500 text-[9px] ml-auto">Direct Connection</span>
          </div>

          {/* Text Input Area & Send Button */}
          <div className="p-2 bg-[#ece9d8] flex items-end gap-2">
            <textarea
              value={inputText}
              rows={2}
              placeholder="Type message and press Enter..."
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
              className="flex-1 bg-white border border-[#7f9db9] p-1.5 text-[11.5px] rounded-xs resize-none outline-none focus:border-[#316ac5]"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="px-3 py-2.5 bg-[#ece9d8] hover:bg-[#dfdbcc] active:bg-[#ccc7b6] border-t border-l border-white border-r border-b border-[#808080] font-bold text-[11px] cursor-pointer shadow-xs"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
