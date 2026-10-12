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
  "Give me two seconds on that—just organizing my thoughts.",
  "Let me think about the best way to frame that for a second.",
  "That's a really good question—give me a quick second to pull up that context.",
  "Let me just verify that in my head so I give you the exact picture.",
  "Give me a quick moment on that, there were a few moving parts."
];

export const NATURAL_HUMAN_FILLERS = [
  "“And what really stood out in the data was…”",
  "“To give you a bit of context on why that happened…”",
  "“And what surprised me most when looking at the numbers was…”",
  "“So in terms of what we learned from that test…”",
  "“Which showed us that when you look underneath the top-line numbers…”",
  "“And honestly, looking back at the results, what I found most interesting was…”",
  "“To put that into perspective with our initial goals…”"
];

export const THINKING_INTRO_SENTENCES = [
  "“Yeah, good question—give me two seconds to frame that…”",
  "“Honestly, what stood out to me most there was…”",
  "“To give you some quick context on how we approached that…”",
  "“Yeah, let me walk you through what we saw in the data…”",
  "“Right, so the main thing we focused on there was…”",
  "“That’s a great question—let me break down what happened…”",
  "“Yeah, so the way I look at that is…”",
  "“Let me give you the quick background on that test…”"
];

export const PRESET_NOTE_TEMPLATES = [
  {
    id: "crealytics-interview",
    title: "Crealytics Interview — The Roo Edition ♡",
    type: "Interview",
    topic: "Performance Marketing Associate (HR / Culture Fit with Torsten Christ)",
    attendees: ["Torsten Christ (Head of HR, Crealytics)", "Garima (Roo)"],
    rawNotes: `CREALYTICS INTERVIEW PREPARATION — PERSONAL, BEHAVIOURAL, SITUATIONAL & COMMERCIAL
Role: Performance Marketing Associate — Remote India
Interviewer: Torsten Christ, Head of HR
Duration: Approximately 30 minutes

SECTION 1: TELL ME ABOUT YOURSELF (GARIMA'S AUTHENTIC INTRODUCTION)
• "Hi! I'm Garima, and I'm from Dehradun, which is a valley nestled in the foothills of the Himalayas. It's a lovely place to grow up in, and I think it has shaped me in some ways. I'm someone who enjoys observing people, having conversations, and being curious about the little things that make people tick.
• Academically, my background is in media and communication, so I've always been interested in how we tell stories, how people interpret information, and what makes a message resonate with an audience.
• I went on to work in writing and editing, including writing for a US-based sports magazine covering the NFL. I wrote over 600 articles, which taught me a lot about research, communicating complex information clearly, understanding an audience, and adapting my writing to what readers actually care about. It also taught me discipline, because you can be as creative as you like, but you still have deadlines to meet!
• But over time, I became increasingly curious about what happens beyond the content itself. Why does one headline get someone to click while another doesn't? Why does one campaign persuade someone to take action while another gets ignored? What makes a person choose one brand over another?
• I realised I was interested not just in creating communication, but also in understanding the psychology behind it and measuring how effectively it works.
• That's what drew me towards digital marketing, and eventually towards performance marketing in particular. It brings together three things I genuinely enjoy: creativity, understanding human behaviour, and working with data to make better decisions.
• What I find especially exciting about performance marketing is that you can start with a hypothesis, test it, look at the results, and learn something concrete from them. You're not relying entirely on intuition or whether something sounds good; you're using evidence to understand what resonates with people and why.
• During my digital marketing course at Kraftshala, I've been able to explore that practically through Google Ads, Meta Ads, and Amazon advertising projects. I've enjoyed working with campaign metrics, experimenting with different approaches, and understanding how small changes can influence performance. It's made the connection between my communication background and my interest in analytical problem-solving feel very natural.
• Outside of work and studies, I'm also someone who enjoys writing fiction and experimenting with creative projects, including building app and game prototypes with AI tools. I think that reflects another side of me: I like imagining possibilities, but I also enjoy figuring out how to bring an idea to life.
• So, for me, moving into performance marketing hasn't felt like abandoning my previous experience. It's felt more like building on it. I get to bring the communication and storytelling skills I've developed through writing, combine them with an understanding of people, and use data to figure out what actually works. That's the combination that makes this field so exciting to me, and it's what I want to keep growing in."

SECTION 2: MOTIVATION AND COMPANY FIT (GARIMA'S AUTHENTIC WHY CREALYTICS)
• "What initially attracted me to Crealytics was its established presence in performance marketing and, particularly, its approach to AI and technology.
• Interestingly, during my time at Kraftshala, my favourite subject turned out to be vibe coding. I started experimenting with AI tools like Antigravity and Claude, building prototypes simply because I was curious to see whether I could turn an idea into something tangible.
• What surprised me was how much I enjoyed the process itself: identifying a problem, figuring out how to approach it, experimenting with different solutions, and refining things when they didn't work. It made me realise that I'm genuinely interested in how technology can make processes more efficient and help solve real problems.
• That's one of the reasons Crealytics caught my attention. I was excited to learn about how the company uses AI and automation in areas like campaign optimisation, analytics, and improving operational efficiency. I find that particularly interesting because it connects technological innovation with measurable business outcomes.
• Coming from a media and communication background, I've always enjoyed the creative side of marketing, but I've also developed a strong interest in understanding consumer behaviour and analysing what makes something effective. Performance marketing brings these interests together, and Crealytics' technology-driven approach makes that combination even more exciting to me.
• What interests me is the idea of using AI to improve the way marketing decisions are made, rather than using it simply because it's a new technology. Through vibe coding, I've experienced how AI can help you move from an idea to a working prototype much faster. At the same time, I've learnt that you still need to understand the problem, evaluate the output, and keep refining the solution.
• That's why I find Crealytics' approach interesting. Its use of AI, automation, and data-driven optimisation connects technology with practical business outcomes.
• I'd love to understand how these tools are applied in real campaign environments, how their effectiveness is measured, how human judgement complements automated systems, and how these tools are applied responsibly.
• I'd love to work in an environment where I can contribute with the skills I'm developing, learn from people with industry experience, and understand how AI and data can be used to solve marketing challenges at scale."

SECTION 3: STRENGTHS, WEAKNESSES AND SELF-AWARENESS
• Greatest Strengths: Attention to detail, research rigor, and clear communication. Fact-checking and editing 1,000+ articles; writing 600+ articles; coordinating with 20+ writers/managers.
• Genuine Weakness: Becoming more confident when approaching something unfamiliar—sometimes wanting to understand all details before moving forward. Learning to balance thoroughness with taking action: identifying what to know first, asking focused questions, and testing iteratively.
• Constructive Criticism: Editorial experience made revisions a normal, healthy part of work. Focus on what needs to improve rather than taking it personally; understand the reasoning and apply the learning.
• What Motivates Me: Understanding how things work and finding ways to make them better—moving from noticing something isn't working to understanding why and testing a solution.
• Trust, Reliability & Hard Work (Garima's Authentic Perspective):
  - "I believe being hardworking is not just about how much time you spend on something, but also about how much ownership you take of the work you're responsible for."
  - "In my previous writing experience, I had to research and write articles consistently while working with deadlines. That taught me the importance of being disciplined, managing my time, and delivering work even when it required more effort than I initially expected."
  - "I've also experienced this during my learning at Kraftshala. There have been concepts I've had to work through, practise, and revisit before I felt confident about them. I try not to treat something as a dead end just because I don't understand it immediately."
  - "As for trust, I think that comes from consistency and honesty. If I commit to something, I take that commitment seriously. If I encounter a problem, I would rather communicate it early and work towards a solution than hide it or let someone discover it at the last minute."
  - "I'm still at a stage where I have a lot to learn, and I'm comfortable acknowledging that. But if I'm given responsibility, I'll make a genuine effort to understand what's expected of me, ask questions when necessary, take feedback seriously, and keep working until I've done the job to the best of my ability."
  - "I wouldn't expect someone to trust me just because I say I'm reliable. I'd want to earn that trust through the way I work and the consistency of my results."
  - When pushed ("Everyone says they're hardworking, why should we believe you?"): "That's fair, and I don't think saying it in an interview is enough to prove it. I'd rather demonstrate it through my work. My writing experience taught me to work consistently towards deadlines, and my experience at Kraftshala has taught me that learning something new often requires repetition, practice, and being willing to get things wrong before you get them right. I also believe reliability means being honest about what you can deliver, asking for help before a problem becomes bigger, and taking responsibility for the outcome. I'd want you to judge me by those things over time, rather than just by what I say today."

SECTION 4: CV DEEP-DIVE CAMPAIGNS
1. Google Search Ads Project (Unleavables):
• 1,252 impressions and 185 clicks.
• CTR improved from 5.20% to 14.78%.
• CPC decreased from ₹5.33 to ₹4.21 (approx. 21% reduction).
• 17 out of 19 planned conversions achieved on ₹777 spend (₹800 budget).
• Optimisation: Intent-based ad group restructuring, negative keywords sculpting, location expansion, bid adjustments, and pausing low-performing areas.
• Key Learning: Looking at metrics together rather than in isolation; high CTR does not automatically mean profitability.
• If CTR rises but conversions drop: Investigate search terms quality, landing page relevance/speed, conversion tracking health, and audience segmentation.

2. Meta Ads Project (Unleavables):
• 11.04% CTR achieved; 15 add-to-carts generated.
• Cost per add-to-cart listed in CV: ₹54.52 blended.
• Live Bidding Test: Cost Cap vs Highest Volume. Cost per add-to-cart reduced from ₹91 to ₹29 during test period.
• Key Learning: Cost Cap controls average cost per result around a target to protect unit economics, whereas Highest Volume prioritises volume. Performance depends on targets, conversion volume, and auction conditions.

3. Amazon Sponsored Products Project (Homecrust):
• ₹700 budget, 9-hour dayparting window, negative targeting, placement adjustments.
• Impressions increased from 5,681 to 5,955 (+5%).
• Clicks increased from 45 to 63 (+40%); CTR improved from 0.80% to 1.06%.
• Generated 2 orders and ₹857 in sales.
• Conversion rate decreased from 2.20% to 1.58%; ACoS increased from 155.56% to 173.59%.
• Honest Commercial Takeaway: Campaign improved visibility but was NOT a profitability success. Increased clicks without listing readiness burned spend; need to investigate product page conversion friction, price elasticity, and search term intent.

SECTION 5: BEHAVIOURAL & SITUATIONAL EXPERIENCE
• Working under pressure: Sportskeeda publishing cycles; maintaining factual accuracy and editorial quality under tight deadlines.
• Handling Conflict & Competing Priorities: “I'd first assess the severity of the performance drop and how urgently the report is needed. Since the issue could affect campaign results, I'd quickly communicate the competing deadlines to my manager and explain the trade-offs. I'd suggest investigating the immediate issue first if it poses a significant risk, while agreeing on a realistic timeline for the report. I'd then keep the relevant stakeholders updated and ensure both responsibilities are addressed.”
• Difficult stakeholder: Coordinating with writers, editors, and managers; understanding individual constraints, transparent communication, and focusing on shared standards.
• Accountability & Mistakes: Homecrust ACoS increase—understanding the difference between generating activity and generating economically valuable results.
• Learning quickly: Transitioning from writing to performance marketing; mastering Google Ads, Meta Ads, Amazon Ads, and AI prototyping by applying concepts directly to real projects.
• When a campaign spends without converting: Verify tracking and landing page, audit search terms, evaluate audience and bidding, pause wasteful areas, and communicate transparently.

SECTION 6: COMMERCIAL JUDGMENT
• High ROAS but low volume: Do NOT scale automatically. Check marginal returns, available search volume/demand, and budget constraints; scale budget gradually while monitoring efficiency.
• Same conversion rate, different CPCs: Look beyond CPC to cost per conversion, average order value (AOV), margins, and statistical sample size.
• Revenue increases but ROAS drops: Evaluate incremental profit contribution after advertising costs. If additional revenue drives net profit and supports client goals, it is worthwhile; if it destroys profitability, reconsider.
• Client wants more sales with no extra budget: Focus on efficiency—eliminate search term waste, negative targeting, bid adjustments, ad copy testing, and landing page conversion rate.
• When to pause, optimise, or scale: Pause on serious waste or broken tracking; optimise when there is a specific testable opportunity; scale when campaign consistently hits business goals with positive incremental returns.

SECTION 7: PERSONAL INTERVIEW NOTES — THE HUMAN BEHIND THE CV
• Dehradun Perspective: Hometown offering a balance of nature, education, and growing talent. Remote work allows ambitious professionals to build international careers without relocating.
• Outside Interests: Sci-fi and fantasy enthusiast (*The Martian*, *Red Rising*, *Gideon the Ninth*, *Ninth House*, *The Raven Boys*). Loves stories that explore systems, characters, and what happens when plans stop working. Also enjoys painting, swimming, and being outdoors.
• Creative vs Analytical: Creative by instinct, actively developing analytical side. Both work together—creativity generates hypotheses, analysis validates them with data.

SECTION 8: VIBE CODING, AI-ASSISTED DEVELOPMENT & PERSONAL PROJECTS
• What is Vibe Coding: Building software with natural language and AI assistance. Lowers the barrier to experimentation—turning ideas into working prototypes without waiting for years of traditional programming training. Key reality: AI-generated code isn't automatically correct; human must define the problem, give clear instructions, test functionality, troubleshoot errors, and make product decisions.
• Productivity App ("The Spare Room"):
  - Origin: Inspired by anxiety discussed in someone's therapy session—how difficult it is to organize responsibilities when everything feels like one giant, overwhelming to-do list.
  - Concepts explored: Visual calendar interface, breaking tasks into smaller chunks, visualising time (dots/blocks representing time before deadlines), "Just This for Today" (focusing only on what can realistically be done today), Start Mode (bridging planning into action), and playful progress systems (collecting puzzle pieces/world building).
  - Feedback & Critical Pivot: Built working prototype with AI-assisted coding and tested with 6 friends. Their candid feedback: the app felt clunky and overcomplicated.
  - Crucial Takeaways: Having an interesting idea isn't enough; don't confuse effort with effectiveness. Adding features can increase user friction. What she'd do differently: build a simple MVP focused on the single core problem, test the main user journey first before expanding. Demonstrates user empathy, product thinking, initiative, and adaptability.
• Gaming Projects in Roblox Studio:
  - Cosy Exploration: Customisable home in a whimsical world, garden, unexpected visitors (cute ghost, deer), little planets with distinct atmospheres and discoveries. Focus on charm and player retention.
  - Supernatural Mystery: City template, cinematic atmosphere, missing person from hospital, investigation, Gothic academy, twist reveal. Developed one working piece at a time.
  - Learnings & Marketing Connection: Taught player perspective, pacing, curiosity, and retention. Directly mirrors marketing: audience understanding, engagement, retention, storytelling, UX friction, and hypothesis testing.
• Vibe-Coding Certificate & Tools (Scrimba Specialization):
  - Completed Scrimba Vibe Coding Specialization.
  - Studied and explored: Cursor AI, GitHub Copilot, Claude Code & AI coding agents (multi-step file inspection and execution), and Model Context Protocol (MCP - open standard for connecting AI models to external tools and data).
  - Iterative development workflow: Define problem → break into smaller tasks → implement with AI → run/test → review errors → refine → repeat.
• Applying AI to Performance Marketing:
  - 1. Campaign reporting & analysis: Summarising trends, spotting anomalies, cross-checking against actual metrics.
  - 2. Ad-copy experimentation: Generating messaging angles across audiences/value propositions, validated via real conversion data.
  - 3. Research & organisation: Structuring competitor insights and themes.
  - 4. Workflow automation: Connecting applications, reducing manual repetitive tasks, with clear error handling.
• Common Interview Questions:
  - "Are you a developer?": Not a professional developer. Combining curiosity, problem-solving, and AI tools to turn ideas into tangible prototypes, with strong product thinking.
  - "Why learn outside marketing?": Approaches problems from different angles; understanding user friction and product journeys directly improves marketing campaigns.
  - "How do you know AI code is correct?": Never assume it's right because it looks plausible; test functionality, examine errors, debug incrementally.
  - "AI limitations": Plausible hallucinations; requires human quality control, clear task scoping, and responsibility for final outcomes.

SECTION 9: QUESTIONS TO ASK TORSTEN & THE TEAM
1. What would success look like for someone in this role during their first three months?
2. How do associates interface with the proprietary iCLV predictive platform and first-party data day-to-day?
3. With your "Sharpen the Saw" philosophy where automation does the heavy lifting, how does the team encourage associates to leverage AI as a force multiplier for strategic problem-solving?
4. How does the team approach experimentation and continuous optimization across retail clients?
5. What distinguishes someone who performs well from someone who is exceptionally good at Crealytics?

SECTION 10: NATURAL LINES IN BACK POCKET
• When you don't know something: "I'm not completely sure of the answer, so I wouldn't want to guess. My first step would be to understand the issue, check the relevant data, and work through it systematically."
• When discussing an underperforming campaign: "I think it's important to distinguish between what improved and what still needs work. The result wasn't perfect, but it gave me something concrete to learn from."
• When asked about a new tool: "I enjoy experimenting with new tools, but I'm also learning that the tool itself isn't the goal. What matters is whether it solves the problem effectively."
• When asked about learning style: "I learn best when I can connect the concept to something practical. Once I've tried it myself, it's much easier for me to understand why it works."
• On pressure: "Staying organised is much more useful than simply trying to do everything at once."
• The Golden Rule: A candidate who can say, 'This is what I tried, this is what happened, and this is what I'd do differently,' is a lot more convincing than someone who claims every project was a smashing success. ♡`,
    cheatSheet: {
      coreNarrative: "Performance marketer with a strong foundation in editorial research, communication, and human psychology. Deeply curious and eager to learn, combining creative intuition with rigorous data across Google Search (CTR 5.20%→14.78%, CPC ₹5.33→₹4.21), Meta Ads (Cost Cap test ₹91→₹29), and Amazon PPC (ACoS 173% conversion puzzle). Passionate about systems and experimentation—from building AI prototypes like 'The Spare Room' and Roblox games to Scrimba Vibe Coding Specialization—and genuinely excited to master retail media tech, CLV optimization, and AI automation at Crealytics.",
      thingsToRemember: [
        "Google Search Ads: 1,252 impressions, 185 clicks, CTR 5.20% → 14.78%, CPC ₹5.33 → ₹4.21 (-21%), 17/19 conversions, ₹777/₹800 spend",
        "Meta Ads (Unleavables): 11.04% CTR, 15 add-to-carts, Cost Cap test dropped cost/ATC from ₹91 → ₹29 (₹54.52 blended CV benchmark)",
        "Amazon Ads (Homecrust): Impressions 5,681 → 5,955, Clicks 45 → 63 (+40%), CTR 0.80% → 1.06%, 2 orders, ₹857 sales, ACoS 155.56% → 173.59% (commercial honesty)",
        "Editorial Background: Edited 1,000+ articles, coordinated 20+ writers/managers, authored 600+ NFL/college football articles at Sportskeeda",
        "The Spare Room App: Therapy-inspired visual calendar app, 'Just This for Today', tested with 6 friends; learned not to confuse effort with effectiveness and avoid feature creep",
        "Gaming in Roblox: Cosy exploration (custom home, planets) & supernatural mystery (missing person); taught player retention, UX, and audience curiosity",
        "Vibe Coding & Scrimba Specialization: Cursor AI, Claude Code, Model Context Protocol (MCP), iterative debugging; AI as strategic force multiplier",
        "Applying AI to Marketing: Reporting pattern analysis, ad-copy variation testing, workflow automation—always backed by verified data",
        "Trust & Work Ethic: Hard work is about ownership over hours; trust comes from consistency, early honesty, and earning credibility over time ('Judge me by my work over time, not just what I say today')",
        "Crealytics Values: CLV & profit margins over vanity ROAS, predictive iCLV platform, Sharpen the Saw (machines do heavy lifting, humans strategize)"
      ],
      thingsToAsk: [
        "How do associates work with the iCLV predictive platform and first-party data day-to-day?",
        "How does Crealytics' 'Sharpen the Saw' AI philosophy empower associates to think strategically?",
        "What would success look like for someone in this role during their first three months?",
        "What distinguishes someone who performs well from someone who is exceptionally good at Crealytics?",
        "How does the team approach continuous optimization and testing across retail clients?"
      ],
      importantNumbers: [
        { label: "Search Impressions", value: "1,252" },
        { label: "Search Clicks", value: "185" },
        { label: "Search CTR", value: "5.20% → 14.78%" },
        { label: "Search CPC", value: "₹5.33 → ₹4.21 (-21%)" },
        { label: "Conversions Achieved", value: "17 of 19" },
        { label: "Search Spend / Budget", value: "₹777 / ₹800" },
        { label: "Meta CTR", value: "11.04%" },
        { label: "Meta Add-to-Carts", value: "15" },
        { label: "Meta Cost/ATC Test", value: "₹91 → ₹29" },
        { label: "Meta Cost/ATC (CV)", value: "₹54.52" },
        { label: "Amazon Impressions", value: "5,681 → 5,955 (+5%)" },
        { label: "Amazon Clicks", value: "45 → 63 (+40%)" },
        { label: "Amazon CTR", value: "0.80% → 1.06%" },
        { label: "Amazon Orders", value: "2 orders" },
        { label: "Amazon Sales", value: "₹857" },
        { label: "Amazon Conversion Rate", value: "2.20% → 1.58%" },
        { label: "Amazon ACoS", value: "155.56% → 173.59%" },
        { label: "Amazon Budget", value: "₹700" },
        { label: "Dayparting Window", value: "9 hours" },
        { label: "Articles Edited", value: "1,000+" },
        { label: "Writers Coordinated", value: "20+" },
        { label: "Articles Authored", value: "600+" },
        { label: "AI Prototypes Built", value: "5+" },
        { label: "App Prototype User Test", value: "6 friends" },
        { label: "Interview Duration", value: "~30 min" }
      ],
      guardrails: [
        "Do NOT invent challenges or claim results you cannot support with campaign data",
        "Do NOT sound like a corporate brochure; speak conversationally, naturally, and warmly",
        "Don't pretend to know everything — if you don't know, explain how you would investigate systematically",
        "Don't confuse effort with effectiveness — focus on user impact and commercial outcomes",
        "Be transparent that Homecrust Amazon PPC improved visibility but faced profitability headwinds with ACoS"
      ],
      anchors: [
        "Sound like a person, not a presentation: speak like a smart, warm person having an authentic conversation on a video call.",
        "Drop in the numbers naturally as proof (5.2% to 14.8% CTR, ₹4.21 CPC, 17/19 conversions, 11.04% CTR, ₹29 cost cap).",
        "Show commercial judgment: Homecrust ACoS proved that clicks mean nothing without conversion readiness and unit economics.",
        "When in doubt: 'I'm not completely sure of the answer, so I wouldn't want to guess. My first step would be to understand the issue, check the data, and test systematically.'",
        "Remember: A candidate who can say 'This is what I tried, this is what happened, and this is what I'd do differently' is the most convincing. ♡"
      ]
    }
  },
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
    glanceSay: "Mostly the creative change and higher CPC during Meta's learning phase, while Search held rock-solid at a 78 quality score with conversion volume up 12% week-over-week.",
    glanceBullets: [
      "• Creative rotated mid-week to combat audience fatigue",
      "• CPC bumped temporarily during algorithm's learning phase",
      "• Search demand resilient: 78 score, +12% volume lift"
    ],
    expandedSay: "To build on that, the reason CPC spiked is algorithmic: when you introduce new assets, Meta's pacing engine runs exploratory auctions to find high-probability converters, temporarily driving up cost-per-click before settling.\n\nThe search data confirms that user intent never degraded—conversion volume grew 12% without needing higher bids. Our Tuesday test will let the algorithm exit learning mode, and we anticipate CPA returning to target ranges once delivery stabilizes.",
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
    glanceSay: "Because conversion velocity on Meta is expanding efficiently and Search proves our baseline unit economics are healthy.",
    glanceBullets: [
      "• Marcus noted: strong conversion volume expansion",
      "• Search unit economics prove buyer intent is solid",
      "• Scale after Tuesday's creative test confirms stabilization"
    ],
    expandedSay: "To look at the auction timing behind that: increasing budget right now lets us capture available impression share before Q4 seasonal competition drives up CPMs across the board.\n\nTo keep risk low, we only unlock that spend once Tuesday's creative test confirms that CPA has stabilized. That way, we let empirical data earn the capital expansion rather than bidding into auction volatility.",
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
    glanceSay: "My recommendation is disciplined patience over the next 72 hours—hold spend steady, run 2 to 3 creative tests on Tuesday, and let empirical stabilization earn the budget increase.",
    glanceBullets: [
      "• Hold budget steady for 72h through Monday",
      "• Test 2-3 fresh variations on Tuesday",
      "• Unlock budget expansion only after CPA settles"
    ],
    expandedSay: "Going a layer deeper into why I recommend that sequence: if we increase budget while the algorithm is still in learning mode, the bidding engine overpays for impression share.\n\nBy waiting for Tuesday's test to establish a clear conversion baseline, we protect unit economics and ensure every incremental dollar works at peak efficiency.",
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
    glanceSay: "Yeah, basically, the shift to multi-touch attribution credits early discovery touchpoints rather than just the final click, so while direct Meta ROAS looks softer on paper, our overall sales and blended volume haven't declined at all.",
    glanceBullets: [
      "• Discovery touchpoints get earned credit",
      "• Direct Meta ROAS appears lower on paper",
      "• Total blended sales completely unchanged"
    ],
    expandedSay: "The strategic takeaway from that shift is that we shouldn't cut top-of-funnel ad spend just because its last-click ROAS seems lower.\n\nThose discovery impressions are the feeder engine driving the 12% conversion lift we're seeing downstream in Google Search. The new model actually gives us a much more honest picture of cross-channel lift.",
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
    glanceSay: "I want to be precise and check the verified report rather than guess an off-the-cuff number—our notes cover our blended benchmarks, but not the isolated Germany breakdown for last Tuesday.",
    glanceBullets: [
      "• No Germany day-level breakout in notes",
      "• Do not invent or estimate numbers",
      "• Commit to immediate post-call follow-up"
    ],
    expandedSay: "Let me pull the audited ledger with the finance team right after this call and send over the verified figures so we're working off exact numbers.",
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
