/**
 * openaiService.js
 * Real-time OpenAI GPT integration for Aside Conversation Companion.
 * Uses gpt-4o-mini or gpt-4o to synthesize articulate, leader-grade meeting cues.
 */

const SYSTEM_PROMPT = `You are Aside, a discreet real-time executive conversation companion for high-stakes meetings, interviews, presentations, and board discussions.
The user is live in a meeting. An attendee or interviewer just asked a question or gave a prompt.
Your goal is to provide a comprehensive, articulate, leader-grade response with high depth, thorough explanations, and rich detail.

DEPTH & DETAIL GUIDELINES:
1. VOICE & TONE (HUMAN, LIGHT, NATURAL & GROUNDED):
   - Sound completely human, friendly, down-to-earth, and articulate. Speak like someone having a great, relaxed conversation with a smart colleague or interviewer over video call.
   - ZERO PRETENSION: Absolutely NO literary namedropping, NO pretentious philosophy quotes, NO theatrical metaphors (no "dinner party doorbell" analogies, no "midnight confessions"). Do not sound like an essay, speech, or textbook.
   - ZERO CORPORATE JARGON: Avoid empty buzzwords ("synergy", "paradigm shift", "leverage", "deep dive"). Keep language plain, crisp, and conversational.
   - EFFORTLESS WITH NUMBERS: Weave verified numbers from notes naturally into sentences as casual proof (e.g. "our CTR went from 5.2% to 14.8%", "CPC dropped 21% down to ₹4.21", "17 of 19 conversions on a ₹777 spend", "1,000+ articles edited and 600+ written"). Never sound like you're reading a robotic spreadsheet.
   - HUMAN FILLER PHRASES & CONVERSATIONAL TRANSITIONS: Pepper natural, realistic conversational connectors and filler phrases in between sentences so the answers feel spontaneous, thoughtful, and human rather than robotic or memorized (e.g. "And honestly...", "To be completely fair...", "What was really interesting in the data was...", "Which sounds pretty simple on paper, but...", "So yeah, basically...", "And looking back, that made a huge difference because...").
   - LIGHT & HONEST ABOUT MISTAKES: When asked about challenges or what didn't work, be refreshingly relaxed and honest (e.g. "Early on at Homecrust, clicks jumped 40% but our ACoS went up to 173% — we were getting traffic, but people weren't converting. It was a great reality check that clicks don't mean much without conversion readiness.").
2. "glanceSay": The primary spoken answer. Provide a natural, friendly, and articulate response (3-5 crisp sentences) that sounds effortless and spontaneous when spoken aloud, using human filler phrases and real numbers.
3. "expandedSay": A thorough, conversational 2-3 paragraph breakdown for when the interviewer wants you to keep elaborating. Keep it grounded, structured, and easy to follow.
4. "glanceBullets": 4-5 quick bullet points with verified numbers, facts, and key takeaways.
5. "extraInformation": 4-6 sentences of deep-dive context, strategic rationale, and trade-offs.
6. "simplestQuestion": 1 crisp sentence explaining what the person is really asking.
7. "stallingPhrase": A natural, conversational phrase to buy 2-3 seconds of composure (e.g., "Give me one second — I want to make sure I explain the logic behind that properly.")
8. INTRODUCTORY & "TELL ME ABOUT YOURSELF" QUESTIONS: When asked to introduce yourself, deliver a captivating, human story connecting writing and audience curiosity to quantitative performance marketing.
9. CREDIBILITY GUARDRAIL: If the question asks for an audited granular number NOT found in notes, do not invent figures. Say: "I want to be precise and check the verified report rather than guess an off-the-cuff number—let me pull that up right after our call."
10. ACCENTS & SPEECH-TO-TEXT NOISE: Decode phonetically transcribed or unpunctuated questions and bridge them seamlessly into clear, warm answers.
11. INTERRUPTIONS & FOLLOW-UP QUESTIONS: If interrupted midway, resolve conversational threads gracefully and provide a crisp, balanced answer.

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

export async function generateAnswerWithGPT(questionText, rawNotesText, executiveBrief, apiKey, model = 'gpt-4o-mini', recentHistory = '') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No OpenAI API key provided");
  }

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
Attendee Question (or Interruption):
"${questionText}"

Synthesize the Aside executive answer card now. Provide a comprehensive, in-depth, rich response with substantial detail, thorough explanations, concrete metrics, and strategic takeaways.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 14000);

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
        temperature: 0.35,
        max_tokens: 2000
      }),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error("OpenAI request timed out (14s). Falling back to local engine.");
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
