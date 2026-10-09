/**
 * mockData.js — Aside Conversation Companion
 * Core scenarios, rolling context, and grounding data.
 */

export const ASIDE_PRODUCT_NAME = "Aside";
export const ASIDE_TAGLINE = "A little help staying in the conversation.";
export const ASIDE_DESCRIPTION = "A lightweight real-time conversation companion for meetings and presentations.";
export const DEFAULT_USER = "Roo";

export const CONVERSATION_STATES = {
  LISTENING: "LISTENING",
  OTHER_PERSON_SPEAKING: "OTHER_PERSON_SPEAKING",
  POSSIBLE_QUESTION: "POSSIBLE_QUESTION",
  QUESTION_CONFIRMED: "QUESTION_CONFIRMED",
  YOUR_TURN: "YOUR_TURN",
  RESPONSE_FINISHED: "RESPONSE_FINISHED"
};

export const BUY_ME_A_SECOND_PHRASES = [
  "Give me one second — I want to make sure I explain that properly.",
  "Let me think about that for a second.",
  "I want to check the exact number before I answer.",
  "That's a fair question, let me pull up the specific breakdown from last week.",
  "Give me just a moment to pull the verified line item."
];

export const PRESET_NOTE_TEMPLATES = [
  {
    id: "marketing-q3",
    title: "Marketing Campaign Review",
    type: "Work",
    topic: "Marketing campaign performance",
    attendees: ["Sarah (VP Marketing)", "Marcus (Growth Lead)", "Alex (Finance)"],
    rawNotes: `Meeting about our marketing campaign.
Meta is performing well overall, but dropped last week because we swapped the creative mid-week and CPC spiked during the learning phase.
Search score is at 78, holding steady with +12% conversion volume.
E-commerce result benchmark is 89.
Creative was delayed by 3 days because design needed legal approval.
Need to ask about increasing budget for next month, but only after Tuesday's creative test.
Do NOT promise lower CPA until we see the fresh variations.
Meta conversion volume is improving; team is considering budget increase.`,
    cheatSheet: {
      coreNarrative: "Performance dipped due to mid-week creative fatigue swap and algorithmic learning reset. Search held steady at 78 score (+12% volume lift).",
      thingsToRemember: [
        "Meta performing well overall; temporary dip from mid-week creative rotation",
        "Search score: 78 (+12% conversion volume lift WoW)",
        "E-commerce result benchmark: 89",
        "Creative rollout delayed 3 days due to compliance & legal review",
        "CPC bumped temporarily during algorithmic learning phase"
      ],
      thingsToAsk: [
        "Increase monthly budget once Tuesday's creative test confirms stabilization?",
        "What is our firm milestone deadline for the Q4 campaign rollout?"
      ],
      importantNumbers: [
        { label: "Search Score", value: "78" },
        { label: "E-comm Benchmark", value: "89" },
        { label: "Volume Lift", value: "+12%" },
        { label: "Review Delay", value: "3 days" }
      ],
      guardrails: [
        "Do NOT promise lower CPA until fresh creative variations are confirmed Tuesday",
        "Hold budget increase until efficiency metrics confirm stabilization"
      ],
      anchors: [
        "If asked why creative changed: Old ad was hitting audience fatigue.",
        "If asked about budget: Hold flat until Tuesday test confirms efficiency.",
        "Take a breath: Sarah wants the strategic facts. You have the numbers."
      ]
    }
  },
  {
    id: "product-interview",
    title: "Senior Product Manager Interview",
    type: "Interview",
    topic: "App Redesign & Activation Strategy",
    attendees: ["Elena (VP Product)", "David (Director of Eng)"],
    rawNotes: `Interview for Lead Product Manager.
Key story: Led the mobile onboarding revamp that improved Day 7 retention by 28%.
Engineering conflict: David might ask how I handled pushback on tech debt. Answer: Negotiated 20% sprint buffer for refactoring.
Important metric: NPS rose from 34 to 58 in 6 months.
Remember to ask about team autonomy and roadmap ownership.
Don't ramble on the failure story — keep it to 90 seconds.`,
    cheatSheet: {
      coreNarrative: "Led onboarding revamp lifting D7 retention +28%. Negotiated 20% sprint buffer for tech debt. NPS grew 34 to 58.",
      thingsToRemember: [
        "Day 7 retention: +28% lift via 3-step value-first onboarding",
        "Negotiated 20% permanent sprint buffer for engineering tech debt",
        "NPS expansion: 34 → 58 over 6 months post-revamp"
      ],
      thingsToAsk: [
        "How is squad autonomy balanced against executive direction?",
        "What does high-impact success look like in the first 90 days?"
      ],
      importantNumbers: [
        { label: "Day 7 Retention", value: "+28%" },
        { label: "NPS Growth", value: "34 → 58" },
        { label: "Sprint Buffer", value: "20%" }
      ],
      guardrails: [
        "Don't ramble on failure story — keep strictly under 90 seconds",
        "Frame tech debt as shared ownership, never adversarial"
      ],
      anchors: [
        "STAR framework: Situation, Task, Action, Result",
        "You earned this interview. Speak with visionary product authority."
      ]
    }
  }
];

