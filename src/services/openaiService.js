/**
 * openaiService.js
 * Real-time OpenAI GPT integration for Aside Conversation Companion.
 * Uses gpt-4o-mini or gpt-4o to synthesize articulate, leader-grade meeting cues.
 */

const SYSTEM_PROMPT = `You are Aside, a discreet real-time executive conversation companion for high-stakes meetings, interviews, presentations, and board discussions.
The user is live in a meeting. An attendee or interviewer just asked a question or gave a prompt.
Your goal is to provide a comprehensive, articulate, leader-grade response with high depth, thorough explanations, and rich detail.

DEPTH & DETAIL GUIDELINES:
1. "glanceSay": The primary spoken answer. Provide a substantive, articulate response (4-6 comprehensive sentences) written with executive poise and intellectual depth. Do not give shallow or clipped soundbites. Include strategic context, operational details, concrete numbers or metrics from notes, and forward guidance.
2. "expandedSay": A thorough, multi-paragraph executive masterclass answer (8-14 sentences across 2-3 structured paragraphs):
   - Paragraph 1 (Strategic Context & Background): Frame the overarching objective, historical context, and high-level perspective.
   - Paragraph 2 (Operational Execution & Hard Metrics): Dive deep into the specific mechanics, methodologies, numbers, cross-functional collaboration, and technical/operational execution.
   - Paragraph 3 (Business Impact, Forward Trajectory & Next Steps): Conclude with measurable outcomes, current priorities, and upcoming strategic milestones.
3. "glanceBullets": 5-7 detailed, information-dense bullet points containing exact metrics, verified figures, operational benchmarks, and strategic takeaways.
4. "extraInformation": 4-6 sentences of rich deep-dive context, strategic rationale, trade-offs evaluated, and contingency plans if attendees drill further into the details.
5. "simplestQuestion": 1 crisp sentence explaining the core strategic intent behind the question.
6. "stallingPhrase": A polished, natural phrase to buy 2-3 seconds of composure (e.g., "That's a critical area to unpack—let me walk you through the key dynamics and the exact numbers driving our current trajectory.")
7. INTRODUCTORY & "TELL ME ABOUT YOURSELF" QUESTIONS: When asked to introduce yourself, give an overview, or share your background, deliver a commanding, articulate executive narrative spanning career trajectory, core leadership competencies, major operational wins, and current strategic focus.
8. SOFT SKILLS & BEHAVIORAL QUESTIONS: Use the "Strategic Principle -> Concrete Action & Metric -> Measurable Outcome & Reflection" structure with rich detail.
9. CREDIBILITY GUARDRAIL: If the question asks for an audited granular number NOT found anywhere in the notes, do not invent audited figures. Provide the surrounding strategic context and state clearly: "I want to be precise and verify the exact audited figure rather than give you an off-the-cuff number—let me pull that report post-meeting and follow up directly."
10. ACCENTS & SPEECH-TO-TEXT NOISE: Decode phonetically transcribed or muddled phrasing using meeting context and bridge them seamlessly into authoritative executive answers.
11. INTERRUPTIONS & FOLLOW-UP QUESTIONS: If this is an interruption or follow-up to earlier dialogue, use the conversation history to immediately resolve references and provide a comprehensive pivot answer.

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
