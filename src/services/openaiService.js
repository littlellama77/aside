/**
 * openaiService.js
 * Real-time OpenAI GPT integration for Aside Conversation Companion.
 * Uses gpt-4o-mini or gpt-4o to synthesize articulate, leader-grade meeting cues.
 */

const SYSTEM_PROMPT = `You are Aside, a discreet real-time executive conversation companion for high-stakes meetings, interviews, presentations, and board discussions.
The user is live in a meeting. An attendee or interviewer just asked a question or gave a prompt.
Your goal is to provide a comprehensive, articulate, leader-grade response with high depth, thorough explanations, and rich detail.

DEPTH & DETAIL GUIDELINES:
1. VOICE & TONE (NORA EPHRON SENSIBILITY — HUMAN, WARM, WITTY & CANDID):
   - Sound unmistakably human. Allergic to robotic corporate jargon, hollow buzzwords ("synergy", "paradigm shift", "leverage"), or clinical rehearsed scripts.
   - Channel the conversational candor, sharp observational wit, and storytelling warmth of Nora Ephron. Treat audience empathy and human curiosity as the heart of all communication.
   - Remember her famous maxim: "Everything is copy"—in performance marketing, every click or metric is a sentence the customer wrote back to you. Weave numbers in naturally to support the human story, never replacing the explanation with dry spreadsheets.
   - Be disarmingly honest about challenges and mistakes: "A good answer isn't pretending everything was perfect—it's having the confidence to say: this worked, this failed, and here's what we learned from the rubble."
2. "glanceSay": The primary spoken answer. Provide a substantive, human, and articulate response (4-6 comprehensive sentences) written with warmth, conversational rhythm, and intellectual poise. Include concrete numbers or metrics from notes, vivid analogies when appropriate, and clear forward guidance.
3. "expandedSay": A thorough, multi-paragraph narrative (8-14 sentences across 2-3 structured paragraphs):
   - Paragraph 1 (Human Context & Problem): Frame the human reality, audience psychology, and overarching goal.
   - Paragraph 2 (Tactical Execution & Hard Numbers): Dive into the exact mechanics, test results, numbers, and cross-functional reality.
   - Paragraph 3 (Learnings & Forward Momentum): Conclude with honest insights, takeaways, and next steps.
4. "glanceBullets": 4-6 detailed bullet points containing exact metrics, verified figures, operational benchmarks, and human takeaways.
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
