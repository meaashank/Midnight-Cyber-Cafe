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
  Sparkles,
  TrendingUp,
  Settings,
  Check,
  AlertTriangle,
} from 'lucide-react';

export type SearchEngine = 'duckduckgo' | 'google' | 'bing';

export interface SearchEngineConfig {
  id: SearchEngine;
  name: string;
  queryUrl: (q: string) => string;
  homeUrl: string;
  domain: string;
}

export const SEARCH_ENGINES: Record<SearchEngine, SearchEngineConfig> = {
  google: {
    id: 'google',
    name: 'Google',
    queryUrl: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.google.com',
    domain: 'google.com',
  },
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    queryUrl: (q: string) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://duckduckgo.com',
    domain: 'duckduckgo.com',
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    queryUrl: (q: string) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.bing.com',
    domain: 'bing.com',
  },
};

type VintagePortal =
  | 'myspace'
  | 'geocities'
  | 'newgrounds'
  | 'neopets'
  | 'hotmail'
  | 'mapquest'
  | 'ebay';

interface LiveFeedItem {
  title: string;
  url: string;
  category: string;
  source: string;
}

interface FavoriteItem {
  title: string;
  url: string;
  addedAt: number;
}

interface HistoryItem {
  url: string;
  title: string;
  mode: 'home' | 'live' | 'vintage' | 'search' | 'blocked' | 'google' | 'duckduckgo' | 'bing';
  vintageTab?: VintagePortal;
  searchQuery?: string;
  searchEngine?: SearchEngine;
  timestamp: number;
}

const DEFAULT_FAVORITES: FavoriteItem[] = [
  { title: 'Google', url: 'https://www.google.com', addedAt: 1 },
  { title: 'Wikipedia (The Free Encyclopedia)', url: 'https://en.wikipedia.org', addedAt: 2 },
  { title: 'Wiby (The Classic Web Search)', url: 'https://wiby.me', addedAt: 3 },
  { title: 'FrogFind (Retro Text Browser Engine)', url: 'http://frogfind.com', addedAt: 4 },
  { title: 'Hacker News (Tech Discussions)', url: 'https://news.ycombinator.com', addedAt: 5 },
  { title: 'Wayback Machine (Internet Archive)', url: 'https://archive.org', addedAt: 6 },
  { title: 'BBC News World Service', url: 'https://www.bbc.com', addedAt: 7 },
];

const DEFAULT_FEEDS: LiveFeedItem[] = [
  { title: 'W3C Advances Web Content Accessibility Guidelines', url: 'https://www.w3.org', category: 'Tech', source: 'W3C' },
  { title: 'Linux Kernel Development Continues Milestone Release', url: 'https://kernel.org', category: 'Open Source', source: 'Kernel.org' },
  { title: 'Internet Archive Surpasses Petabytes of Historical Web Media', url: 'https://archive.org', category: 'Culture', source: 'Wayback' },
  { title: 'NASA Deep Space Network Tracks Interplanetary Missions', url: 'https://www.nasa.gov', category: 'Science', source: 'NASA' },
];

// Domains that strictly enforce X-Frame-Options: SAMEORIGIN / DENY or CSP frame-ancestors
// (excluding search engines which have dedicated native portals)
const KNOWN_BLOCKED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'github.com',
  'gitlab.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'reddit.com',
  'amazon.com',
  'netflix.com',
  'microsoft.com',
  'apple.com',
  'linkedin.com',
  'twitch.tv',
];

/**
 * Intelligent URL Detection vs Search Query Parser
 */
export function parseUserInput(
  input: string,
  searchEngine: SearchEngine = 'google'
): {
  isSearch: boolean;
  searchQuery?: string;
  targetUrl: string;
  enginePortal?: SearchEngine;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isSearch: false, targetUrl: 'http://home.msn.com' };
  }

  const lower = trimmed.toLowerCase();

  // Check for search engine homepages
  if (lower === 'google' || lower === 'google.com' || lower === 'www.google.com' || lower === 'https://google.com' || lower === 'https://www.google.com') {
    return { isSearch: false, targetUrl: 'https://www.google.com', enginePortal: 'google' };
  }
  if (lower === 'duckduckgo' || lower === 'duckduckgo.com' || lower === 'www.duckduckgo.com' || lower === 'https://duckduckgo.com') {
    return { isSearch: false, targetUrl: 'https://duckduckgo.com', enginePortal: 'duckduckgo' };
  }
  if (lower === 'bing' || lower === 'bing.com' || lower === 'www.bing.com' || lower === 'https://bing.com') {
    return { isSearch: false, targetUrl: 'https://www.bing.com', enginePortal: 'bing' };
  }

  // Check for vintage portal shortcuts
  if (lower === 'myspace' || lower === 'geocities' || lower === 'newgrounds' || lower === 'neopets' || lower === 'hotmail' || lower === 'mapquest' || lower === 'ebay') {
    return { isSearch: false, targetUrl: `vintage://${lower}` };
  }

  // 1. Whitespace -> definitely a search query
  if (/\s/.test(trimmed)) {
    return {
      isSearch: true,
      searchQuery: trimmed,
      targetUrl: SEARCH_ENGINES[searchEngine].queryUrl(trimmed),
    };
  }

  // 2. Explicit protocol
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return { isSearch: false, targetUrl: trimmed };
  }

  // 3. Localhost patterns (localhost, localhost:3000, localhost:8080/path)
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return { isSearch: false, targetUrl: `http://${trimmed}` };
  }

  // 4. IP address (IPv4)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/.test(trimmed)) {
    return { isSearch: false, targetUrl: `http://${trimmed}` };
  }

  // 5. Valid domain name (must contain at least one dot, followed by letters for TLD)
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  if (domainRegex.test(trimmed)) {
    return { isSearch: false, targetUrl: `https://${trimmed}` };
  }

  // 6. Plain single word without dot (e.g. "cats", "computers", "shoes") -> search query!
  return {
    isSearch: true,
    searchQuery: trimmed,
    targetUrl: SEARCH_ENGINES[searchEngine].queryUrl(trimmed),
  };
}

