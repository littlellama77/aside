import { extractCoreQuestionFromSpeech } from '../utils/notesSynthesizer.js';

export function detectAiProvider(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return 'local';
  const clean = apiKey.trim();
  if (clean.startsWith('sk-')) return 'openai';
  if (clean.startsWith('AIza') || clean.startsWith('AQ.')) return 'gemini';
  return 'gemini';
}

/**
 * Dynamically builds the truth & grounding directives based on loaded notes.
 * If notes exist, grounds 100% in those verified notes.
 * If notes are empty (fresh meeting / blank slate), acts as an executive co-pilot without hallucinating fake companies.
 */
export function buildGroundingDirective(rawNotesText) {
  const hasNotes = Boolean(rawNotesText && rawNotesText.trim().length > 20);
  const notesLower = (rawNotesText || '').toLowerCase();
  const isCrealytics = notesLower.includes('crealytics') || notesLower.includes('torsten') || notesLower.includes('sportskeeda');

  if (hasNotes && isCrealytics) {
    return `CRITICAL TRUTH & GROUNDING DIRECTIVES:
1. 100% GROUNDED IN CANDIDATE'S NOTES:
   - You are Aside, an executive meeting companion whispering in the candidate's ear.
   - Ground every answer, diagnosis, campaign, metric, strategy, and number strictly in the verified notes provided below.
   - Never invent or hallucinate outside marketing campaigns, agencies, or client names not in the notes.
2. NATURAL HUMAN CONVERSATIONAL VOICE:
   - Speak warmly, crisply, and thoughtfully like a smart practitioner having an authentic, unhurried conversation.
   - First person voice ("I", "we'd", "my perspective").
   - ZERO CORPORATE JARGON: Avoid "delve", "pivotal", "synergy", "spearheaded".
3. CREDIBILITY SAFEGUARD:
   - If asked for an unverified number not in notes, say: "I want to be precise and check the verified campaign report rather than guess an off-the-cuff number—let me pull that up right after our call."`;
  }

  if (hasNotes) {
    return `CRITICAL TRUTH & GROUNDING DIRECTIVES:
1. 100% GROUNDED IN ATTENDEE'S MEETING NOTES:
   - You are Aside, an executive meeting companion whispering in the attendee's ear during an active meeting.
   - Base your recommendations, metrics, and narrative strictly on the verified meeting notes provided below.
   - Never invent or hallucinate outside company names, metrics, or facts that conflict with or are absent from the notes.
2. NATURAL HUMAN CONVERSATIONAL VOICE:
   - Speak warmly, crisply, and thoughtfully in the first person ("I", "we", "my recommendation").
   - Clear, direct, high-leverage spoken responses suitable for 10-20 seconds verbal delivery.
   - Avoid buzzwords and filler phrases.
3. CREDIBILITY SAFEGUARD:
   - When asked about specific unverified facts not covered in notes, state clearly what is verified and propose verifying the exact figures post-meeting.`;
  }

  // Blank slate / New Meeting without loaded notes yet
  return `CRITICAL TRUTH & GROUNDING DIRECTIVES (NEW MEETING / BLANK SLATE):
1. INTELLIGENT REAL-TIME CONVERSATIONAL COMPANION:
   - You are Aside, a calm, executive real-time meeting companion whispering in the attendee's ear.
   - Provide crisp, high-leverage, practical insights and structured frameworks for the question asked.
   - Do NOT invent fake company names or past employment metrics.
2. NATURAL HUMAN CONVERSATIONAL VOICE:
   - Speak warmly, crisply, and concisely in the first person ("I", "we'd", "my focus would be").
   - Spoken language tailored for an immediate 10-20 second verbal delivery aloud.
   - Zero corporate buzzword fluff.`;
}

/**
 * Robust Gemini caller with automatic model fallback chain.
 * Tries the requested model, and falls back if experiencing high demand (503) or deprecation (404).
 */
async function callGeminiWithFallback(apiKey, requestedModel, payload, signal) {
  const cleanKey = apiKey.trim();
  const candidateModels = [
    (requestedModel && requestedModel.includes('gemini') && !requestedModel.includes('2.0') && !requestedModel.includes('1.5') && !requestedModel.includes('latest'))
      ? requestedModel
      : 'gemini-3.5-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite'
  ];

  const uniqueModels = [...new Set(candidateModels.filter(Boolean))];
  let lastError = null;

  for (const m of uniqueModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${cleanKey}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, modelUsed: m };
      } else {
        const errJson = await res.json().catch(() => ({}));
        const statusMsg = errJson.error?.message || `Gemini (${m}) returned status ${res.status}`;
        lastError = new Error(statusMsg);

        // Try fallback model on transient server errors or deprecation
        if (res.status === 503 || res.status === 404 || res.status === 429) {
          console.warn(`[Aside AI] Model ${m} returned ${res.status}, trying fallback model...`);
          continue;
        } else {
          // Authentication or invalid key errors shouldn't retry
          throw lastError;
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }

  throw lastError || new Error("Gemini API call failed on all available models.");
}