/**
 * INITIAL ROLLING CONVERSATION LOG
 * Pre-seeded with earlier meeting statements to demonstrate continuous rolling context.
 */
export const INITIAL_CONVERSATION_HISTORY = [
  {
    id: "hist-1",
    speaker: "Sarah (VP Marketing)",
    role: "VP Marketing",
    text: "Thanks everyone for joining our Q3 mid-sprint review. Let's look at performance numbers.",
    timestamp: "10:31 AM",
    isUser: false,
    type: "statement"
  },
  {
    id: "hist-2",
    speaker: "Marcus (Growth Lead)",
    role: "Growth Lead",
    text: "Meta is generating good conversion volume right now, even though ad spend fluctuated a bit.",
    timestamp: "10:33 AM",
    isUser: false,
    type: "statement",
    keyFact: "Meta conversion volume is strong"
  },
  {
    id: "hist-3",
    speaker: "Alex (Finance Lead)",
    role: "Finance Lead",
    text: "Search budget pacing is completely on track at $12k/month with stable ROAS.",
    timestamp: "10:34 AM",
    isUser: false,
    type: "statement",
    keyFact: "Search pacing on track at $12k/mo"
  }
];

/**
 * 8 CORE DEMO SCENARIOS (Matching User Specification Section 22 & 23)
 */
