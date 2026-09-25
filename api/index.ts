import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { AIM_PERSONAS } from '../src/config/aimPersonas';

const app = express();
app.use(express.json());

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

const OPENROUTER_MODELS = [
  'deepseek/deepseek-chat',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-small-24b-instruct-2501',
  'google/gemma-2-9b-it',
  'qwen/qwen-2.5-72b-instruct',
];

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
    process.env.OPENROUTER_AI_CHAT_FRIENDS || process.env.OPENROUTER_API_KEY;

  // 1. Try OpenRouter
  if (openRouterKey) {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `${persona.systemInstruction}\n\nIMPORTANT FORMATTING RULE: Keep replies concise (1 to 3 short sentences max) in true authentic 2004 AIM style. Use authentic 2004 internet slang, emoticons, and tone. Never talk like an AI assistant.`,
      },
    ];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        messages.push({
          role: h.from === 'You' ? 'user' : 'assistant',
          content: h.text,
        });
      }
    }
    messages.push({ role: 'user', content: prompt });

    for (const model of OPENROUTER_MODELS) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://midnight-cyber-cafe.vercel.app',
            'X-Title': 'Midnight Cyber Cafe 2004',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.85,
            max_tokens: 150,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return {
              reply,
              provider: 'openrouter',
              model,
            };
          }
        }
      } catch {
        // try next
      }
    }
  }

  // 2. Try Gemini API
  const ai = getAiClient();
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      let conversationContext = '';
      if (Array.isArray(history) && history.length > 0) {
        conversationContext =
          'Recent conversation:\n' +
          history
            .slice(-6)
            .map((h) => `${h.from}: ${h.text}`)
            .join('\n') +
          '\n\n';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${conversationContext}User says to you: "${prompt}"`,
        config: {
          systemInstruction: `${persona.systemInstruction}\n\nCRITICAL RULE: Keep replies concise (1 to 2 short lines max) in nostalgic 2004 AIM messenger style. Use authentic 2004 teen/retro internet abbreviations and slang. Do NOT format as a generic AI.`,
          temperature: 0.9,
          maxOutputTokens: 120,
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        return {
          reply,
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        };
      }
    } catch {
      // fallback
    }
  }

  // 3. Retro Fallback
  const fallbacks = persona.sampleResponses || ['lol nice', 'brb', 'k'];
  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return {
    reply: randomFallback,
    provider: 'retro_fallback',
  };
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    hasOpenRouterKey: !!(process.env.OPENROUTER_AI_CHAT_FRIENDS || process.env.OPENROUTER_API_KEY),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// AIM Chat
app.post('/api/aim/chat', async (req, res) => {
  try {
    const { buddy, message, history } = req.body;
    const persona = AIM_PERSONAS[buddy];

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
  } catch {
    res.status(500).json({ error: 'Failed to process AIM message' });
  }
});

// AIM Buzz
app.post('/api/aim/buzz', async (req, res) => {
  try {
    const { buddy } = req.body;
    const persona = AIM_PERSONAS[buddy];

    if (!persona) {
      return res.status(400).json({ error: 'Unknown AIM buddy' });
    }

    const result = await generateAiReply({
      persona,
      prompt: '⚠️ [SYSTEM NOTIFICATION]: The user just pressed the BUZZ button on your AIM window!',
      history: [],
    });

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
  } catch {
    res.status(500).json({ error: 'Failed to process buzz' });
  }
});

// Live Web Search
app.get('/api/search', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      return res.json({ results: [] });
    }

    const results: Array<{ title: string; url: string; snippet: string; source?: string }> = [];

    // 1. Wikipedia live search
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
    } catch {
      // ignore
    }

    // 2. DuckDuckGo Instant search
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
        if (ddgData.Heading && ddgData.AbstractText) {
          results.unshift({
            title: ddgData.Heading,
            url: ddgData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
            snippet: ddgData.AbstractText,
            source: 'Instant Answer',
          });
        }
      }
    } catch {
      // ignore
    }

    return res.json({ results: results.slice(0, 10) });
  } catch {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Live Feed
app.get('/api/live-feed', async (req, res) => {
  try {
    const hnRes = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty&limitToFirst=6'
    );
    if (hnRes.ok) {
      const ids: number[] = await hnRes.json();
      const items = await Promise.all(
        ids.slice(0, 5).map(async (id) => {
          const itemRes = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`
          );
          if (itemRes.ok) {
            const data = await itemRes.json();
            return {
              id: String(data.id),
              title: data.title,
              category: 'TECH NEWS',
              source: 'Hacker News',
              time: 'Trending',
              summary: data.url ? `Read at ${new URL(data.url).hostname}` : 'Discussion thread on HN',
              readUrl: data.url || `https://news.ycombinator.com/item?id=${data.id}`,
            };
          }
          return null;
        })
      );
      return res.json({ items: items.filter(Boolean) });
    }
  } catch {
    // ignore
  }
  return res.json({ items: [] });
});

export default app;