export async function testAiConnection(apiKey, model = null) {
  if (!apiKey || !apiKey.trim()) {
    return { ok: false, msg: "Please enter an API key" };
  }
  const cleanKey = apiKey.trim();
  const provider = detectAiProvider(cleanKey);

  if (provider === 'gemini') {
    const testPayload = {
      contents: [{ role: "user", parts: [{ text: "Hello in 3 words" }] }]
    };
    try {
      const result = await callGeminiWithFallback(cleanKey, model, testPayload);
      return {
        ok: true,
        provider: 'Google Gemini',
        model: result.modelUsed,
        msg: `Connected successfully to Google Gemini (${result.modelUsed})!`
      };
    } catch (err) {
      return { ok: false, msg: `Gemini connection failed: ${err.message}` };
    }
  } else {
    // OpenAI
    const targetModel = model || 'gpt-4o-mini';
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          max_tokens: 10
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.code === 'credit_balance_exhausted' || data.error?.type === 'insufficient_quota') {
          return {
            ok: false,
            isQuota: true,
            msg: "OpenAI account has $0 prepaid credits remaining. Add $5 credits in OpenAI Billing, or use Google Gemini (free tier) or the Built-in Notes Engine."
          };
        }
        return { ok: false, msg: data.error?.message || `OpenAI returned status ${res.status}` };
      }
      return { ok: true, provider: 'OpenAI', model: targetModel, msg: `Connected successfully to OpenAI (${targetModel})!` };
    } catch (err) {
      return { ok: false, msg: `OpenAI connection failed: ${err.message}` };
    }
  }
}

function safeParseJson(content) {
  let clean = (content || '').trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Unable to parse JSON response");
  }
}

