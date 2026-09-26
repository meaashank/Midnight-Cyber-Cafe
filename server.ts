import express from 'express';
import path from 'path';
import { Readable, pipeline } from 'stream';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { AIM_PERSONAS } from './src/config/aimPersonas';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Server-side Gemini AI Client fallback
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // OpenRouter Open-Source Models Priority List (Ultra-fast Llama 3.1 8B, Llama 3.3 70B, Mistral Small, Gemini Flash)
  const OPENROUTER_MODELS = [
    'meta-llama/llama-3.1-8b-instruct',
    'meta-llama/llama-3.3-70b-instruct',
    'mistralai/mistral-small-24b-instruct-2501',
    'google/gemini-2.0-flash-001',
  ];

  // Universal AI generator helper with multi-tier OpenRouter + Gemini + Retro fallbacks
  async function generateAiReply({
    persona,
    prompt,
    history = [],
  }: {
    persona: any;
    prompt: string;
    history?: Array<{ from: string; text: string }>;
  }): Promise<{ reply: string; provider: string; model?: string }> {
    const openRouterKey =
      process.env.OPENROUTER_API_KEY_CHAT ||
      process.env.OPENROUTER_AI_CHAT_FRIENDS ||
      process.env.OPENROUTER_API_KEY;

    // Format clean alternating history (user -> assistant/model -> user -> ...)
    const sanitizedHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-8)) {
        if (!item?.text) continue;
        const role: 'user' | 'assistant' = item.from === 'me' ? 'user' : 'assistant';
        const last = sanitizedHistory[sanitizedHistory.length - 1];
        if (last && last.role === role) {
          last.text += `\n${item.text}`;
        } else {
          sanitizedHistory.push({ role, text: item.text });
        }
      }
    }

    // Ensure the conversation starts with 'user'
    while (sanitizedHistory.length > 0 && sanitizedHistory[0].role === 'assistant') {
      sanitizedHistory.shift();
    }

    // 1. Try OpenRouter with fast open-source models
    if (openRouterKey) {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: `${persona.systemInstruction}\n\nCRITICAL CONVERSATION & LANGUAGE RULES:
- Always DIRECTLY read and respond to what the user said in their latest message! Never ignore their questions or comments.
- If the user writes in English, reply in 100% natural 2004 English.
- If the user writes in Hindi or Hinglish, mirror them in Hinglish.
- Keep replies punchy, authentic (1 to 2 short sentences max) in true 2004 AIM style. Never talk like an AI bot.`,
        },
      ];

      for (const item of sanitizedHistory) {
        messages.push({ role: item.role, content: item.text });
      }

      // Add user prompt, strictly keeping role alternation
      const prevMsg = messages[messages.length - 1];
      if (prevMsg && prevMsg.role === 'user') {
        if (prevMsg.content.trim() !== (prompt || '').trim()) {
          prevMsg.content += `\n${prompt || 'hey'}`;
        }
      } else {
        messages.push({ role: 'user', content: prompt || 'hey' });
      }

      for (const model of OPENROUTER_MODELS) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://cybercafe2004.local',
              'X-Title': 'Midnight Cyber Cafe 2004 AIM',
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: 90,
              temperature: 0.85,
            }),
            signal: AbortSignal.timeout(2400),
          });

          if (res.ok) {
            const data = await res.json();
            const replyText = data.choices?.[0]?.message?.content?.trim();
            if (replyText) {
              return {
                reply: replyText,
                provider: 'openrouter',
                model,
              };
            }
          } else {
            console.warn(`[OpenRouter ${model}] HTTP ${res.status}`);
          }
        } catch (openRouterErr: any) {
          console.warn(`[OpenRouter ${model}] fetch failed:`, openRouterErr.message);
        }
      }
    }

    // 2. Fallback to Gemini if configured
    const ai = getAiClient();
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
        
        for (const item of sanitizedHistory) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          });
        }

        const lastContent = contents[contents.length - 1];
        if (lastContent && lastContent.role === 'user') {
          if (lastContent.parts[0].text.trim() !== (prompt || '').trim()) {
            lastContent.parts[0].text += `\n${prompt || 'hey'}`;
          }
        } else {
          contents.push({
            role: 'user',
            parts: [{ text: prompt || 'hey' }],
          });
        }

        let aiResponse;
        const geminiModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
        for (const gModel of geminiModels) {
          try {
            aiResponse = await ai.models.generateContent({
              model: gModel,
              contents,
              config: {
                systemInstruction: persona.systemInstruction,
                temperature: 0.9,
                topP: 0.9,
              },
            });
            if (aiResponse?.text) break;
          } catch (gErr: any) {
            console.warn(`[Gemini ${gModel}] error:`, gErr.message);
          }
        }

        const replyText = aiResponse?.text?.trim();
        if (replyText) {
          return {
            reply: replyText,
            provider: 'gemini',
            model: 'gemini-flash',
          };
        }
      } catch (geminiErr: any) {
        console.warn(`[Gemini Fallback] error:`, geminiErr.message);
      }
    }

    // 3. Fallback to authentic 2004 persona responses
    const fallbacks = persona.sampleResponses || ['lol nice', 'brb', 'k'];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return {
      reply: randomFallback,
      provider: 'retro_fallback',
    };
  }

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    const hasOpenRouter = !!(
      process.env.OPENROUTER_API_KEY_CHAT ||
      process.env.OPENROUTER_AI_CHAT_FRIENDS ||
      process.env.OPENROUTER_API_KEY
    );
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      hasOpenRouterKey: hasOpenRouter,
      openRouterModels: OPENROUTER_MODELS,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // API 1.5: AIM Persona Chat Endpoint powered by OpenRouter / Gemini AI
  app.post('/api/aim/chat', async (req, res) => {
    try {
      const { buddy, message, history } = req.body;
      let persona =
        AIM_PERSONAS[buddy] ||
        Object.values(AIM_PERSONAS).find(
          (p) => p.screenName.toLowerCase() === (buddy || '').toLowerCase()
        );

      if (!persona) {
        return res.status(400).json({ error: 'Unknown AIM buddy' });
      }

      const result = await generateAiReply({
        persona,
        prompt: message || 'hey',
        history,
      });

      return res.json({
        reply: result.reply,
        buddy: persona.screenName,
        aiPowered: result.provider !== 'retro_fallback',
        provider: result.provider,
        model: result.model,
      });
    } catch (err: any) {
      console.error('AIM chat error:', err);
      res.status(500).json({ error: 'Failed to process AIM message' });
    }
  });

  // API 1.6: AIM BUZZ reaction endpoint
  app.post('/api/aim/buzz', async (req, res) => {
    try {
      const { buddy } = req.body;
      const persona = AIM_PERSONAS[buddy];

      if (!persona) {
        return res.status(400).json({ error: 'Unknown AIM buddy' });
      }

      const result = await generateAiReply({
        persona,
        prompt:
          '⚠️ [SYSTEM NOTIFICATION]: The user just pressed the BUZZ button on your AIM window, shaking your screen with a loud vibration sound!',
        history: [],
      });

      // If retro fallback, pick from buzz specific responses
      let replyText = result.reply;
      if (result.provider === 'retro_fallback') {
        const buzzFallbacks = persona.buzzResponses || ['whoa why did you buzz me haha!'];
        replyText = buzzFallbacks[Math.floor(Math.random() * buzzFallbacks.length)];
      }

      return res.json({
        reply: replyText,
        buddy: persona.screenName,
        aiPowered: result.provider !== 'retro_fallback',
        provider: result.provider,
        model: result.model,
      });
    } catch (err: any) {
      console.error('AIM buzz error:', err);
      res.status(500).json({ error: 'Failed to process buzz' });
    }
  });

  // API 2: Real live web search endpoint for IE6 Google / Search Bar
  app.get('/api/search', async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q) {
        return res.json({ results: [] });
      }

      const results: Array<{ title: string; url: string; snippet: string; source?: string }> = [];

      // 1. Fetch Wikipedia live search matches
      try {
        const wikiRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            q
          )}&format=json&origin=*&utf8=1&srlimit=7`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MidnightCyberCafe/2.0',
            },
          }
        );
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData?.query?.search) {
            for (const item of wikiData.query.search) {
              const cleanSnippet = item.snippet
                .replace(/<[^>]*>?/gm, '')
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&#039;/g, "'");
              results.push({
                title: `${item.title} - Wikipedia`,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                snippet: cleanSnippet + '...',
                source: 'Wikipedia',
              });
            }
          }
        }
      } catch (err) {
        console.warn('Wikipedia search error:', err);
      }

      // 2. Fetch DuckDuckGo instant search / topics
      try {
        const ddgRes = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=0`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MidnightCyberCafe/2.0',
            },
          }
        );
        if (ddgRes.ok) {
          const ddgData = await ddgRes.json();
          if (ddgData.AbstractText && ddgData.AbstractURL) {
            results.unshift({
              title: ddgData.Heading || q,
              url: ddgData.AbstractURL,
              snippet: ddgData.AbstractText,
              source: 'Instant Answer',
            });
          }

          if (Array.isArray(ddgData.RelatedTopics)) {
            for (const topic of ddgData.RelatedTopics.slice(0, 6)) {
              if (topic.Text && topic.FirstURL) {
                results.push({
                  title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 45),
                  url: topic.FirstURL,
                  snippet: topic.Text,
                  source: 'Web Index',
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('DuckDuckGo search error:', err);
      }

      // 3. Fallback / curated retro & encyclopedia search destinations
      if (results.length === 0) {
        results.push({
          title: `${q} - Wikipedia Encyclopedia`,
          url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
          snippet: `Search real-time encyclopedic entries and articles for "${q}".`,
          source: 'Wikipedia',
        });
        results.push({
          title: `Wiby Search: "${q}" (Indie & Classic Web Index)`,
          url: `https://wiby.me/?q=${encodeURIComponent(q)}`,
          snippet: `Search classic, lightweight, and independent web pages for "${q}".`,
          source: 'Wiby Engine',
        });
        results.push({
          title: `FrogFind 2004 View: "${q}"`,
          url: `http://frogfind.com/?q=${encodeURIComponent(q)}`,
          snippet: `Ultra-fast text-friendly browser view of internet search results for "${q}".`,
          source: 'FrogFind',
        });
      }

      res.json({ results });
    } catch (error: any) {
      console.error('Search endpoint error:', error);
      res.status(500).json({ error: error.message || 'Search failed' });
    }
  });

  // API 3: Live trending headlines and feeds for the browser homepage
  app.get('/api/live-feed', async (req, res) => {
    try {
      const items: Array<{ title: string; url: string; category: string; source: string }> = [];

      // Hacker News Top Stories
      try {
        const hnTopRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        if (hnTopRes.ok) {
          const storyIds: number[] = await hnTopRes.json();
          const topIds = storyIds.slice(0, 5);
          for (const id of topIds) {
            const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (storyRes.ok) {
              const story = await storyRes.json();
              if (story && story.title) {
                items.push({
                  title: story.title,
                  url: story.url || `https://news.ycombinator.com/item?id=${id}`,
                  category: 'Tech News',
                  source: 'Hacker News',
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('HN feed fetch error:', err);
      }

      // Default curated active feeds if offline or rate-limited
      if (items.length < 3) {
        items.push(
          {
            title: 'Wikipedia: Today\'s Featured Articles & Discoveries',
            url: 'https://en.wikipedia.org/wiki/Main_Page',
            category: 'Encyclopedia',
            source: 'Wikipedia',
          },
          {
            title: 'Wiby: Search Engine for the Classic Web',
            url: 'https://wiby.me',
            category: 'Retro Web',
            source: 'Wiby',
          },
          {
            title: 'Hacker News: Real-Time Technology & Programming',
            url: 'https://news.ycombinator.com',
            category: 'Tech',
            source: 'Y Combinator',
          },
          {
            title: 'FrogFind: The Vintage Computer Friendly Search Engine',
            url: 'http://frogfind.com',
            category: 'Fast Search',
            source: 'FrogFind',
          }
        );
      }

      res.json({ items });
    } catch (error: any) {
      console.error('Live feed error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API 4: Live Web Reader / Text Extraction Endpoint
  app.get('/api/reader', async (req, res) => {
    try {
      let targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).send('Missing url parameter');
      }

      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const rawHtml = await response.text();

      // Extract basic title, headings, paragraphs, and links
      const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : targetUrl;

      // Clean HTML tags for reader mode
      let cleanContent = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');

      // Grab main article / body content
      const bodyMatch = cleanContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyHtml = bodyMatch ? bodyMatch[1] : cleanContent;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title} - IE6 Reader Mode</title>
            <style>
              body {
                font-family: Tahoma, Verdana, Arial, sans-serif;
                font-size: 13px;
                line-height: 1.6;
                color: #222;
                background: #fdfdfd;
                max-width: 760px;
                margin: 0 auto;
                padding: 20px;
              }
              header {
                border-bottom: 2px solid #003399;
                padding-bottom: 12px;
                margin-bottom: 20px;
              }
              h1 {
                font-size: 20px;
                color: #003399;
                margin: 0 0 6px 0;
              }
              .url-meta {
                font-size: 11px;
                color: #666;
                font-family: monospace;
              }
              .reader-banner {
                background: #eef3fa;
                border: 1px solid #c0d4ec;
                padding: 8px 12px;
                font-size: 11px;
                color: #003366;
                margin-bottom: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              a {
                color: #0000cc;
              }
              p {
                margin: 0 0 14px 0;
              }
              img {
                max-width: 100%;
                height: auto;
                border: 1px solid #ccc;
              }
            </style>
          </head>
          <body>
            <div class="reader-banner">
              <span>📖 <strong>Internet Explorer Fast Reader</strong>: Displaying article content for <code>${targetUrl}</code></span>
              <a href="/api/proxy?url=${encodeURIComponent(targetUrl)}" style="font-weight: bold;">[Switch to Raw Live View]</a>
            </div>
            <header>
              <h1>${title}</h1>
              <div class="url-meta">Source: <a href="/api/proxy?url=${encodeURIComponent(targetUrl)}">${targetUrl}</a></div>
            </header>
            <main>
              ${bodyHtml}
            </main>
            <script>
              document.addEventListener('click', function(e) {
                var target = e.target.closest('a');
                if (target && target.href && !target.href.startsWith('javascript:')) {
                  e.preventDefault();
                  try {
                    window.parent.postMessage({ type: 'IE_NAVIGATE', url: target.href }, '*');
                  } catch(err) {}
                  window.location.href = '/api/proxy?url=' + encodeURIComponent(target.href);
                }
              }, true);
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send(`Failed to parse article: ${err.message}`);
    }
  });

  // API 5: Web proxy endpoint to load live websites inside 2004 IE6 frame
  app.get('/api/proxy', async (req, res) => {
    try {
      let targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).send('Missing target url');
      }

      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
      }

      const parsedTarget = new URL(targetUrl);

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      const contentType = response.headers.get('content-type') || 'text/html';

      // Set headers on our response, explicitly stripping framing and security restrictions
      res.setHeader('Content-Type', contentType);
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Cross-Origin-Embedder-Policy');
      res.removeHeader('Cross-Origin-Opener-Policy');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (contentType.includes('text/html')) {
        let html = await response.text();

        // Inject <base> tag so relative CSS, fonts, and images resolve correctly
        const baseTag = `<base href="${targetUrl}">`;
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}`);
        } else if (html.includes('<HEAD>')) {
          html = html.replace('<HEAD>', `<HEAD>${baseTag}`);
        } else {
          html = `${baseTag}${html}`;
        }

        // Inject robust link and form submission interceptor script
        const scriptInjection = `
<script>
  // 1. Intercept all link clicks and keep them inside our proxy
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a');
    if (target && target.href && !target.href.startsWith('javascript:')) {
      e.preventDefault();
      var dest = target.href;
      try {
        window.parent.postMessage({ type: 'IE_NAVIGATE', url: dest }, '*');
      } catch(err) {}
      window.location.href = '/api/proxy?url=' + encodeURIComponent(dest);
    }
  }, true);

  // 2. Intercept search and navigation form submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form && form.action) {
      var method = (form.method || 'GET').toUpperCase();
      if (method === 'GET') {
        e.preventDefault();
        var formData = new FormData(form);
        var actionUrl = new URL(form.action, document.baseURI || window.location.href);
        var params = new URLSearchParams(formData);
        var finalUrl = actionUrl.origin + actionUrl.pathname + (params.toString() ? '?' + params.toString() : '');
        try {
          window.parent.postMessage({ type: 'IE_NAVIGATE', url: finalUrl }, '*');
        } catch(err) {}
        window.location.href = '/api/proxy?url=' + encodeURIComponent(finalUrl);
      }
    }
  }, true);
</script>
`;
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${scriptInjection}</body>`);
        } else {
          html = `${html}${scriptInjection}`;
        }

        return res.send(html);
      } else {
        // Stream non-HTML assets (images, css, etc.)
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (error: any) {
      console.error('Proxy error:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Internet Explorer - Cannot display the webpage</title></head>
          <body style="font-family: Tahoma, Arial, sans-serif; font-size: 12px; background: #fff; padding: 20px; color: #111;">
            <div style="color: #003399; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
              The page cannot be displayed
            </div>
            <p>The page you are looking for is currently unavailable or returned a connection error. You can try viewing it in Reader Mode or opening it in a new window.</p>
            <p><strong>Attempted URL:</strong> <code>${req.query.url}</code></p>
            <p style="color: #666; font-size: 11px;">Error details: ${error.message || 'Connection timeout or invalid domain'}</p>
            <hr style="border: 0; border-top: 1px solid #d4d0c8; margin: 15px 0;">
            <div style="display: flex; gap: 8px;">
              <a href="/api/reader?url=${encodeURIComponent(req.query.url as string)}" style="display: inline-block; padding: 5px 12px; background: #003399; color: #fff; text-decoration: none; font-size: 11px; border-radius: 2px;">📖 Try Reader Mode</a>
              <button onclick="window.location.reload()" style="padding: 5px 12px; font-size: 11px; cursor: pointer;">Refresh</button>
              <button onclick="window.history.back()" style="padding: 5px 12px; font-size: 11px; cursor: pointer;">Back</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // API 6: Universal Media Stream Proxy for VLC media player (Instant Fast Stream + Live Remuxer)
  app.get(['/api/stream', '/api/stream-proxy'], async (req, res) => {
    const controller = new AbortController();
    let ffmpegProc: any = null;

    req.on('close', () => {
      controller.abort();
      if (ffmpegProc) {
        try {
          ffmpegProc.kill('SIGKILL');
        } catch {
          // ignore
        }
      }
    });

    try {
      const targetUrl = (req.query.url as string || '').trim();
      if (!targetUrl) {
        return res.status(400).send('Missing url query parameter');
      }

      // Check if URL is an explicit MKV, AVI, FLV, TS container
      const lowerUrl = targetUrl.toLowerCase();
      const isKnownNonBrowserContainer =
        lowerUrl.includes('.mkv') ||
        lowerUrl.includes('.avi') ||
        lowerUrl.includes('.flv') ||
        lowerUrl.includes('.ts') ||
        lowerUrl.includes('.wmv');

      // Forward browser-like headers for maximum CDN / server compatibility
      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      };
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      // 30-second connect timeout
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(targetUrl, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 206) {
        return res.status(response.status).send(`Upstream returned ${response.status}`);
      }

      const rawContentType = (response.headers.get('content-type') || '').toLowerCase();
      const contentDisposition = (response.headers.get('content-disposition') || '').toLowerCase();
      const isMatroskaOrLegacy =
        isKnownNonBrowserContainer ||
        rawContentType.includes('mkv') ||
        rawContentType.includes('matroska') ||
        rawContentType.includes('msvideo') ||
        rawContentType.includes('flv') ||
        rawContentType.includes('mp2t') ||
        contentDisposition.includes('.mkv') ||
        contentDisposition.includes('.avi');

      // If non-browser container, run on-the-fly FFmpeg fast stream copy to fragmented MP4
      if (isMatroskaOrLegacy) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Cache-Control', 'no-cache');
        res.status(200);
        res.flushHeaders();

        ffmpegProc = spawn('ffmpeg', [
          '-headers',
          'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36\r\n',
          '-i',
          targetUrl,
          '-c:v',
          'copy',
          '-c:a',
          'aac',
          '-f',
          'mp4',
          '-movflags',
          'frag_keyframe+empty_moov+default_base_moof',
          'pipe:1',
        ]);

        ffmpegProc.stdout.pipe(res);

        ffmpegProc.stderr.on('data', () => {
          // background trace
        });

        ffmpegProc.on('error', (err: any) => {
          if (!res.writableEnded) {
            try {
              res.end();
            } catch {
              // ignore
            }
          }
        });

        ffmpegProc.on('close', () => {
          if (!res.writableEnded) {
            try {
              res.end();
            } catch {
              // ignore
            }
          }
        });

        return;
      }

      // Standard direct streaming for MP4, WebM, MP3, OGG, etc.
      const contentType = response.headers.get('content-type') || 'video/mp4';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const contentLength = response.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      const contentRange = response.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);

      res.status(response.status);
      res.flushHeaders();

      if (response.body) {
        const stream = Readable.fromWeb(response.body as any);
        stream.on('error', (streamErr: any) => {
          if (streamErr?.name === 'AbortError' || controller.signal.aborted) {
            return;
          }
          if (!res.writableEnded) {
            try {
              res.end();
            } catch {
              // ignore
            }
          }
        });

        pipeline(stream, res, (err) => {
          if (err && err.name !== 'AbortError' && !controller.signal.aborted) {
            // Stream ended or connection closed
          }
        });
      } else {
        res.end();
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      console.error('Stream proxy error:', err?.message || err);
      if (!res.headersSent) {
        res.status(500).send(`Stream proxy failure: ${err?.message || 'timeout'}`);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Midnight Cyber Café Server running on http://localhost:${PORT}`);
  });
}

startServer();
