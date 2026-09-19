import React, { useState, useEffect, useRef } from 'react';
import {
  playMouseClick,
  playKeyClick,
  playHddSeek,
} from '../../utils/audio';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Home,
  Search,
  Star,
  Globe,
  Lock,
  Mail,
  ExternalLink,
  Loader2,
  BookOpen,
  Compass,
  Sparkles,
  TrendingUp,
  History,
} from 'lucide-react';

type VintagePortal =
  | 'myspace'
  | 'geocities'
  | 'newgrounds'
  | 'neopets'
  | 'hotmail'
  | 'mapquest'
  | 'ebay';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

interface LiveFeedItem {
  title: string;
  url: string;
  category: string;
  source: string;
}

export const InternetExplorerApp: React.FC = () => {
  const [browserMode, setBrowserMode] = useState<'home' | 'live' | 'vintage'>('home');
  const [currentUrl, setCurrentUrl] = useState('http://home.msn.com');
  const [inputUrl, setInputUrl] = useState('http://home.msn.com');
  const [activeVintageTab, setActiveVintageTab] = useState<VintagePortal>('myspace');
  const [liveProxyUrl, setLiveProxyUrl] = useState('');
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [pageTitle, setPageTitle] = useState('MSN.com — Microsoft Internet Explorer');
  const [statusText, setStatusText] = useState('Done');
  const [isLoading, setIsLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Live feed state
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Browser History
  const [history, setHistory] = useState<
    Array<{ url: string; mode: 'home' | 'live' | 'vintage'; vintageTab?: VintagePortal; title: string }>
  >([{ url: 'http://home.msn.com', mode: 'home', title: 'MSN Home' }]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch live trending feeds on startup
  useEffect(() => {
    const fetchLiveFeed = async () => {
      setIsLoadingFeed(true);
      try {
        const res = await fetch('/api/live-feed');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            setLiveFeed(data.items);
          }
        }
      } catch (err) {
        console.warn('Failed to load live feed:', err);
      } finally {
        setIsLoadingFeed(false);
      }
    };
    fetchLiveFeed();
  }, []);

  // Listen for iframe link navigation messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'IE_NAVIGATE' && event.data.url) {
        const destUrl = event.data.url;
        navigateToLiveUrl(destUrl, false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [historyIdx, history]);

  const pushHistory = (item: {
    url: string;
    mode: 'home' | 'live' | 'vintage';
    vintageTab?: VintagePortal;
    title: string;
  }) => {
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(item);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
  };

  const navigateToHome = () => {
    playMouseClick();
    playHddSeek();
    setIsLoading(true);
    setStatusText('Opening MSN Home...');
    setCurrentUrl('http://home.msn.com');
    setInputUrl('http://home.msn.com');
    setBrowserMode('home');
    setPageTitle('MSN.com — Microsoft Internet Explorer');
    pushHistory({ url: 'http://home.msn.com', mode: 'home', title: 'MSN Home' });
    setTimeout(() => {
      setIsLoading(false);
      setStatusText('Done');
    }, 300);
  };

  const navigateToLiveUrl = (rawUrl: string, addToHistory = true, useReader = false) => {
    playMouseClick();
    playHddSeek();
    setIsLoading(true);
    setStatusText('Connecting to site...');

    let formattedUrl = rawUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setCurrentUrl(formattedUrl);
    setInputUrl(formattedUrl);
    setBrowserMode('live');
    setIsReaderMode(useReader);

    const proxyEndpoint = useReader
      ? `/api/reader?url=${encodeURIComponent(formattedUrl)}`
      : `/api/proxy?url=${encodeURIComponent(formattedUrl)}`;

    setLiveProxyUrl(proxyEndpoint);
    setPageTitle(`${formattedUrl} — Microsoft Internet Explorer`);

    if (addToHistory) {
      pushHistory({
        url: formattedUrl,
        mode: 'live',
        title: formattedUrl,
      });
    }

    setTimeout(() => {
      setStatusText('Downloading page elements...');
    }, 400);
  };

  const navigateToVintage = (tab: VintagePortal) => {
    playMouseClick();
    playHddSeek();
    setIsLoading(true);
    setStatusText('Opening vintage archive...');

    const urlMap: Record<VintagePortal, string> = {
      myspace: 'http://www.myspace.com/xXemo_rawrXx',
      geocities: 'http://www.geocities.com/cyber_den_2004',
      newgrounds: 'http://www.newgrounds.com',
      neopets: 'http://www.neopets.com/petlookup.phtml',
      hotmail: 'http://mail.hotmail.com/inbox',
      mapquest: 'http://www.mapquest.com/directions',
      ebay: 'http://www.ebay.com',
    };

    const titleMap: Record<VintagePortal, string> = {
      myspace: 'MySpace.com — a place for friends',
      geocities: 'The Cyber Den 2004 — GeoCities',
      newgrounds: 'Newgrounds.com — Everything, By Everyone',
      neopets: 'Neopets — Virtual Pet Community',
      hotmail: 'MSN Hotmail — Inbox',
      mapquest: 'MapQuest Maps — Driving Directions',
      ebay: "eBay — The World's Online Marketplace",
    };

    const targetUrl = urlMap[tab];
    setCurrentUrl(targetUrl);
    setInputUrl(targetUrl);
    setBrowserMode('vintage');
    setActiveVintageTab(tab);
    setPageTitle(`${titleMap[tab]} — Microsoft Internet Explorer`);

    pushHistory({
      url: targetUrl,
      mode: 'vintage',
      vintageTab: tab,
      title: titleMap[tab],
    });

    setTimeout(() => {
      setIsLoading(false);
      setStatusText('Done');
    }, 350);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputUrl.trim();
    if (!query) return;

    const lower = query.toLowerCase();

    // Check for vintage portal shortcuts
    if (lower === 'myspace' || lower.includes('myspace.com')) {
      navigateToVintage('myspace');
    } else if (lower === 'geocities' || lower.includes('geocities.com')) {
      navigateToVintage('geocities');
    } else if (lower === 'newgrounds' || lower.includes('newgrounds.com')) {
      navigateToVintage('newgrounds');
    } else if (lower === 'neopets' || lower.includes('neopets.com')) {
      navigateToVintage('neopets');
    } else if (lower === 'hotmail' || lower.includes('hotmail.com')) {
      navigateToVintage('hotmail');
    } else if (lower === 'mapquest' || lower.includes('mapquest.com')) {
      navigateToVintage('mapquest');
    } else if (lower === 'ebay' || lower.includes('ebay.com')) {
      navigateToVintage('ebay');
    } else if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.includes('.com') ||
      lower.includes('.org') ||
      lower.includes('.net') ||
      lower.includes('.io') ||
      lower.includes('.edu') ||
      lower.includes('.gov') ||
      lower.includes('.me') ||
      lower.includes('.co') ||
      lower.includes('.info') ||
      lower.includes('localhost')
    ) {
      // Direct live website navigation!
      navigateToLiveUrl(query);
    } else {
      // Search query entered in address bar -> Run live multi-engine search!
      setBrowserMode('home');
      setSearchQuery(query);
      performSearch(query);
    }
  };

  // Perform live web search
  const performSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    playMouseClick();
    setIsSearching(true);
    setHasSearched(true);
    setStatusText(`Searching web index for "${queryText}"...`);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(queryText)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn('Search failed', err);
      setSearchResults([
        {
          title: `${queryText} — Wikipedia`,
          url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(queryText)}`,
          snippet: `Search real-time encyclopedic entries and articles for "${queryText}".`,
          source: 'Wikipedia',
        },
      ]);
    } finally {
      setIsSearching(false);
      setStatusText('Done');
    }
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      playMouseClick();
      playHddSeek();
      const prevIdx = historyIdx - 1;
      const target = history[prevIdx];
      setHistoryIdx(prevIdx);
      setCurrentUrl(target.url);
      setInputUrl(target.url);
      setPageTitle(`${target.title} — Microsoft Internet Explorer`);
      setBrowserMode(target.mode);

      if (target.mode === 'vintage' && target.vintageTab) {
        setActiveVintageTab(target.vintageTab);
      } else if (target.mode === 'live') {
        setLiveProxyUrl(`/api/proxy?url=${encodeURIComponent(target.url)}`);
      }
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      playMouseClick();
      playHddSeek();
      const nextIdx = historyIdx + 1;
      const target = history[nextIdx];
      setHistoryIdx(nextIdx);
      setCurrentUrl(target.url);
      setInputUrl(target.url);
      setPageTitle(`${target.title} — Microsoft Internet Explorer`);
      setBrowserMode(target.mode);

      if (target.mode === 'vintage' && target.vintageTab) {
        setActiveVintageTab(target.vintageTab);
      } else if (target.mode === 'live') {
        setLiveProxyUrl(`/api/proxy?url=${encodeURIComponent(target.url)}`);
      }
    }
  };

  const handleRefresh = () => {
    playMouseClick();
    setIsLoading(true);
    setStatusText('Refreshing page...');

    if (browserMode === 'live' && iframeRef.current) {
      const currentEndpoint = isReaderMode ? '/api/reader' : '/api/proxy';
      iframeRef.current.src = `${currentEndpoint}?url=${encodeURIComponent(currentUrl)}&t=${Date.now()}`;
    }

    setTimeout(() => {
      setIsLoading(false);
      setStatusText('Done');
    }, 500);
  };

  const toggleReaderMode = () => {
    const nextState = !isReaderMode;
    setIsReaderMode(nextState);
    if (browserMode === 'live') {
      const nextEndpoint = nextState ? '/api/reader' : '/api/proxy';
      setLiveProxyUrl(`${nextEndpoint}?url=${encodeURIComponent(currentUrl)}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#ece9d8] text-[#111] font-tahoma text-[11px] select-text">
      {/* 1. Menu Bar */}
      <div className="bg-[#ece9d8] px-2 py-0.5 border-b border-[#d4d0c8] flex items-center justify-between text-[11px] select-none">
        <div className="flex items-center gap-3">
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">File</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">Edit</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">View</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">Favorites</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">Tools</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">Help</span>
        </div>

        {/* Mode Selector Tabs in the Menu Row */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              if (browserMode === 'vintage') {
                navigateToHome();
              }
            }}
            className={`px-2 py-0.5 rounded-xs border cursor-pointer flex items-center gap-1 font-bold ${
              browserMode !== 'vintage'
                ? 'bg-[#003399] text-white border-[#002266]'
                : 'bg-[#dcd8c8] hover:bg-white text-gray-800 border-gray-400'
            }`}
          >
            <Globe size={11} />
            <span>Live Web Engine</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              navigateToVintage('myspace');
            }}
            className={`px-2 py-0.5 rounded-xs border cursor-pointer flex items-center gap-1 font-bold ${
              browserMode === 'vintage'
                ? 'bg-[#990033] text-white border-[#660022]'
                : 'bg-[#dcd8c8] hover:bg-white text-gray-800 border-gray-400'
            }`}
          >
            <Sparkles size={11} className="text-yellow-300" />
            <span>2004 Time Capsule</span>
          </button>
        </div>
      </div>

      {/* 2. Classic IE6 Large Navigation Toolbar */}
      <div className="bg-[#ece9d8] px-2 py-1 border-b border-[#d4d0c8] flex items-center justify-between gap-1 select-none">
        <div className="flex items-center gap-1">
          {/* Back */}
          <button
            type="button"
            disabled={historyIdx <= 0}
            onClick={handleBack}
            className="flex items-center gap-1 px-1.5 py-0.5 border border-transparent hover:border-[#808080] active:border-white rounded-xs disabled:opacity-40 cursor-pointer"
            title="Back (Alt + Left Arrow)"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#8fd35f] to-[#458b1b] flex items-center justify-center text-white shadow-xs">
              <ArrowLeft size={12} strokeWidth={3} />
            </div>
            <span className="font-bold">Back</span>
          </button>

          {/* Forward */}
          <button
            type="button"
            disabled={historyIdx >= history.length - 1}
            onClick={handleForward}
            className="flex items-center gap-1 px-1.5 py-0.5 border border-transparent hover:border-[#808080] active:border-white rounded-xs disabled:opacity-40 cursor-pointer"
            title="Forward (Alt + Right Arrow)"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#8fd35f] to-[#458b1b] flex items-center justify-center text-white shadow-xs">
              <ArrowRight size={12} strokeWidth={3} />
            </div>
          </button>

          <span className="h-5 border-r border-[#d4d0c8] mx-1" />

          {/* Stop */}
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              setIsLoading(false);
              setStatusText('Done');
            }}
            className="p-1 hover:border border-[#808080] rounded-xs cursor-pointer flex items-center gap-1"
            title="Stop (Esc)"
          >
            <X size={14} className="text-red-600" />
            <span>Stop</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1 hover:border border-[#808080] rounded-xs cursor-pointer flex items-center gap-1"
            title="Refresh (F5)"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin text-blue-600' : 'text-gray-700'} />
            <span>Refresh</span>
          </button>

          {/* Home */}
          <button
            type="button"
            onClick={navigateToHome}
            className="p-1 hover:border border-[#808080] rounded-xs cursor-pointer flex items-center gap-1"
            title="MSN / Home Portal"
          >
            <Home size={14} className="text-amber-700" />
            <span>Home</span>
          </button>

          <span className="h-5 border-r border-[#d4d0c8] mx-1" />

          {/* Search */}
          <button
            type="button"
            onClick={() => {
              setBrowserMode('home');
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:border border-[#808080] rounded-xs cursor-pointer"
          >
            <Search size={13} className="text-blue-600" />
            <span>Search</span>
          </button>

          {/* Favorites */}
          <button
            type="button"
            onClick={() => navigateToLiveUrl('https://en.wikipedia.org')}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:border border-[#808080] rounded-xs cursor-pointer"
          >
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span>Favorites</span>
          </button>

          {/* Mail */}
          <button
            type="button"
            onClick={() => navigateToVintage('hotmail')}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:border border-[#808080] rounded-xs cursor-pointer"
          >
            <Mail size={13} className="text-blue-700" />
            <span>Mail</span>
          </button>
        </div>

        {/* Windows Flag / Spinning Globe Throbber */}
        <div className="w-6 h-6 border border-[#808080] bg-black flex items-center justify-center shadow-inner select-none">
          <div className={`text-[13px] ${isLoading ? 'animate-spin' : ''}`}>🌐</div>
        </div>
      </div>

      {/* 3. Address Bar with Go Action */}
      <form
        onSubmit={handleUrlSubmit}
        className="bg-[#ece9d8] px-2 py-1 border-b border-[#7f9db9] flex items-center gap-2 select-none"
      >
        <span className="text-gray-600 text-[10.5px] font-semibold">Address</span>
        <div className="flex-1 bg-white border border-[#7f9db9] px-2 py-0.5 flex items-center gap-1.5 shadow-inner">
          <Globe size={12} className="text-blue-600 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            placeholder="Type any website (e.g. en.wikipedia.org, wiby.me, news.ycombinator.com) or search query..."
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full bg-transparent border-none outline-none font-tahoma text-[11px] text-[#111]"
          />
        </div>
        <button
          type="submit"
          className="px-2.5 py-0.5 bg-[#ece9d8] hover:bg-[#dfdbcc] active:bg-[#c8c4b4] border-t border-l border-white border-r border-b border-[#808080] font-bold text-[10.5px] cursor-pointer flex items-center gap-1 text-[#002266]"
        >
          <span className="text-green-700 font-bold">➔</span>
          <span>Go</span>
        </button>
      </form>

      {/* 4. Live Quick Links / Bookmarks Bar */}
      <div className="bg-[#f0ede0] px-2 py-0.5 border-b border-[#d4d0c8] flex items-center gap-2 overflow-x-auto text-[10px] select-none">
        <span className="font-bold text-gray-500 shrink-0">Links:</span>
        <button
          type="button"
          onClick={() => navigateToLiveUrl('https://en.wikipedia.org')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0 font-semibold"
        >
          📖 Wikipedia (Live)
        </button>
        <button
          type="button"
          onClick={() => navigateToLiveUrl('https://news.ycombinator.com')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          📰 Hacker News
        </button>
        <button
          type="button"
          onClick={() => navigateToLiveUrl('https://wiby.me')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          🌐 Wiby (Retro Index)
        </button>
        <button
          type="button"
          onClick={() => navigateToLiveUrl('http://frogfind.com')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          🐸 FrogFind (Light Web)
        </button>
        <button
          type="button"
          onClick={() => navigateToLiveUrl('https://archive.org')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          📜 Wayback Archive
        </button>
        <button
          type="button"
          onClick={() => navigateToLiveUrl('https://www.bbc.com')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          🌍 BBC News
        </button>
        <button
          type="button"
          onClick={() => navigateToVintage('myspace')}
          className="text-purple-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0 font-bold ml-auto"
        >
          ⭐ 2004 Portals ➔
        </button>
      </div>

      {/* 5. Main Browser Viewport */}
      <div className="flex-1 bg-white overflow-hidden relative select-text">
        {/* VIEW 1: LIVE HOME PORTAL (MSN / Internet Explorer Home with Real Search & Real Feeds) */}
        {browserMode === 'home' && (
          <div className="w-full h-full overflow-y-auto bg-[#f8f9fa] p-4 flex flex-col">
            {/* Top MSN / Internet Explorer Brand Banner */}
            <div className="max-w-4xl mx-auto w-full space-y-4">
              <div className="bg-gradient-to-r from-[#003399] via-[#2055b5] to-[#003399] text-white p-3 rounded-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                      <span>MSN Internet Explorer Live Portal</span>
                      <span className="bg-yellow-400 text-black text-[9px] px-1.5 py-0.2 rounded-xs font-mono font-bold">
                        ONLINE 2004
                      </span>
                    </div>
                    <div className="text-[10px] text-blue-200">
                      Real-time Live Web Browsing · Multi-Engine Search · Clean Article Reader
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateToLiveUrl('https://en.wikipedia.org/wiki/Portal:Current_events')}
                    className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xs text-[10px] font-bold cursor-pointer"
                  >
                    World Events
                  </button>
                </div>
              </div>

              {/* Live Web Search Box */}
              <div className="bg-white border-2 border-[#7f9db9] p-3.5 rounded-xs shadow-xs">
                <div className="text-[12px] font-bold text-[#002266] mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Search size={14} className="text-blue-600" />
                    <span>Search the Live Internet:</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-normal">
                    Queries Wikipedia, DuckDuckGo & Web Indexes
                  </span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    performSearch(searchQuery);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="Search topics, encyclopedia entries, news, or enter any domain (e.g. apple.com)..."
                    onChange={(e) => {
                      playKeyClick();
                      setSearchQuery(e.target.value);
                    }}
                    className="flex-1 border border-[#7f9db9] p-2 text-[12px] outline-none shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white font-bold text-[11px] rounded-xs cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                    <span>{isSearching ? 'Searching...' : 'Web Search'}</span>
                  </button>
                </form>

                {/* Search Results Display */}
                {hasSearched && (
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                    <div className="text-[10.5px] text-gray-600 flex justify-between items-center">
                      <span>
                        Live Search Results for: <strong>"{searchQuery}"</strong>
                      </span>
                      <span>{searchResults.length} matches found</span>
                    </div>

                    {isSearching ? (
                      <div className="py-6 text-center text-gray-600 flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-blue-600" />
                        <span>Querying live internet index servers...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-4 text-center text-gray-500">
                        No direct results found. Try entering a specific website URL in the address bar!
                      </div>
                    ) : (
                      <div className="space-y-3 divide-y divide-gray-100">
                        {searchResults.map((res, idx) => (
                          <div key={idx} className="pt-2 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => navigateToLiveUrl(res.url)}
                                className="text-[#0000cc] hover:underline font-bold text-[13px] text-left cursor-pointer"
                              >
                                {res.title}
                              </button>
                              {res.source && (
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 border border-blue-200 rounded-xs font-mono">
                                  {res.source}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 text-[11.5px] leading-relaxed">{res.snippet}</p>
                            <div className="text-[#008000] text-[10px] flex items-center gap-2">
                              <span className="truncate max-w-md">{res.url}</span>
                              <span className="text-gray-400">·</span>
                              <button
                                type="button"
                                onClick={() => navigateToLiveUrl(res.url)}
                                className="text-blue-700 hover:underline font-bold cursor-pointer"
                              >
                                ➔ Browse Live
                              </button>
                              <button
                                type="button"
                                onClick={() => navigateToLiveUrl(res.url, true, true)}
                                className="text-amber-800 hover:underline cursor-pointer"
                              >
                                📖 Reader Mode
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live Web Quick Directory Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Live Encylopedia & Retro Engines */}
                <div className="bg-white border border-[#d4d0c8] p-3 rounded-xs space-y-2 shadow-xs">
                  <div className="font-bold text-[11.5px] text-[#002266] border-b border-gray-200 pb-1 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-blue-600" />
                    <span>Real Live Encyclopedias</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div
                      onClick={() => navigateToLiveUrl('https://en.wikipedia.org/wiki/Main_Page')}
                      className="p-1.5 hover:bg-blue-50 rounded-xs cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <div className="font-bold text-blue-800">Wikipedia Main Portal</div>
                      <div className="text-[10px] text-gray-500">6,700,000+ free encyclopedia articles</div>
                    </div>
                    <div
                      onClick={() => navigateToLiveUrl('https://wiby.me')}
                      className="p-1.5 hover:bg-blue-50 rounded-xs cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <div className="font-bold text-blue-800">Wiby Search Engine</div>
                      <div className="text-[10px] text-gray-500">Classic, indie, and early web search index</div>
                    </div>
                    <div
                      onClick={() => navigateToLiveUrl('http://frogfind.com')}
                      className="p-1.5 hover:bg-blue-50 rounded-xs cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <div className="font-bold text-blue-800">FrogFind 2004</div>
                      <div className="text-[10px] text-gray-500">Lightweight text-first browsing for vintage PCs</div>
                    </div>
                  </div>
                </div>

                {/* 2. Live Tech & News Feed */}
                <div className="bg-white border border-[#d4d0c8] p-3 rounded-xs space-y-2 shadow-xs">
                  <div className="font-bold text-[11.5px] text-[#002266] border-b border-gray-200 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-green-600" />
                      <span>Live Tech News</span>
                    </div>
                    {isLoadingFeed && <Loader2 size={10} className="animate-spin text-gray-400" />}
                  </div>
                  <div className="space-y-1 text-[10.5px]">
                    {liveFeed.length === 0 && !isLoadingFeed ? (
                      <div className="text-gray-500 text-[10px] py-2">Loading live feeds...</div>
                    ) : (
                      liveFeed.slice(0, 4).map((feed, idx) => (
                        <div
                          key={idx}
                          onClick={() => navigateToLiveUrl(feed.url)}
                          className="p-1 hover:bg-green-50 rounded-xs cursor-pointer border border-transparent hover:border-green-200 truncate"
                        >
                          <div className="text-blue-900 font-semibold truncate hover:underline">
                            {feed.title}
                          </div>
                          <div className="text-[9px] text-gray-500 flex justify-between">
                            <span>{feed.source}</span>
                            <span className="text-green-700 font-medium">LIVE</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. 2004 Period Portals Time Capsule */}
                <div className="bg-[#fffdf5] border border-[#d4c890] p-3 rounded-xs space-y-2 shadow-xs">
                  <div className="font-bold text-[11.5px] text-[#994400] border-b border-[#ebdca0] pb-1 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-600" />
                    <span>2004 Vintage Portals</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => navigateToVintage('myspace')}
                      className="p-1.5 bg-white hover:bg-orange-50 border border-gray-300 rounded-xs text-left cursor-pointer"
                    >
                      <div className="font-bold text-orange-700">🎵 MySpace</div>
                      <div className="text-gray-500 text-[8.5px]">Top 8 friends</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToVintage('geocities')}
                      className="p-1.5 bg-white hover:bg-blue-50 border border-gray-300 rounded-xs text-left cursor-pointer"
                    >
                      <div className="font-bold text-blue-700">💾 GeoCities</div>
                      <div className="text-gray-500 text-[8.5px]">Cyber Den 2004</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToVintage('newgrounds')}
                      className="p-1.5 bg-white hover:bg-red-50 border border-gray-300 rounded-xs text-left cursor-pointer"
                    >
                      <div className="font-bold text-red-700">⚡ Newgrounds</div>
                      <div className="text-gray-500 text-[8.5px]">Flash Portal</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToVintage('neopets')}
                      className="p-1.5 bg-white hover:bg-yellow-50 border border-gray-300 rounded-xs text-left cursor-pointer"
                    >
                      <div className="font-bold text-yellow-700">🐾 Neopets</div>
                      <div className="text-gray-500 text-[8.5px]">Virtual Pets</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToVintage('hotmail')}
                      className="p-1.5 bg-white hover:bg-blue-50 border border-gray-300 rounded-xs text-left cursor-pointer"
                    >
                      <div className="font-bold text-blue-700">📬 Hotmail</div>
                      <div className="text-gray-500 text-[8.5px]">2004 Inbox</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToVintage('ebay')}
                      className="p-1.5 bg-white hover:bg-green-50 border border-gray-300 rounded-xs text-left cursor-pointer"
                    >
                      <div className="font-bold text-green-700">🏷️ eBay</div>
                      <div className="text-gray-500 text-[8.5px]">Online Auctions</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LIVE WEB BROWSING PROXY / READER (Real live internet sites inside 2004 IE6 frame) */}
        {browserMode === 'live' && (
          <div className="w-full h-full flex flex-col bg-white">
            {/* Live Web Action Header Bar */}
            <div className="bg-[#f0f4f9] border-b border-[#c8d8ec] px-3 py-1 text-[11px] text-gray-700 flex items-center justify-between select-none">
              <div className="flex items-center gap-2 truncate max-w-[65%]">
                <Globe size={13} className="text-blue-600 shrink-0" />
                <span className="font-mono text-[10.5px] truncate text-[#002266] font-semibold">{currentUrl}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Reader View Toggle */}
                <button
                  type="button"
                  onClick={toggleReaderMode}
                  className={`px-2 py-0.5 rounded-xs border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                    isReaderMode
                      ? 'bg-[#003399] text-white border-[#002266]'
                      : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                  title="Toggle Fast Reader Mode"
                >
                  <BookOpen size={11} />
                  <span>{isReaderMode ? 'Reader Active' : 'Reader View'}</span>
                </button>

                {/* External popout */}
                <button
                  type="button"
                  onClick={() => window.open(currentUrl, '_blank')}
                  className="px-2 py-0.5 bg-white hover:bg-gray-100 text-blue-700 border border-gray-300 rounded-xs flex items-center gap-1 text-[10px] cursor-pointer"
                  title="Open site in new browser tab"
                >
                  <ExternalLink size={10} />
                  <span>Popout</span>
                </button>
              </div>
            </div>

            {/* Live Proxy Frame */}
            <iframe
              ref={iframeRef}
              src={liveProxyUrl}
              title={currentUrl}
              onLoad={() => {
                setIsLoading(false);
                setStatusText('Done');
              }}
              className="flex-1 w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}

        {/* VIEW 3: 2004 VINTAGE PORTALS TIME CAPSULE */}
        {browserMode === 'vintage' && (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#ece9d8]">
            {/* Vintage Portals Tab Selector */}
            <div className="max-w-3xl mx-auto mb-3 flex items-center gap-1 border-b border-[#7f9db9] pb-1 overflow-x-auto text-[10.5px]">
              {[
                { id: 'myspace', label: 'MySpace Profile' },
                { id: 'geocities', label: 'GeoCities WebRing' },
                { id: 'newgrounds', label: 'Newgrounds Flash' },
                { id: 'neopets', label: 'Neopets Central' },
                { id: 'hotmail', label: 'MSN Hotmail' },
                { id: 'mapquest', label: 'MapQuest' },
                { id: 'ebay', label: 'eBay 2004' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigateToVintage(tab.id as VintagePortal)}
                  className={`px-2.5 py-1 border rounded-t-xs cursor-pointer font-semibold ${
                    activeVintageTab === tab.id
                      ? 'bg-white text-[#002266] border-[#7f9db9] border-b-white -mb-[2px]'
                      : 'bg-[#dfdbcc] hover:bg-white text-gray-700 border-gray-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* MYSPACE PROFILE */}
            {activeVintageTab === 'myspace' && (
              <div className="max-w-2xl mx-auto bg-[#0a0a0f] text-[#dddddd] p-4 border-2 border-[#334466] shadow-lg">
                <div className="bg-[#003399] text-white p-1.5 flex justify-between items-center text-[10px] mb-3">
                  <span className="font-bold">MySpace.com | a place for friends</span>
                  <div className="flex gap-2">
                    <span>Home</span> | <span>Browse</span> | <span>Search</span> | <span>Invite</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 border border-gray-700 p-2 bg-[#141420]">
                    <div className="font-bold text-[14px] text-orange-400">xX_rawr_xD_2004_Xx</div>
                    <div className="text-[10px] text-gray-400">"it's not a phase mom"</div>

                    <div className="my-2 w-full h-36 bg-gradient-to-b from-purple-900 to-black border border-gray-600 flex items-center justify-center text-center p-2 text-[11px]">
                      📷 [Webcam Self-Portrait with mirror flash]
                    </div>

                    <div className="text-[10px] space-y-1 text-gray-300">
                      <div><strong>Mood:</strong> melancholic 🖤</div>
                      <div><strong>Status:</strong> at cyber cafe cabin 04</div>
                      <div><strong>City:</strong> Austin, TX</div>
                      <div><strong>Member Since:</strong> 03/14/2004</div>
                    </div>

                    <div className="mt-3 border border-gray-700 p-1.5 bg-black/50 text-[10px] space-y-1">
                      <div className="text-orange-400 font-bold">Contacting Me:</div>
                      <div className="text-blue-400 underline cursor-pointer">✉️ Send Message</div>
                      <div className="text-blue-400 underline cursor-pointer">➕ Add to Friends</div>
                      <div className="text-blue-400 underline cursor-pointer">⭐ Add to Favorites</div>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-3">
                    <div className="bg-[#1b2230] border border-[#ff6600] p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">▶️</span>
                        <div>
                          <div className="text-orange-400 font-bold text-[11px]">Evanescence - Bring Me To Life.mp3</div>
                          <div className="text-[9px] text-gray-400">Autoplaying profile song (buffering 100%)</div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-700 p-2.5 bg-[#141420]">
                      <div className="text-orange-400 font-bold text-[12px] border-b border-gray-700 pb-1 mb-1.5">
                        About Me:
                      </div>
                      <p className="text-[10.5px] leading-relaxed text-gray-300">
                        hey welcome 2 my profile. please don't steal my HTML codes or glitter graphics!!
                        i spend most of my weekends at the cyber cafe playing Counter-Strike and chatting on AIM.
                        leave a comment or i'll remove you from my top 8 lol.
                      </p>
                      <div className="mt-2 text-[10px] text-pink-400">
                        Bands: The Used, Taking Back Sunday, My Chemical Romance, Linkin Park, Blink-182.
                      </div>
                    </div>

                    <div className="border border-gray-700 p-2 bg-[#141420]">
                      <div className="text-orange-400 font-bold text-[12px] border-b border-gray-700 pb-1 mb-2">
                        xX_rawr_Xx's Friend Space (Top 8):
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[9px]">
                        {[
                          { name: 'Tom', title: 'Your first friend' },
                          { name: 'xX_bhavya_core_Xx', title: 'bestie 4ever' },
                          { name: 'sk8rboi', title: 'skate crew' },
                          { name: 'HaloMaster', title: 'LAN partner' },
                          { name: 'punkrockgirl', title: 'concert buddy' },
                          { name: 'Mike', title: 'school' },
                          { name: 'Dave', title: 'guitarist' },
                          { name: 'Cabin04 Admin', title: 'cyber cafe' },
                        ].map((friend) => (
                          <div key={friend.name} className="border border-gray-800 p-1 bg-black/40">
                            <div className="w-full h-10 bg-gray-800 flex items-center justify-center text-[10px]">
                              👤
                            </div>
                            <div className="text-blue-400 font-bold truncate mt-1">{friend.name}</div>
                            <div className="text-gray-500 truncate text-[8px]">{friend.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GEOCITIES */}
            {activeVintageTab === 'geocities' && (
              <div className="max-w-xl mx-auto bg-[#000033] text-[#ffff00] p-4 border-4 border-double border-[#ff00ff] font-terminal text-center">
                <div className="text-2xl font-bold tracking-widest text-[#00ffff] mb-2 animate-pulse">
                  ★★★ WELCOME TO THE CYBER DEN 2004 ★★★
                </div>
                <div className="text-xs text-pink-400 mb-4">
                  Best viewed in 800x600 resolution with Internet Explorer 5.0+
                </div>

                <div className="inline-block border-2 border-yellow-400 p-2 bg-black text-yellow-400 font-bold text-xs mb-4">
                  🚧 ⚠️ SITE UNDER CONSTRUCTION — PLEASE EXCUSE THE PIXELS ⚠️ 🚧
                </div>

                <div className="text-left text-xs text-white bg-black/70 p-3 border border-blue-500 space-y-2 font-mono">
                  <p>Hello websurfer! You have reached node #482 on the Cyber Highway WebRing.</p>
                  <p>Here you will find:</p>
                  <ul className="list-disc pl-5 text-green-400">
                    <li>Free MIDI audio background downloads</li>
                    <li>Counter Strike 1.6 server console config files</li>
                    <li>ASCII Art collections</li>
                    <li>Winamp classic skins collection</li>
                  </ul>
                </div>

                <div className="mt-6 flex flex-col items-center">
                  <span className="text-[10px] text-gray-300 font-sans">You are visitor number:</span>
                  <div className="bg-black border-2 border-gray-600 px-3 py-1 font-pixel text-2xl text-red-500 tracking-widest mt-1">
                    0 0 4 8 2 9
                  </div>
                </div>
              </div>
            )}

            {/* NEWGROUNDS */}
            {activeVintageTab === 'newgrounds' && (
              <div className="max-w-xl mx-auto bg-[#181818] text-white p-3 border border-[#333]">
                <div className="bg-[#cc5500] text-black font-bold p-2 text-sm flex justify-between items-center">
                  <span>NEWGROUNDS.COM - EVERYTHING BY EVERYONE</span>
                  <span className="text-xs">Flash Portal 2004</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                  <div className="bg-[#282828] p-2 border border-gray-700">
                    <div className="h-16 bg-[#111] flex items-center justify-center text-2xl">⚡</div>
                    <div className="font-bold text-orange-400 mt-1">Alien Hominid</div>
                    <div className="text-[10px] text-gray-400">Score: 4.88 / 5.0</div>
                  </div>
                  <div className="bg-[#282828] p-2 border border-gray-700">
                    <div className="h-16 bg-[#111] flex items-center justify-center text-2xl">🎮</div>
                    <div className="font-bold text-orange-400 mt-1">Pico's School</div>
                    <div className="text-[10px] text-gray-400">Score: 4.92 / 5.0</div>
                  </div>
                  <div className="bg-[#282828] p-2 border border-gray-700">
                    <div className="h-16 bg-[#111] flex items-center justify-center text-2xl">⚔️</div>
                    <div className="font-bold text-orange-400 mt-1">Madness Combat</div>
                    <div className="text-[10px] text-gray-400">Score: 4.95 / 5.0</div>
                  </div>
                </div>
              </div>
            )}

            {/* NEOPETS */}
            {activeVintageTab === 'neopets' && (
              <div className="max-w-lg mx-auto bg-[#fffbe6] border-2 border-[#f0c040] p-4 text-[#333]">
                <div className="text-center pb-2 border-b border-[#f0c040]">
                  <div className="text-2xl font-bold text-[#b07000]">NEOPETS.COM</div>
                  <div className="text-xs text-gray-600">The Greatest Virtual Pet Site in the Universe!</div>
                </div>
                <div className="mt-3 flex gap-3 items-center bg-white p-3 border border-yellow-300">
                  <div className="w-20 h-20 bg-yellow-100 border border-yellow-400 rounded-full flex items-center justify-center text-3xl">
                    🐲
                  </div>
                  <div>
                    <div className="font-bold text-sm text-blue-900">Draco_Scorch_2004</div>
                    <div className="text-xs text-gray-600">Species: Shoyru (Yellow)</div>
                    <div className="text-xs text-green-700 font-bold">Health: 15 / 15 (Delighted)</div>
                    <div className="text-xs text-amber-800">Neopoints: 14,820 NP</div>
                  </div>
                </div>
              </div>
            )}

            {/* HOTMAIL */}
            {activeVintageTab === 'hotmail' && (
              <div className="max-w-xl mx-auto bg-white border border-gray-400 shadow-sm">
                <div className="bg-[#003399] text-white p-2 flex justify-between items-center text-xs">
                  <span className="font-bold">MSN Hotmail - Inbox (4 unread)</span>
                  <span>cyber_surfer04@hotmail.com</span>
                </div>
                <div className="p-2 border-b border-gray-200 flex gap-3 text-[11px] text-blue-800 bg-[#f0ede0]">
                  <span className="font-bold cursor-pointer">New Message</span> |
                  <span className="cursor-pointer">Delete</span> |
                  <span className="cursor-pointer">Junk Mail</span>
                </div>
                <div className="divide-y divide-gray-200">
                  {[
                    { from: 'Mom', subject: 'Fw: Fw: Fw: The cutest puppy ever please read!!', date: 'Aug 14', size: '12 KB' },
                    { from: 'CyberCafe Manager', subject: 'Receipt for Cabin 04 session - 2 hours prepaid', date: 'Aug 14', size: '3 KB' },
                    { from: 'LAN Admin', subject: 'Counter-Strike 1.6 tournament signups this Saturday', date: 'Aug 13', size: '8 KB' },
                    { from: 'eBay Notifications', subject: 'Outbid notice: Vintage Walkman Cassette Player', date: 'Aug 12', size: '5 KB' },
                  ].map((mail) => (
                    <div key={mail.subject} className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">✉️</span>
                        <span className="font-bold text-gray-800 w-28 truncate">{mail.from}</span>
                        <span className="text-blue-900 font-medium truncate">{mail.subject}</span>
                      </div>
                      <span className="text-gray-500 text-[10px]">{mail.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAPQUEST */}
            {activeVintageTab === 'mapquest' && (
              <div className="max-w-lg mx-auto bg-white border border-gray-400 p-3 text-xs">
                <div className="bg-[#006699] text-white p-2 font-bold text-sm">
                  MAPQUEST.COM - Driving Directions (Printable)
                </div>
                <div className="mt-3 p-2 bg-gray-50 border border-gray-300">
                  <div className="font-bold text-gray-800">From: Midnight Cyber Café (Cabin 04)</div>
                  <div className="font-bold text-gray-800">To: 24-Hour Diner & Convenience Store</div>
                </div>
                <div className="mt-3 space-y-1.5 text-[11px] text-gray-700">
                  <div>1. Turn LEFT onto Elm Street — 0.4 miles</div>
                  <div>2. Continue straight past the neon gas station — 1.2 miles</div>
                  <div>3. Turn RIGHT on 4th Ave next to the arcade — 0.2 miles</div>
                  <div className="font-bold text-green-800">Total Distance: 1.8 miles / Est. Time: 4 mins</div>
                </div>
              </div>
            )}

            {/* EBAY */}
            {activeVintageTab === 'ebay' && (
              <div className="max-w-xl mx-auto bg-white border border-gray-300 p-3 text-xs">
                <div className="text-xl font-bold mb-2">
                  <span className="text-red-500">e</span>
                  <span className="text-blue-500">B</span>
                  <span className="text-yellow-500">a</span>
                  <span className="text-green-500">y</span>
                  <span className="text-xs text-gray-500 font-normal ml-2">The World's Online Marketplace</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="border p-2">
                    <div className="font-bold text-blue-800">Apple iPod Mini 4GB (Silver)</div>
                    <div className="text-green-700 font-bold text-sm">$199.00</div>
                    <div className="text-gray-500 text-[10px]">14 bids · 2 hrs left</div>
                  </div>
                  <div className="border p-2">
                    <div className="font-bold text-blue-800">Sony PlayStation 2 Slim + 2 Games</div>
                    <div className="text-green-700 font-bold text-sm">$149.50</div>
                    <div className="text-gray-500 text-[10px]">22 bids · 45 mins left</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Authentic IE6 Status Bar */}
      <div className="bg-[#ece9d8] border-t border-[#d4d0c8] px-2 py-0.5 flex items-center justify-between text-[10px] text-gray-600 select-none">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          <Globe size={11} className="text-blue-700 shrink-0" />
          <span className="truncate">{statusText}</span>
        </div>
        <div className="flex items-center gap-2">
          {browserMode === 'live' && (
            <div className="border-l border-r border-[#808080] px-2 text-[9.5px] text-green-700 font-mono font-bold">
              ● PROXIED LIVE
            </div>
          )}
          <div className="border-r border-[#808080] pr-2 flex items-center gap-1">
            <Lock size={10} className="text-gray-500" />
            <span>Internet (Zone 1)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
