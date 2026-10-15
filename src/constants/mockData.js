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
  "id": "crealytics-technical-master",
  "title": "✨ Crealytics Technical Interview (Primary & Secondary Master Notes)",
  "type": "Interview",
  "topic": "Crealytics Performance Marketing Associate — Technical Interview & Case Study",
  "attendees": [
    "Crealytics Technical Interview Panel",
    "Garima (Roo)"
  ],
  "rawNotes": "CREALYTICS PERFORMANCE MARKETING ASSOCIATE — MASTER TECHNICAL & CASE STUDY PREPARATION NOTES\nCandidate: Garima (Roo) | Role: Performance Marketing Associate (Remote India)\nMaster Index: Primary Presentation Script + Secondary Performance Marketing Playbook + Google Data Analytics Frameworks\n\n================================================================================\nPART 1: PRIMARY INTERVIEW SCRIPT & CASE STUDY PRESENTATION\n================================================================================\n\nSECTION 1: PERSONAL INTRODUCTION & WHY CREALYTICS\n• Tell Me About Yourself:\n  - I'm from Dehradun, which is a valley, and I think that explains why I love places that make you stop and look around for a minute.\n  - I studied Media and Communication and worked as an editor, so I've always been interested in stories, people, and how we communicate.\n  - When I joined Kraftshala, I discovered that I really enjoyed performance marketing because it brings together creativity, psychology, and data.\n  - A slightly unexpected discovery was how much I enjoyed working with AI. As someone who worked in publishing, I'd seen how AI was affecting the industry, so I didn't expect to enjoy it as much as I did!\n  - Then we were introduced to vibe coding, and I realised I really liked being able to take an idea and actually build something. I'm currently trying to make a small Roblox game, which has been fun.\n  - Core mindset: I think I just enjoy figuring things out, trying new things, and seeing if I can make an idea work. And that's a big part of what I like about performance marketing, too.\n• Why Crealytics?\n  - What caught my attention about Crealytics was the combination of performance marketing, data, and technology.\n  - I've discovered that I really enjoy exploring AI and how it can be used to solve problems, and I'd love to learn how that works at a larger scale in a real marketing environment.\n  - The role combines analytical thinking with practical marketing decisions.\n\nSECTION 2: SOCIAL CAMPAIGN CASE STUDY PRESENTATION\n• 1. Opening Script:\n  - \"Hi! So, I've gone through both parts of the assignment. I'll walk you through how I approached them, what stood out to me, and what I'd recommend based on the numbers.\"\n  - \"My background is in Media and Communication, and I got interested in performance marketing because I like the combination of creativity, psychology, and data. You get to understand why people behave a certain way, test your ideas, and actually measure what works. That's what I find fun about it.\"\n  - \"And Crealytics stood out to me because of its focus on data, technology, and performance marketing. I'd like to build my skills in that kind of environment.\"\n• 2. How I Approached the Numbers:\n  - Filled in missing metrics using standard formulas:\n    * Impressions = Clicks ÷ CTR\n    * Orders = Cost ÷ CPO\n    * Profit = Revenue - Cost\n    * ROAS = Revenue ÷ Ad Spend\n  - Compared campaigns on total revenue, efficiency, and areas needing attention.\n• 3. Comparing Campaigns A, B and C:\n  - Campaign A generated €8,400 in revenue, with a ROAS of 33.6.\n  - Campaign B generated €8,190, but its ROAS was higher at 39, and it also had the lowest CPC at €0.35.\n  - Conclusion: If looking at efficiency, lean towards Campaign B (generating more revenue per euro spent on advertising). If looking at total revenue volume, Campaign A is slightly ahead.\n• 4. What About Campaign C? (Diagnosis & Recommendations):\n  - Campaign C has highest CTR at 30%, so people are clicking. But it spends €2,200 and generates €2,100 revenue, giving a ROAS of ~0.95.\n  - Clicks are not translating into enough revenue to cover ad spend.\n  - Diagnostic checklist: Check the audience, ad creative, landing page, and conversion tracking before deciding what to change. Maybe attracting the wrong people, or an issue after click.\n  - Golden rule: Never automatically switch it off without investigating, but definitely do NOT increase budget just because CTR looks good.\n• 5. Which Campaign to Choose for Branding?\n  - If objective is attention, Campaign C is worth investigating because of highest CTR (30%).\n  - But careful calling it best branding on CTR alone! Look at reach, frequency, engagement, and brand-lift results.\n  - Judge campaign against actual objective: immediate sales aren't the only measure of brand awareness, but success must be clearly defined.\n• 6. How to Improve Campaign B:\n  - Campaign B is already performing well—don't start changing things just for the sake of it.\n  - First, look at which audiences and creatives generate orders (not just clicks). Check landing page matches ad.\n  - Run tests separately (test new creative or different audience segment).\n  - Track CTR, conversion rate, CPO, and ROAS together. If a test performs consistently well, gradually increase budget.\n  - Key principle: Understand what's working before trying to scale it.\n• 7. Data Anomaly Noticed:\n  - Campaign C order count works out to approximately 31.43 orders (Cost ÷ CPO). Orders are normally whole numbers. Could be a rounding issue, but verify original data before final recommendation.\n\nSECTION 3: EXCEL PRACTICAL & AUDIENCE DEEP DIVE\n• 8. What I Did in Excel:\n  - Sorted table by cost descending so highest-spending entries were at the top.\n  - Conditional formatting: highlighted costs above €300 in red. Color scale for profit to spot profitable vs losing audiences.\n  - VLOOKUP to retrieve correct label for each campaign; created Pivot Table to summarise clicks and impressions by campaign.\n• 9. Explain VLOOKUP:\n  - Formula: =VLOOKUP(A2, A19:B23, 2, FALSE)\n  - The idea: find a value in the first column of a table and return corresponding value from another column (e.g. campaign name -> country label).\n  - FALSE at the end ensures an exact match.\n• 10. Pivot Table Summary:\n  - DE Prospecting Sales: 7,546 clicks and 218,675 impressions (overall CTR around 3.45%).\n  - US Acquisition Lead Gen: 931 clicks and 6,956 impressions (much higher CTR at 13.38%, but lower volume).\n  - DE Retargeting Sales: CTR ~6.67%, but based on only 60 clicks (careful drawing big conclusions from small sample).\n• 11. Audience Level Findings:\n  - DE Prospecting Sales: Broad generated €3,912 in revenue and €2,712 in profit. Lookalike generated €294 revenue, loss of -€6. (Investigate scaling Broad; check why Lookalike isn't converting).\n  - US Acquisition Lead Gen: Interests generated €100 revenue and €40 profit. Lookalike generated only €8 revenue against €281 cost (-€273 loss). (Investigate Lookalike first: lower CTR, check targeting, creative, lead quality).\n  - UK Prospecting Traffic: Broad generated €40 revenue against €20 cost (+€20 profit); Lookalike lost €110. (Be careful scaling Broad immediately due to small data).\n  - DE Social ASC: Broad lost €27. (Check if campaign is still learning, spend sufficiency, objective and tracking setup).\n  - DE Retargeting Sales: CRM List generated €29 revenue against €12 cost (+€17 profit on 60 clicks).\n• 12. Prioritising Audiences:\n  - Start by investigating profitable audiences with clearest potential to scale (DE Prospecting Broad).\n  - Prioritise understanding why US Lookalike and UK Lookalike are losing money.\n  - Avoid decisions based on CTR alone; compare cost, revenue, profit, conversion performance, and sample size.\n• 13. Note on Calculating CTR in Pivot Tables:\n  - Never add individual CTR percentages together! Calculate weighted CTR: Total clicks ÷ Total impressions × 100.\n\nSECTION 4: PPC CORE CONCEPTS & CALCULATION SCENARIOS\n• 15. Difference Between PPC and SEO:\n  - PPC is paid advertising (pay for traffic, starts quickly). SEO is organic search visibility (takes time, no per-click fee). Balance based on objective, timeline, budget.\n• 16. Negative Keywords:\n  - Stop ads from showing for irrelevant searches (e.g. exclude 'free' when selling premium shoes). Reduces wasted spend and improves traffic quality.\n• 17. What Do CPC and CPA Mean?\n  - CPC = Cost Per Click (cost of traffic). CPA = Cost Per Acquisition (cost of conversion/business outcome).\n• 18. Search Ad Character Limits:\n  - Depends on format. Older ETA had 30-char headlines, 80-char descriptions. Responsive Search Ads (RSAs) have up to 15 headlines (30 chars) and 4 descriptions (90 chars). Check latest platform specs.\n• 19. PPC Math Calculation Scenario:\n  - Impressions = 100,000 | CTR = 3% => Clicks = 100,000 × 3% = 3,000 clicks.\n  - CPC = €0.10 => Total Ad Spend = 3,000 × €0.10 = €300.\n  - Conversion Rate = 5% => Total Conversions = 3,000 × 5% = 150 conversions.\n  - Profit per conversion = €20 => Gross profit before ads = 150 × €20 = €3,000.\n  - Net Profit remaining = €3,000 - €300 ad spend = €2,700 net profit.\n• 20. Other Core Metrics:\n  - CTR = Clicks ÷ Impressions | CPC = Spend ÷ Clicks | CVR = Conversions ÷ Clicks | CPA = Spend ÷ Conversions | ROAS = Attributed Revenue ÷ Spend | ACoS = Spend ÷ Attributed Sales (%).\n• 21. If Campaign Is Underperforming:\n  - 1. Check tracking/data reliability. 2. Segment by audience, creative, placement, landing page. 3. Analyze funnel (seeing ad vs clicking vs converting). 4. Test one change at a time.\n• 22. Client Wants to Increase Spend on High CTR:\n  - CTR is encouraging, but check conversion rate and unit economics before recommending spend. Clicks without sales waste budget.\n• 23. If Data Doesn't Give Clear Answer:\n  - Be honest. Explain what data suggests, what cannot be concluded, and what to investigate next. Rather give clear caveats than pretend.\n• Closing & Questions to Ask:\n  - \"The main thing I took away is that numbers make more sense together: CTR, cost, revenue, and ROAS each tell a different story.\"\n  - 4 Questions for Team: Onboarding milestones, scaling decision criteria, cross-team performance collaboration, good vs great performance marketer.\n\n================================================================================\nPART 2: SECONDARY TECHNICAL PLAYBOOK & PERFORMANCE MARKETING KNOWLEDGE\n================================================================================\n\nSECTION 5: RESUME PROJECTS — VERIFIED QUANTITATIVE PROOF POINTS\n• 1. Google Search Ads (Unleavables):\n  - 1,252 impressions, 185 clicks.\n  - CTR improved 5.20% → 14.78% (9.58 percentage points, +184.2% relative lift).\n  - CPC reduced ₹5.33 → ₹4.21 (21% reduction, saved ₹1.12 per click).\n  - 17 of 19 planned conversions achieved (89.5% target). Spent ₹777 of ₹800 budget (97.1%).\n  - Intent-based ad groups, keyword refinement, bid adjustments, location targeting, negative keywords.\n• 2. Meta Ads (Unleavables):\n  - 11.04% CTR, 15 Add-to-Carts.\n  - Cost per Add-to-Cart reduced ₹91 → ₹29 in Cost Cap experiments; campaign benchmark was ₹54.52.\n  - Cost Cap vs Highest Volume: Highest Volume maximizes results within budget; Cost Cap manages average cost per result around target.\n  - Add-to-Cart is a useful intermediate event when purchases are sparse, but must evaluate downstream revenue.\n• 3. Amazon Ads (Homecrust):\n  - ACoS 173.59% (spend ₹1.74 for every ₹1 sales—warning sign unless strategic clearance/launch).\n  - ROAS = 1 ÷ ACoS (50% ACoS = 2x ROAS). Negative targeting and dayparting.\n• 4. Sportskeeda & Editorial Background:\n  - 600+ articles authored, 1,000+ edited, 20+ writers coordinated.\n  - Transferable skills: Research accuracy, deadline discipline, audience psychology, structured communication.\n\nSECTION 6: SITUATIONAL INTERVIEW PLAYBOOK (17 SCENARIOS)\n• Six-Step Framework: Goal → Data → Diagnosis → Hypothesis → Action → Evaluation.\n• Scenario 1: CTR High but Sales Low (\"A click is not a sale.\"):\n  - Confirm objective and conversion tracking. SQR audit for broad/curiosity clicks. Check landing page speed, mobile UX, pricing, and checkout friction.\n• Scenario 2: CTR Low and CPC High:\n  - Review search-term report, add negatives, improve match types and ad copy relevance for Quality Score. Check auction insights for competitor bidding pressure.\n• Scenario 3: CPA Suddenly Increases:\n  - Verify data/tracking first. Compare CPC, CVR, volume vs previous period. Segment by audience/placement. Make targeted adjustment without choking volume.\n• Scenario 4: Revenue Increases but ROAS Falls:\n  - Example: Spend ₹10k/Rev ₹40k (4x ROAS) -> Spend ₹20k/Rev ₹60k (3x ROAS).\n  - Evaluate incremental contribution margin. If lower ROAS is above break-even and captures profitable volume, it may be commercially desirable.\n• Scenario 5: Campaign Underspending:\n  - Budget ₹50k, spending only ₹25k. Check delivery bottleneck: targeting restrictions, search volume, bid/cost caps, ad eligibility. Don't force spend if traffic isn't valuable.\n• Scenario 6: Client Wants to Double Budget:\n  - \"The next rupee spent may be less efficient than the previous rupee.\" Check marginal efficiency curve, demand ceiling, and client margin tolerance. Scale in 15-20% increments.\n• Scenario 7: Retargeting Strong, Prospecting Weak:\n  - Retargeting captures existing demand; prospecting builds new customer pipeline. Review audience exclusions and frequency. Test dedicated prospecting budget.\n• Scenario 8: Meta Ads Learning Limited:\n  - Diagnostic signal, not failure. Ensure ad sets receive ~50 optimization events/week. Consolidate fragmented ad sets, expand audience, or loosen bid constraints.\n• Scenario 9: Frequency Increases, CTR Declines:\n  - Creative fatigue or audience saturation. Test fresh ad creatives or expand lookalike/broad targeting.\n• Scenario 10: Two Creatives (One High CTR, One Low CPA):\n  - Winner is whichever creative best supports the primary business KPI (typically low CPA / profitable orders).\n• Scenario 11: Product Generates Sales but Loses Money:\n  - \"Revenue is not profit.\" Calculate ad cost relative to gross margin and contribution margin. Reallocate budget to higher-margin inventory.\n• Scenario 12: Conversion Rate Suddenly Drops:\n  - Validate site tracking and pixel health immediately. Check technical errors on landing page/checkout across browsers/devices. Check inventory stockouts or price changes.\n• Scenario 13: Limited Budget Allocation:\n  - Allocate evidence-first: prioritize proven profitable lower-funnel channels, reserve 10-20% for testing, monitor marginal returns.\n• Scenario 14: Discrepancy Between Google Ads & Analytics:\n  - Google Ads attributes to click date; GA attributes to session/visit date. Check attribution models, lookback windows, time zones, tracking delays.\n• Scenario 15: Mistake in Client Report:\n  - Transparency & ownership: verify discrepancy, alert manager/client promptly, issue corrected report with clear changelog, add validation checklist.\n• Scenario 16: Five Campaigns Need Attention:\n  - Prioritize by business risk, budget exposure, and revenue impact (triage broken tracking and disapproved ads first).\n• Scenario 17: Disagreement with Colleague:\n  - Seek to understand their reasoning and data; align on shared client goal; propose controlled A/B test.\n\nSECTION 7: ADVANCED TECHNICAL & CLOSING THE KNOWLEDGE GAPS\n• Candidate Honesty Principle:\n  - \"I haven't had direct hands-on platform experience with Microsoft Ads/PMax/LinkedIn yet, but PPC and measurement principles are transferable, and I'm eager to learn them hands-on at Crealytics.\"\n• Microsoft Advertising:\n  - Transferable PPC search mechanics; distinct audience demographics, lower CPC competition, syndicated search partner network.\n• Performance Max (PMax) & Shopping:\n  - Cross-channel automation (Search, YouTube, Display, Discover, Maps). Audience signals guide (not restrict) machine learning. Product feeds: titles, GTIN, availability, category mapping. Feed optimization improves query matching.\n• Attribution vs Incrementality vs MMM:\n  - Attribution assigns credit across touchpoints (last-click, data-driven).\n  - Incrementality proves causality (test vs control, geo-holdout). Platform ROAS often overstates incremental impact.\n  - Marketing Mix Modeling (MMM): Top-down aggregate regression analysis over time.\n• CAC, CLV & Payback Period:\n  - CAC = Acquisition Spend ÷ New Customers Acquired.\n  - CLV = Long-term customer gross profit. Payback period is time to recover CAC.\n  - Break-Even ROAS = 1 ÷ Contribution Margin Ratio.\n• Privacy & First-Party Data:\n  - Third-party cookie depreciation, GDPR compliance, server-side tracking, contextual targeting.\n• A/B Testing:\n  - One variable at a time, statistically significant sample, predefined primary KPI. Avoid declaring winners prematurely.\n• Agency Workflow & Quality Control:\n  - Pre-launch checklist (account, budget, dates, tracking, negative keywords, UTMs). Ongoing checks (daily spend, search terms, landing page 200 OK).\n\nSECTION 8: GOOGLE DATA ANALYTICS CERTIFICATE CONCEPTS\n• 6-Phase Data Analysis Process: ASK → PREPARE → PROCESS → ANALYZE → SHARE → ACT.\n• Data Life Cycle: Plan → Capture → Manage → Analyze → Archive → Destroy.\n• Data Quality: ROCCC Framework (Reliable, Original, Comprehensive, Current, Cited).\n• Spreadsheets & Cleaning: TRIM, VALUE, SPLIT, CONCATENATE, COUNTIF, SUMIFS, XLOOKUP, VLOOKUP, Pivot Tables.\n• SQL Mastery: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, CASE WHEN, CTEs (WITH), JOINs (INNER, LEFT, RIGHT, FULL OUTER).\n• Statistics: Mean vs Median in skewed distributions, Correlation does not imply Causation, Hypothesis testing (Null/Alternative, statistical significance).\n• Visualization & Storytelling: Chart selection (bar, line, scatterplot, box plot, heat map). Structure: Context → Finding → Implication → Action.\n• AI for Data: TCREI Framework (Task, Context, References, Evaluate, Iterate). Responsible AI verification.\n",
  "cheatSheet": {
    "coreNarrative": "Master technical interview and case study preparation. Grounded in primary presentation scripts (Campaign A/B/C comparison, Campaign C ROAS 0.95 & 31.43 order anomaly, Excel VLOOKUP exact match, audience ROI, PPC math €2,700 net profit) and secondary playbooks (17 situational scenarios, incrementality vs attribution, CAC/CLV, PMax, Google Data Analytics).",
    "thingsToRemember": [
      "Case Study: Campaign B wins on efficiency (ROAS 39, CPC €0.35); Campaign A wins on total revenue (€8,400, ROAS 33.6)",
      "Campaign C Triage: 30% CTR but ROAS 0.95 (€2,200 cost vs €2,100 rev). Notice 31.43 fractional order count anomaly. Never switch off without investigating; never scale on CTR alone.",
      "Excel Practical: =VLOOKUP(A2, A19:B23, 2, FALSE). Weighted CTR in Pivot Tables: Total Clicks ÷ Total Impressions × 100 (never average percentages).",
      "Audience Deep Dive: DE Prospecting Broad (+€2,712 profit) vs Lookalike (-€6 loss); US Acquisition Interests (+€40 profit) vs Lookalike (-€273 loss).",
      "PPC Math: 100k imp × 3% CTR = 3,000 clicks × €0.10 CPC = €300 spend. 3,000 clicks × 5% CVR = 150 orders × €20 profit = €3,000 - €300 spend = €2,700 net profit.",
      "Honesty Safeguard: State transferable PPC principles for Microsoft Ads/PMax/LinkedIn while honestly sharing desire to learn them hands-on at Crealytics.",
      "6-Step Situational Framework: Goal → Data → Diagnosis → Hypothesis → Action → Evaluation.",
      "Google Data Analytics: ASK → PREPARE → PROCESS → ANALYZE → SHARE → ACT. ROCCC data evaluation."
    ],
    "thingsToAsk": [
      "What would you expect someone joining this role to get comfortable with in their first few months?",
      "What does the team usually look at when deciding whether a campaign is ready to scale?",
      "How do the teams work together when performance data suggests that a campaign needs a change in strategy?",
      "What do you think separates someone who's good at managing campaigns from someone who's really good at performance marketing?"
    ],
    "importantNumbers": [
      {
        "label": "Campaign A Revenue",
        "value": "€8,400 (ROAS 33.6)"
      },
      {
        "label": "Campaign B ROAS",
        "value": "39.0 (CPC €0.35, Rev €8,190)"
      },
      {
        "label": "Campaign C ROAS",
        "value": "0.95 (CTR 30%, Spend €2,200, Rev €2,100)"
      },
      {
        "label": "Campaign C Orders Anomaly",
        "value": "31.43 orders (fractional)"
      },
      {
        "label": "DE Prospecting Broad Profit",
        "value": "+€2,712 (Rev €3,912)"
      },
      {
        "label": "US Lookalike Loss",
        "value": "-€273 (Cost €281, Rev €8)"
      },
      {
        "label": "PPC Math Net Profit",
        "value": "€2,700 (100k imp, 3% CTR, 5% CVR)"
      },
      {
        "label": "Google Search Ads CTR",
        "value": "5.20% → 14.78% (+184.2% rel)"
      },
      {
        "label": "Google Search Ads CPC",
        "value": "₹5.33 → ₹4.21 (-21%)"
      },
      {
        "label": "Google Conversions",
        "value": "17 of 19 (Spent ₹777/₹800)"
      },
      {
        "label": "Meta Ads Add-to-Carts",
        "value": "15 (Cost per ATC ₹91 → ₹29)"
      },
      {
        "label": "Amazon Ads ACoS",
        "value": "173.59% (Spend ₹1.74 per ₹1 sales)"
      },
      {
        "label": "Sportskeeda Editorial",
        "value": "600+ written, 1,000+ edited, 20+ writers"
      }
    ],
    "guardrails": [
      "Never judge performance on CTR alone — a click is not a sale",
      "Do NOT claim hands-on experience with Microsoft Ads or PMax; frame as transferable knowledge and enthusiasm to learn",
      "Revenue is not profit — always factor product margins, variable costs, and break-even ROAS",
      "In ambiguous data, admit what is unknown and suggest controlled testing rather than guessing"
    ],
    "anchors": [
      "Main Message: I understand the numbers, I can explain what they mean, and I know that a good recommendation needs context.",
      "Numbers make more sense together: CTR, cost, revenue, and ROAS each tell a different story.",
      "Take a breath: Speak crisply and calmly. You know the case study cold."
    ]
  }
},
  {
    id: "blank",
    title: "✨ New Meeting (Blank Slate)",
    type: "Work",
    topic: "General Discussion",
    attendees: [],
    rawNotes: "",
    cheatSheet: {
      coreNarrative: "Ready for your pre-meeting notes.",
      thingsToRemember: [],
      thingsToAsk: [],
      importantNumbers: [],
      guardrails: [],
      anchors: ["Take a breath. Speak naturally and lead with your key insight."]
    }
  },
  {
    id: "crealytics-functional",
    title: "Crealytics Functional Round — Performance Marketing & Diagnostics",
    type: "Interview",
    topic: "Performance Marketing Associate — Functional / Department Round",
    attendees: ["Senior Performance Marketing Team / Client Lead", "Garima (Roo)"],
    rawNotes: `CREALYTICS FUNCTIONAL & DEPARTMENT ROUND — ACCOUNT DIAGNOSTICS, CAMPAIGN MECHANICS & CLIENT SCENARIOS
Role: Performance Marketing Associate — Remote India
Interviewer: Senior Performance Marketing Lead / Account Director
Focus: Practical campaign problem-solving, live client data interpretation, account audits, bidding strategies, and commercial diagnostics.

SECTION 1: PROFESSIONAL PROFILE & PERFORMANCE MARKETING FOUNDATION
• Background in media, communication, and high-velocity editorial at Sportskeeda: edited 1,000+ articles, authored 600+ NFL articles, and coordinated with 20+ writers and managers under strict publishing deadlines.
• Why the transition into performance marketing: Content taught me headline resonance, audience psychology, and editorial discipline. But I wanted to understand the full commercial feedback loop—how algorithms price auction inventory, why users drop off in checkout funnels, and how quantitative data can validate creative hypotheses.
• Practical training at Kraftshala: Managed live and simulated campaigns across Google Search, Meta Ads, and Amazon PPC. Hands-on experience with keyword architecture, negative keyword sculpting, auction bidding models (Cost Cap vs Highest Volume), search term reports (SQR), dayparting, and full-funnel attribution.
• Core mindset: Treat every campaign as a structured hypothesis. Don't rely on platform automation as an unexamined black box; understand what is happening under the hood, analyze root-cause drop-offs, and prioritize net profit over vanity metrics.

SECTION 2: VERIFIED CAMPAIGN EXPERIMENTS & QUANTITATIVE PROOF POINTS
1. Google Search Ads Project (Unleavables):
   - 1,252 impressions, 185 clicks.
   - CTR surged from 5.20% to 14.78% (almost 3x lift).
   - CPC reduced by 21% from ₹5.33 to ₹4.21.
   - Delivered 17 out of 19 planned conversions on ₹777 spend (against ₹800 budget).
   - Optimization tactics: Restructured broad ad groups into tightly themed intent clusters; aggressive negative keyword sculpting to eliminate non-converting exploratory search terms; bid adjustments by location and high-intent device segments.
   - Core insight: Analyzed the 2 missed conversions via Search Query Reports. Discovered exploratory queries were still triggering ads and bouncing on landing pages. Taught me that winning the auction is only half the battle—query intent alignment and landing page friction determine actual conversion.

2. Meta Ads Project (Unleavables):
   - 11.04% CTR achieved; 15 add-to-carts generated.
   - Blended CV benchmark: ₹54.52 cost per add-to-cart across full lifecycle.
   - Controlled Bidding Experiment (Cost Cap vs Highest Volume): Cost per add-to-cart dropped from ₹91 down to ₹29 during the test.
   - Technical mechanics: Highest Volume bidding forces Meta to exhaust daily budgets regardless of auction inflation. By implementing an explicit Cost Cap, we established an algorithmic bid ceiling that forced Meta to pace delivery and bid only on auctions with high conversion probability relative to cost.
   - Core insight: Algorithmic bid ceilings protect client margins during competitive auction surges.

3. Amazon Sponsored Products Project (Homecrust):
   - Budget: ₹700, 9-hour dayparting window, negative keyword targeting, placement bid adjustments.
   - Top-of-funnel traffic: Impressions grew 5% (5,681 → 5,955); clicks increased 40% (45 → 63); CTR improved from 0.80% to 1.06%.
   - Commercial reality: 2 orders, ₹857 in sales. Conversion rate dropped from 2.20% to 1.58%; ACoS rose from 155.56% to 173.59%.
   - Honest commercial diagnostic: The advertising did its job driving qualified traffic, but the listing was NOT conversion-ready. Review velocity was low, pricing was uncompetitive relative to category alternatives, and dayparting bids drove traffic during exploratory browsing hours rather than buying hours.
   - Core insight: PPC traffic without listing readiness and price elasticity simply burns spend. Traffic and conversion rate must always be diagnosed together.

SECTION 3: STEP-BY-STEP ACCOUNT AUDIT PLAYBOOK (FOR NEW OR STRUGGLING CLIENTS)
When evaluating a client's account or presented with an underperforming campaign, follow this 6-step diagnostic sequence:
1. Tracking & Measurement Health (Step 0):
   - Verify GA4, Google Ads conversion tracking, Meta Pixel, Conversions API (CAPI), and Amazon Attribution tags.
   - Check conversion action settings: Is primary vs secondary firing correctly? Are transactions deduplicated via transaction ID? Are enhanced conversions configured?
   - Rule: Never optimize or change campaign settings if tracking is broken or double-counting.
2. Account Structure & Intent Isolation:
   - Check if Brand, Generic, and Competitor traffic are strictly segmented into separate campaigns with dedicated budgets.
   - Check match type strategy: Are broad match keywords running without smart bidding or without exact negative match lists?
   - Check ad group theme density: Ensure ad groups have 5-15 tightly related keywords rather than 50+ divergent keywords.
3. Search Query Report (SQR) & Negative Keyword Hygiene:
   - Audit actual search terms from the last 30-60 days.
   - Identify budget drainers: Search queries generating high clicks/spend with zero conversions.
   - Sculpt negative keywords: Add phrase and exact negatives to eliminate informational, job-seeker, DIY, or irrelevant competitor intent.
4. Bidding Strategy Alignment & Auction Dynamics:
   - Check bidding type: Max Clicks, Max Conversions, Target CPA, Target ROAS.
   - Evaluate learning phase status: Did budget or bid changes trigger a learning reset? Is the account hitting the recommended conversion threshold (at least 30 conversions/month) before activating Target CPA / Target ROAS?
   - Check Impression Share (IS): Identify whether Impression Share is lost to Budget (need budget reallocation) or lost to Rank (need ad relevance, expected CTR, or bid adjustment).
5. Creative, Ad Copy & Asset Health:
   - Evaluate Responsive Search Ads (RSA) strength, headline-keyword alignment, and CTR trends.
   - On Meta: Audit creative fatigue (frequency > 3.5-4, rising CPMs, dropping CTR). Check diversity of creative formats (video, static hook, carousel).
6. Post-Click Funnel & Landing Page Experience:
   - Check mobile load speed and Core Web Vitals.
   - Check headline consistency: Does the landing page promise exactly what the ad copy pitched?
   - Audit checkout friction: Clear CTAs above the fold, stock availability, pricing transparency, and payment gateway health.

SECTION 4: SITUATIONAL DIAGNOSTIC SCENARIOS (CLIENT CASES & CURVEBALLS)
1. "CTR Increased, but Conversion Rate (CVR) and Conversions Dropped":
   - Diagnosis 1 (Technical): Check if conversion tags broke, tag container failed, or checkout page was updated without re-tagging.
   - Diagnosis 2 (Intent Leakage): Check if broad match expansion or a viral creative hook attracted curiosity clickers with zero buying intent.
   - Diagnosis 3 (Message Disconnect): Ad promoted a specific discount, bundle, or feature that is not immediately visible on the landing page.
   - Diagnosis 4 (Commercial Friction): Out-of-stock items, price increase, unexpected shipping fees added at checkout, or broken mobile cart.
2. "Campaign is Spending Full Daily Budget with Zero Conversions":
   - Triage action sequence:
     * Step 1: Fire a test transaction to verify conversion tracking is recording.
     * Step 2: Open Search Query Report immediately. Is 70-80% of budget being sucked up by 2-3 runaway broad queries? If yes, pause those queries immediately and add negatives.
     * Step 3: Test mobile landing page live on actual devices—verify page load and checkout flow.
     * Step 4: Inspect bidding strategy—if set to Maximize Clicks with high daily budget, the platform bids aggressively on low-cost junk inventory. Switch to manual CPC with bid caps or add strict negative keywords.
3. "High ROAS on Small Budget — Client Wants to Double Budget Overnight":
   - Why NOT to double overnight: Ad auction algorithms harvest lowest-hanging fruit first. Scaling budget rapidly pushes into broader, lower-intent auctions, which compresses marginal ROAS and drives up CPA. Doubling budget also resets the algorithm's learning phase.
   - Scaling Playbook:
     * Scale in disciplined increments: 15% to 20% budget increases every 3 to 5 days.
     * Monitor Marginal ROAS & Marginal CPA: Don't just watch blended metrics; calculate the return on the incremental dollars spent.
     * Check Search Impression Share: If Impression Share lost to budget is high (> 40%), budget expansion is safe. If Impression Share lost to rank is high, optimize ad relevance and bids first before adding budget.
4. "Platform Bidding Strategies: When to Use What":
   - Google Ads:
     * Maximize Clicks: Only for initial keyword discovery or low-volume accounts needing baseline traffic.
     * Maximize Conversions: When ramping up an account to reach 20-30 conversions/month.
     * Target CPA (tCPA): When you have stable conversion volume and a strict customer acquisition cost limit.
     * Target ROAS (tROAS) / POAS: When order values vary widely and the goal is revenue or gross profit efficiency.
   - Meta Ads:
     * Highest Volume: Good for quick scale or when budget is flexible, but vulnerable to CPM volatility.
     * Cost Cap: Essential when unit economics must be protected. Caps average cost per result and forces the algorithm to pace delivery selectively.
   - Amazon PPC:
     * Sponsored Products (exact vs broad vs ASIN targeting).
     * Dayparting: Restricting spend to peak conversion hours to avoid daytime browsing waste.
     * Placement Adjustments: Bidding up on Top of Search (+50-100%) when CTR and conversion rate are significantly higher than product detail pages.
5. "Crealytics Principles: POAS & iCLV (The Commercial Edge)":
   - POAS (Profit on Ad Spend) vs ROAS: Standard ROAS is a vanity metric because it treats a ₹10,000 order with a 10% margin identically to a ₹10,000 order with a 60% margin. High ROAS can actually bankrupt a business if ad spend exceeds gross product margin. Crealytics POAS integrates COGS (cost of goods sold) and shipping costs into bidding algorithms to optimize for actual cash contribution profit.
   - iCLV (Predictive Customer Lifetime Value): Platform algorithms treat every new customer identically. Crealytics iCLV models predict which customer cohorts have high repeat-purchase probability, allowing the brand to bid higher to acquire high-value recurring customers while bidding conservatively on one-and-done discount seekers.

SECTION 5: COLLABORATION, STAKEHOLDER MANAGEMENT & DISAGREEMENTS
• Handling Disagreements on Campaign Strategy:
  - "I'd first understand why we disagree: do we have different information, or different priorities?"
  - "I focus on the shared business goal rather than whose idea wins. In performance marketing, we don't have to argue over personal opinions—we can design an A/B split test with a controlled budget and let real empirical conversion data decide."
• Handling Client Pushback on Pausing an Underperforming Campaign:
  - "Acknowledge their goals first. Don't just say 'it's not working.' Walk them through the data: show where spend is leaking, explain the unit economics, and present an actionable alternative test rather than simply turning things off."
• Competing Deadlines & Urgent Account Issues:
  - Assess commercial severity immediately: live budget waste or conversion drops take priority over internal slide decks. Flag the trade-off to leadership early, contain the live account risk, and deliver reports on an agreed realistic timeline.

SECTION 6: STRATEGIC QUESTIONS TO ASK THE PERFORMANCE MARKETING TEAM
1. "How does the team integrate client margin data and POAS into automated bidding algorithms across Google and retail media?"
2. "What does the typical diagnostic and experimentation cadence look like across accounts—how do associates propose and validate new campaign tests?"
3. "What distinguishes an associate who executes mechanically from someone who becomes an exceptional performance strategist at Crealytics?"
4. "With the industry shifting toward black-box automation like Advantage+ and Performance Max, how does the team maintain strategic control and intent isolation?"`,
    cheatSheet: {
      coreNarrative: "Performance marketer with a rigorous analytical mindset, strong editorial discipline from Sportskeeda (600+ articles written, 1,000+ edited), and hands-on campaign execution across Google Search (CTR 5.20%→14.78%, CPC ₹5.33→₹4.21, 17/19 conversions), Meta Ads (Cost Cap test dropping cost/ATC from ₹91→₹29), and Amazon PPC (ACoS 173% conversion diagnostic). Systematic in account audits, full-funnel diagnostics, and POAS/margin-first optimization.",
      thingsToRemember: [
        "Google Search Ads: 1,252 impressions, 185 clicks, CTR 5.20% → 14.78%, CPC ₹5.33 → ₹4.21 (-21%), 17/19 conversions, ₹777 spend (₹800 budget)",
        "Meta Ads (Unleavables): 11.04% CTR, 15 add-to-carts, Cost Cap test dropped cost/ATC from ₹91 → ₹29 (₹54.52 blended CV benchmark)",
        "Amazon Ads (Homecrust): 5,681 → 5,955 impressions, 45 → 63 clicks (+40%), CTR 0.80% → 1.06%, 2 orders, ₹857 sales, ACoS 155.56% → 173.59% (commercial honesty: clicks without listing readiness burns spend)",
        "Editorial Background: 1,000+ articles edited/fact-checked, 600+ NFL articles written, 20+ writers/managers coordinated under strict daily deadlines",
        "Account Audit Sequence: 1. Tracking Health → 2. Structure & Intent → 3. SQR & Negatives → 4. Bidding & IS → 5. Creative Health → 6. Post-click CVR",
        "CTR up + CVR down: 1. Tag tracking break, 2. Broad intent drift, 3. Ad vs landing page disconnect, 4. Price/stock friction",
        "0-Conversion Leak: Triage tags first → SQR query waste second → mobile landing page third → bidding strategy fourth",
        "Budget Scaling: Never double overnight; marginal returns compress; scale in 15-20% steps every 3-5 days; monitor marginal ROAS/POAS",
        "Crealytics POAS: Profit on Ad Spend incorporates COGS and margins; prevents spending ₹500 to generate a ₹500 order with 10% gross margin",
        "Crealytics iCLV: Predictive Customer Lifetime Value bids up on high-repeat cohorts, avoiding overpaying for one-and-done discount buyers",
        "Disagreements: Understand why first, focus on shared goal over winning, test competing hypotheses with empirical data"
      ],
      thingsToAsk: [
        "How does the team integrate client margin data and POAS into automated bidding algorithms?",
        "What does the diagnostic and experimentation cadence look like across accounts?",
        "What separates a mechanically competent associate from an exceptional performance strategist here?",
        "How does the team balance platform automation (PMax / Advantage+) with strategic intent control?"
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
        { label: "Articles Authored", value: "600+" }
      ],
      guardrails: [
        "Never guess numbers or metrics; offer to pull verified campaign data",
        "Never recommend scaling budget overnight; always advocate 15-20% increments and marginal ROAS monitoring",
        "Never blame algorithms in a vacuum; evaluate tracking, intent, creative, and landing page friction",
        "Prioritize profit contribution (POAS) and unit economics over top-line vanity revenue"
      ],
      anchors: [
        "Lead with the diagnostic hypothesis first, then support with the step-by-step checklist.",
        "Drop in verified campaign numbers naturally (5.2% to 14.8% CTR, ₹4.21 CPC, ₹29 Cost Cap, 173% ACoS lesson).",
        "Show mature commercial judgment: traffic means nothing without conversion readiness and unit economics.",
        "When in doubt: 'I want to be precise and check the verified campaign report rather than guess an off-the-cuff number—let me pull that up right after our call.'"
      ]
    }
  },
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
• Interestingly, during my time at Kraftshala, I honestly didn't expect vibe coding to become my favourite subject, but I got really into it. I started experimenting with AI tools like Antigravity and Claude, building prototypes simply because I was curious to see whether I could turn an idea into something tangible.
• What surprised me was how much I enjoyed the process itself: identifying a problem, figuring out how to approach it, experimenting with different solutions, and refining things when they didn't work. It made me realise that I'm genuinely interested in how technology can make processes more efficient and help solve real problems.
• That's one of the reasons Crealytics caught my attention: you connect practical technology and automation with real, measurable business outcomes rather than just hype.
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
• Handling Disagreements with Colleagues (Garima's Authentic Perspective):
  - "I'd first try to understand why we disagree, because sometimes people are approaching the same problem with different information or priorities."
  - "I'd explain my perspective, but I'd also listen to theirs and be open to the possibility that they've noticed something I haven't."
  - "If we're working towards a shared goal, I'd want us to focus on what best serves that goal rather than on whose idea wins. In a marketing environment, for example, I'd be happy to test competing ideas or look at the available data instead of relying entirely on personal opinions."
  - "I think it's possible to disagree with someone's approach while still respecting them. For me, that's an important part of working well with different people."
• What Makes a Good Teammate & Collaboration Style (Garima's Authentic Perspective):
  - "I think one of the things that genuinely defines me is how much I enjoy connecting with people. I'm naturally curious about people, how they think, what they care about, and how they approach things differently from me."
  - "I enjoy conversations where I get to exchange ideas, learn something new, or see a situation from a perspective I hadn't considered before. That's also why I was drawn to media and communication in the first place: communication isn't just about putting a message out there; it's about understanding the person on the other side of it."
  - "That carries over into how I think about collaboration. I don't believe good teamwork means everyone has to think alike or agree on everything. In fact, I think some of the best work comes from people with different strengths and perspectives being able to challenge each other's ideas respectfully."
  - "If someone has a better idea, I'm happy to learn from them. If I disagree with something, I'd rather have a constructive conversation about it than turn it into a personal issue."
  - "For me, a good teammate is someone who's dependable, communicates honestly, and makes space for other people to contribute."
  - "I think it's important to take ownership of your own responsibilities while also understanding that you're part of something bigger than your individual tasks."
  - "A good teammate should be able to give and receive feedback, disagree respectfully, and offer support when someone needs it. I also think it's important to celebrate other people's contributions rather than viewing everything as a competition."
  - "Ultimately, I want to be someone who brings both ideas and positive energy to a team. I care about doing good work, but I also care about the people I'm doing it with. Good collaboration is about creating an environment where people can challenge each other, learn from each other, and produce better work together than they might have individually."
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
• Tell Me Something That Isn't on Your CV (Garima's Authentic Perspective):
  - "Oh, that's a fun question! I think something that isn't really reflected in my CV is how curious I am about things, sometimes to a slightly ridiculous extent. If something catches my interest, I tend to go down a rabbit hole trying to understand it."
  - "For example, I recently got really interested in vibe coding, and what started as a subject I was learning at Kraftshala turned into me experimenting with building my own little apps and game concepts. I think I enjoy the process of taking an idea that's floating around in my head and figuring out whether I can actually make something out of it."
  - "I'm also a big reader, particularly fantasy and science fiction. I love stories that make you look at the world a little differently, and I think that curiosity about people and how they think carries into other parts of my life, too."
  - "I guess I'm someone who enjoys both the imaginative side of things and figuring out how they work in practice. I like having conversations with people who see things differently from me because I usually come away having learnt something."
  - "And, well, sometimes I have far more ideas than I have hours in the day to execute them, but I'm learning to pick one, start small, and see where it goes!"
• Favourite Books & Reading Deep Dive:
  - Drawn to fantasy and science fiction: Getting completely absorbed in a story, especially when the author has built an entire world that feels like it exists beyond the pages.
  - *The Stormlight Archive* by Brandon Sanderson: "I love the scale of the world-building and how the story explores people, their flaws, their responsibilities, and the ways they change over time."
  - *The Night Circus* by Erin Morgenstern: "It's such a different experience from epic fantasy. The atmosphere is almost dreamlike, and I love how the writing makes the world feel magical without needing to explain every little thing."
  - *The House in the Cerulean Sea* by TJ Klune: "I love stories that have warmth and heart, especially when they're about belonging, found family, and looking beyond your first impressions of people."
  - "I think I enjoy books that can transport me somewhere completely different but still leave me thinking about something very human. I want the world-building and the imagination, but I also want characters I can get emotionally invested in."
  - "I'm probably the kind of person who gets attached to fictional characters and then has to deal with the consequences of that attachment. *Laughs.*"
  - "I know, they're almost opposites! I think I just enjoy stories that make me feel something, whether that's genuine unease or that very quiet feeling you get from watching an ordinary moment unfold. I don't necessarily need every story to be exciting in the conventional sense. Sometimes I want something that completely messes with my head, and sometimes I just want to watch people exist and figure life out."
• Dehradun Perspective: Hometown offering a balance of nature, education, and growing talent. Remote work allows ambitious professionals to build international careers without relocating.
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
        "Vibe Coding & Scrimba: 'I honestly didn't expect vibe coding to become my favourite subject, but I got really into it' — prototypes with Antigravity, Claude, Cursor, MCP; lowering the barrier to experimentation",
        "Applying AI to Marketing: Reporting pattern analysis, ad-copy variation testing, workflow automation—always backed by verified data",
        "Trust & Work Ethic: Hard work is about ownership over hours; trust comes from consistency, early honesty, and earning credibility over time ('Judge me by my work over time, not just what I say today')",
        "Good Teammate & Collaboration: Dependable, honest communication, making space for others, and celebrating teammates; 'I care about doing good work, but I also care about the people I'm doing it with'",
        "Handling Disagreements: Understand why we disagree first (info vs priorities); focus on shared goal over whose idea wins; in marketing: test competing ideas with data; disagree with approach while respecting the person",
        "Not on CV (Rabbit-Hole Curiosity): Curious to a slightly ridiculous extent; turning floating ideas into tangible apps/games; 'Sometimes I have far more ideas than hours in the day, but I'm learning to pick one, start small, and see where it goes!'",
        "Favourite Books: *The Stormlight Archive* (epic world-building & flawed characters carrying responsibility), *The Night Circus* (dreamlike magic without over-explaining), *The House in the Cerulean Sea* (warmth & found family); 'Getting attached to fictional characters and dealing with the consequences *laughs*'",
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