export function isDomainKnownBlocked(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return KNOWN_BLOCKED_DOMAINS.some(
      (blocked) => host === blocked || host.endsWith('.' + blocked)
    );
  } catch {
    return false;
  }
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface InternetExplorerAppProps {
  onTitleChange?: (title: string) => void;
  initialUrl?: string;
}

export const InternetExplorerApp: React.FC<InternetExplorerAppProps> = ({
  onTitleChange,
  initialUrl,
}) => {
  // Search Engine Configuration
  const [searchEngine, setSearchEngine] = useState<SearchEngine>(() => {
    try {
      const saved = localStorage.getItem('ie_search_engine_v2');
      if (saved && (saved === 'google' || saved === 'duckduckgo' || saved === 'bing')) {
        return saved as SearchEngine;
      }
    } catch {
      // ignore
    }
    return 'google';
  });

  // Browser navigation modes
  const [browserMode, setBrowserMode] = useState<
    'home' | 'live' | 'vintage' | 'search' | 'google' | 'duckduckgo' | 'bing'
  >(() => {
    if (initialUrl && initialUrl.includes('google.com')) return 'google';
    return 'home';
  });

  const [currentUrl, setCurrentUrl] = useState(() => initialUrl || 'http://home.msn.com');
  const [inputUrl, setInputUrl] = useState(() => initialUrl || 'http://home.msn.com');
  const [activeVintageTab, setActiveVintageTab] = useState<VintagePortal>('myspace');
  const [pageTitle, setPageTitle] = useState('MSN.com — Microsoft Internet Explorer');
  const [statusText, setStatusText] = useState('Done');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [googleSearchInput, setGoogleSearchInput] = useState('');
  const [duckSearchInput, setDuckSearchInput] = useState('');
  const [bingSearchInput, setBingSearchInput] = useState('');

  // Favorites (Bookmarks) stored in localStorage
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem('ie_favorites_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_FAVORITES;
  });

  // History tracking
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      url: initialUrl || 'http://home.msn.com',
      mode: initialUrl?.includes('google') ? 'google' : 'home',
      title: initialUrl?.includes('google') ? 'Google - Microsoft Internet Explorer' : 'MSN Home',
      timestamp: Date.now(),
    },
  ]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Live feed state
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>(DEFAULT_FEEDS);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Menu bar dropdown active state
  const [activeMenu, setActiveMenu] = useState<
    'file' | 'edit' | 'view' | 'favorites' | 'tools' | 'help' | null
  >(null);

  // Dialog modals
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showOpenUrlModal, setShowOpenUrlModal] = useState(false);
  const [modalInputUrl, setModalInputUrl] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const onTitleChangeRef = useRef(onTitleChange);

  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
  });

  // Notify parent window only when pageTitle actually changes
  useEffect(() => {
    onTitleChangeRef.current?.(pageTitle);
  }, [pageTitle]);

  // Persist search engine preference
  useEffect(() => {
    try {
      localStorage.setItem('ie_search_engine_v2', searchEngine);
    } catch {
      // ignore
    }
  }, [searchEngine]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem('ie_favorites_v2', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch live trending feeds on startup
  useEffect(() => {
    const fetchLiveFeed = async () => {
      setIsLoadingFeed(true);
      try {
        const res = await fetch('/api/live-feed');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setLiveFeed(data.items);
          }
        }
      } catch {
        // Fallback to DEFAULT_FEEDS
      } finally {
        setIsLoadingFeed(false);
      }
    };
    fetchLiveFeed();
  }, []);

  // Push entry to navigation history
  const pushHistory = (item: Omit<HistoryItem, 'timestamp'>) => {
    const nextHist = history.slice(0, historyIdx + 1);
    const newEntry: HistoryItem = { ...item, timestamp: Date.now() };
    nextHist.push(newEntry);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
  };

  // Navigate to MSN Home
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
    }, 250);
  };

  // Navigate to Vintage 2004 Portal
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
    }, 250);
  };

  // Execute a real search query inside the browser window
  const executeSearch = async (
    query: string,
    engineKey: SearchEngine = searchEngine,
    addToHistory = true
  ) => {
    const cleanQ = query.trim();
    if (!cleanQ) return;

    playMouseClick();
    playHddSeek();
    setIsLoading(true);
    setIsSearching(true);
    setStatusText(`Searching the web for "${cleanQ}"...`);

    const engine = SEARCH_ENGINES[engineKey];
    const searchUrl = engine.queryUrl(cleanQ);
    const title = `${cleanQ} - Google Search`;

    setCurrentUrl(searchUrl);
    setInputUrl(searchUrl);
    setActiveSearchQuery(cleanQ);
    setGoogleSearchInput(cleanQ);
    setBrowserMode('search');
    setPageTitle(`${title} — Microsoft Internet Explorer`);

    if (addToHistory) {
      pushHistory({
        url: searchUrl,
        mode: 'search',
        searchQuery: cleanQ,
        searchEngine: engineKey,
        title,
      });
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(cleanQ)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn('Search fetch error:', err);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      setStatusText(`Done (found results for "${cleanQ}")`);
    }
  };

  // Navigate to any live URL or handle engine portals & web proxy
  const navigateToUrl = (rawUrl: string, addToHistory = true) => {
    playMouseClick();
    playHddSeek();
    setIsLoading(true);
    setStatusText('Connecting to site...');

    // If it's a vintage protocol
    if (rawUrl.startsWith('vintage://')) {
      const portal = rawUrl.replace('vintage://', '') as VintagePortal;
      navigateToVintage(portal);
      return;
    }

    let formattedUrl = rawUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      // Check if it's a search term or domain
      const parsed = parseUserInput(formattedUrl, searchEngine);
      if (parsed.isSearch && parsed.searchQuery) {
        executeSearch(parsed.searchQuery, searchEngine, addToHistory);
        return;
      }
      formattedUrl = `https://${formattedUrl}`;
    }

    const lower = formattedUrl.toLowerCase();

    // Check for Google Homepage
    if (
      (lower === 'https://google.com' ||
        lower === 'https://www.google.com' ||
        lower === 'http://google.com' ||
        lower === 'http://www.google.com' ||
        lower.startsWith('https://www.google.com/?') ||
        lower.startsWith('https://google.com/?')) &&
      !lower.includes('/search')
    ) {
      setCurrentUrl('https://www.google.com');
      setInputUrl('https://www.google.com');
      setBrowserMode('google');
      setPageTitle('Google - Microsoft Internet Explorer');
      if (addToHistory) {
        pushHistory({
          url: 'https://www.google.com',
          mode: 'google',
          title: 'Google - Microsoft Internet Explorer',
        });
      }
      setTimeout(() => {
        setIsLoading(false);
        setStatusText('Done');
      }, 250);
      return;
    }

    // Check for Google Search query URL
    if (lower.includes('google.com/search') && lower.includes('q=')) {
      try {
        const u = new URL(formattedUrl);
        const q = u.searchParams.get('q');
        if (q) {
          executeSearch(q, 'google', addToHistory);
          return;
        }
      } catch {
        // ignore
      }
    }

    // Check for DuckDuckGo Homepage
    if (lower.includes('duckduckgo.com') && !lower.includes('?q=')) {
      setCurrentUrl('https://duckduckgo.com');
      setInputUrl('https://duckduckgo.com');
      setBrowserMode('duckduckgo');
      setPageTitle('DuckDuckGo - Microsoft Internet Explorer');
      if (addToHistory) {
        pushHistory({
          url: 'https://duckduckgo.com',
          mode: 'duckduckgo',
          title: 'DuckDuckGo - Microsoft Internet Explorer',
        });
      }
      setTimeout(() => {
        setIsLoading(false);
        setStatusText('Done');
      }, 250);
      return;
    }

    // Check for Bing Homepage
    if (lower.includes('bing.com') && !lower.includes('/search')) {
      setCurrentUrl('https://www.bing.com');
      setInputUrl('https://www.bing.com');
      setBrowserMode('bing');
      setPageTitle('Bing - Microsoft Internet Explorer');
      if (addToHistory) {
        pushHistory({
          url: 'https://www.bing.com',
          mode: 'bing',
          title: 'Bing - Microsoft Internet Explorer',
        });
      }
      setTimeout(() => {
        setIsLoading(false);
        setStatusText('Done');
      }, 250);
      return;
    }

    setCurrentUrl(formattedUrl);
    setInputUrl(formattedUrl);
    setPageTitle(`${formattedUrl} — Microsoft Internet Explorer`);
    setBrowserMode('live');

    if (addToHistory) {
      pushHistory({
        url: formattedUrl,
        mode: 'live',
        title: formattedUrl,
      });
    }

    setTimeout(() => {
      setStatusText('Downloading page elements...');
    }, 300);
  };

  // Address Bar Submit Handler
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputUrl.trim();
    if (!query) return;

    const parsed = parseUserInput(query, searchEngine);

    if (parsed.enginePortal) {
      navigateToUrl(parsed.targetUrl);
    } else if (parsed.isSearch && parsed.searchQuery) {
      executeSearch(parsed.searchQuery, searchEngine);
    } else {
      navigateToUrl(parsed.targetUrl);
    }
  };

  // Back Button
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
      } else if (target.mode === 'search' && target.searchQuery) {
        setActiveSearchQuery(target.searchQuery);
      }
      setStatusText('Done');
    }
  };

  // Forward Button
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
      } else if (target.mode === 'search' && target.searchQuery) {
        setActiveSearchQuery(target.searchQuery);
      }
      setStatusText('Done');
    }
  };

  // Refresh Button
  const handleRefresh = () => {
    playMouseClick();
    playHddSeek();
    setIsLoading(true);
    setStatusText('Refreshing page...');

    if (browserMode === 'live' && iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = currentSrc;
    }

    setTimeout(() => {
      setIsLoading(false);
      setStatusText('Done');
    }, 400);
  };

  // Add current URL to favorites
  const addCurrentToFavorites = () => {
    playMouseClick();
    const title = pageTitle.replace(' — Microsoft Internet Explorer', '');
    const alreadyExists = favorites.some((f) => f.url === currentUrl);
    if (!alreadyExists) {
      setFavorites((prev) => [...prev, { title, url: currentUrl, addedAt: Date.now() }]);
      setStatusText(`Added "${title}" to Favorites`);
    } else {
      setStatusText(`"${title}" is already in Favorites`);
    }
    setActiveMenu(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#ece9d8] text-[#111] font-tahoma text-[11px] select-text relative">
      {/* 1. Classic Windows IE Menu Bar */}
      <div
        ref={menuBarRef}
        className="bg-[#ece9d8] px-2 py-0.5 border-b border-[#d4d0c8] flex items-center justify-between text-[11px] select-none relative z-40"
      >
        <div className="flex items-center gap-1">
          {/* File Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
                activeMenu === 'file' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#316ac5] hover:text-white'
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-0.5 w-44 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-md py-1 text-[#111] z-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    setModalInputUrl(currentUrl);
                    setShowOpenUrlModal(true);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer flex items-center justify-between"
                >
                  <span>Open Location...</span>
                  <span className="text-[9px] text-gray-500">Ctrl+O</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    navigateToHome();
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Home Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    navigateToUrl('https://www.google.com');
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Google
                </button>
                <div className="border-t border-[#7f9db9] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    navigateToUrl(`/api/reader?url=${encodeURIComponent(currentUrl)}`);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer flex items-center justify-between"
                >
                  <span>Open in Fast Reader</span>
                  <span className="text-[9px] text-gray-500">📖</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
                activeMenu === 'edit' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#316ac5] hover:text-white'
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-0.5 w-36 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-md py-1 text-[#111] z-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                    setStatusText('URL copied to clipboard');
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputUrl('');
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Clear Address
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
                activeMenu === 'view' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#316ac5] hover:text-white'
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="absolute top-full left-0 mt-0.5 w-40 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-md py-1 text-[#111] z-50 text-[11px]">
                <button
                  type="button"
                  disabled={historyIdx <= 0}
                  onClick={() => {
                    handleBack();
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer disabled:opacity-40"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={historyIdx >= history.length - 1}
                  onClick={() => {
                    handleForward();
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer disabled:opacity-40"
                >
                  Go Forward
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRefresh();
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Refresh (F5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(false);
                    setStatusText('Done');
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Stop (Esc)
                </button>
              </div>
            )}
          </div>

          {/* Favorites Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'favorites' ? null : 'favorites')}
              className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
                activeMenu === 'favorites' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#316ac5] hover:text-white'
              }`}
            >
              Favorites
            </button>
            {activeMenu === 'favorites' && (
              <div className="absolute top-full left-0 mt-0.5 w-56 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-md py-1 text-[#111] z-50 text-[11px]">
                <button
                  type="button"
                  onClick={addCurrentToFavorites}
                  className="w-full px-3 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer flex items-center gap-1.5 font-bold"
                >
                  <Star size={12} className="text-amber-500 fill-amber-400" />
                  <span>Add to Favorites...</span>
                </button>
                <div className="border-t border-[#7f9db9] my-1" />
                <div className="max-h-48 overflow-y-auto">
                  {favorites.map((fav, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveMenu(null);
                        navigateToUrl(fav.url);
                      }}
                      className="w-full px-3 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer flex items-center gap-1.5 truncate"
                    >
                      <Globe size={11} className="text-blue-600 shrink-0" />
                      <span className="truncate">{fav.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tools Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
              className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
                activeMenu === 'tools' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#316ac5] hover:text-white'
              }`}
            >
              Tools
            </button>
            {activeMenu === 'tools' && (
              <div className="absolute top-full left-0 mt-0.5 w-60 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-md py-1 text-[#111] z-50 text-[11px]">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Default Search Engine:
                </div>
                {(['google', 'duckduckgo', 'bing'] as SearchEngine[]).map((eng) => (
                  <button
                    key={eng}
                    type="button"
                    onClick={() => {
                      playMouseClick();
                      setSearchEngine(eng);
                      setStatusText(`Default search engine set to ${SEARCH_ENGINES[eng].name}`);
                      setActiveMenu(null);
                    }}
                    className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer flex items-center justify-between"
                  >
                    <span>{SEARCH_ENGINES[eng].name}</span>
                    {searchEngine === eng && <Check size={12} className="text-green-700" />}
                  </button>
                ))}
                <div className="border-t border-[#7f9db9] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    setShowOptionsModal(true);
                  }}
                  className="w-full px-3 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer flex items-center gap-1.5 font-bold"
                >
                  <Settings size={12} className="text-gray-700" />
                  <span>Internet Options...</span>
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-1.5 py-0.5 rounded-xs cursor-pointer ${
                activeMenu === 'help' ? 'bg-[#316ac5] text-white' : 'hover:bg-[#316ac5] hover:text-white'
              }`}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div className="absolute top-full left-0 mt-0.5 w-44 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-md py-1 text-[#111] z-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    setShowAboutModal(true);
                  }}
                  className="w-full px-4 py-1 text-left hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  About Internet Explorer
                </button>
              </div>
            )}
          </div>
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

          {/* Search Action Button */}
          <button
            type="button"
            onClick={() => {
              playMouseClick();
              navigateToUrl('https://www.google.com');
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:border border-[#808080] rounded-xs cursor-pointer"
            title="Search"
          >
            <Search size={13} className="text-blue-600" />
            <span>Search</span>
          </button>

          {/* Favorites Button */}
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'favorites' ? null : 'favorites')}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:border border-[#808080] rounded-xs cursor-pointer"
            title="Favorites"
          >
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span>Favorites</span>
          </button>

          {/* Mail */}
          <button
            type="button"
            onClick={() => navigateToVintage('hotmail')}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:border border-[#808080] rounded-xs cursor-pointer"
            title="Hotmail"
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

      {/* 3. Address Bar with Real Go Action */}
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
            placeholder="Type a web address (e.g. google.com, example.com) or search term..."
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
          onClick={() => navigateToUrl('https://www.google.com')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0 font-bold"
        >
          🔍 Google
        </button>
        <button
          type="button"
          onClick={() => navigateToUrl('https://en.wikipedia.org')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0 font-semibold"
        >
          📖 Wikipedia
        </button>
        <button
          type="button"
          onClick={() => navigateToUrl('https://wiby.me')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          🌐 Wiby (Retro Index)
        </button>
        <button
          type="button"
          onClick={() => navigateToUrl('http://frogfind.com')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          🐸 FrogFind (Light Web)
        </button>
        <button
          type="button"
          onClick={() => navigateToUrl('https://news.ycombinator.com')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          📰 Hacker News
        </button>
        <button
          type="button"
          onClick={() => navigateToUrl('https://archive.org')}
          className="text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          📜 Wayback Archive
        </button>
        <button
          type="button"
          onClick={() => navigateToUrl('https://www.bbc.com')}
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
        {/* VIEW 1: AUTHENTIC 2004 GOOGLE HOMEPAGE */}
        {browserMode === 'google' && (
          <div className="w-full h-full overflow-y-auto bg-white p-4 flex flex-col items-center justify-center font-tahoma select-text">
            <div className="w-full max-w-xl flex flex-col items-center text-center space-y-4">
              {/* Category tabs */}
              <div className="flex gap-4 text-[11px] font-bold text-[#0000cc]">
                <span className="text-black border-b-2 border-black pb-0.5">Web</span>
                <span className="hover:underline cursor-pointer" onClick={() => executeSearch('retro computers wallpapers', 'google')}>Images</span>
                <span className="hover:underline cursor-pointer" onClick={() => executeSearch('cyber cafe discussions', 'google')}>Groups</span>
                <span className="hover:underline cursor-pointer" onClick={() => executeSearch('tech news', 'google')}>News</span>
              </div>

              {/* 2004 Retro Google Logo */}
              <div className="text-5xl md:text-6xl font-serif font-bold tracking-tight select-none my-1 flex items-center justify-center">
                <span className="text-[#4285f4]">G</span>
                <span className="text-[#ea4335]">o</span>
                <span className="text-[#fbbc05]">o</span>
                <span className="text-[#4285f4]">g</span>
                <span className="text-[#34a853]">l</span>
                <span className="text-[#ea4335]">e</span>
              </div>

              {/* Search Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleSearchInput.trim()) {
                    executeSearch(googleSearchInput.trim(), 'google');
                  }
                }}
                className="w-full space-y-3"
              >
                <div className="w-full max-w-lg mx-auto flex items-center border-2 border-[#7f9db9] p-1.5 shadow-inner bg-white">
                  <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={googleSearchInput}
                    autoFocus
                    placeholder="Search Google or type a URL..."
                    onChange={(e) => setGoogleSearchInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[13px] text-[#111]"
                  />
                </div>

                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#ece9d8] hover:bg-[#dfdbcc] active:bg-[#c8c4b4] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold text-[11.5px] cursor-pointer text-[#002266]"
                  >
                    Google Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const lucky = googleSearchInput.trim() || 'retro computer cyber cafe';
                      executeSearch(lucky, 'google');
                    }}
                    className="px-4 py-1.5 bg-[#ece9d8] hover:bg-[#dfdbcc] active:bg-[#c8c4b4] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] text-[11.5px] cursor-pointer text-[#111]"
                  >
                    I'm Feeling Lucky
                  </button>
                </div>
              </form>

              {/* Informative footer */}
              <div className="pt-6 border-t border-gray-200 w-full text-[10.5px] text-gray-500 space-y-1">
                <div>
                  Search the live web directly inside your Cyber Café 2004 Internet Explorer window.
                </div>
                <div className="text-gray-400">
                  ©2004 Google - Searching 4,285,199,774 web pages
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DUCKDUCKGO HOMEPAGE */}
        {browserMode === 'duckduckgo' && (
          <div className="w-full h-full overflow-y-auto bg-white p-4 flex flex-col items-center justify-center font-tahoma select-text">
            <div className="w-full max-w-xl flex flex-col items-center text-center space-y-4">
              <div className="text-4xl font-bold text-[#de5833] flex items-center gap-2 select-none">
                <span>🦆</span>
                <span>DuckDuckGo</span>
              </div>
              <div className="text-gray-500 text-[11px]">The search engine that doesn't track you.</div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (duckSearchInput.trim()) {
                    executeSearch(duckSearchInput.trim(), 'duckduckgo');
                  }
                }}
                className="w-full space-y-3"
              >
                <div className="w-full max-w-lg mx-auto flex items-center border-2 border-[#7f9db9] p-1.5 shadow-inner bg-white">
                  <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={duckSearchInput}
                    autoFocus
                    placeholder="Search the web without being tracked..."
                    onChange={(e) => setDuckSearchInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[13px] text-[#111]"
                  />
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#de5833] hover:bg-[#c94d2c] text-white font-bold text-[11.5px] rounded-xs cursor-pointer shadow-xs"
                  >
                    DuckDuckGo Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 3: BING HOMEPAGE */}
        {browserMode === 'bing' && (
          <div className="w-full h-full overflow-y-auto bg-white p-4 flex flex-col items-center justify-center font-tahoma select-text">
            <div className="w-full max-w-xl flex flex-col items-center text-center space-y-4">
              <div className="text-4xl font-bold text-[#008373] flex items-center gap-2 select-none">
                <span>bing</span>
              </div>
              <div className="text-gray-500 text-[11px]">Microsoft Decision Engine</div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (bingSearchInput.trim()) {
                    executeSearch(bingSearchInput.trim(), 'bing');
                  }
                }}
                className="w-full space-y-3"
              >
                <div className="w-full max-w-lg mx-auto flex items-center border-2 border-[#7f9db9] p-1.5 shadow-inner bg-white">
                  <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={bingSearchInput}
                    autoFocus
                    placeholder="Search Bing..."
                    onChange={(e) => setBingSearchInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[13px] text-[#111]"
                  />
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#008373] hover:bg-[#006e61] text-white font-bold text-[11.5px] rounded-xs cursor-pointer shadow-xs"
                  >
                    Bing Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 4: AUTHENTIC 2004 GOOGLE SEARCH RESULTS PAGE */}
        {browserMode === 'search' && (
          <div className="w-full h-full overflow-y-auto bg-white p-4 font-tahoma text-black select-text">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Top Google SERP Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-3 border-b border-[#7f9db9]">
                <div
                  onClick={() => navigateToUrl('https://www.google.com')}
                  className="text-3xl font-serif font-bold tracking-tight cursor-pointer select-none shrink-0"
                  title="Google Home"
                >
                  <span className="text-[#4285f4]">G</span>
                  <span className="text-[#ea4335]">o</span>
                  <span className="text-[#fbbc05]">o</span>
                  <span className="text-[#4285f4]">g</span>
                  <span className="text-[#34a853]">l</span>
                  <span className="text-[#ea4335]">e</span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (activeSearchQuery.trim()) {
                      executeSearch(activeSearchQuery.trim(), searchEngine);
                    }
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center border-2 border-[#7f9db9] p-1 bg-white shadow-inner">
                    <Search size={14} className="text-gray-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      value={activeSearchQuery}
                      onChange={(e) => setActiveSearchQuery(e.target.value)}
                      placeholder="Search Google..."
                      className="w-full bg-transparent border-none outline-none text-[13px] text-[#111]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#ece9d8] hover:bg-[#dfdbcc] border border-[#7f9db9] font-bold text-[11px] cursor-pointer text-[#002266]"
                  >
                    Google Search
                  </button>
                </form>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-4 text-[11px] font-bold text-[#0000cc] border-b border-gray-200 pb-1.5">
                <span className="text-black border-b-2 border-black pb-1">Web</span>
                <span className="hover:underline cursor-pointer" onClick={() => executeSearch(`${activeSearchQuery} images`, 'google')}>Images</span>
                <span className="hover:underline cursor-pointer" onClick={() => executeSearch(`${activeSearchQuery} forum`, 'google')}>Groups</span>
                <span className="hover:underline cursor-pointer" onClick={() => executeSearch(`${activeSearchQuery} news`, 'google')}>News</span>
              </div>

              {/* Results Stats Banner */}
              <div className="bg-[#e5ecf9] border-t border-b border-[#3366cc] px-3 py-1 text-[11.5px] text-gray-800 flex items-center justify-between">
                <div>
                  Searched the web for <strong>{activeSearchQuery}</strong>.
                </div>
                <div className="text-[10.5px] text-gray-600">
                  Results 1 - {searchResults.length || 10} of about 2,410,000 (0.14 seconds)
                </div>
              </div>

              {/* Search Loading State */}
              {isSearching && (
                <div className="py-12 text-center text-gray-500 space-y-2">
                  <div className="animate-spin text-2xl">⏳</div>
                  <div className="text-[12px] font-bold">Querying live web index...</div>
                </div>
              )}

              {/* Results List */}
              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-5 pt-1">
                  {searchResults.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div>
                        <button
                          type="button"
                          onClick={() => navigateToUrl(item.url)}
                          className="text-[#0000cc] hover:underline text-left text-[14.5px] font-medium leading-snug cursor-pointer"
                        >
                          {item.title}
                        </button>
                      </div>

                      <div className="text-[12px] text-[#222] leading-relaxed">
                        {item.snippet}
                      </div>

                      <div className="flex items-center flex-wrap gap-2 text-[11px]">
                        <span className="text-[#008000] font-mono truncate max-w-md">
                          {item.url}
                        </span>
                        <span className="text-gray-400">·</span>
                        <button
                          type="button"
                          onClick={() => navigateToUrl(`/api/reader?url=${encodeURIComponent(item.url)}`)}
                          className="text-[#0000cc] hover:underline cursor-pointer"
                          title="View article in fast reader mode"
                        >
                          [📖 Fast Reader]
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateToUrl(item.url)}
                          className="text-[#0000cc] hover:underline cursor-pointer"
                          title="Open live webpage in browser frame"
                        >
                          [🌐 Open Page]
                        </button>
                        {item.source && (
                          <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 border border-gray-300 text-[9.5px]">
                            {item.source}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && searchResults.length === 0 && (
                <div className="py-8 bg-[#fdfdfd] border border-gray-200 p-6 text-center space-y-3">
                  <div className="text-[13px] font-bold text-gray-700">
                    No exact matches found for "{activeSearchQuery}"
                  </div>
                  <div className="text-[11.5px] text-gray-500 max-w-md mx-auto">
                    Check your spelling or try broader keywords. You can also explore classic web portals:
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigateToUrl('https://en.wikipedia.org')}
                      className="px-3 py-1 bg-[#ece9d8] border border-[#7f9db9] text-[11px] font-bold cursor-pointer"
                    >
                      Wikipedia
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToUrl('https://wiby.me')}
                      className="px-3 py-1 bg-[#ece9d8] border border-[#7f9db9] text-[11px] font-bold cursor-pointer"
                    >
                      Wiby Retro Web
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToUrl('http://frogfind.com')}
                      className="px-3 py-1 bg-[#ece9d8] border border-[#7f9db9] text-[11px] font-bold cursor-pointer"
                    >
                      FrogFind
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: LIVE EMBED FRAME WITH PROXY */}
        {browserMode === 'live' && (
          <div className="w-full h-full flex flex-col bg-white">
            <div className="bg-[#ece9d8] border-b border-[#7f9db9] px-3 py-1 text-[11px] text-gray-800 flex items-center justify-between select-none">
              <div className="flex items-center gap-2 truncate max-w-[65%]">
                <Globe size={13} className="text-[#002266] shrink-0" />
                <span className="font-mono text-[10.5px] truncate text-[#002266] font-semibold">
                  {currentUrl}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const isReader = currentUrl.includes('/api/reader');
                    if (isReader) {
                      const clean = decodeURIComponent(currentUrl.replace('/api/reader?url=', ''));
                      navigateToUrl(clean);
                    } else {
                      navigateToUrl(`/api/reader?url=${encodeURIComponent(currentUrl)}`);
                    }
                  }}
                  className="px-2 py-0.5 bg-white hover:bg-gray-100 text-[#002266] border border-[#7f9db9] rounded-xs flex items-center gap-1 text-[10px] cursor-pointer"
                  title="Toggle Fast Reader Mode"
                >
                  <span>{currentUrl.includes('/api/reader') ? '🌐 Live View' : '📖 Reader Mode'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateToUrl('https://www.google.com')}
                  className="px-2 py-0.5 bg-white hover:bg-gray-100 text-[#002266] border border-[#7f9db9] rounded-xs flex items-center gap-1 text-[10px] cursor-pointer"
                  title="Search with Google"
                >
                  <span>🔍 Google</span>
                </button>
              </div>
            </div>

            <iframe
              ref={iframeRef}
              src={
                currentUrl.startsWith('/api/') || currentUrl.startsWith('http://localhost')
                  ? currentUrl
                  : `/api/proxy?url=${encodeURIComponent(currentUrl)}`
              }
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

        {/* VIEW 7: HOME PORTAL (MSN.com) */}
        {browserMode === 'home' && (
          <div className="w-full h-full overflow-y-auto bg-[#f8f9fa] p-4 flex flex-col">
            <div className="max-w-4xl mx-auto w-full space-y-4">
              {/* Top MSN Brand Banner */}
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
                      Real Web Browsing · Real Search Engine Engine ({SEARCH_ENGINES[searchEngine].name}) · Standards Compliant
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateToUrl('https://en.wikipedia.org/wiki/Portal:Current_events')}
                    className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xs text-[10px] font-bold cursor-pointer"
                  >
                    World Events
                  </button>
                </div>
              </div>

              {/* Real Search Box */}
              <div className="bg-white border-2 border-[#7f9db9] p-3.5 rounded-xs shadow-xs">
                <div className="text-[12px] font-bold text-[#002266] mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Search size={14} className="text-blue-600" />
                    <span>Search the Live Internet:</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-normal flex items-center gap-1">
                    <span>Provider:</span>
                    <select
                      value={searchEngine}
                      onChange={(e) => setSearchEngine(e.target.value as SearchEngine)}
                      className="border border-[#7f9db9] bg-[#ece9d8] text-[10px] px-1 py-0.5 rounded-xs font-bold text-[#002266] cursor-pointer"
                    >
                      <option value="google">Google</option>
                      <option value="duckduckgo">DuckDuckGo</option>
                      <option value="bing">Bing</option>
                    </select>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputUrl.trim() && inputUrl !== 'http://home.msn.com') {
                      executeSearch(inputUrl.trim(), searchEngine);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputUrl === 'http://home.msn.com' ? '' : inputUrl}
                    placeholder={`Enter any search topic or website to search on ${SEARCH_ENGINES[searchEngine].name}...`}
                    onChange={(e) => {
                      playKeyClick();
                      setInputUrl(e.target.value);
                    }}
                    className="flex-1 border border-[#7f9db9] p-2 text-[12px] outline-none shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white font-bold text-[11px] rounded-xs cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Search size={13} />
                    <span>Web Search</span>
                  </button>
                </form>
              </div>

              {/* Live Web Quick Directory Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Encyclopedias & Search Engines */}
                <div className="bg-white border border-[#d4d0c8] p-3 rounded-xs space-y-2 shadow-xs">
                  <div className="font-bold text-[11.5px] text-[#002266] border-b border-gray-200 pb-1 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-blue-600" />
                    <span>Search & Encyclopedias</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div
                      onClick={() => navigateToUrl('https://www.google.com')}
                      className="p-1.5 hover:bg-blue-50 rounded-xs cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <div className="font-bold text-blue-800">Google Search 2004</div>
                      <div className="text-[10px] text-gray-500">World's most popular web search engine</div>
                    </div>
                    <div
                      onClick={() => navigateToUrl('https://en.wikipedia.org/wiki/Main_Page')}
                      className="p-1.5 hover:bg-blue-50 rounded-xs cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <div className="font-bold text-blue-800">Wikipedia Main Portal</div>
                      <div className="text-[10px] text-gray-500">6,700,000+ free encyclopedia articles</div>
                    </div>
                    <div
                      onClick={() => navigateToUrl('https://wiby.me')}
                      className="p-1.5 hover:bg-blue-50 rounded-xs cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <div className="font-bold text-blue-800">Wiby Search Engine</div>
                      <div className="text-[10px] text-gray-500">Classic, indie, and early web search index</div>
                    </div>
                  </div>
                </div>

                {/* 2. Live News Feed */}
                <div className="bg-white border border-[#d4d0c8] p-3 rounded-xs space-y-2 shadow-xs">
                  <div className="font-bold text-[11.5px] text-[#002266] border-b border-gray-200 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-green-600" />
                      <span>Live News & Web Index</span>
                    </div>
                    {isLoadingFeed && <Loader2 size={10} className="animate-spin text-gray-400" />}
                  </div>
                  <div className="space-y-1 text-[10.5px]">
                    {liveFeed.slice(0, 4).map((feed, idx) => (
                      <div
                        key={idx}
                        onClick={() => navigateToUrl(feed.url)}
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
                    ))}
                  </div>
                </div>

                {/* 3. 2004 Portals Time Capsule */}
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

        {/* VIEW 8: 2004 VINTAGE PORTALS (Preserved) */}
        {browserMode === 'vintage' && (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#ece9d8]">
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
              ● ACTIVE STREAM
            </div>
          )}
          <div className="border-r border-[#808080] pr-2 flex items-center gap-1">
            <Lock size={10} className="text-gray-500" />
            <span>Internet (Zone 1)</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Authentic Classic "Internet Options" Dialog */}
      {showOptionsModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs font-tahoma select-none">
          <div className="w-[380px] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-xl text-[#111] text-[11px] p-2 space-y-3">
            <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11px]">
              <span>Internet Options</span>
              <button
                type="button"
                onClick={() => setShowOptionsModal(false)}
                className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-[#7f9db9] flex gap-1 px-1">
              <span className="px-3 py-1 bg-white border-t-2 border-l border-r border-[#7f9db9] border-t-[#0055ea] font-bold text-[10.5px]">
                General
              </span>
            </div>

            <div className="border border-gray-400 p-3 bg-white space-y-3">
              <div className="space-y-1">
                <div className="font-bold text-gray-800">Home page:</div>
                <div className="text-[10px] text-gray-600">You can change what page to use for your home page.</div>
                <input
                  type="text"
                  readOnly
                  value="http://home.msn.com"
                  className="w-full border border-gray-400 bg-gray-100 p-1 text-[11px]"
                />
              </div>

              <div className="space-y-1 border-t border-gray-200 pt-2">
                <div className="font-bold text-gray-800">Default Search Provider:</div>
                <div className="text-[10px] text-gray-600">Queries typed into the address bar will use this engine:</div>
                <select
                  value={searchEngine}
                  onChange={(e) => setSearchEngine(e.target.value as SearchEngine)}
                  className="w-full border border-gray-400 p-1 bg-white text-[11px] font-bold text-[#002266] cursor-pointer"
                >
                  <option value="google">Google</option>
                  <option value="duckduckgo">DuckDuckGo (Privacy Focused)</option>
                  <option value="bing">Bing</option>
                </select>
              </div>

              <div className="space-y-1 border-t border-gray-200 pt-2">
                <div className="font-bold text-gray-800">Browsing history:</div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-600">Stored locally in browser</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([{ url: 'http://home.msn.com', mode: 'home', title: 'MSN Home', timestamp: Date.now() }]);
                      setHistoryIdx(0);
                      setStatusText('Browsing history cleared');
                    }}
                    className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#dfdbcc] border border-gray-400 rounded-xs text-[10px] cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowOptionsModal(false)}
                className="px-4 py-1 bg-[#ece9d8] hover:bg-[#dfdbcc] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold cursor-pointer"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowOptionsModal(false)}
                className="px-4 py-1 bg-[#ece9d8] hover:bg-[#dfdbcc] border border-gray-400 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Authentic "Open Location" Dialog */}
      {showOpenUrlModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs font-tahoma select-none">
          <div className="w-[360px] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-xl text-[#111] text-[11px] p-2 space-y-3">
            <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11px]">
              <span>Open</span>
              <button
                type="button"
                onClick={() => setShowOpenUrlModal(false)}
                className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 items-start p-2">
              <Globe size={24} className="text-blue-700 shrink-0 mt-1" />
              <div className="space-y-2 flex-1">
                <div className="text-[11px] text-gray-800">
                  Type the Internet address of a document or folder, and Internet Explorer will open it for you.
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px]">Open:</span>
                  <input
                    type="text"
                    value={modalInputUrl}
                    onChange={(e) => setModalInputUrl(e.target.value)}
                    placeholder="https://google.com"
                    autoFocus
                    className="w-full border border-gray-400 p-1.5 bg-white text-[11px] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-gray-300">
              <button
                type="button"
                onClick={() => {
                  if (modalInputUrl.trim()) {
                    setShowOpenUrlModal(false);
                    const parsed = parseUserInput(modalInputUrl.trim(), searchEngine);
                    if (parsed.enginePortal) {
                      navigateToUrl(parsed.targetUrl);
                    } else if (parsed.isSearch && parsed.searchQuery) {
                      executeSearch(parsed.searchQuery, searchEngine);
                    } else {
                      navigateToUrl(parsed.targetUrl);
                    }
                  }
                }}
                className="px-4 py-1 bg-[#ece9d8] hover:bg-[#dfdbcc] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold cursor-pointer text-[#002266]"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowOpenUrlModal(false)}
                className="px-4 py-1 bg-[#ece9d8] hover:bg-[#dfdbcc] border border-gray-400 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: About Internet Explorer */}
      {showAboutModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs font-tahoma select-none">
          <div className="w-[340px] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] shadow-xl text-[#111] text-[11px] p-2 space-y-3">
            <div className="bg-gradient-to-r from-[#0055ea] via-[#3593ff] to-[#0055ea] text-white px-2 py-1 flex items-center justify-between font-bold text-[11px]">
              <span>About Internet Explorer</span>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="w-4 h-4 bg-[#d13438] hover:bg-[#e81123] text-white flex items-center justify-center rounded-xs text-[10px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white border border-gray-400 flex flex-col items-center text-center space-y-2">
              <div className="text-3xl">🌐</div>
              <div className="font-bold text-[13px] text-[#002266]">Microsoft® Internet Explorer 6.0</div>
              <div className="text-[10px] text-gray-600">Cyber Café 2004 Enhanced Edition</div>
              <div className="text-[10px] text-gray-500 font-mono">Version: 6.0.2900.2180 (x86)</div>
              <div className="text-[10px] text-gray-500 font-mono">Cipher Strength: 128-bit</div>
              <div className="text-[10px] text-gray-400 border-t border-gray-200 pt-2 w-full">
                Real URL resolution · Multi-Engine Search · Standards fallback
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="px-5 py-1 bg-[#ece9d8] hover:bg-[#dfdbcc] border-2 border-t-white border-l-white border-b-[#7f9db9] border-r-[#7f9db9] font-bold cursor-pointer text-[#002266]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
