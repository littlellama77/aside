/**
 * openaiService.js
 * Real-time OpenAI GPT integration for Aside Conversation Companion.
 * Uses gpt-4o-mini or gpt-4o to synthesize articulate, leader-grade meeting cues.
 */

const SYSTEM_PROMPT = `You are Aside, a discreet real-time executive conversation companion for meetings, interviews, and presentations.
The user is live in a meeting. Someone just asked a question.
Your goal is to quietly help the user formulate their own thoughts without speaking for them or sounding like a robotic AI.

GUIDELINES:
1. "glanceSay": The primary spoken answer. 1-3 crisp, articulate, human sentences written with executive presence. Grounded 100% in the user's provided notes. Sound natural to speak aloud in front of executives.
2. "glanceBullets": 3-4 bullet chips containing exact figures, numbers, metrics, and facts from their notes.
3. "extraInformation": 2-3 sentences of deep-dive context, strategic rationale, and next steps if the meeting attendee probes deeper.
4. "simplestQuestion": 1 plain-English sentence explaining what the person is actually asking.
5. "stallingPhrase": A natural phrase to buy 2-3 seconds of thinking time (e.g. "Give me one second — I want to make sure I pull up the exact breakdown for you.")
6. VAGUE HUMAN SKILLS / SOFT SKILLS: If the question is about conflict, leadership, culture, stakeholders, or interpersonal dynamics, use the "Principle -> Concrete Action -> Outcome" framework.
7. CREDIBILITY GUARDRAIL: If the question asks for a specific fact, country, or number NOT found anywhere in the provided notes, DO NOT hallucinate or guess data. Set "isUnknown": true, and make "glanceSay": "I want to be precise and verify the audited figure rather than give you an off-the-cuff number — let me pull that report post-meeting and follow up directly."
8. ACCENTS, MUDDLED WORDS & SPEECH-TO-TEXT NOISE: Meeting audio frequently includes diverse regional accents (British, Indian, European, Australian, American regional, Asian, Latino), background microphone interference, or fast mumbling. Live speech-to-text often produces phonetically transcribed or garbled words (e.g. "see ay see" or "kay ack" -> CAC; "see pee see" -> CPC; "metta" -> Meta; "convertion" -> conversion; "retenshun" -> retention; "onboardin" -> onboarding; "wat bout dat" -> what about that). ALWAYS decode the speaker's true intent using context from the user's notes and bridge muddled phrasing into clear, executive-grade answers.

Always respond in strictly valid JSON with this schema:
{
  "topic": "Short topic title",
  "simplestQuestion": "Plain English interpretation",
  "babeTag": "babe 👀 clear strategic rationale",
  "glanceSay": "1-3 articulate sentences to say aloud",
  "glanceBullets": ["• Bullet 1 with number", "• Bullet 2 with fact", "• Bullet 3 with next step"],
  "expandedSay": "Full 3-5 sentence executive narrative",
  "extraInformation": "Deep dive background and rationale from notes",
  "supportingContext": "Section or notes retrieved",
  "isUnknown": false,
  "stallingPhrase": "Phrase to buy thinking time"
}`;

export async function generateAnswerWithGPT(questionText, rawNotesText, executiveBrief, apiKey, model = 'gpt-4o-mini') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No OpenAI API key provided");
  }

  const userPrompt = `Meeting Notes & Context:
"""
${rawNotesText || "General meeting context"}
"""

Attendee Question:
"${questionText}"

Synthesize the Aside executive answer card now.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API returned status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response content from OpenAI");
  }

  const parsed = JSON.parse(content);
  return {
    id: `gpt-${Date.now()}`,
    speaker: "Meeting Attendee",
    question: questionText,
    topic: parsed.topic || "Meeting Inquiry",
    simplestQuestion: parsed.simplestQuestion || questionText,
    babeTag: parsed.babeTag || "babe 👀 GPT-4o executive cue",
    glanceSay: parsed.glanceSay,
    glanceBullets: parsed.glanceBullets || [],
    expandedSay: parsed.expandedSay || parsed.glanceSay,
    extraInformation: parsed.extraInformation || "Synthesized live with GPT-4o from your notes.",
    supportingContext: parsed.supportingContext || "Live GPT synthesis from your meeting notes.",
    isUnknown: Boolean(parsed.isUnknown),
    stuckRecovery: {
      breatheMsg: "Take a breath babe. You've got this.",
      questionSummary: questionText,
      points: parsed.glanceBullets || ["Ground in notes", "Stay calm"],
      easySay: parsed.glanceSay,
      stallSay: parsed.stallingPhrase || "Give me one second — I want to make sure I frame that clearly."
    }
  };
}
