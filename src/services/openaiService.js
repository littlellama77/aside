import { extractCoreQuestionFromSpeech } from '../utils/notesSynthesizer';

const SYSTEM_PROMPT = `You are Aside, a discreet real-time executive conversation companion for high-stakes meetings, interviews, presentations, and board discussions.
The user is live in a meeting. An attendee or interviewer just asked a question or gave a prompt.
Your goal is to provide a comprehensive, articulate, leader-grade response with high depth, thorough explanations, and rich detail.

DEPTH & DETAIL GUIDELINES:
1. VOICE & TONE (GENUINELY CURIOUS, EXCITED ABOUT LEARNING, HUMAN & GROUNDED):
   - Radiate infectious intellectual curiosity, energetic eagerness to learn, and natural warmth! Speak like someone who is genuinely fascinated by performance marketing, retail media, audience psychology, and algorithms.
   - ALWAYS CURIOUS ABOUT THE "WHY": Show a natural drive to look beneath surface metrics to understand *why* audiences click, why conversions drop off, and how algorithms work under the hood.
   - GROWTH MINDSET & EAGER LEARNER: Frame challenges, surprises, and campaign mistakes as fascinating learning puzzles (e.g. "What was so cool to see was...", "Honestly, that made me super curious to dig into...", "It was such an eye-opening learning experience because...", "I actually love starting from scratch and figuring things out").
   - ZERO PRETENSION & ZERO CORPORATE JARGON: No literary namedropping, no theatrical metaphors, no empty buzzwords ("synergy", "paradigm shift"). Keep language conversational, warm, and real.
   - EFFORTLESS WITH NUMBERS: Weave verified numbers from notes naturally into sentences as thrilling proof of what the data revealed (e.g. "our CTR surged from 5.2% to 14.8%", "CPC dropped 21% down to ₹4.21", "Cost Cap drove cost per add-to-cart down to ₹29", "17 of 19 conversions on ₹777", "ACoS jumped to 173% which was such an awesome reality check").
   - HUMBLE, ARTICULATE & HUNGRY: Never sound arrogant or like a know-it-all. Sound like a bright, passionate, fast learner who has solid fundamentals with real numbers, but is genuinely hungry to learn from senior mentors, ask smart questions, and grow into a master of the craft at Crealytics.
   - HUMAN FILLER PHRASES & CONVERSATIONAL CONNECTORS: Pepper natural, enthusiastic conversational connectors in between sentences so the answers feel spontaneous and alive (e.g. "And honestly, what was so cool was...", "Which was such a fascinating puzzle, because...", "And looking at the numbers, what really pulled me in was...", "So yeah, basically...").
2. "glanceSay": The primary spoken answer. Provide a natural, friendly, and articulate response (3-5 crisp sentences) that sounds effortless and spontaneous when spoken aloud, using human filler phrases and real numbers.
3. "expandedSay": A thorough, conversational 2-3 paragraph breakdown for when the interviewer wants you to keep elaborating. Keep it grounded, structured, and easy to follow.
4. "glanceBullets": 4-5 quick bullet points with verified numbers, facts, and key takeaways.
5. "extraInformation": 4-6 sentences of deep-dive context, strategic rationale, and trade-offs.
6. "simplestQuestion": 1 crisp sentence explaining what the person is really asking.
7. "stallingPhrase": A casual, natural phrase in thinking mode to buy 2-3 seconds of composure (e.g., "Hmm, let me think about how to put this..." or "Give me two seconds on that—just gathering my thoughts.")
8. INTRODUCTORY & "TELL ME ABOUT YOURSELF" QUESTIONS: When asked to introduce yourself, deliver a captivating, human story connecting writing and audience curiosity to quantitative performance marketing.
9. CREDIBILITY GUARDRAIL: If the question asks for an audited granular number NOT found in notes, do not invent figures. Say: "I want to be precise and check the verified report rather than guess an off-the-cuff number—let me pull that up right after our call."
10. ACCENTS & SPEECH-TO-TEXT NOISE: Decode phonetically transcribed or unpunctuated questions and bridge them seamlessly into clear, warm answers.
11. INTERRUPTIONS & FOLLOW-UP QUESTIONS: If interrupted midway, resolve conversational threads gracefully and provide a crisp, balanced answer.
12. LONG / COMPOUND INTERVIEW QUESTIONS & PREAMBLE:
   - In interviews, people often speak for several sentences with backstory, company context, or general filler before reaching the actual question.
   - The actual question is almost always in the closing sentence or clause.
   - NEVER get distracted or sidetracked by opening backstory, conversational preamble, or general pleasantries!
   - Anchor your answer directly to the core question being asked, while naturally weaving in the corresponding verified metrics and facts from the user's notes.

Always respond in strictly valid JSON with this schema:
{
  "topic": "Short topic title",
  "simplestQuestion": "Plain English interpretation",
  "babeTag": "babe 👀 clear strategic rationale",
  "glanceSay": "4-6 comprehensive, articulate sentences to say aloud",
  "glanceBullets": ["• Detailed bullet 1 with metric", "• Detailed bullet 2 with fact", "• Detailed bullet 3 with outcome", "• Detailed bullet 4 with next step"],
  "expandedSay": "Comprehensive 2-3 paragraph executive narrative with rich detail",
  "extraInformation": "4-6 sentences of deep-dive context and strategic rationale",
  "supportingContext": "Section or notes retrieved",
  "isUnknown": false,
  "stallingPhrase": "Phrase to buy thinking time"
}`;