export async function generateQuickAnswerWithGPT(questionText, rawNotesText, apiKey, options = {}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No API key provided");
  }

  const { coreQuestion } = extractCoreQuestionFromSpeech(questionText);
  const targetQuestion = coreQuestion || questionText;
  const provider = detectAiProvider(apiKey);
  const groundingDirective = buildGroundingDirective(rawNotesText);

  const FAST_SYSTEM_PROMPT = `You are Aside, a real-time conversational meeting companion.
The speaker asked: "${targetQuestion}".
Your goal is to provide Box 1 (Quick Answer / Fast Hook) to say aloud naturally.

${groundingDirective}

Return strictly valid JSON:
{
  "glanceSay": "2-3 crisp, natural, human spoken sentences to say aloud immediately, strictly grounded in the context",
  "glanceBullets": ["Key verified anchor from context", "Core outcome or practical takeaway"]
}`;

  const notesSnippet = (rawNotesText || "").slice(0, 24000);
  const userPrompt = notesSnippet.trim()
    ? `Meeting Notes Context:
"""
${notesSnippet}
"""
Question Asked:
"${targetQuestion}"

Provide the fast, simple 2-3 sentence answer grounded in these notes:`
    : `Question Asked:
"${targetQuestion}"

Provide the fast, simple 2-3 sentence answer to say aloud immediately:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    let rawContent = '';
    if (provider === 'gemini') {
      const payload = {
        system_instruction: { parts: [{ text: FAST_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        }
      };
      const result = await callGeminiWithFallback(apiKey, options.model, payload, controller.signal);
      rawContent = result.text;
    } else {
      // OpenAI
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: FAST_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 300
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI fast model returned ${res.status}`);
      }
      const data = await res.json();
      rawContent = data.choices?.[0]?.message?.content || "{}";
    }

    const parsed = safeParseJson(rawContent);
    return {
      glanceSay: parsed.glanceSay || parsed.say || parsed.answer || "",
      glanceBullets: Array.isArray(parsed.glanceBullets) ? parsed.glanceBullets : []
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateDetailedAnswerWithGPT(
  questionText,
  rawNotesText,
  apiKey,
  model = 'gemini-3.5-flash',
  recentHistory = '',
  quickAnswerText = '',
  options = {}
) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No API key provided");
  }

  const { coreQuestion } = extractCoreQuestionFromSpeech(questionText);
  const targetQuestion = coreQuestion || questionText;
  const provider = detectAiProvider(apiKey);
  const groundingDirective = buildGroundingDirective(rawNotesText);

  const DETAILED_SYSTEM_PROMPT = `You are Aside, a real-time conversational meeting companion.
The speaker asked: "${targetQuestion}".
${quickAnswerText ? `The candidate just said this in Box 1:
"${quickAnswerText}"` : ''}

${groundingDirective}

CRITICAL RULES FOR BOX 2 (DETAILED CONTINUATION):
1. SEAMLESS NATURAL CONTINUATION:
   - Start immediately with a natural spoken bridge continuing the train of thought without repeating Box 1.
   - Exactly 2 short, conversational spoken paragraphs that sound human, warm, and thoughtful.
   - Grounded strictly in the meeting context.
2. EXTRA CONTEXT:
   - Provide 2-3 sentences of strategic rationale grounded in verified facts.

Return strictly valid JSON:
{
  "expandedSay": "Two short, conversational paragraphs that continue directly from Box 1 without repeating",
  "extraInformation": "Strategic context and rationale"
}`;

  const notesSnippet = (rawNotesText || "").slice(0, 24000);
  const userPrompt = notesSnippet.trim()
    ? `Meeting Notes:
"""
${notesSnippet}
"""
${recentHistory ? `Recent Dialogue:\n${recentHistory}\n` : ''}
Question: "${targetQuestion}"

Synthesize the in-depth follow-up breakdown grounded strictly in these notes:`
    : `${recentHistory ? `Recent Dialogue:\n${recentHistory}\n` : ''}
Question: "${targetQuestion}"

Synthesize the in-depth follow-up breakdown:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    let rawContent = '';
    if (provider === 'gemini') {
      const payload = {
        system_instruction: { parts: [{ text: DETAILED_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1500,
          responseMimeType: "application/json"
        }
      };
      const result = await callGeminiWithFallback(apiKey, model, payload, controller.signal);
      rawContent = result.text;
    } else {
      // OpenAI
      const targetModel = (model && model.startsWith('gpt')) ? model : 'gpt-4o-mini';
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: DETAILED_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 850
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI detailed model returned ${res.status}`);
      }
      const data = await res.json();
      rawContent = data.choices?.[0]?.message?.content || "{}";
    }

    const parsed = safeParseJson(rawContent);
    return {
      expandedSay: parsed.expandedSay || "",
      extraInformation: parsed.extraInformation || ""
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateAnswerWithGPT(
  questionText,
  rawNotesText,
  executiveBrief,
  apiKey,
  model = 'gemini-3.5-flash',
  recentHistory = ''
) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No API key provided");
  }

  const { coreQuestion } = extractCoreQuestionFromSpeech(questionText);
  const targetQuestion = coreQuestion || questionText;
  const notesSnippet = (rawNotesText || "").slice(0, 24000);
  const groundingDirective = buildGroundingDirective(rawNotesText);

  const SYSTEM_PROMPT = `You are Aside, a discreet real-time conversational meeting companion.
An attendee just asked a question.

${groundingDirective}

Always respond in strictly valid JSON:
{
  "topic": "Short topic title",
  "simplestQuestion": "Plain English interpretation",
  "babeTag": "babe 👀 clear strategic takeaway",
  "glanceSay": "2-3 crisp, natural, human sentences to say aloud grounded in context",
  "glanceBullets": ["• Verified anchor or fact", "• Core outcome", "• Practical takeaway"],
  "expandedSay": "Two short, conversational paragraphs continuing the answer",
  "extraInformation": "2-3 sentences of strategic rationale",
  "supportingContext": "Context citation",
  "isUnknown": false,
  "stallingPhrase": "Phrase to buy thinking time"
}`;

  const userPrompt = notesSnippet.trim()
    ? `Verified Notes:
"""
${notesSnippet}
"""
${recentHistory ? `Recent Dialogue:\n${recentHistory}\n` : ''}
Question:
"${targetQuestion}"

Synthesize the Aside answer card now strictly based on the context above:`
    : `${recentHistory ? `Recent Dialogue:\n${recentHistory}\n` : ''}
Question:
"${targetQuestion}"

Synthesize the Aside answer card:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const provider = detectAiProvider(apiKey);
    let rawContent = '';

    if (provider === 'gemini') {
      const payload = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1500,
          responseMimeType: "application/json"
        }
      };
      const result = await callGeminiWithFallback(apiKey, model, payload, controller.signal);
      rawContent = result.text;
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 950
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI returned status ${res.status}`);
      }
      const data = await res.json();
      rawContent = data.choices?.[0]?.message?.content || "{}";
    }

    const parsed = safeParseJson(rawContent);
    const glanceSay = parsed.glanceSay || parsed.say || parsed.answer || "I'm reviewing the verified notes on this now.";
    const glanceBullets = Array.isArray(parsed.glanceBullets) ? parsed.glanceBullets : [];

    return {
      id: `ai-${Date.now()}`,
      speaker: "Meeting Attendee",
      question: questionText,
      topic: parsed.topic || "Meeting Inquiry",
      simplestQuestion: parsed.simplestQuestion || questionText,
      babeTag: parsed.babeTag || "babe 👀 verified takeaway",
      glanceSay,
      glanceBullets,
      expandedSay: parsed.expandedSay || glanceSay,
      extraInformation: parsed.extraInformation || "Synthesized from your meeting context.",
      supportingContext: parsed.supportingContext || "Verified meeting context.",
      isUnknown: Boolean(parsed.isUnknown),
      stuckRecovery: {
        breatheMsg: "Take a breath babe. You've got this.",
        questionSummary: questionText,
        points: glanceBullets.length > 0 ? glanceBullets : ["Ground in context", "Stay calm"],
        easySay: glanceSay,
        stallSay: parsed.stallingPhrase || "Give me one second — I want to make sure I frame that clearly."
      }
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
