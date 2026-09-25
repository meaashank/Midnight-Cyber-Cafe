import { AimBuddy, AimMessage } from '../types';
import { AIM_PERSONAS } from '../config/aimPersonas';

interface ExportChatOptions {
  buddyScreenName: string;
  messages: AimMessage[];
  allChats?: Record<string, AimMessage[]>;
  buddies?: AimBuddy[];
  exportAll?: boolean;
}

export function generateAimChatHtml({
  buddyScreenName,
  messages,
  allChats,
  buddies = [],
  exportAll = false,
}: ExportChatOptions): string {
  const exportDate = new Date().toLocaleString();
  const persona = AIM_PERSONAS[buddyScreenName as keyof typeof AIM_PERSONAS];

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const renderMessageList = (msgs: AimMessage[], currentBuddy: string) => {
    if (!msgs || msgs.length === 0) {
      return `<div class="empty-state">No messages recorded in this chat log.</div>`;
    }
    return msgs
      .map((msg) => {
        if (msg.isBuzz) {
          return `
            <div class="msg-buzz">
              <span class="buzz-icon">🔔</span>
              <span class="buzz-text">${escapeHtml(msg.text)}</span>
              <span class="msg-time">${escapeHtml(msg.time)}</span>
            </div>
          `;
        }

        const isMe = msg.from === 'me';
        const senderName = isMe ? 'Guest_Cabin04' : currentBuddy;
        const senderClass = isMe ? 'sender-me' : 'sender-buddy';

        return `
          <div class="msg-row">
            <div class="msg-header">
              <span class="msg-sender ${senderClass}">${escapeHtml(senderName)}:</span>
              <span class="msg-time">${escapeHtml(msg.time)}</span>
            </div>
            <div class="msg-body">${escapeHtml(msg.text)}</div>
          </div>
        `;
      })
      .join('\n');
  };

  const buddyListHtml =
    exportAll && allChats
      ? Object.keys(allChats)
          .map((bName) => {
            const count = allChats[bName]?.length || 0;
            const bPersona = AIM_PERSONAS[bName as keyof typeof AIM_PERSONAS];
            return `
              <button class="buddy-tab ${bName === buddyScreenName ? 'active' : ''}" onclick="switchBuddy('${escapeHtml(bName)}')">
                <span class="status-dot"></span>
                <span class="b-name">${escapeHtml(bName)}</span>
                <span class="b-count">(${count})</span>
              </button>
            `;
          })
          .join('')
      : '';

  const chatsDataJson = exportAll && allChats ? JSON.stringify(allChats) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AOL Instant Messenger - Chat Log with ${escapeHtml(buddyScreenName)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #3a6ea5;
      background-image: 
        radial-gradient(circle at 50% 30%, #5289c7 0%, #2b5585 100%);
      font-family: 'Tahoma', 'MS Sans Serif', Geneva, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 12px;
      color: #000;
    }

    /* Top utility bar */
    .top-action-bar {
      width: 100%;
      max-width: 680px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      background: rgba(0, 0, 0, 0.4);
      padding: 8px 16px;
      border-radius: 6px;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .top-action-bar .brand {
      color: #fff;
      font-weight: bold;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    }

    .btn-group {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: #ece9d8;
      border-top: 1px solid #ffffff;
      border-left: 1px solid #ffffff;
      border-right: 1px solid #707070;
      border-bottom: 1px solid #707070;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: bold;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #222;
      border-radius: 2px;
    }

    .action-btn:hover {
      background: #dfdbcc;
    }

    .action-btn:active {
      border-top: 1px solid #707070;
      border-left: 1px solid #707070;
      border-right: 1px solid #ffffff;
      border-bottom: 1px solid #ffffff;
    }

    /* Classic Windows XP / AIM Window Container */
    .aim-window {
      width: 100%;
      max-width: 680px;
      background: #ece9d8;
      border: 3px solid #0055ea;
      border-radius: 8px 8px 4px 4px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0,0,0,0.3);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Windows XP Luna Titlebar */
    .titlebar {
      background: linear-gradient(180deg, #0058ee 0%, #3593ff 4%, #288eff 6%, #0058ee 8%, #0055ea 14%, #0045d0 68%, #0030a0 100%);
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff;
      font-weight: bold;
      font-size: 12px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
      user-select: none;
    }

    .titlebar-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .aim-icon {
      width: 16px;
      height: 16px;
      background: #ffcc00;
      border-radius: 3px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #990000;
      font-weight: 900;
      border: 1px solid #cc9900;
    }

    .window-controls {
      display: flex;
      gap: 3px;
    }

    .win-btn {
      width: 20px;
      height: 20px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.7);
      color: #ffffff;
      font-size: 11px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      cursor: default;
    }

    .btn-min, .btn-max {
      background: linear-gradient(180deg, #3c8dff 0%, #1055c8 100%);
    }

    .btn-close {
      background: linear-gradient(180deg, #e76049 0%, #b8220f 100%);
    }

    /* Menubar */
    .menubar {
      background: #ece9d8;
      border-bottom: 1px solid #d4d0c8;
      padding: 3px 8px;
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #333;
    }

    .menubar span {
      cursor: default;
    }

    .menubar span:first-letter {
      text-decoration: underline;
    }

    /* Buddy Selector Tabs (for All Chats export) */
    .buddy-tabs-bar {
      display: flex;
      background: #dcd8c8;
      border-bottom: 1px solid #b5b09f;
      padding: 4px 6px 0 6px;
      overflow-x: auto;
      gap: 3px;
    }

    .buddy-tab {
      background: #ece9d8;
      border-top: 1px solid #ffffff;
      border-left: 1px solid #ffffff;
      border-right: 1px solid #808080;
      border-bottom: none;
      padding: 4px 8px;
      font-size: 10.5px;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      border-radius: 4px 4px 0 0;
      color: #444;
    }

    .buddy-tab.active {
      background: #ffffff;
      font-weight: bold;
      color: #002266;
      border-bottom: 1px solid #ffffff;
      margin-bottom: -1px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      display: inline-block;
    }

    .b-count {
      color: #777;
      font-size: 9px;
    }

    /* Buddy Info Header */
    .buddy-info-header {
      background: #f0ede0;
      padding: 8px 12px;
      border-bottom: 1px solid #7f9db9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .buddy-main-name {
      font-size: 13px;
      font-weight: bold;
      color: #002266;
    }

    .buddy-badge {
      font-size: 10px;
      background: #dfdcc8;
      color: #333;
      padding: 1px 6px;
      border-radius: 2px;
      border: 1px solid #a09d8d;
      margin-left: 6px;
    }

    .buddy-status-text {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    .export-stamp {
      font-size: 9.5px;
      color: #777;
      text-align: right;
    }

    /* Message Stream Area */
    .chat-body {
      background: #ffffff;
      min-height: 280px;
      max-height: 500px;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-bottom: 1px solid #7f9db9;
    }

    .msg-row {
      font-size: 11.5px;
      line-height: 1.4;
    }

    .msg-header {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .sender-me {
      color: #c00000;
    }

    .sender-buddy {
      color: #0000cc;
    }

    .msg-time {
      font-size: 9.5px;
      color: #888888;
      font-weight: normal;
      margin-left: 6px;
    }

    .msg-body {
      color: #111111;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'Tahoma', sans-serif;
    }

    .msg-buzz {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 4px;
      padding: 6px 10px;
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      color: #92400e;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .empty-state {
      text-align: center;
      color: #999;
      font-size: 11px;
      padding: 40px 0;
      font-style: italic;
    }

    /* Search Filter Area */
    .search-bar-wrap {
      background: #f4f2e6;
      padding: 6px 12px;
      border-bottom: 1px solid #d4d0c8;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-input {
      flex: 1;
      padding: 3px 6px;
      font-size: 11px;
      border: 1px solid #7f9db9;
      background: #ffffff;
      outline: none;
      font-family: inherit;
    }

    .search-input:focus {
      border-color: #0055ea;
    }

    /* Window Footer */
    .aim-footer {
      background: #ece9d8;
      padding: 6px 10px;
      font-size: 10px;
      color: #666;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .terminal-stamp {
      font-family: monospace;
      color: #444;
    }

    /* Print styles */
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .top-action-bar, .search-bar-wrap, .buddy-tabs-bar {
        display: none !important;
      }
      .aim-window {
        box-shadow: none;
        border: 1px solid #000;
        max-width: 100%;
      }
      .chat-body {
        max-height: none;
        overflow: visible;
      }
    }
  </style>
</head>
<body>

  <!-- Top Utility Bar -->
  <div class="top-action-bar">
    <div class="brand">
      <span class="aim-icon">AIM</span>
      <span>AOL Instant Messenger Chat Export</span>
    </div>
    <div class="btn-group">
      <button class="action-btn" onclick="window.print()">
        🖨️ Print / Save PDF
      </button>
      <button class="action-btn" onclick="copyEntireTranscript()">
        📋 Copy Transcript
      </button>
    </div>
  </div>

  <!-- Main AIM Window -->
  <div class="aim-window">
    <!-- XP Titlebar -->
    <div class="titlebar">
      <div class="titlebar-left">
        <span class="aim-icon">AIM</span>
        <span id="windowTitle">DirectIM - ${escapeHtml(buddyScreenName)}</span>
      </div>
      <div class="window-controls">
        <div class="win-btn btn-min">_</div>
        <div class="win-btn btn-max">□</div>
        <div class="win-btn btn-close">✕</div>
      </div>
    </div>

    <!-- Menubar -->
    <div class="menubar">
      <span>File</span>
      <span>Edit</span>
      <span>Insert</span>
      <span>People</span>
      <span>Help</span>
    </div>

    ${exportAll ? `<div class="buddy-tabs-bar" id="buddyTabsBar">${buddyListHtml}</div>` : ''}

    <!-- Search / Filter bar -->
    <div class="search-bar-wrap">
      <span style="font-size: 11px; color: #555;">🔍 Filter:</span>
      <input type="text" id="filterInput" class="search-input" placeholder="Type to search chat transcript..." oninput="filterMessages()">
      <button class="action-btn" onclick="clearFilter()" style="font-size: 10px; padding: 2px 6px;">Clear</button>
    </div>

    <!-- Buddy Profile Header -->
    <div class="buddy-info-header">
      <div>
        <div style="display: flex; align-items: center;">
          <span class="buddy-main-name" id="currentBuddyName">${escapeHtml(buddyScreenName)}</span>
          <span class="buddy-badge" id="currentBuddyBadge">${escapeHtml(persona?.displayName || 'Buddy')}</span>
        </div>
        <div class="buddy-status-text" id="currentBuddyStatus">${escapeHtml(persona?.statusMessage || 'Direct Connection Active')}</div>
      </div>
      <div class="export-stamp">
        <div>Exported: ${exportDate}</div>
        <div style="color: #006600; font-weight: bold; margin-top: 1px;">Verified Cyber Café Log</div>
      </div>
    </div>

    <!-- Chat Message Stream -->
    <div class="chat-body" id="chatStream">
      ${renderMessageList(messages, buddyScreenName)}
    </div>

    <!-- Footer -->
    <div class="aim-footer">
      <span class="terminal-stamp">Terminal: Cabin 04 @ Cyber Café 2004</span>
      <span>AOL Instant Messenger (v5.9) Log Archive</span>
    </div>
  </div>

  <script>
    const allChatsData = ${chatsDataJson || '{}'};
    let activeBuddy = "${escapeHtml(buddyScreenName)}";

    function filterMessages() {
      const query = document.getElementById('filterInput').value.toLowerCase();
      const rows = document.querySelectorAll('#chatStream .msg-row, #chatStream .msg-buzz');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    function clearFilter() {
      document.getElementById('filterInput').value = '';
      filterMessages();
    }

    function copyEntireTranscript() {
      const text = document.getElementById('chatStream').innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert('Chat transcript copied to clipboard!');
      }).catch(() => {
        alert('Please select and copy the chat text manually.');
      });
    }

    function switchBuddy(buddyName) {
      activeBuddy = buddyName;
      document.querySelectorAll('.buddy-tab').forEach(tab => {
        if (tab.innerText.includes(buddyName)) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      document.getElementById('windowTitle').innerText = 'DirectIM - ' + buddyName;
      document.getElementById('currentBuddyName').innerText = buddyName;
      
      const msgs = allChatsData[buddyName] || [];
      const stream = document.getElementById('chatStream');
      
      if (msgs.length === 0) {
        stream.innerHTML = '<div class="empty-state">No messages recorded with ' + buddyName + '</div>';
        return;
      }

      let html = '';
      msgs.forEach(m => {
        if (m.isBuzz) {
          html += '<div class="msg-buzz"><span class="buzz-icon">🔔</span><span class="buzz-text">' + escape(m.text) + '</span><span class="msg-time">' + escape(m.time) + '</span></div>';
        } else {
          const isMe = m.from === 'me';
          const sender = isMe ? 'Guest_Cabin04' : buddyName;
          const sClass = isMe ? 'sender-me' : 'sender-buddy';
          html += '<div class="msg-row"><div class="msg-header"><span class="msg-sender ' + sClass + '">' + escape(sender) + ':</span><span class="msg-time">' + escape(m.time) + '</span></div><div class="msg-body">' + escape(m.text) + '</div></div>';
        }
      });
      stream.innerHTML = html;
      clearFilter();
    }

    function escape(str) {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  </script>
</body>
</html>`;
}

/**
 * Triggers an instant download of the styled .html chat file in browser
 */
export function downloadAimChatHtml(options: ExportChatOptions) {
  const htmlContent = generateAimChatHtml(options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = options.exportAll
    ? `AIM_All_Chat_Logs_${dateStr}.html`
    : `AIM_Chat_${options.buddyScreenName}_${dateStr}.html`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