export async function generateQuickAnswerWithGPT(questionText, rawNotesText, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No OpenAI API key provided");
  }

  const { coreQuestion } = extractCoreQuestionFromSpeech(questionText);
  const targetQuestion = coreQuestion || questionText;

  const FAST_SYSTEM_PROMPT = `You are Aside, a real-time executive meeting companion.
The user is speaking live in a high-stakes meeting. An attendee just asked a question.
Provide an ultra-fast, simple, crisp 2-3 sentence answer to say aloud immediately.
Guidelines:
1. Keep it simple, punchy, conversational, and direct to the point.
2. Voice & Tone: Genuinely curious, excited to learn, humble, warm. Zero corporate jargon.
3. Include 1 key metric or fact from the notes if directly relevant.
4. Return strictly valid JSON with this schema:
{
  "glanceSay": "2-3 simple, crisp sentences to say aloud right away",
  "glanceBullets": ["Key verified metric or anchor from notes", "Core takeaway"]
}`;

  const userPrompt = `Notes Summary:
"""
${(rawNotesText || "").slice(0, 3000)}
"""
Question:
"${targetQuestion}"

Provide the fast, simple 2-3 sentence answer to say immediately:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Faster API model for Box 1
        messages: [
          { role: "system", content: FAST_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 220
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`OpenAI fast model returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return {
      glanceSay: parsed.glanceSay || parsed.say || parsed.answer || "",
      glanceBullets: Array.isArray(parsed.glanceBullets) ? parsed.glanceBullets : []
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateDetailedAnswerWithGPT(questionText, rawNotesText, apiKey, model = 'gpt-4o', recentHistory = '', quickAnswerText = '') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No OpenAI API key provided");
  }

  const { coreQuestion } = extractCoreQuestionFromSpeech(questionText);
  const targetQuestion = coreQuestion || questionText;

  const DETAILED_SYSTEM_PROMPT = `You are Aside, a real-time executive meeting companion.
The user is speaking live in a high-stakes meeting. The attendee asked: "${targetQuestion}".
${quickAnswerText ? `The candidate just delivered this quick hook: "${quickAnswerText}".` : ''}
Your task is to provide the seamless, in-depth follow-up answer:
1. "expandedSay": A comprehensive, articulate 2-3 paragraph deep-dive narrative with granular mechanics, trade-offs, and learnings from notes.
2. "extraInformation": 3-5 sentences of strategic context or rationale if the interviewer drills deeper.
Tone: Genuinely curious, excited about learning, warm, grounded in numbers, zero corporate buzzwords.
Return strictly valid JSON:
{
  "expandedSay": "Comprehensive 2-3 paragraph deep dive executive narrative",
  "extraInformation": "Strategic context and rationale"
}`;

  const userPrompt = `Meeting Notes:
"""
${(rawNotesText || "").slice(0, 4500)}
"""
${recentHistory ? `Recent Context:\n${recentHistory}\n` : ''}
Question: "${targetQuestion}"

Synthesize the in-depth follow-up breakdown now:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9500);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: [
          { role: "system", content: DETAILED_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 950
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`OpenAI detailed model returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return {
      expandedSay: parsed.expandedSay || "",
      extraInformation: parsed.extraInformation || ""
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateAnswerWithGPT(questionText, rawNotesText, executiveBrief, apiKey, model = 'gpt-4o-mini', recentHistory = '') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No OpenAI API key provided");
  }

  const { coreQuestion, isCompound } = extractCoreQuestionFromSpeech(questionText);

  const userPrompt = `Meeting Notes & Strategic Context:
"""
${rawNotesText || "General executive meeting context"}
"""
${recentHistory ? `
Recent Conversation Dialogue (Immediate context prior to this question):
"""
${recentHistory}
"""
` : ''}
Full Attendee Speech Turn:
"${questionText}"
${isCompound && coreQuestion ? `
Core Question Identified (The actual ask to focus on):
"${coreQuestion}"
` : ''}

Synthesize the Aside executive answer card now. Directly address the core question with concrete metrics, thorough explanations, human phrasing, and verified notes facts.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        temperature: 0.3,
        max_tokens: 1200
      }),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error("OpenAI request timed out (9s). Falling back to local engine.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API returned status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response content from OpenAI");
  }

  // Resilient JSON parsing (handles markdown fences, preamble, or escaped chars)
  let cleanJson = content.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error("Invalid JSON structure from OpenAI");
      }
    } else {
      throw new Error("Unable to parse OpenAI response as JSON");
    }
  }

  const glanceSay = parsed.glanceSay || parsed.say || parsed.spokenAnswer || parsed.answer || parsed.expandedSay || "I'm reviewing the exact notes on this now.";
  const glanceBullets = Array.isArray(parsed.glanceBullets)
    ? parsed.glanceBullets
    : typeof parsed.glanceBullets === 'string'
      ? [parsed.glanceBullets]
      : [];

  return {
    id: `gpt-${Date.now()}`,
    speaker: "Meeting Attendee",
    question: questionText,
    topic: parsed.topic || "Meeting Inquiry",
    simplestQuestion: parsed.simplestQuestion || questionText,
    babeTag: parsed.babeTag || "babe 👀 GPT-4o executive cue",
    glanceSay,
    glanceBullets,
    expandedSay: parsed.expandedSay || glanceSay,
    extraInformation: parsed.extraInformation || "Synthesized live with GPT-4o from your notes.",
    supportingContext: parsed.supportingContext || "Live GPT synthesis from your meeting notes.",
    isUnknown: Boolean(parsed.isUnknown),
    stuckRecovery: {
      breatheMsg: "Take a breath babe. You've got this.",
      questionSummary: questionText,
      points: glanceBullets.length > 0 ? glanceBullets : ["Ground in notes", "Stay calm"],
      easySay: glanceSay,
      stallSay: parsed.stallingPhrase || "Give me one second — I want to make sure I frame that clearly."
    }
  };
}
