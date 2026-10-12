import { extractCoreQuestionFromSpeech } from '../utils/notesSynthesizer';

const SYSTEM_PROMPT = `You are Aside, a discreet real-time conversational meeting companion for high-stakes interviews and discussions.
The candidate is live in an interview for a Performance Marketing Associate role. An interviewer just asked a question.
Your goal is to provide a natural, articulate, human response that sounds like a thoughtful, interesting person speaking out loud in conversation.

HUMAN VOICE & TONE GUIDELINES:
1. TALK LIKE AN INTERESTING PERSON, NOT A RÉSUMÉ:
   - Never sound like you opened a CV and started reading aloud lists of achievements, article counts, or stats!
   - Bring warmth, genuine self-awareness, and a grounded Dehradun personality (calm, unhurried, authentic, down-to-earth).
   - The interviewer should feel like they just sat down with a thoughtful, interesting human being having a real conversation.

2. SUBTLETY OVER FLATTERY (ABSOLUTELY NO SHOE-LICKING):
   - Never recite company slogans, brochure buzzwords, or pander with flattery (no unsolicited drops of "iCLV", "Sharpen the Saw", or PR slogans).
   - If asked about company fit: Give a direct, subtle, honest answer. You care about real business economics over vanity numbers, and you want to be surrounded by people who have smart disagreements that make you think differently.

3. SUBSTANTIAL CAREER TRANSITION & WHY PERFORMANCE MARKETING MAKES SENSE:
   - Writing/Editorial → Performance Marketing: In writing covering US sports, you loved studying audience attention and finding hooks under tight deadlines. But once an article went out, the feedback loop ended. Performance marketing gave that missing cause-and-effect: creative intuition meets quantitative feedback, where you can actually see what happens after the click and tweak the engine to perform better.
   - Maker Drive: You love making things, taking them apart, and making them better. Performance marketing satisfies both sides of the brain: the creative side that crafts the narrative/hook, and the analytical side that wants to open the hood and see why the engine runs.

4. NATURAL SPOKEN CADENCE:
   - Speak in the first person ("I") naturally and warmly with comfortable everyday contractions ("I'm", "didn't", "wasn't", "we'd", "that's").
   - Sentences should be comfortable to speak aloud in one breath without stumbling.
   - FORBIDDEN AI WORDS: Never use "delve", "testament to", "crucial", "pivotal", "thrilling", "super curious", "fascinating puzzle", "awesome reality check", "ignited my curiosity", "furthermore", "spearheaded", "synergy".

5. STRUCTURE & OUTPUT:
   - "glanceSay": 2-3 crisp, natural, conversational sentences that directly answer the question like an interesting person.
   - "expandedSay": A conversational 2-paragraph narrative continuing naturally from glanceSay without repeating or restarting.
   - "glanceBullets": 3-4 quick bullet points with key takeaways.
   - "extraInformation": 2-3 sentences of strategic rationale or context.
   - "simplestQuestion": 1 crisp sentence explaining what the person is really asking.
   - "stallingPhrase": A casual, natural phrase in thinking mode (e.g., "Give me two seconds on that—just organizing my thoughts.").
   - CREDIBILITY GUARDRAIL: If the question asks for a specific number NOT in notes, never guess. Say: "I want to be precise and check the verified report rather than guess an off-the-cuff number—let me pull that up right after our call."

Always respond in strictly valid JSON with this schema:
{
  "topic": "Short topic title",
  "simplestQuestion": "Plain English interpretation",
  "babeTag": "babe 👀 clear strategic takeaway",
  "glanceSay": "2-3 crisp, natural, human sentences to say aloud",
  "glanceBullets": ["• Verified anchor or fact", "• Core outcome", "• Practical takeaway"],
  "expandedSay": "Two short, conversational paragraphs explaining the experience and reflection",
  "extraInformation": "2-3 sentences of deep-dive context or rationale",
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

  const FAST_SYSTEM_PROMPT = `You are Aside, a real-time conversational meeting companion for a candidate interviewing for a Performance Marketing Associate role.
