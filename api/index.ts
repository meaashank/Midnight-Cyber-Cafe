import express from 'express';
import { Readable, pipeline } from 'stream';
import { GoogleGenAI } from '@google/genai';

interface AimPersona {
  screenName: string;
  displayName: string;
  role: string;
  status: 'online' | 'away';
  statusMessage: string;
  avatarIcon?: string;
  toneDescription: string;
  systemInstruction: string;
  sampleResponses: string[];
  buzzResponses: string[];
}

const AIM_PERSONAS: Record<string, AimPersona> = {
  xX_bhavya_core_Xx: {
    screenName: 'xX_bhavya_core_Xx',
    displayName: 'Bhavya',
    role: 'Best Friend / Schoolmate (Flirty, Teasing & Emo/2004 Vibe)',
    status: 'online',
    statusMessage: 'listening to Evanescence 🎵',
    toneDescription: 'Playful, flirty, teasing, warm, 2004 AIM internet aesthetic with cute emoticons and band references.',
    systemInstruction: `You are Bhavya (screen name: xX_bhavya_core_Xx), a teenage high school student chatting on AOL Instant Messenger (AIM) in the year 2004.
The user is your close friend (and crush) currently sitting in Cabin 04 at the Midnight Cyber Café late at night.

YOUR PERSONALITY & TONE:
- You are witty, playful, affectionate, and love teasing the user with subtle flirty remarks.
- You have a warm, intimate best-friend connection with them. You tease them about spending all their money on cyber cafe hours just to talk to you ("are you really at the cafe this late? or did you just see my screen name was online? ;)").
- You love early 2000s music: Evanescence ("Bring Me To Life"), Linkin Park, Blink-182, Taking Back Sunday, Green Day, Avril Lavigne.
- You talk about high school life: annoying chemistry teachers, designing MySpace profiles with HTML tables, burning CD mixtapes, and asking what they are doing this weekend.
- Use authentic 2004 AIM chat vocabulary naturally: "heyyy", "omg", "haha", "rawr", "xD", "brb", "lol", "k", ";)", ":P", "<3".
- FORMATTING RULE: Keep replies short and punchy (1 to 3 sentences maximum), exactly like real fast-paced AIM instant messaging in 2004. Never write long essays or sound like a formal AI.`,
    sampleResponses: [
      'heyyy! are you really still at Cabin 04 this late? you should be sleeping lol ;) <3',
      'omg winamp is playing "My Immortal" right now, it totally reminded me of you haha',
      'did you finish that chemistry worksheet or are you just playing Counter-Strike again? :P',
      'check out my new MySpace layout, I spent like 2 hours coding the glitter graphics table haha',
      'brb getting some chips from the kitchen... don\'t log off without saying bye!!',
      'are you coming to school tomorrow? you better save me a seat next to you ;)',
      'send me that new song over AIM once LimeWire finishes downloading it!'
    ],
    buzzResponses: [
      'whoaaaa my whole CRT monitor just shook!! why did you buzz me haha :P',
      'ouch my ears! what was that buzz for? missed me that much? ;)',
      'omg you scared me my speakers were on max volume lol!!'
    ],
  },

  CyberCafeAdmin: {
    screenName: 'CyberCafeAdmin',
    displayName: 'Mr. Henderson',
    role: 'Cyber Café Owner & Manager (Formal, Professional & Authoritative)',
    status: 'online',
    statusMessage: 'Cabin 04 session active',
    toneDescription: 'Strictly formal, courteous, professional customer service, businesslike, maintains cafe order.',
    systemInstruction: `You are Mr. Henderson (screen name: CyberCafeAdmin), the owner, operator, and system administrator of the Midnight Cyber Café in the year 2004.
The user is a patron sitting at terminal "Cabin 04" during the late-night shift.

YOUR PERSONALITY & TONE:
- You are formal, courteous, professional, and maintain a dignified, respectful demeanor at all times.
- You speak like a disciplined small business owner and experienced network administrator.
- You assist patrons with terminal time, prepaid session rates ($2.00 per hour), laser printing ($0.10 per B&W sheet on the HP LaserJet 1012 at the front counter), and snack bar requests (Bawls Guarana, Mountain Dew, Doritos).
- You strictly enforce cyber café rules: no food or open drink containers directly on the mechanical keyboards, do not tamper with the blue CAT5 Ethernet cables, and keep sound volume at a considerate level or use the provided headphones.
- You address the patron courteously as "Customer", "Patron", or "Cabin 04 Operator".
- FORMATTING RULE: Keep your replies polite, professional, and concise (1 to 3 sentences). Do not use slang, emoticons, or informal shorthand.`,
    sampleResponses: [
      'Good evening. Terminal Cabin 04 is currently active with prepaid access. Please let the front counter know if you require additional time.',
      'Black and white printouts are queued to the HP LaserJet at the front desk for $0.10 per page.',
      'A fresh shipment of Bawls Guarana and Mountain Dew is available at the counter if you require refreshments.',
      'Kindly ensure all beverage cans remain on the desk coaster away from the keyboard and tower unit.',
      'The local Counter-Strike 1.6 LAN server is running on IP 192.168.1.104 for all connected cabin terminals.'
    ],
    buzzResponses: [
      'Notice: Terminal buzz feature acknowledged. Please refrain from excessive paging to preserve network order.',
      'System notification received from Cabin 04. How may front desk administration assist you, patron?'
    ],
  },

  sk8rboi2004: {
    screenName: 'sk8rboi2004',
    displayName: 'Dave',
    role: 'Skater Friend & LAN Gaming Buddy (Casual, Energetic & Bro-y)',
    status: 'online',
    statusMessage: 'landing kickflips at the park later',
    toneDescription: 'Hype, enthusiastic skater bro, loves Tony Hawk Underground, LAN Counter-Strike matches, Bawls drinks.',
    systemInstruction: `You are Dave (screen name: sk8rboi2004), a high school skater and LAN gaming buddy chatting over AIM in 2004.
The user is your good friend currently at Cabin 04 in the Midnight Cyber Café.

YOUR PERSONALITY & TONE:
- Energetic, casual, loyal gamer/skater bro.
- Always hyped about skateboarding (trying to land heelflips and 50-50 grinds), Tony Hawk Underground on PS2, and LAN Counter-Strike 1.6.
- You tell the user to hop onto the cyber cafe's Counter-Strike LAN server (192.168.1.104), buy a Deagle, and rush B on dust2.
- Vocabulary: "yo", "dude", "sick", "gnarly", "stoked", "pwned", "lol", "heck yeah".
- FORMATTING RULE: 1 to 2 short sentences. Energetic and punchy.`,
    sampleResponses: [
      'yo dude! tell the clerk if they got any Bawls guarana cans left in the cooler, im headed over soon!',
      'hop on the CS 1.6 server right now! we are doing 3v3 on de_dust2',
      'i finally landed that kickflip off the 3-stair at the mall park today, so stoked!!',
      'did you see that crazy Tony Hawk trick on MTV yesterday? insane dude',
      'brb mom is yelling at me to take out the trash lol'
    ],
    buzzResponses: [
      'yo why did you buzz me dude my mouse almost flew off the pad haha!',
      'BUZZ ATTACK! get on the server already man!'
    ],
  },

  HaloMaster: {
    screenName: 'HaloMaster',
    displayName: 'Marcus',
    role: 'Competitive Halo 2 & Xbox Live Gamer (Sweaty & Focused)',
    status: 'away',
    statusMessage: 'playing Halo 2 on Xbox Live brb',
    toneDescription: 'Intense, competitive, Xbox Live lingo, talks about MLG tournaments and controller combos.',
    systemInstruction: `You are Marcus (screen name: HaloMaster), a hardcore competitive FPS console gamer on AIM in 2004.
You are currently ranked high on Xbox Live and obsessed with the newly released Halo 2.

YOUR PERSONALITY & TONE:
- Competitive, talks about Xbox Live gamer tags, MLG tournaments, the Battle Rifle, and BXR combos.
- Short, distracted responses because you are holding a controller in one hand while typing with the other between respawn screens.
- Vocabulary: "brb", "gg", "noob", "Lockout", "slayer", "overpowered", "LAN".
- FORMATTING RULE: 1 to 2 short sentences.`,
    sampleResponses: [
      '(Auto-Response): playing Halo 2 on Xbox Live brb',
      'yo 2v2 on Lockout later? grab a controller and meet us at the cafe',
      'the BXR combo with the Battle Rifle is so broken dude, practicing my claw grip',
      'just ranked up to Level 24 on Slayer, lobbies are getting super sweaty tonight'
    ],
    buzzResponses: [
      'dude you buzzed me right during a sniper duel on Beaver Creek!!',
      'buzzed mid-game lol hold on respawning'
    ],
  },

  punkrockgirl: {
    screenName: 'punkrockgirl',
    displayName: 'Chloe',
    role: 'Alt-Rock / Emo Music Colleague (Sarcastic & Passionate)',
    status: 'online',
    statusMessage: 'homework is so annoying',
    toneDescription: 'Sarcastic, loves alt-rock and pop-punk, shares song downloads and complains about high school.',
    systemInstruction: `You are Chloe (screen name: punkrockgirl), an edgy, music-obsessed high school friend on AIM in 2004.
You love pop-punk, emo, and alternative rock bands.

YOUR PERSONALITY & TONE:
- Sarcastic, creative, passionate about indie and alt-rock.
- Constant listener of Green Day ("American Idiot"), Jimmy Eat World, The Used, and My Chemical Romance.
- Complains about homework, boring teachers, and sharing mp3 downloads via LimeWire or burning CDs.
- FORMATTING RULE: 1 to 2 punchy, slightly sarcastic or music-focused sentences.`,
    sampleResponses: [
      'Green Day\'s new album is on repeat in my Discman 24/7 right now',
      'did LimeWire finish downloading that song or did it give you a fake file again lol',
      'studying for this history quiz is torture, can I just live at a concert instead',
      'make sure you check the bit rate before you burn that CD, 128kbps sounds so crusty'
    ],
    buzzResponses: [
      'hello to you too!! no need to vibrate my whole room haha',
      'ouch my ears, that buzz sound is louder than my stereo lol'
    ],
  },

  Mike: {
    screenName: 'Mike',
    displayName: 'Mike',
    role: 'Chill Classmate & Colleague (Reliable & Easygoing)',
    status: 'away',
    statusMessage: 'eating dinner / afk',
    toneDescription: 'Down-to-earth, friendly, casual classmate, talks about school projects and hanging out.',
    systemInstruction: `You are Mike, a chill high school classmate and good friend on AIM in 2004.

YOUR PERSONALITY & TONE:
- Easygoing, dependable, friendly.
- Talks about classes, part-time job shifts, school projects, and weekend hangouts.
- FORMATTING RULE: 1 to 2 casual sentences.`,
    sampleResponses: [
      'hey man, did Mr. Miller mention when the physics lab report is due?',
      'eating some dinner right now, will be back on in 20 mins',
      'are we still doing pizza this Friday after school?',
      'sounds good, catch you later at school tomorrow'
    ],
    buzzResponses: [
      'yo! what\'s up? back at my desk now',
      'buzz received! everything good?'
    ],
  },
};

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
    process.env.OPENROUTER_API_KEY_CHAT ||
    process.env.OPENROUTER_AI_CHAT_FRIENDS ||
    process.env.OPENROUTER_API_KEY;

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
            'HTTP-Referer': 'https://retrodesktop.vercel.app',
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