export const DEMO_SCENARIOS = [
  {
    id: "scenario-1",
    scenarioNum: 1,
    title: "Scenario 1: Expected Question",
    subtitle: "Directly covered in notes (High Confidence)",
    category: "expected",
    confidence: "high",
    isTargetedAtUser: true,
    speaker: "Sarah (VP Marketing)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    question: "Why did campaign performance drop last week?",
    topic: "Campaign drop",
    babeTag: "babe 👀",
    simplestQuestion: "They're asking why performance dropped.",
    startWithPrompt: "Start with: “Yeah, so the short story is…”",
    glanceSay: "Mostly the creative change and higher CPC.",
    glanceBullets: [
      "• creative changed mid-week",
      "• CPC ↑ during learning phase",
      "• Search held steady at 78"
    ],
    expandedSay: "Yeah, happy to walk through that. We rotated our primary creative mid-week because older assets were fatiguing, which reset Meta's learning phase and pushed CPC up temporarily. The reassuring signal is our baseline held firm—Google Search stayed solid at a 78 quality score with conversion volume up 12% WoW, so this was transient friction from the ad refresh.",
    supportingContext: "Notes: Creative swapped Wednesday after fatigue; 3-day legal delay; Search quality score 78 (+12% volume lift).",
    stuckRecovery: {
      breatheMsg: "okay babe, breathe.",
      questionSummary: "Why did performance drop?",
      points: ["creative changed", "CPC increased", "Search stayed solid"],
      easySay: "I think it was mainly the creative change and higher CPC.",
      stallSay: "Give me one second — I want to make sure I explain that properly."
    }
  },
  {
    id: "scenario-2",
    scenarioNum: 2,
    title: "Scenario 2: Unexpected but Inferable",
    subtitle: "Reasons from continuous conversation context",
    category: "unexpected",
    confidence: "high",
    isTargetedAtUser: true,
    speaker: "Sarah (VP Marketing)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    question: "So why do you think we should increase the budget?",
    topic: "Budget increase rationale",
    babeTag: "babe 👀 unexpected one",
    simplestQuestion: "They're asking why you want to increase the budget.",
    startWithPrompt: "Start with: “I think it makes sense because…”",
    glanceSay: "Because conversion volume is strong and CPC hasn't risen too much.",
    glanceBullets: [
      "• Marcus noted: good conversion volume",
      "• CPC is stabilizing",
      "• Scale after Tuesday's creative test"
    ],
    expandedSay: "I think it makes sense to test increasing the budget because conversion volume is strong and CPC hasn't risen too much once creative settles. Marcus mentioned earlier that volume is expanding nicely, and our unit economics on Search prove user intent is healthy.",
    supportingContext: "From the conversation: Earlier Marcus confirmed Meta is generating good conversion volume. Combined with stable baseline, scaling makes sense post-test.",
    stuckRecovery: {
      breatheMsg: "Connect the dots: volume is up, CPC stable, scale post-test.",
      questionSummary: "Why increase budget?",
      points: ["Marcus noted strong volume", "CPC stable", "Scale after Tuesday test"],
      easySay: "Because conversion volume is strong and CPC hasn't risen too much.",
      stallSay: "I want to be precise about why the math works here."
    }
  },
  {
    id: "scenario-3",
    scenarioNum: 3,
    title: "Scenario 3: Opinion Question",
    subtitle: "Asking for user's recommendation",
    category: "opinion",
    confidence: "high",
    isTargetedAtUser: true,
    speaker: "Marcus (Growth Lead)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    question: "Roo, what do you think we should do next?",
    topic: "Next steps recommendation",
    babeTag: "They're asking for YOUR recommendation. 👀",
    simplestQuestion: "They want your recommendation on what to do next.",
    startWithPrompt: "Start with: “My recommendation is…”",
    glanceSay: "I'd probably test a couple more creatives before increasing the budget.",
    glanceBullets: [
      "• test 2-3 fresh variations Tuesday",
      "• hold budget steady for 72h",
      "• let data earn the budget scale"
    ],
    expandedSay: "My recommendation is disciplined patience over the next 72 hours. We shouldn't rush to scale budget until Tuesday's creative test confirms efficiency, but once we validate the fresh hooks and see CPC settle, we can unlock spend behind our winning variations with high confidence.",
    supportingContext: "Based on what you've prepared: Hold off on spend until Tuesday's test proves itself.",
    stuckRecovery: {
      breatheMsg: "Take a second. This is your opinion, not a pop quiz.",
      questionSummary: "What should we do next?",
      points: ["test 2-3 variations", "hold spend steady", "review Tuesday"],
      easySay: "I'd test a couple more creative variations and hold our spend steady for now.",
      stallSay: "Let me think about the cleanest rollout order for a second."
    }
  },
  {
    id: "scenario-4",
    scenarioNum: 4,
    title: "Scenario 4: Ambiguous / Jargon Question",
    subtitle: "“What are they actually asking?” mode",
    category: "jargon",
    confidence: "high",
    isTargetedAtUser: true,
    speaker: "Marcus (Growth Lead)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    question: "Can you speak to the implications of the Q3 attribution model relative to our previous acquisition strategy?",
    topic: "Corporate Jargon Translation",
    babeTag: "babe, normal-person translation:",
    simplestQuestion: "“What changed, and what does it mean for our strategy?”",
    startWithPrompt: "Start with: “Yeah, basically, the main change is…”",
    glanceSay: "Yeah, basically, the main change is we're weighting top clicks more, so direct ROAS looks lower while total sales held steady.",
    glanceBullets: [
      "• top-of-funnel gets more credit",
      "• reported ROAS looks lower",
      "• total sales unchanged"
    ],
    expandedSay: "Yeah, basically, the main change is that the new model credits early discovery clicks. It makes last-click ROAS look lower on paper, but our blended customer volume hasn't dropped. It proves our top-of-funnel ads are feeding our search conversions.",
    supportingContext: "Jargon unpacked: Attribution models shift how revenue is credited between ads, not the actual dollars collected.",
    stuckRecovery: {
      breatheMsg: "Classic corporate jargon. Don't let big words rattle you.",
      questionSummary: "What changed with attribution?",
      points: ["top clicks get credit", "direct ROAS looks lower", "overall sales steady"],
      easySay: "Yeah, basically top clicks get more credit now, but total sales are completely steady.",
      stallSay: "Give me one second — I want to make sure I explain that attribution shift simply."
    }
  },
  {
    id: "scenario-5",
    scenarioNum: 5,
    title: "Scenario 5: Unknown Fact",
    subtitle: "Refuses to hallucinate / Safe credibility defense",
    category: "unknown",
    confidence: "high", // High confidence that we do NOT know!
    isTargetedAtUser: true,
    speaker: "Alex (Finance Lead)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    question: "What was our exact CPA variance in Germany last Tuesday?",
    topic: "When Aside doesn't know (No hallucinations)",
    babeTag: "babe, I don't have enough info for this one 😭",
    simplestQuestion: "They're asking for a hyper-specific Germany stat not in your notes.",
    startWithPrompt: "Safe response:",
    glanceSay: "I'm not sure off the top of my head — let me check and get back to you.",
    glanceBullets: [
      "• no Germany data in notes",
      "• don't guess a number",
      "• offer to follow up"
    ],
    expandedSay: "I don't have that exact breakdown with me right now. Let me verify the numbers with the finance team after the meeting so I give you the verified figure.",
    supportingContext: "Aside fact check: Notes contain blended benchmarks, but zero Germany-specific breakouts. Safe fallback applied.",
    stuckRecovery: {
      breatheMsg: "babe, do NOT guess. It is 100% fine not to know.",
      questionSummary: "Germany CPA last Tuesday?",
      points: ["not in notes", "do not invent numbers", "check after call"],
      easySay: "I'm not sure off the top of my head — let me check and get back to you.",
      stallSay: "I don't want to give you the wrong number. Let me verify that."
    }
  },
  {
    id: "scenario-6",
    scenarioNum: 6,
    title: "Scenario 6: False Trigger (Room Question)",
    subtitle: "Question addressed to room -> Aside stays silent",
    category: "false-trigger",
    confidence: "none",
    isTargetedAtUser: false,
    speaker: "Marcus (Growth Lead)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    question: "Does anyone want coffee or water before we keep going?",
    topic: "Room-wide chatter (Targeting check failed)",
    babeTag: "● listening quietly",
    simplestQuestion: "Addressed to everyone, not directed at you.",
    glanceSay: "",
    glanceBullets: [],
    expandedSay: "",
    suppressedReason: "General room question with no user targeting cues. Aside remains silent.",
    supportingContext: "Turn-taking filter: Not directed at user. Aside stays quiet."
  },
  {
    id: "scenario-7",
    scenarioNum: 7,
    title: "Scenario 7: User Is Speaking (No Regeneration)",
    subtitle: "User speech detected -> Freeze suggestion & wait",
    category: "user-speaking",
    confidence: "high",
    isUserSpeech: true,
    speaker: "You (Roo)",
    avatar: "👤",
    question: "“Yeah, so I think there were two main things. The creative changed mid-week and CPC went up a little…”",
    topic: "User is speaking (Freeze suggestion)",
    babeTag: "🗣️ YOUR TURN · Frozen",
    simplestQuestion: "You are answering right now.",
    frozenSuggestion: "Mostly the creative change and higher CPC.",
    glanceSay: "Mostly the creative change and higher CPC.",
    glanceBullets: [
      "• User speaking detected on mic",
      "• Regeneration completely frozen",
      "• Waiting for user to finish"
    ],
    expandedSay: "Aside freezes the current response and remains silent while you speak. It will return to listening after you finish.",
    supportingContext: "Core Principle: User speech never triggers new AI generation."
  },
  {
    id: "scenario-8",
    scenarioNum: 8,
    title: "Scenario 8: Contextual Follow-up",
    subtitle: "Uses previous user answer and conversation thread",
    category: "follow-up",
    confidence: "high",
    isTargetedAtUser: true,
    speaker: "Sarah (VP Marketing)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    question: "And what would you do differently next time to avoid that lag?",
    topic: "Process reflection & follow-up",
    babeTag: "babe 👀 follow-up to creative delay",
    simplestQuestion: "They're asking how to avoid the 3-day approval delay next time.",
    startWithPrompt: "Start with: “Next time I'd…”",
    glanceSay: "Next time I'd build in a mandatory 2-day compliance buffer and pre-clear claims with legal.",
    glanceBullets: [
      "• 2-day buffer in campaign calendar",
      "• pre-clear claim language with legal",
      "• avoids mid-week delivery bottleneck"
    ],
    expandedSay: "Next time, I'd build a mandatory 2-day compliance buffer into the schedule and pre-clear promotional claims with legal before finishing design assets. That prevents the approval bottleneck from compressing our learning phase.",
    supportingContext: "Chained context: Connects 'that lag' to the 3-day legal review delay mentioned in your earlier response.",
    stuckRecovery: {
      breatheMsg: "Follow-up question. Give the forward-looking solution.",
      questionSummary: "What to do differently?",
      points: ["2-day buffer", "pre-clear claims with legal", "prevent bottleneck"],
      easySay: "Next time we'll buffer 2 days for legal approval and pre-clear the claims.",
      stallSay: "I've already thought through how we'll adjust the schedule for next round."
    }
  },
  {
    id: "scenario-low-confidence",
    scenarioNum: 9,
    title: "Medium/Low Confidence Demonstration",
    subtitle: "Section 9: Unclear audio with Replay / Transcript options",
    category: "low-confidence",
    confidence: "low",
    isTargetedAtUser: true,
    speaker: "Alex (Finance Lead)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    question: "Muffled audio: “...[garbled]... and what's the ...target variance?”",
    topic: "Budget / campaign performance",
    babeTag: "I didn't quite catch that 😭",
    simplestQuestion: "Audio was unclear. Best guess topic: Budget / performance target.",
    glanceSay: "I didn't quite catch that 😭",
    glanceBullets: [
      "• Topic seems to be: Budget & targets",
      "• Options: Replay, Show transcript, or Ignore"
    ],
    expandedSay: "Audio was muffled. You can ask: “Sorry, could you repeat that last part?” or glance at recent transcript.",
    supportingContext: "Section 9 Confidence handling: Do not invent answers when audio is unclear.",
    lowConfidenceActions: ["Replay audio snippet", "Show recent transcript", "Ignore"]
  }
];

export const MEETING_WRAPUP_SUMMARY = {
  title: "Q3 Paid Acquisition & Creative Review",
  date: "October 8, 2026",
  recap: "Aside quietly helped you navigate 8 conversation turns with zero interruption. You articulated the creative fatigue rationale, explained attribution simply, and held spend steady until Tuesday's test.",
  thingsDiscussed: [
    "Mid-week creative rotation and temporary CPC variance during learning phase",
    "Continuous context: Marcus's conversion volume confirmation connected to budget rationale",
    "Attribution model translation from corporate jargon to plain English",
    "Follow-up process improvement: 2-day compliance buffer for future sprints"
  ],
  decisions: [
    "Confirmed hold on monthly budget increase until Tuesday creative validation completes",
    "Proceeding with 2-3 fresh creative hooks to solve ad fatigue ahead of Q4",
    "Search campaign will maintain existing pacing given solid score of 78"
  ],
  followUps: [
    "Confirm Q4 sign-off deadline with Sarah",
    "Verify Germany CPA ledger with finance team post-meeting"
  ],
  thingsToCheck: [
    "Pull Tuesday creative split-test conversion metrics by 3pm",
    "Send follow-up note to Alex on verified regional variances"
  ]
};