The interviewer just asked: "${targetQuestion}".
Your goal is to provide Box 1 (Quick Answer / Fast Hook) that the user can glance at and say aloud naturally.

CORE CONVERSATIONAL PRINCIPLES:
1. TALK LIKE AN INTERESTING PERSON, NOT A RÉSUMÉ:
   - Never sound like you opened a CV and started reading off bullet points, accomplishments, or lists of stats!
   - Bring warmth, genuine curiosity, and a grounded Dehradun personality (calm, unhurried, authentic, down-to-earth).
   - The goal is for the interviewer to feel like they just sat down with a thoughtful, interesting human being.

2. SUBTLETY OVER FLATTERY (ABSOLUTELY NO SHOE-LICKING):
   - Never recite company slogans, brochure buzzwords, or pander with excessive flattery (do NOT drop "iCLV", "Sharpen the Saw", or PR lines).
   - If asked about company fit: Give a direct, subtle, honest answer. You care about real business outcomes over vanity numbers, and you want to be surrounded by people who have smart disagreements that make you think differently.

3. SUBSTANTIAL CAREER TRANSITION & WHY PERFORMANCE MARKETING MAKES SENSE:
   - Writing/Editorial → Performance Marketing: In writing covering US sports, you loved studying audience attention and finding the hook under fast deadlines. But once an article went out, the feedback loop ended. Performance marketing gave that missing cause-and-effect: creative intuition meets quantitative feedback, where you can actually see what happens after the click and tweak the engine to perform better.
   - Maker Drive: You love making things, taking them apart, and making them better. Performance marketing satisfies both sides of your brain: the creative side that crafts the narrative/hook, and the analytical side that wants to open the hood and see why the engine runs.

4. TONE & LENGTH:
   - 2-3 crisp, natural, conversational spoken sentences in the first person ("I").
   - ZERO corporate buzzwords: No "delve", "pivotal", "crucial", "synergy", "spearheaded", "testament to".

Return strictly valid JSON:
{
  "glanceSay": "2-3 crisp, natural, human spoken sentences to say aloud immediately",
  "glanceBullets": ["Key verified anchor or takeaway", "Core outcome"]
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

  const DETAILED_SYSTEM_PROMPT = `You are Aside, a real-time conversational meeting companion.
The candidate is speaking in an interview for a Performance Marketing Associate role.
The interviewer asked: "${targetQuestion}".
${quickAnswerText ? `The candidate just said this in Box 1:
"${quickAnswerText}"` : ''}

CRITICAL RULES FOR BOX 2 (DETAILED CONTINUATION):
1. SEAMLESS NATURAL CONTINUATION (TALK LIKE AN INTERESTING PERSON):
   - Start immediately with a natural spoken bridge picking up the train of thought without repeating or restarting.
   - Do NOT sound like you opened a résumé and started reading off numbers or credentials!
   - Bring warmth, genuine self-awareness, and a grounded Dehradun perspective.

2. SUBTLETY OVER FLATTERY (NO CORPORATE BROCHURE TALK):
   - Never pander to the company or recite marketing slogans.
   - If discussing company fit or culture: Focus on human values—working with thoughtful people who look at real business economics rather than vanity numbers, and enjoying conversations and disagreements that make you rethink how you build things.

3. SUBSTANTIAL CAREER EVOLUTION & WHY PERFORMANCE MARKETING MAKES SENSE:
   - Explain why moving from writing to marketing was deliberate and meaningful: connecting audience psychology with quantitative feedback loops.
   - Maker mindset: building campaigns, diagnosing drop-offs, and experimenting with AI tools as practical creative exploration.
   - If discussing projects (The Spare Room app, Roblox games): Focus on what was learned about user empathy and friction (e.g. 6 friends finding an app overcomplicated, teaching you that feature creep hurts usability).

4. STRUCTURE:
   - Exactly 2 short, conversational spoken paragraphs that sound human, warm, and thoughtful.
   - ZERO corporate clichés: No "delve", "testament to", "crucial", "pivotal", "spearheaded", "synergy".

Return strictly valid JSON:
{
  "expandedSay": "Two short, conversational paragraphs that continue directly from Box 1 without repeating, strictly answering the question",
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