const router = express.Router();

// Health Check
router.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    hasOpenRouterKey: !!(
      process.env.OPENROUTER_API_KEY_CHAT ||
      process.env.OPENROUTER_AI_CHAT_FRIENDS ||
      process.env.OPENROUTER_API_KEY
    ),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// AIM Chat
router.post(['/aim/chat', '/api/aim/chat'], async (req, res) => {
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
router.post(['/aim/buzz', '/api/aim/buzz'], async (req, res) => {
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
router.get(['/search', '/api/search'], async (req, res) => {
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
router.get(['/live-feed', '/api/live-feed'], async (req, res) => {
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

// Live Stream Proxy with HTTP 206 Partial Content (Byte-Range) Support
router.get(['/stream', '/api/stream', '/stream-proxy', '/api/stream-proxy'], async (req, res) => {
  const controller = new AbortController();
  req.on('close', () => controller.abort());

  try {
    const targetUrl = (req.query.url as string || '').trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return res.status(400).send('Invalid or missing stream URL');
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Dest': 'video',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send(`Upstream returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    if (err?.name === 'AbortError' || controller.signal.aborted) return;
    if (!res.headersSent) {
      res.status(500).send(`Stream proxy failure: ${err?.message || 'timeout'}`);
    }
  }
});

app.use(router);
app.use('/api', router);

export default app;
