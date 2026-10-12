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

  const FAST_SYSTEM_PROMPT = `You are Aside, a real-time conversational meeting companion for a candidate interviewing for a Performance Marketing Associate role at Crealytics (an omnichannel digital agency specializing in retail e-commerce, paid search/SEA, social advertising, and incremental growth).
The interviewer just asked: "${targetQuestion}".
Your goal is to provide Box 1 (Quick Answer / Fast Hook) that the user can glance at and say aloud immediately.

CANDIDATE'S AUTHENTIC VOICE & PHILOSOPHY:
- Confident, Grounded Practitioner: Speaks with genuine conviction about what they've learned and can implement. They have hands-on experience running live campaigns across Google Search, Meta Ads, and Amazon PPC under real budget constraints, and know how to operate the levers.
- Core Maker Drive: Drawn to things that let them "make something, take it apart, and make it better." That is what pulled them into performance marketing in the first place.
- Crealytics Alignment (CLV & Profit Margins over ROAS): Rejects tired industry clichés of superficial Return on Ad Spend (ROAS). Values Crealytics' focus on Customer Lifetime Value (CLV), net profit margins, and predictive modeling via your proprietary iCLV Measurement Platform in a privacy-first world.
- "Sharpen the Saw" & AI Philosophy: Machines and automation should do the repetitive heavy lifting so human minds are freed to think strategically and generate creative solutions. AI is a strategic force multiplier to amplify human potential, not replace it (evident in the candidate's experience building 5+ functional AI web prototypes).
- The 4 Muscles: Creative (building the campaign), Analytical (diagnosing why it worked or didn't), Technical (finding better ways, testing bidding levers), and Human/Collaborative (learning from people who make them realize they could have built it differently; welcoming questions and disagreements).
- Tone: Confident, articulate, intellectually curious, honest, and grounded. NEVER canned corporate buzzwords (no "delve", "pivotal", "crucial", "synergy", "spearheaded", "testament to").

BOX 1 REQUIREMENTS:
1. STRICTLY ON-TOPIC: Directly answer what the interviewer asked!
   - If asked "Why Crealytics / Why this role / Why good fit?": Open confidently with the maker drive ("drawn to things where I can make something, take it apart, and make it better") combined with hands-on campaign execution. Emphasize moving past vanity ROAS clichés to real profit margins and Customer Lifetime Value (CLV) with Crealytics' predictive iCLV platform, and the excitement of building all four muscles.
   - If asked about a campaign (Google Search, Meta, Amazon): Give the direct numbers and core finding with confidence (e.g., Search CTR 5.2% to 14.8%, CPC down 21%, Cost Cap vs Highest Volume, Homecrust ACoS 173%).
   - If asked about feedback/mistakes: Confidently explain the feedback and the principle of never confusing effort with effectiveness.
   - If asked about "Vibe Coding / Personal Projects / The Spare Room / Gaming / Scrimba / MCP / Are you a developer?":
     * Vibe coding is using natural-language AI tools to translate ideas into working prototypes without waiting for years of traditional programming training.
     * Highlight "The Spare Room" (therapy-inspired visual calendar app, tested with 6 friends; learned to avoid feature creep and prioritize user simplicity), or Roblox gaming (cosy exploration, supernatural mystery; player retention and pacing).
     * Clarify with humility and confidence: Not a professional developer, but a curious builder who combines product thinking, user empathy, and practical experimentation to turn ideas into tangible solutions.
2. 2-3 crisp, natural, conversational spoken sentences in the first person ("I").
3. Set up the train of thought so Box 2 can seamlessly continue.

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
The candidate is interviewing for a Performance Marketing Associate role at Crealytics.
The interviewer asked: "${targetQuestion}".
${quickAnswerText ? `The candidate just delivered this opening statement in Box 1:
"${quickAnswerText}"` : ''}

CRITICAL RULES FOR BOX 2 (DETAILED CONTINUATION):
1. BOX 2 MUST DIRECTLY ANSWER AND CONTINUE THE SPECIFIC QUESTION ASKED:
   - CRITICAL: Stay laser-focused on the exact subject of the question asked without drifting to unrelated topics.
   - If asked "Why Crealytics / Why this role / Why good fit?": Continue explaining fit, strategy, and culture with confidence:
     * Weave in Crealytics' "Sharpen the Saw" philosophy: machines/automation do the heavy lifting so human minds can think strategically and generate creative hypotheses; AI as a strategic force multiplier (connecting with candidate's hands-on experience building AI app prototypes).
     * Connect with Crealytics' focus on challenging the status quo and avoiding tired industry clichés—optimizing for CLV and profit margins via predictive modeling (iCLV platform) rather than vanity ROAS.
     * Highlight the collaborative human side: thriving on conversations, questions, and healthy disagreements that challenge assumptions; developing the 4 muscles (creative, analytical, technical, human) in a continuous optimization loop with a diverse global team.
   - If asked about "Vibe Coding / Personal Projects / The Spare Room / Gaming / Scrimba / MCP / Applying AI":
     * For "The Spare Room" app: Explain how 6 friends' feedback ("clunky and complicated") taught her that adding features increases friction, to never confuse effort with effectiveness, and why she'd build a simple MVP focused on the single core user problem first.
     * For Roblox Gaming: Connect game mechanics (cosy exploration, supernatural mystery) to marketing concepts—player retention, pacing, storytelling, and hypothesis testing.
     * For Vibe coding & Scrimba Specialization (Cursor, Claude Code, MCP): Explain iterative development (define problem → break into smaller tasks → implement with AI → run/test → debug errors → refine). Highlight how AI is a force multiplier in marketing (reporting, ad copy variations, workflow automation) but requires human verification against real data.
     * If asked "Are you a developer?": Clarify with confidence that she is not a professional software engineer, but someone combining curiosity, user empathy, and AI tools to turn ideas into tangible prototypes.
   - If asked about a campaign (Google Search, Meta Ads, Amazon PPC): Continue explaining the specific campaign mechanics, query intent, auction dynamics, or landing page drop-offs, tying back to commercial unit economics and margin.
   - If asked about mistakes or feedback: Continue explaining the feedback, how you separated effort from effectiveness, and what you improved.
   - If asked about adaptability or fast learning: Continue explaining how you break down new domains from first principles.

2. BOX 2 MUST BE A DIRECT, SEAMLESS SPOKEN CONTINUATION OF BOX 1:
   - NEVER repeat, rephrase, or reintroduce what was already said in Box 1! Do NOT start the story over.
   - Start Box 2 immediately with a natural spoken transition picking up the exact train of thought:
     - For fit / culture / why Crealytics: "And what excites me just as much is your 'Sharpen the Saw' philosophy around AI and automation...", "To build on that, another reason this resonates with me is how you challenge baseline industry assumptions...", "And perhaps most importantly, what drew me to your team is the human side..."
     - For vibe coding / personal projects: "To build on that, what that project really taught me about product thinking was...", "Going a layer deeper into the feedback from friends...", "How that connects directly back to performance marketing is..."
     - For campaigns / data: "To build on that and explain what was happening under the hood...", "Going a layer deeper into what the data revealed..."
     - For strategy / decisions: "Going a layer deeper into why I recommend that sequence..."

3. CONFIDENT, PRACTITIONER TONE (GROUNDED & CAPABLE):
   - Sound like a confident practitioner who knows what they've learned and can implement it directly.
   - Grounded in hands-on execution (Kraftshala live campaigns, building AI prototypes, fact-checking rigor).
   - "I like learning from the people who make me realise I could have built them differently. I want the numbers and the tools, but I also want the conversations, the questions, the disagreements, and the people who make me think differently."
   - 2 short, conversational paragraphs that expand the answer with genuine depth, strategic confidence, and first-principles insight.
   - ZERO corporate buzzwords: No "delve", "testament to", "crucial", "pivotal", "spearheaded", "synergy".

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
