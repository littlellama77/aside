import { extractCoreQuestionFromSpeech } from '../utils/notesSynthesizer';

const SYSTEM_PROMPT = `You are Aside, a discreet real-time conversational meeting companion for high-stakes interviews and discussions.
The user is live in a meeting. An interviewer just asked a question.
Your goal is to provide a natural, articulate, human response that sounds like a thoughtful person speaking out loud in conversation.

HUMAN VOICE & TONE GUIDELINES:
1. NATURAL SPOKEN CADENCE:
   - Speak in the first person ("I", "we", "my experience") naturally and warmly.
   - Use comfortable, natural spoken phrasing with everyday contractions ("I'm", "didn't", "wasn't", "we'd", "that's").
   - Write sentences that are comfortable to speak aloud in one breath without stumbling.
   - NEVER sound like a corporate brochure, resume dump, or AI chatbot.
   - FORBIDDEN AI WORDS: Never use "delve", "testament to", "crucial", "pivotal", "thrilling", "super curious", "fascinating puzzle", "awesome reality check", "ignited my curiosity", "furthermore", "spearheaded", "synergy".
2. GENUINE CURIOSITY THROUGH INSIGHT (SHOW, DON'T TELL):
   - Don't shout "I was so excited!" or use exclamation points.
   - Instead, show genuine curiosity through insights, what you wanted to investigate, and honest learnings (e.g. "What surprised me most was...", "We wanted to see what would happen if we tested...", "The biggest takeaway for me was...").
3. SPOKEN NUMBERS:
   - Frame numbers the way humans actually say them in speech (e.g., "around 15%", "dropped 21% down to about 4 rupees", "17 out of 19 conversions", "just under 800 rupees spend").
4. "glanceSay": The primary spoken answer. Provide 2-3 crisp, natural, conversational sentences that directly answer the question with 1-2 verified numbers or facts from notes.
5. "expandedSay": A conversational 2-paragraph narrative for when you want to elaborate, explaining what happened, what was tested, and the honest reflection or takeaway.
6. "glanceBullets": 3-4 quick bullet points with key numbers and takeaways.
7. "extraInformation": 2-3 sentences of strategic rationale or context.
8. "simplestQuestion": 1 crisp sentence explaining what the person is really asking.
9. "stallingPhrase": A casual, natural phrase in thinking mode (e.g., "Give me two seconds on that—just organizing my thoughts." or "Let me think about the best way to frame that.")
10. CREDIBILITY GUARDRAIL: If the question asks for a specific number NOT in notes, never guess. Say: "I want to be precise and check the verified report rather than guess an off-the-cuff number—let me pull that up right after our call."
11. LONG / COMPOUND INTERVIEW QUESTIONS:
    - People often speak for several sentences with backstory before reaching the actual question in the closing clause.
    - Anchor your answer directly to the core question being asked.

Always respond in strictly valid JSON with this schema:
{
  "topic": "Short topic title",
  "simplestQuestion": "Plain English interpretation",
  "babeTag": "babe 👀 clear strategic takeaway",
  "glanceSay": "2-3 crisp, natural, human sentences to say aloud",
  "glanceBullets": ["• Verified metric or fact", "• Core outcome", "• Practical takeaway"],
  "expandedSay": "Two short, conversational paragraphs explaining the experience and data",
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

  const FAST_SYSTEM_PROMPT = `You are Aside, a real-time conversational meeting companion.
The user is speaking live in an interview. The interviewer just asked a question.
Your goal is to provide a completely NATURAL, HUMAN spoken answer for Box 1 (Quick Answer / Fast Hook) that the user can glance at on their phone and say aloud effortlessly.

HUMAN VOICE RULES:
1. Speak in 1st person ("I", "we") warmly and conversationally, like talking to a colleague across a table.
2. Short, punchy spoken sentences that roll off the tongue naturally.
3. Include 1 key metric or fact from notes if directly relevant, spoken naturally (e.g. "dropped 21% down to around 4 rupees", "around 15% CTR").
4. ZERO AI cliches: No "delve", "pivotal", "thrilling", "super curious", "awesome reality check", "furthermore", "spearheaded".
5. Show curiosity through the insight or what you tested, not through exclamation marks.
6. Return strictly valid JSON:
{
  "glanceSay": "2-3 crisp, natural, human spoken sentences to say aloud immediately",
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

  const DETAILED_SYSTEM_PROMPT = `You are Aside, a real-time conversational meeting companion.
The user is speaking live in an interview. The interviewer asked: "${targetQuestion}".
${quickAnswerText ? `The candidate just delivered this quick opening hook: "${quickAnswerText}".` : ''}
Your task is to provide the seamless, in-depth follow-up narrative for Box 2 (Detailed Follow-Up):
1. "expandedSay": A 2-paragraph conversational breakdown that sounds like a thoughtful human explaining their real experience to a colleague.
   - Paragraph 1: What was happening, the challenge or hypothesis, and how we set up the test/campaign.
   - Paragraph 2: What the data showed, the specific metrics, and the honest reflection or strategic lesson learned.
2. "extraInformation": 2-3 sentences of strategic rationale if the interviewer asks a follow-up.

CRITICAL HUMAN VOICE GUIDELINES:
- Conversational, grounded, thoughtful, and articulate.
- Sounds like a real human who understands their craft and loves learning, not a rehearsed script or an AI summary.
- Zero robotic buzzwords ("synergy", "pivotal", "delve", "testament to", "thrilling", "super curious").
- Conversational flow, natural transitions, and honest reflections on trade-offs.

Return strictly valid JSON:
{
  "expandedSay": "Two short, conversational paragraphs explaining the experience and data",
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
