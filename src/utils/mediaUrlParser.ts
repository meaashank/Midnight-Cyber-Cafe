export interface ParsedMediaInput {
  source: 'youtube' | 'spotify';
  type: 'playlist' | 'video' | 'track' | 'album' | 'artist' | 'show' | 'episode';
  id: string;
  originalInput: string;
  embedUrl?: string;
  canonicalUrl?: string;
  spotifyUri?: string;
}

/**
 * Universal parser for YouTube and Spotify media URLs, URIs, and raw IDs.
 */
export function parseMediaInput(input: string): ParsedMediaInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 0. Unwrap spotify.app.link and redirect URLs
  let cleanInput = trimmed;
  if (cleanInput.includes('spotify.app.link')) {
    try {
      const url = new URL(cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`);
      const fullUrl = url.searchParams.get('$full_url') || url.searchParams.get('$fallback_url');
      if (fullUrl) {
        cleanInput = decodeURIComponent(fullUrl);
      }
    } catch {
      // fallback regex for encoded url parameter
      const match = cleanInput.match(/(?:\$full_url|\$fallback_url)=([^&]+)/);
      if (match && match[1]) {
        cleanInput = decodeURIComponent(match[1]);
      }
    }
  }

  // ==========================================
  // 1. SPOTIFY URL / URI PARSING
  // ==========================================
  // Spotify URI format: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M or spotify:album:... or spotify:track:...
  const spotifyUriMatch = cleanInput.match(/^spotify:(playlist|album|track|artist|show|episode):([a-zA-Z0-9]+)/i);
  if (spotifyUriMatch) {
    const type = spotifyUriMatch[1].toLowerCase() as ParsedMediaInput['type'];
    const id = spotifyUriMatch[2];
    return {
      source: 'spotify',
      type,
      id,
      originalInput: trimmed,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
      spotifyUri: `spotify:${type}:${id}`,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  // Spotify Web URLs: https://open.spotify.com/(intl-xx/)?(playlist|album|track|artist|show|episode)/{id}
  if (cleanInput.includes('spotify.com/')) {
    try {
      const url = new URL(cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`);
      const pathname = url.pathname;
      const match = pathname.match(/\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(playlist|album|track|artist|show|episode)\/([a-zA-Z0-9]+)/i);
      if (match) {
        const type = match[1].toLowerCase() as ParsedMediaInput['type'];
        const id = match[2];
        return {
          source: 'spotify',
          type,
          id,
          originalInput: trimmed,
          canonicalUrl: `https://open.spotify.com/${type}/${id}`,
          spotifyUri: `spotify:${type}:${id}`,
          embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        };
      }
    } catch {
      // fallback regex
      const match = cleanInput.match(/(playlist|album|track|artist|show|episode)\/([a-zA-Z0-9]+)/i);
      if (match) {
        const type = match[1].toLowerCase() as ParsedMediaInput['type'];
        const id = match[2];
        return {
          source: 'spotify',
          type,
          id,
          originalInput: trimmed,
          canonicalUrl: `https://open.spotify.com/${type}/${id}`,
          spotifyUri: `spotify:${type}:${id}`,
          embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        };
      }
    }
  }

  // ==========================================
  // 2. YOUTUBE PLAYLIST & VIDEO PARSING
  // ==========================================
  // Direct YouTube Playlist ID (PL, RD, UU, FL, OLAK5uy_, etc.)
  if (/^(PL|RD|UU|FL|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      source: 'youtube',
      type: 'playlist',
      id: trimmed,
      originalInput: trimmed,
      canonicalUrl: `https://www.youtube.com/playlist?list=${trimmed}`,
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${trimmed}`,
    };
  }

  // YouTube URL with list= param
  try {
    if (trimmed.includes('list=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const listParam = url.searchParams.get('list');
      if (listParam) {
        return {
          source: 'youtube',
          type: 'playlist',
          id: listParam,
          originalInput: trimmed,
          canonicalUrl: `https://www.youtube.com/playlist?list=${listParam}`,
          embedUrl: `https://www.youtube.com/embed/videoseries?list=${listParam}`,
        };
      }
    }
  } catch {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return {
        source: 'youtube',
        type: 'playlist',
        id: match[1],
        originalInput: trimmed,
        canonicalUrl: `https://www.youtube.com/playlist?list=${match[1]}`,
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${match[1]}`,
      };
    }
  }

  // YouTube single video URL (watch?v=, youtu.be, /embed/, /v/)
  try {
    if (trimmed.includes('youtu.be/')) {
      const match = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return {
          source: 'youtube',
          type: 'video',
          id: match[1],
          originalInput: trimmed,
          canonicalUrl: `https://www.youtube.com/watch?v=${match[1]}`,
          embedUrl: `https://www.youtube.com/embed/${match[1]}`,
        };
      }
    }

    if (trimmed.includes('watch?v=') || trimmed.includes('/embed/') || trimmed.includes('/v/')) {
      const match = trimmed.match(/(?:v=|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return {
          source: 'youtube',
          type: 'video',
          id: match[1],
          originalInput: trimmed,
          canonicalUrl: `https://www.youtube.com/watch?v=${match[1]}`,
          embedUrl: `https://www.youtube.com/embed/${match[1]}`,
        };
      }
    }
  } catch {
    // ignore
  }

  // Raw 11-char YouTube Video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return {
      source: 'youtube',
      type: 'video',
      id: trimmed,
      originalInput: trimmed,
      canonicalUrl: `https://www.youtube.com/watch?v=${trimmed}`,
      embedUrl: `https://www.youtube.com/embed/${trimmed}`,
    };
  }

  // Loose playlist ID
  if (!trimmed.includes('/') && !trimmed.includes('?') && trimmed.length >= 12) {
    return {
      source: 'youtube',
      type: 'playlist',
      id: trimmed,
      originalInput: trimmed,
      canonicalUrl: `https://www.youtube.com/playlist?list=${trimmed}`,
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${trimmed}`,
    };
  }

  return null;
}

/**
 * Fetch metadata for a Spotify resource via Spotify oEmbed
 */
export async function fetchSpotifyMetadata(
  spotifyUrlOrId: string,
  type: string = 'playlist'
): Promise<{ title: string; artist: string; thumbnailUrl?: string; embedUrl: string }> {
  const canonicalUrl = spotifyUrlOrId.startsWith('http')
    ? spotifyUrlOrId
    : `https://open.spotify.com/${type}/${spotifyUrlOrId}`;

  const defaultEmbed = `https://open.spotify.com/embed/${type}/${
    spotifyUrlOrId.startsWith('http') ? spotifyUrlOrId.split('/').pop()?.split('?')[0] : spotifyUrlOrId
  }?utm_source=generator&theme=0`;

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'Spotify Playlist',
        artist: data.provider_name || 'Spotify',
        thumbnailUrl: data.thumbnail_url,
        embedUrl: data.iframe_url || defaultEmbed,
      };
    }
  } catch {
    // fallback
  }

  return {
    title: `Spotify ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    artist: 'Spotify',
    embedUrl: defaultEmbed,
  };
}
