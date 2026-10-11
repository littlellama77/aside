/**
 * notesSynthesizer.js
 * Intelligent parser and executive answer synthesizer for Babe.
 * Transforms raw user notes into detailed, human, and leader-grade answers.
 */

// Stop words to isolate significant search terms
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'you', 'your', 'yours'
]);

/**
 * Extracts numbers, metrics, currency, percentages, ratios, and data points from text
 * Fully supports INR (₹), USD ($), EUR (€), percentage ranges (5.20% to 14.78%),
 * comma counts (1,252 impressions, 1,000 articles), ratios (17 of 19), and project stats.
 */
export function extractNumbersAndMetrics(text) {
  if (!text) return [];
  const metrics = [];
  const seen = new Set();
  const lines = text.split('\n');

  lines.forEach(rawLine => {
    const line = rawLine.replace(/^[●•\-\*#>\s]+/, '').trim();
    if (!line || line.length < 3) return;

    // Pattern 1: Explicit Label: Value or Label = Value
    const labelMatch = line.match(/^([A-Za-z\s\-_/]+)[:=]\s*([+\-]?[₹$€£]?\s*[\d,]+(?:\.\d+)?%?(?:\s*(?:to|-)\s*[₹$€£]?\s*[\d,]+(?:\.\d+)?%?)?(?:\s*(?:days|weeks|months|hours|users|YoY|WoY|WoW|lift|score|NPS|CPA|CAC|ROAS|CTR|clicks|impressions|sales|orders|articles|conversions))?)/i);
    if (labelMatch) {
      let label = labelMatch[1].replace(/[:=]$/, '').trim();
      let val = labelMatch[2].replace(/[.,\s]+$/, '').trim();
      const key = (label + val).toLowerCase();
      if (!seen.has(key) && label.length > 1) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 2: Currency comparisons / ranges: e.g. 'CPC decreased from ₹5.33 to ₹4.21...', 'from ₹91 to ₹29'
    const currRangeMatch = line.match(/(.+?)(?:decreased|increased|dropped|from)?\s*([₹$€£]\s*[\d,]+(?:\.\d+)?\s*(?:to|-)\s*[₹$€£]?\s*[\d,]+(?:\.\d+)?(?:\s*,\s*[^.]*)?)/i);
    if (currRangeMatch) {
      let label = currRangeMatch[1].replace(/^(cpc|cpa|ctr|cost|spend|budget)\s*(?:decreased|increased|from)?/i, '$1').trim();
      label = label.replace(/(?:decreased|increased|from)\s*$/i, '').replace(/costper/i, 'Cost per').replace(/[:=.,]+$/, '').trim() || 'Cost / CPC';
      let val = currRangeMatch[2].replace(/[.,\s]+$/, '').trim();
      const key = (label + val).toLowerCase();
      if (!seen.has(key) && label.length > 1) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 3: Percentage ranges: e.g. 'CTR increased from 5.20% to 14.78%', 'from 0.80% to 1.06%', '155.56% to 173.59%'
    const pctRangeMatch = line.match(/(.+?)(?:increased|decreased|from|rose|dropped)?\s*([\d.]+\s*%\s*(?:to|-)\s*[\d.]+\s*%(?:\s*,\s*[^.]*)?)/i);
    if (pctRangeMatch) {
      let label = pctRangeMatch[1].replace(/(?:increased|decreased|from)\s*$/i, '').replace(/[:=.,]+$/, '').trim() || 'Rate Change';
      let val = pctRangeMatch[2].replace(/[.,\s]+$/, '').trim();
      const key = (label + val).toLowerCase();
      if (!seen.has(key) && label.length > 1) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 4: Number ranges: e.g. 'Impressions increased from 5,681 to 5,955', 'Clicks increased from 45 to 63'
    const numRangeMatch = line.match(/(.+?)(?:increased|decreased|from)?\s*([\d,]+\s*(?:to|-)\s*[\d,]+(?:\s*,\s*[^.]*)?)/i);
    if (numRangeMatch && !numRangeMatch[0].includes('2020') && !numRangeMatch[0].includes('2024') && !numRangeMatch[0].includes('2025')) {
      let label = numRangeMatch[1].replace(/(?:increased|decreased|from)\s*$/i, '').replace(/[:=.,]+$/, '').trim();
      let val = numRangeMatch[2].replace(/[.,\s]+$/, '').trim();
      const key = (label + val).toLowerCase();
      if (!seen.has(key) && label.length > 2 && label.length < 50) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 5: Ratio / target achieved: e.g. '17 of 19 planned conversions achieved'
    const ratioMatch = line.match(/(\d+\s*of\s*\d+)\s*(.+)/i);
    if (ratioMatch) {
      const val = ratioMatch[1].trim();
      let label = ratioMatch[2].replace(/(?:achieved|planned|completed|\.)/gi, '').trim() || 'Conversions Achieved';
      label = label.charAt(0).toUpperCase() + label.slice(1);
      const key = (label + val).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 6: Currency spent / budget comparison: e.g. '₹777 spent from an ₹800 planned budget'
    const spendBudgetMatch = line.match(/([₹$€£]\s*[\d,]+(?:\.\d+)?)\s*(?:spent from(?:\s*an)?|of)\s*([₹$€£]\s*[\d,]+(?:\.\d+)?)/i);
    if (spendBudgetMatch) {
      const val = `${spendBudgetMatch[1]} / ${spendBudgetMatch[2]}`;
      const label = "Campaign Spend / Budget";
      const key = (label + val).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 7: Single currency values: e.g. '₹54.52 overall cost per add-to-cart', '₹857 in sales', '₹700 budget'
    const currMatch = line.match(/([₹$€£]\s*[\d,]+(?:\.\d+)?)/);
    if (currMatch) {
      const val = currMatch[1].trim();
      let label = line.replace(val, '').replace(/[-*•#>\s]+/g, ' ').replace(/\b(in|spent|planned|overall|listed|my|CV)\b/gi, '').replace(/[.:=]+$/, '').trim();
      if (!label || label.length < 2) label = 'Spend / Budget';
      label = label.replace(/\s+/g, ' ').trim();
      label = label.charAt(0).toUpperCase() + label.slice(1);
      const key = (label + val).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 8: Single percentages: e.g. '11.04% CTR', '+12% conversion volume', '21% reduction'
    const pctMatch = line.match(/([+\-]?\d+(?:\.\d+)?\s*%)/);
    if (pctMatch) {
      const val = pctMatch[1].trim();
      let label = line.replace(val, '').replace(/[-*•#>\s]+/g, ' ').replace(/[.:=]+$/, '').trim() || 'Percentage';
      label = label.charAt(0).toUpperCase() + label.slice(1);
      const key = (label + val).toLowerCase();
      if (!seen.has(key) && label.length > 1 && label.length < 60) {
        seen.add(key);
        metrics.push({ label, value: val, context: line });
        return;
      }
    }

    // Pattern 9: Quantities with whitelisted units (impressions, clicks, conversions, articles, etc.)
    const METRIC_UNITS = /(?:articles|writers|managers|prototypes|impressions|clicks|conversions|orders|add-to-carts|hours|minutes|days|weeks|months|sprints|score|benchmark|cpa|cpc|ctr|roas|acos|users)/i;
    const countMatches = Array.from(line.matchAll(/(?:over|more than|approximately)?\s*([\d,]+)\s+([a-zA-Z\-_]+)/gi));
    if (countMatches && countMatches.length > 0) {
      countMatches.forEach(cm => {
        const num = cm[1].trim();
        const unit = cm[2].trim();
        if (!METRIC_UNITS.test(unit)) return;
        if (num.match(/^(2020|2022|2024|2025|2026)$/)) return;
        const label = unit.charAt(0).toUpperCase() + unit.slice(1);
        const val = cm[0].trim();
        const key = (label + val).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          metrics.push({ label, value: val, context: line });
        }
      });
    }

    // Pattern 10: Word numbers with units (e.g. 'Two orders generated', 'more than five web prototypes', 'nine hours of dayparting')
    const wordNumMatch = line.match(/(?:built\s+(?:more\s+than\s+)?)?(?:approximately\s+)?\b(one|two|three|four|five|six|seven|eight|nine|ten)\b\s+([a-zA-Z\-_]+(?:\s+[a-zA-Z\-_]+)?)/i);
    if (wordNumMatch) {
      const word = wordNumMatch[1].toLowerCase();
      const unitPhrase = wordNumMatch[2].toLowerCase();
      const WORD_TO_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      if (METRIC_UNITS.test(unitPhrase) || /order|prototype|hour|daypart/i.test(unitPhrase)) {
        let label = unitPhrase.replace(/(?:generated|built|of|using|assisted|web|functional|\.)/gi, '').trim();
        if (label.length >= 3) {
          label = label.charAt(0).toUpperCase() + label.slice(1);
          const val = `${WORD_TO_NUM[word] || word} ${label.toLowerCase()}`.trim();
          const key = (label + val).toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            metrics.push({ label, value: val, context: line });
          }
        }
      }
    }
  });

  return metrics;
}

/**
 * Breaks massive notes (even 50,000+ words) into logical sections & paragraphs with extracted metadata
 */
export function chunkLargeNotes(rawText) {
  if (!rawText || !rawText.trim()) return [];

  // Split by Markdown headers (# Header), section dividers, or double line breaks
  const rawSections = rawText.split(/(?:\r?\n){2,}|(?=^#{1,3}\s+)/m);
  const chunks = [];

  rawSections.forEach((sectionText, idx) => {
    const trimmed = sectionText.trim();
    if (!trimmed || trimmed.length < 12) return;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    
    // Clean heading title
    let title = firstLine.replace(/^[#\-*•>\s]+/, '').replace(/[:=].*$/, '').trim();
    if (title.length > 55) title = title.slice(0, 52) + '...';
    if (!title) title = `Section ${idx + 1}`;

    const words = trimmed.toLowerCase().split(/[^a-z0-9%$\-+]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    const metrics = extractNumbersAndMetrics(trimmed);

    chunks.push({
      id: `chunk-${idx}`,
      title,
      text: trimmed,
      lines,
      metrics,
      wordTokens: new Set(words),
      wordCount: trimmed.split(/\s+/).filter(Boolean).length
    });
  });

  return chunks;
}

/**
 * Normalizes speech-to-text phonetic approximations, garbled acronyms, and muddled spoken words
 */
export function normalizeSpokenPhonetics(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\b(see\s*ay\s*see|c\s*a\s*c|kay\s*ack)\b/g, 'cac')
    .replace(/\b(see\s*pee\s*see|c\s*p\s*c)\b/g, 'cpc')
    .replace(/\b(see\s*tee\s*are|c\s*t\s*r)\b/g, 'ctr')
    .replace(/\b(row\s*as|r\s*o\s*a\s*s)\b/g, 'roas')
    .replace(/\b(en\s*pee\s*es|n\s*p\s*s)\b/g, 'nps')
    .replace(/\b(kay\s*pee\s*eye|k\s*p\s*i)\b/g, 'kpi')
    .replace(/\b(mehtah|metta)\b/g, 'meta')
    .replace(/\b(convertion|convershun)\b/g, 'conversion')
    .replace(/\b(retenshun)\b/g, 'retention')
    .replace(/\b(onboardin)\b/g, 'onboarding')
    .replace(/\b(road\s*map|rodmap)\b/g, 'roadmap')
    .replace(/\b(quater|quartr)\b/g, 'quarter');
}

/**
 * BM25 / Ranked relevance search across thousands of lines & sections
 */
export function findTopMatchingSections(query, chunks, maxSections = 3) {
  if (!chunks || chunks.length === 0) return [];
  const normalizedQuery = normalizeSpokenPhonetics(query);
  const qLower = normalizedQuery.toLowerCase();
  const queryTokens = qLower.split(/[^a-z0-9%$\-+]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const chunkLower = chunk.text.toLowerCase();
    const titleLower = chunk.title.toLowerCase();

    // 1. Exact phrase match boost (+25)
    if (chunkLower.includes(qLower)) {
      score += 25;
    }

    // 2. Query words in Title (+12 each)
    queryTokens.forEach(t => {
      if (titleLower.includes(t)) {
        score += 12;
      }
    });

    // 3. Query words in Chunk Body (+4 each)
    queryTokens.forEach(t => {
      if (chunk.wordTokens.has(t)) {
        score += 4;
      }
    });

    // 4. Metric matches (e.g. searching for a number or label)
    chunk.metrics.forEach(m => {
      if (qLower.includes(m.label.toLowerCase()) || qLower.includes(m.value.toLowerCase())) {
        score += 8;
      }
    });

    return { ...chunk, score };
  });

  return scoredChunks
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSections);
}

/**
 * Parses raw unstructured notes (supports massive documents) into an Executive Memory Brief
 */
export function parseNotesToExecutiveBrief(rawText) {
  if (!rawText || !rawText.trim()) {
    return {
      coreNarrative: "Ready for your pre-meeting notes.",
      thingsToRemember: ["Key points will populate here."],
      thingsToAsk: ["Strategic questions will populate here."],
      importantNumbers: [],
      guardrails: [],
      anchors: ["Take a breath. You know this domain inside out."],
      stats: { wordCount: 0, charCount: 0, sectionCount: 0, metricCount: 0, readTimeMin: 0 },
      topics: []
    };
  }

  const lines = rawText.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(l => l.length > 0);
  const thingsToRemember = [];
  const thingsToAsk = [];
  const guardrails = [];
  const numbers = extractNumbersAndMetrics(rawText);
  const chunks = chunkLargeNotes(rawText);
  const totalWords = rawText.split(/\s+/).filter(Boolean).length;

  lines.forEach(line => {
    const lower = line.toLowerCase();

    // Guardrails / Don'ts
    if (lower.startsWith('do not') || lower.startsWith("don't") || lower.includes('avoid') || lower.includes('hold off') || lower.includes('wait until')) {
      guardrails.push(line);
      return;
    }

    // Questions to ask
    if (line.includes('?') || lower.startsWith('ask') || lower.startsWith('need to ask') || lower.startsWith('question:')) {
      const cleanQ = line.replace(/^(ask|need to ask|question:)\s*/i, '').trim();
      thingsToAsk.push(cleanQ.endsWith('?') ? cleanQ : `${cleanQ}?`);
      return;
    }

    // High priority strategic points
    if (line.length > 15 && thingsToRemember.length < 15) {
      thingsToRemember.push(line);
    }
  });

  // Extract core narrative from first 1-2 substantial sentences
  const narrativeSummary = lines.slice(0, 2).join(' ').slice(0, 180);

  // Document Statistics
  const stats = {
    wordCount: totalWords,
    charCount: rawText.length,
    sectionCount: chunks.length,
    metricCount: numbers.length,
    readTimeMin: Math.max(1, Math.ceil(totalWords / 200))
  };

  const topics = chunks.map(c => c.title).slice(0, 12);

  return {
    coreNarrative: narrativeSummary || "Strategic meeting context prepared.",
    thingsToRemember: thingsToRemember.length > 0 ? thingsToRemember : [
      "Core strategy aligned across workstreams",
      "Key metrics and constraints prepared"
    ],
    thingsToAsk: thingsToAsk.length > 0 ? thingsToAsk : [
      "What are the final milestone expectations for this phase?",
      "Are there any cross-functional dependencies we need to align on today?"
    ],
    importantNumbers: numbers.length > 0 ? numbers : [
      { label: "Target Status", value: "On Track" }
    ],
    guardrails: guardrails.length > 0 ? guardrails : [
      "Stay grounded in verified data before committing to stretch timelines"
    ],
    anchors: [
      "Lead with the strategic bottom line, then walk through the data.",
      "You have the domain context. Stay calm, composed, and unhurried."
    ],
    stats,
    topics,
    chunks
  };
}

/**
 * Synthesizes human, leader-like answers for ANY question
 * using BM25 chunk retrieval across even huge amounts of notes!
 */
export function synthesizeLeaderAnswerForCustomQuestion(questionText, rawNotesText, executiveBrief, speakingStyle = {}) {
  const qLower = questionText.toLowerCase();
  const chunks = chunkLargeNotes(rawNotesText);
  const topSections = findTopMatchingSections(questionText, chunks, 3);
  const bestSection = topSections[0] || null;

  const metrics = executiveBrief?.importantNumbers || [];
  const guardrails = executiveBrief?.guardrails || [];
  const rememberItems = executiveBrief?.thingsToRemember || [];

  // Determine intent category
  let category = "expected";
  let topic = bestSection?.title || "Meeting Inquiry";
  let babeTag = "babe 👀 executive answer";
  let isUnknown = false;

  // Check for personal, introductory, or high-level strategic overview questions
  const isIntro = qLower.includes("yourself") ||
                  qLower.includes("tell me about") ||
                  qLower.includes("tell us about") ||
                  qLower.includes("introduce") ||
                  qLower.includes("background") ||
                  qLower.includes("who are you") ||
                  qLower.includes("overview");

  if (isIntro) {
    category = "intro";
    topic = "Executive Overview";
    babeTag = "babe 👀 concise executive intro";
    const glanceSay = "Sure, absolutely. To give you a high-level overview: I'm leading execution across our key initiatives, focusing on performance stability and cross-functional alignment. In our current cycle, our priority is disciplined execution against our core benchmarks while scaling our next milestone.";
    const expandedSay = "Sure, absolutely. To give you a complete picture: I lead execution across our strategic priorities, partnering closely with cross-functional stakeholders. Currently, my primary focus is ensuring performance stability, protecting core efficiency, and scaling our validated roadmap initiatives. In this meeting, I have our recent performance data and strategic rationale ready to dive into wherever helpful.";
    return {
      id: `custom-${Date.now()}`,
      category,
      speaker: "Meeting Attendee",
      question: questionText,
      topic,
      babeTag,
      simplestQuestion: "They're asking for an introductory overview of your role, focus, and background.",
      glanceSay,
      glanceBullets: [
        "• Strategic execution lead",
        "• Focus: performance stability & roadmap delivery",
        "• Current priority: scaling validated milestones"
      ],
      expandedSay,
      supportingContext: "Executive introduction aligned with your leadership role.",
      extraInformation: "Grounded in your leadership profile and current project context.",
      isUnknown: false
    };
  }

  // If no sections matched or query asks for completely unrelated details not in notes
  const queryTokens = qLower.split(/[^a-z0-9%$\-+]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const hasAnyNoteMatch = chunks.some(c => queryTokens.some(t => c.wordTokens.has(t)));

  if (!hasAnyNoteMatch && chunks.length > 0 && queryTokens.length > 0) {
    category = "unknown";
    isUnknown = true;
    babeTag = "babe, this isn't in your notes 🔒 (preserve credibility)";
    const glanceSay = "I want to be precise and not give you an off-the-cuff figure—that specific detail isn't in my notes right now. Let me pull that report post-meeting and follow up directly with the verified numbers.";
    const expandedSay = "I want to make sure we're making decisions on verified data rather than an estimate, so I won't guess on that specific breakout off the top of my head. I have our high-level benchmarks in front of me, but let me pull the audited granular data right after we wrap up today and send the exact breakdown over to the team.";
    return {
      id: `custom-${Date.now()}`,
      category,
      speaker: "Meeting Attendee",
      question: questionText,
      topic: "Unverified Data Point",
      babeTag,
      simplestQuestion: "They're asking for a detail outside your provided notes.",
      glanceSay,
      glanceBullets: [
        "• Specific detail not in current notes",
        "• Protect executive credibility (do not guess)",
        "• Commit to immediate post-call follow-up"
      ],
      expandedSay,
      supportingContext: "Executive safety guardrail: Grounded in your actual notes. No hallucinations.",
      extraInformation: "Grounded defense: Notes contain other sections, but zero verified mentions of this specific inquiry.",
      isUnknown: true,
      stuckRecovery: {
        breatheMsg: "Take a breath. Leaders never guess numbers on the fly.",
        questionSummary: "What's the exact number?",
        points: ["Not in notes", "Do not invent data", "Follow up immediately after call"],
        easySay: glanceSay,
        stallSay: "I want to ensure the numbers are 100% verified before I speak to that."
      }
    };
  }

  // Find relevant sentences and metrics from best section, or fallback across all lines
  let coreFact = "";
  let relevantMetrics = [];

  if (bestSection && bestSection.score > 0) {
    const sectionLines = bestSection.lines.filter(l => l.length > 15);
    coreFact = sectionLines.slice(0, 2).join('. ').replace(/[-*•#>\s]+/g, ' ').trim();
    relevantMetrics = bestSection.metrics.length > 0 ? bestSection.metrics : metrics.slice(0, 2);
  } else {
    coreFact = rememberItems.slice(0, 2).join('. ').replace(/[-*•#>\s]+/g, ' ').trim() || "Our execution remains aligned with planned roadmap benchmarks.";
    relevantMetrics = metrics.slice(0, 2);
  }

  // Construct Leader Framing
  let opening = "Yeah, happy to address that.";
  if (qLower.includes("why")) {
    opening = "Yeah, happy to walk through the rationale behind that.";
    babeTag = "babe 👀 clear strategic rationale";
  } else if (qLower.includes("what should") || qLower.includes("recommend") || qLower.includes("opinion") || qLower.includes("next step")) {
    opening = "Looking at where things stand, my recommendation is very clear.";
    babeTag = "babe 👀 decisive executive recommendation";
    category = "opinion";
  } else if (qLower.includes("how") || qLower.includes("status")) {
    opening = "To give you a direct status update on that:";
    babeTag = "babe 👀 status & performance update";
  } else if (qLower.includes("risk") || qLower.includes("delay") || qLower.includes("concern") || qLower.includes("problem")) {
    opening = "That's a fair question, and I want to be upfront about what we ran into.";
    babeTag = "babe 👀 accountability & proactive solution";
    category = "reflective";
  }

  // Build the Metric Clause
  let metricMention = "";
  if (relevantMetrics.length > 0) {
    metricMention = relevantMetrics.map(m => `${m.label} is currently at ${m.value}`).join(', and ');
  } else if (metrics.length > 0) {
    const topM = metrics[0];
    metricMention = `${topM.label} is currently holding at ${topM.value}`;
  }

  // Build the Guardrail / Forward Guidance Clause
  let guardrailMention = "";
  if (guardrails.length > 0) {
    guardrailMention = `To ensure we don't overextend, our operating rule is to ${guardrails[0].toLowerCase().replace(/^do not\s+|^don't\s+/, 'hold off on ')}.`;
  } else {
    guardrailMention = "Our immediate focus is validating results before making broader structural shifts.";
  }

  // Assemble Glanceable Leader Answer (2-3 sentences, articulate, punchy)
  const glanceSay = `${opening} ${coreFact}. ${metricMention ? `As a reference point, ${metricMention}. ` : ''}Our next priority is keeping execution steady while we validate the upcoming milestone.`;

  // Assemble Full Expanded Leader Answer (4-6 sentences, structured executive narrative)
  const expandedSay = `${opening} If we step back and look at the full picture, ${coreFact.toLowerCase().startsWith('i ') ? coreFact : coreFact.charAt(0).toLowerCase() + coreFact.slice(1)}. ${metricMention ? `Specifically, ${metricMention}, which gives us a solid baseline to build on. ` : ''}${guardrailMention} Going forward, the decisive milestone is confirming this week's test results so we can scale with high confidence and keep cross-functional stakeholders aligned.`;

  // Bullets
  const glanceBullets = [
    `• ${coreFact.slice(0, 48)}...`,
    metricMention ? `• Data: ${metricMention.slice(0, 42)}` : `• Execution aligned with targets`,
    `• Next step: Validate milestone before scaling`
  ];

  return {
    id: `custom-${Date.now()}`,
    category,
    speaker: "Meeting Attendee",
    question: questionText,
    topic: bestSection?.title || "Meeting Inquiry",
    babeTag,
    simplestQuestion: "They're asking for your perspective and status.",
    glanceSay,
    glanceBullets,
    expandedSay,
    supportingContext: bestSection
      ? `Retrieved from Section: "${bestSection.title}" · ${coreFact}`
      : `Synthesized from your notes: "${coreFact.slice(0, 90)}..."`,
    extraInformation: bestSection && bestSection.lines.length > 2
      ? `Deep-dive context from "${bestSection.title}": ${bestSection.lines.slice(2, 5).join(' ')}`
      : `${guardrailMention} Strategic rationale: ${coreFact}.`,
    isUnknown: false,
    stuckRecovery: {
      breatheMsg: "Take a second babe. Lead with the core point from your notes.",
      questionSummary: questionText,
      points: [
        coreFact.slice(0, 45),
        metricMention ? metricMention.slice(0, 40) : "Steady execution",
        "Next steps planned"
      ],
      easySay: glanceSay,
      stallSay: "Give me one second — I want to make sure I frame that clearly."
    }
  };
}

/**
 * Dynamically generates a tailored suite of 6-8 realistic meeting questions
 * with rich, detailed, leader-like answers directly from ANY user notes!
 */
export function generateQuestionsFromNotes(rawNotesText, templateId = "custom") {
  const brief = parseNotesToExecutiveBrief(rawNotesText);
  const metrics = brief.importantNumbers;
  const remember = brief.thingsToRemember;
  const ask = brief.thingsToAsk;
  const guardrails = brief.guardrails;

  // Extract candidate themes from notes
  const textLower = rawNotesText.toLowerCase();

  // If this matches Crealytics interview template (Torsten Christ, Performance Marketing Associate, Sportskeeda, Kraftshala)
  if (templateId === "crealytics-interview" || textLower.includes("crealytics") || textLower.includes("torsten") || textLower.includes("kraftshala") || textLower.includes("sportskeeda") || textLower.includes("unleavables") || textLower.includes("homecrust")) {
    return [
      {
        id: "crealytics-q1",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about yourself and your journey into performance marketing.",
        topic: "Candidate Story & Background",
        babeTag: "babe 👀 Point → Example → Learning",
        simplestQuestion: "Torsten wants your 60-75 second intro story connecting editing to marketing.",
        startWithPrompt: "Start with: “Hi Torsten, I'm Garima…”",
        glanceSay: "Hi Torsten, I'm Garima. I started my career in sports media at Sportskeeda, editing over 1,000 articles and writing over 600 articles covering NFL and college football. Working with headlines and audience engagement made me curious about why certain messages resonate and how their impact can be measured. That curiosity led me to Kraftshala's Marketing Launchpad, where I executed hands-on projects across Google Search Ads, Meta Ads, and Amazon PPC. Now, I'm excited to bring my editorial rigor, data analysis, and technical curiosity together in a performance marketing role at Crealytics.",
        glanceBullets: [
          "• 1,000+ articles edited & 600+ articles authored at Sportskeeda",
          "• Transitioned from sports journalism to measurable audience science",
          "• Hands-on campaign execution at Kraftshala: Google Search, Meta Ads, Amazon PPC",
          "• Built >5 AI prototypes; eager to drive profitable growth at Crealytics"
        ],
        expandedSay: "Hi Torsten, thank you for having me. I'd describe myself as someone who's endlessly curious about people and why certain ideas resonate with them. I started my career in sports media at Sportskeeda, where I edited over 1,000 articles, collaborated with over 20 writers, and authored over 600 articles covering NFL and college football. Over time, I became fascinated by the data side of communication—why certain headlines attracted higher CTR and what made content perform. That led me to Kraftshala's Marketing Launchpad, where I've managed real ad budgets across Google Search Ads, Meta Ads, and Amazon PPC. Along the way, I've also been building AI-assisted web prototypes. I'm now looking to bring those experiences together in a performance marketing role at Crealytics, where I can contribute to real campaigns and learn alongside experienced practitioners.",
        supportingContext: "Notes Part 1: Sportskeeda (1,000+ edited, 600+ written), Doon University (BA 2020, MA 2022), Kraftshala Launchpad, AI prototypes.",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. You know your journey: Sportskeeda → Kraftshala → Crealytics.",
          questionSummary: "Tell me about yourself?",
          points: ["1,000+ articles edited", "Moved from writing to data & ads", "Kraftshala campaigns + AI prototypes"],
          easySay: "I started in sports media editing over 1,000 articles, became fascinated by how communication is measured, and transitioned into performance marketing at Kraftshala.",
          stallSay: "I'd love to walk you through my journey from media into performance marketing."
        }
      },
      {
        id: "crealytics-q2",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Why Crealytics specifically, and what draws you to this role?",
        topic: "Why Crealytics & Culture Fit",
        babeTag: "babe 👀 highlight profitable growth + AI",
        simplestQuestion: "Why Crealytics instead of other marketing agencies?",
        startWithPrompt: "Start with: “What really excites me about Crealytics is…”",
        glanceSay: "What really excites me about Crealytics is the intersection of performance marketing, technology, and AI—especially your focus on profitable growth. Too many agencies stop at surface metrics like clicks or CTR, but Crealytics connects campaign decisions directly to real business margins. I've also been building AI-assisted web prototypes myself, so joining a team that uses technology to solve large-scale marketing problems while building strong fundamentals is exactly where I want to grow.",
        glanceBullets: [
          "• Focus on profitable growth beyond vanity clicks",
          "• Intersection of performance marketing, technology, and AI",
          "• Personal interest: built >5 AI prototypes to explore workflow automation",
          "• Eager to learn from experienced teammates who challenge assumptions"
        ],
        expandedSay: "What really interests me about Crealytics is the combination of performance marketing, technology, and AI. I'm at a point in my career where I'm excited by understanding not just how to run campaigns, but why certain things work and how technology can help us make better decisions. The focus on profitable growth particularly stood out to me, because it means looking beyond whether an ad gets clicks and asking whether it's actually helping the business grow. I've also been experimenting with AI-assisted development tools and building functional web prototypes myself, so joining a company that applies AI to marketing at scale feels like a natural match for what I'm already curious about.",
        supportingContext: "Notes Part 2: Profitable growth focus; technology + AI integration; writing background brings audience perspective.",
        stuckRecovery: {
          breatheMsg: "Profitable growth + AI + learning environment. You've got this.",
          questionSummary: "Why Crealytics?",
          points: ["Profitable growth focus", "Performance marketing + AI", "Great place to build fundamentals"],
          easySay: "Your focus on profitable growth and combining performance marketing with AI matches exactly what I'm curious about.",
          stallSay: "What stood out most to me about Crealytics is how you approach profitable growth."
        }
      },
      {
        id: "crealytics-q3",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Can you walk me through your Google Search Ads project and your key results?",
        topic: "Google Search Ads Project",
        babeTag: "babe 👀 share the numbers: CTR 5.2%→14.8%, CPC ₹5.33→₹4.21",
        simplestQuestion: "Torsten wants to hear your Google Search project metrics and learnings.",
        startWithPrompt: "Start with: “In my Google Search Ads project…”",
        glanceSay: "In my Google Search Ads project at Kraftshala, I focused on improving campaign performance through intent-based ad groups and keyword refinement. Over the campaign, CTR jumped from 5.20% to 14.78%, while CPC decreased from ₹5.33 down to ₹4.21—roughly a 21% reduction in cost. We achieved 17 of our 19 planned conversions within a ₹777 spend from an ₹800 budget. The big takeaway was seeing how tighter campaign structure directly unlocked both higher engagement and cost efficiency.",
        glanceBullets: [
          "• 1,252 impressions and 185 clicks",
          "• CTR surged: 5.20% → 14.78%",
          "• CPC reduced: ₹5.33 → ₹4.21 (approx 21% reduction)",
          "• Conversions: 17 of 19 achieved within ₹777 spend (₹800 budget)",
          "• Intent-based ad groups, bid adjustments, pausing underperformers"
        ],
        expandedSay: "In my Google Search Ads project at Kraftshala, I worked on improving campaign performance through keyword and targeting optimization. I focused on creating more intent-based ad groups, refining negative keywords, adjusting bids and locations, and pausing underperforming areas. By the end of the project, CTR had increased from 5.20% to 14.78%, while CPC decreased from ₹5.33 to ₹4.21—approximately a 21% reduction. We achieved 17 of the 19 planned conversions within a ₹777 spend from an ₹800 budget. What I found most valuable was learning to evaluate multiple metrics together: seeing how intent-driven structure can simultaneously improve engagement and cost efficiency.",
        supportingContext: "Notes Part 4: Google Search Ads — 1,252 impressions, 185 clicks, CTR 5.20% to 14.78%, CPC ₹5.33 to ₹4.21, 17 of 19 conversions, ₹777/₹800 spend.",
        stuckRecovery: {
          breatheMsg: "You have all the numbers: 1,252 impressions, CTR 14.78%, CPC down 21% to ₹4.21.",
          questionSummary: "Google Search Ads project results?",
          points: ["CTR 5.20% to 14.78%", "CPC ₹5.33 to ₹4.21 (-21%)", "17 of 19 conversions on ₹777 spend"],
          easySay: "We increased CTR from 5.20% to 14.78% and reduced CPC by 21% to ₹4.21, hitting 17 of 19 planned conversions on a ₹777 spend.",
          stallSay: "I'd love to walk through the metrics from that Google Search project."
        }
      },
      {
        id: "crealytics-q4",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "In your Unleavables Meta Ads project, what did you test and what were the outcomes?",
        topic: "Unleavables Meta Ads Project",
        babeTag: "babe 👀 highlight bidding test: Cost Cap vs Highest Volume",
        simplestQuestion: "What did you test on Meta and what did the data show?",
        startWithPrompt: "Start with: “For Unleavables, I ran an A/B bidding test…”",
        glanceSay: "For Unleavables, a custom apparel brand, I tested bidding strategies between Cost Cap and Highest Volume alongside audience segmentation. During the test period, Cost Cap proved significantly more cost-efficient, dropping cost per add-to-cart from ₹91 down to ₹29, with an overall 11.04% CTR and 15 add-to-carts. It reinforced the value of testing bidding strategies empirically rather than assuming default volume delivery is best.",
        glanceBullets: [
          "• 11.04% CTR achieved, 15 add-to-carts generated",
          "• Cost per add-to-cart decreased from ₹91 to ₹29 in test period",
          "• Cost Cap proved more efficient than Highest Volume",
          "• Overall CV cost per add-to-cart: ₹54.52"
        ],
        expandedSay: "One project I worked on was a Meta Ads campaign for Unleavables, a direct-to-consumer custom apparel brand. The project involved audience segmentation, competitor analysis, and creative decisions. Crucially, I also compared bidding strategies between Cost Cap and Highest Volume. During the test period, Cost Cap proved significantly more efficient, bringing the cost per add-to-cart down from ₹91 to ₹29. Overall, the campaign delivered an 11.04% CTR and 15 add-to-carts, with a blended ₹54.52 cost per add-to-cart across the full run. It was a great learning experience in validating hypotheses with data rather than intuition.",
        supportingContext: "Notes Part 4: Unleavables Meta Ads — 11.04% CTR, 15 add-to-carts, ₹54.52 CV benchmark, ₹91 to ₹29 test cost.",
        stuckRecovery: {
          breatheMsg: "Cost Cap vs Highest Volume. Dropped ₹91 to ₹29. 11.04% CTR.",
          questionSummary: "Unleavables Meta Ads project?",
          points: ["Cost Cap beat Highest Volume", "Cost/ATC dropped ₹91 to ₹29", "11.04% CTR & 15 ATCs"],
          easySay: "Cost Cap reduced cost per add-to-cart from ₹91 to ₹29 during testing, delivering an 11.04% CTR and 15 add-to-carts.",
          stallSay: "In that project, the core experiment was comparing bidding strategies."
        }
      },
      {
        id: "crealytics-q5",
        category: "opinion",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "In your Homecrust Amazon campaign, clicks rose by 40% but ACoS increased to 173%. How do you evaluate that?",
        topic: "Homecrust Amazon PPC & Honest Analysis",
        babeTag: "babe 👀 be honest about what worked and what didn't",
        simplestQuestion: "Why did ACoS increase despite higher clicks, and what would you optimize next?",
        startWithPrompt: "Start with: “I appreciate that question because…”",
        glanceSay: "I appreciate that question because it shows that more clicks don't automatically mean a profitable campaign. We successfully expanded visibility—impressions grew 5% and clicks rose 40% with CTR improving from 0.80% to 1.06%, generating ₹857 in sales. However, conversion rate decreased from 2.20% to 1.58% and ACoS rose to 173.59%. If I were optimizing this next, I'd investigate product-page conversion barriers, search term relevance, and per-unit margins rather than assuming more clicks alone equals success.",
        glanceBullets: [
          "• Impressions: 5,681 → 5,955 (+5%), Clicks: 45 → 63 (+40%)",
          "• CTR improved: 0.80% → 1.06%, 2 orders, ₹857 sales",
          "• Conversion rate dipped: 2.20% → 1.58%, ACoS rose: 155.56% → 173.59%",
          "• Key takeaway: Clicks ≠ Profitability; next step is auditing product page & search term intent"
        ],
        expandedSay: "I worked on an Amazon Sponsored Products campaign for Homecrust, a home and kitchen brand, optimizing a ₹700 budget using negative targeting, placement adjustments, and dayparting. The campaign generated clear improvements in visibility and engagement: impressions grew by about 5%, clicks increased by 40%, and CTR rose from 0.80% to 1.06%, generating two orders and ₹857 in sales. However, our conversion rate dropped from 2.20% to 1.58%, and ACoS climbed from 155.56% to 173.59%. That taught me that more clicks don't automatically mean a better campaign. If I were running the next iteration, I would analyze the search term report to eliminate non-converting queries, audit product listing copy and pricing, and examine order economics before committing more budget.",
        supportingContext: "Notes Part 4 & 6: Homecrust — 5,681 to 5,955 impressions, 45 to 63 clicks, ACoS 155.56% to 173.59%, ₹700 budget.",
        stuckRecovery: {
          breatheMsg: "This shows mature analytical thinking. Honest about ACoS, clear on next steps.",
          questionSummary: "Why did Homecrust ACoS rise?",
          points: ["Clicks up 40%, sales ₹857", "Conversion rate dipped to 1.58%", "Audit product page & search term intent"],
          easySay: "Clicks grew 40% and CTR improved, but conversion rate dropped, pushing ACoS to 173%. It proved that more clicks don't equal profitability without conversion alignment.",
          stallSay: "That project gave me a really valuable lesson about the difference between traffic and profitability."
        }
      },
      {
        id: "crealytics-q6",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about a time you had to learn something quickly or adapt to a new domain.",
        topic: "Adaptability & Fast Learning",
        babeTag: "babe 👀 Sportskeeda NFL story (600+ articles from zero)",
        simplestQuestion: "Share how you mastered American football writing from scratch.",
        startWithPrompt: "Start with: “One clear example is…”",
        glanceSay: "One clear example is moving into NFL and college football writing at Sportskeeda when I had little prior knowledge of American football. I had to learn the game rules, terminology, and key storylines on tight publishing deadlines. By researching systematically, learning from editor feedback, and building domain knowledge article by article, I went on to publish over 600 articles. That experience showed me that not knowing something yet isn't a barrier—I genuinely enjoy starting as a beginner and mastering new domains through disciplined research.",
        glanceBullets: [
          "• Stepped into NFL and college football with zero prior background",
          "• Researched game terminology, roster trends, and rules under tight deadlines",
          "• Authored over 600 articles applying SEO principles",
          "• Demonstrates high adaptability, coachability, and research rigor"
        ],
        expandedSay: "A defining experience for me was transitioning into NFL and college football coverage at Sportskeeda. I had very little prior knowledge of American football, but I was tasked with producing timely, accurate content for an informed audience under strict publishing deadlines. I approached it with structured discipline: I studied the terminology and schemes, reviewed game footage, paid close attention to editor feedback, and cross-referenced reputable sources. Over time, I authored over 600 articles and developed real comfort covering the sport. That experience taught me that being adaptable and curious is far more valuable than only sticking to familiar topics, and that exact mindset has accelerated my learning in performance marketing.",
        supportingContext: "Notes Part 3 & 5: Question 19 & 29 — moved into NFL writing from scratch, authored 600+ articles.",
        stuckRecovery: {
          breatheMsg: "600+ NFL articles from scratch. You can learn anything quickly.",
          questionSummary: "Time you learned something quickly?",
          points: ["Started NFL writing with zero knowledge", "Systematic research & editor feedback", "Authored over 600 articles"],
          easySay: "I moved into NFL writing with no prior knowledge, researched the sport systematically, and went on to write over 600 articles.",
          stallSay: "A great example is when I started writing about American football."
        }
      },
      {
        id: "crealytics-q7",
        category: "opinion",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Do you have any questions for me today?",
        topic: "Questions to Ask Torsten",
        babeTag: "babe 👀 ask thoughtful culture & role questions",
        simplestQuestion: "Ask Torsten about 3-6 month success and PPC development.",
        startWithPrompt: "Start with: “Yes, thank you Torsten…”",
        glanceSay: "Yes, thank you Torsten! I'd love to ask: What would success look like for someone in this role during their first three to six months? And how does Crealytics help new associates develop deep expertise across PPC and algorithmic campaign optimization?",
        glanceBullets: [
          "• 1. What does success look like in the first 3–6 months?",
          "• 2. How does Crealytics help associates develop PPC & optimization expertise?",
          "• 3. How closely does the associate team collaborate with technical & AI squads?",
          "• 4. What are the next steps in the interview process?"
        ],
        expandedSay: "Yes, thank you Torsten, I do have a couple of questions. First, what would success look like for someone joining as a Performance Marketing Associate during their first three to six months? Second, given Crealytics' strong focus on technology and AI, how is the training and mentorship structured to help associates build deep fundamentals in PPC and campaign optimization? And third, how closely does the associate team collaborate with your data and technical squads on daily client work?",
        supportingContext: "Notes Part 7: Questions to Ask Torsten (success in 3-6 months, PPC development, team structure, next steps).",
        stuckRecovery: {
          breatheMsg: "Ask about 3-6 month success and learning PPC.",
          questionSummary: "Questions to ask Torsten?",
          points: ["3-6 month success definition", "How Crealytics trains PPC & AI", "Next steps in interview"],
          easySay: "What would success look like in the first 3 to 6 months, and how does Crealytics support associates in developing deep PPC expertise?",
          stallSay: "I have a few questions about the role and team structure."
        }
      }
    ];
  }

  // If this matches the default marketing template, return the premium upgraded marketing questions
  if (templateId === "marketing-q3" || (textLower.includes("meta") && textLower.includes("search") && textLower.includes("creative"))) {
    return [
      {
        id: "q1",
        category: "expected",
        speaker: "Sarah (VP Marketing)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Why did campaign performance drop last week?",
        topic: "Weekly Performance Drivers",
        babeTag: "babe 👀 lead with the strategic drivers",
        simplestQuestion: "They're asking why performance dropped last week.",
        glanceSay: "Yeah, happy to walk through that. We rotated our primary creative mid-week because older assets were fatiguing, which reset Meta's learning phase and pushed CPC up temporarily. The reassuring signal is our baseline held firm—Google Search stayed solid at a 78 quality score with conversion volume up 12% WoW, so this was transient friction from the ad refresh.",
        glanceBullets: [
          "• Creative rotated mid-week to combat fatigue",
          "• Algorithmic learning phase caused temporary CPC bump",
          "• Search fundamentals strong: 78 score, +12% volume lift",
          "• Tuesday creative test will validate stabilization"
        ],
        expandedSay: "Yeah, I appreciate the question, Sarah. Looking at the weekly performance data, there were really two interconnected drivers. First, our legacy creative was showing clear signs of audience fatigue, so we swapped in fresh variations mid-week. That reset Meta's bidding model into a learning phase, causing an expected short-term spike in cost-per-click. Second, that rollout was compressed because design had to wait 3 days on legal sign-off. What gives me high confidence, though, is that our demand baseline is strong—Google Search held steady with a 78 quality score and conversion volume was up 12% week-over-week. We're running our follow-up creative test on Tuesday, and once that data settles, we anticipate CPA stabilizing back to our target ranges.",
        supportingContext: "From your notes: Creative swapped Wednesday after fatigue; 3-day legal delay; Search quality score 78 (+12% volume lift).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. You know the exact two reasons.",
          questionSummary: "Why did performance drop?",
          points: [
            "Creative rotated mid-week to combat fatigue",
            "Learning phase caused temporary CPC bump",
            "Search remained resilient at 78 (+12% volume)"
          ],
          easySay: "It was driven by the mid-week creative rotation entering the learning phase, while our Search baseline stayed strong at 78.",
          stallSay: "Give me one second — I want to give you the precise breakdown from last week."
        }
      },
      {
        id: "q2",
        category: "opinion",
        speaker: "Marcus (Growth Lead)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "What do you think we should do next?",
        topic: "Strategic Recommendation",
        babeTag: "They want YOUR strategic recommendation. 👀",
        simplestQuestion: "They want your recommendation on what to do next.",
        glanceSay: "My recommendation is disciplined patience over the next 72 hours. We shouldn't rush to scale budget until Tuesday's creative test confirms efficiency, but once we validate the fresh hooks and see CPC settle, we can unlock spend behind our winning variations with high confidence.",
        glanceBullets: [
          "• Hold budget flat through Monday",
          "• Test 2–3 fresh creative variations on Tuesday",
          "• Unlock scaling only after CPC and CPA stabilize",
          "• Protect unit economics before expanding"
        ],
        expandedSay: "From a growth perspective, the smartest play right now is disciplined execution rather than an emotional reaction. I recommend we hold spend flat through Monday, launch our two to three new creative variations on Tuesday, and monitor how the learning phase responds. Once we verify that click-through rate rebounds and CPA settles without volatility, we can confidently greenlight the budget increase Marcus and I discussed. That way, we let empirical test data earn our additional capital rather than gambling into a fluctuating bidding window.",
        supportingContext: "Notes: Do not scale budget until Tuesday's test; run 2-3 variations; let data confirm efficiency first.",
        stuckRecovery: {
          breatheMsg: "This is your strategic opinion, not a test. Speak calmly.",
          questionSummary: "What should we do next?",
          points: [
            "Hold spend steady for now",
            "Run 2-3 creative tests Tuesday",
            "Scale budget once efficiency confirms"
          ],
          easySay: "I recommend we hold spend steady until Tuesday's creative test confirms stabilization, then scale.",
          stallSay: "Let me frame the cleanest rollout sequence for a second."
        }
      },
      {
        id: "q3",
        category: "expected",
        speaker: "Sarah (VP Marketing)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Why did we change the creative in the first place?",
        topic: "Creative Strategy Rationale",
        babeTag: "babe 👀 explain audience saturation",
        simplestQuestion: "They're asking why we swapped the ad creative mid-week.",
        glanceSay: "The original creative had been running for consecutive weeks and was hitting clear audience saturation—our click-through rate was decaying and frequency was creeping up. Refreshing the hook was essential to protect margins and avoid burning ad spend ahead of Q4.",
        glanceBullets: [
          "• Original creative hit audience fatigue",
          "• CTR decaying & frequency creeping up",
          "• Refreshed hook protects long-term margins"
        ],
        expandedSay: "We made the call to rotate creative because our primary asset was hitting audience saturation. We watched click-through rates steadily decay over consecutive sprints while impression frequency crossed our threshold. In paid acquisition, keeping a tired creative running just burns margin. We needed fresh visual hooks to re-engage our core demographics ahead of the upcoming quarter, even though taking that short-term learning hit creates temporary variance.",
        supportingContext: "From notes: Original ad had been running for weeks and click engagement was trailing off.",
        stuckRecovery: {
          breatheMsg: "babe, don't overthink this one. The old ad was tired.",
          questionSummary: "Why switch creative?",
          points: ["Original ad was fatiguing", "CTR slowing down", "Needed fresh hooks for Q4"],
          easySay: "The previous creative was fatiguing and CTR was dropping, so we needed a fresh hook to prevent margin burn.",
          stallSay: "The primary driver behind that swap was ad fatigue."
        }
      },
      {
        id: "q4",
        category: "contextual",
        speaker: "Marcus (Growth Lead)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "And did that work?",
        topic: "Iteration Outcomes (Contextual)",
        babeTag: "babe 👀 contextual ('that' = ad change)",
        simplestQuestion: "They're asking if the creative change worked.",
        glanceSay: "It gave us encouraging top-of-funnel signals, but downstream conversion efficiency still needs tuning. Click-through rate lifted with the new hook, but on-site conversion dipped slightly. That's why Tuesday's test focuses specifically on aligning the landing page experience.",
        glanceBullets: [
          "• 'That' = mid-week creative rotation",
          "• Top-of-funnel CTR improved",
          "• Conversion efficiency dipped slightly",
          "• Tuesday test aligns ad hook with landing page"
        ],
        expandedSay: "The honest assessment is that it's a mixed read so far, which is normal for a first iteration. On the positive side, our top-of-funnel engagement improved—CTR lifted as the new hook caught attention. However, downstream conversion rate dipped slightly as users acclimated to the new messaging angle. So it proved our thesis that fresh creative was needed, but confirmed we need to refine the mid-funnel alignment. That's why Tuesday's test is focused specifically on tightening message consistency from ad to landing page.",
        supportingContext: "Contextual memory: Knows 'that' refers to the mid-week creative rotation mentioned in Q3.",
        stuckRecovery: {
          breatheMsg: "Remember 'that' means the ad change. Be honest and balanced.",
          questionSummary: "Did the creative change work?",
          points: ["CTR lifted", "Conversion rate dipped slightly", "Iterating on Tuesday"],
          easySay: "Top-of-funnel clicks improved, but conversions dipped slightly, so we're refining alignment on Tuesday.",
          stallSay: "The results were nuanced—let me give you the balanced picture."
        }
      },
      {
        id: "q5",
        category: "expected",
        speaker: "Alex (Finance Lead)",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "What were the Search results?",
        topic: "Search Performance Data",
        babeTag: "babe 👀 standout metrics here",
        simplestQuestion: "They want the Search numbers from your notes.",
        glanceSay: "Search was our standout channel this week. Quality score held firm at 78, conversion volume grew 12% week-over-week, and our overall e-commerce benchmark hit 89. It provided the exact revenue floor we needed while social was fluctuating.",
        glanceBullets: [
          "• Search quality score: 78",
          "• Conversion volume: +12% WoW",
          "• E-commerce benchmark: 89",
          "• Anchored blended customer acquisition"
        ],
        expandedSay: "Search delivered our most dependable performance of the period, Alex. Our core quality score remained rock solid at 78, and we actually expanded conversion volume by 12% week-over-week without needing to escalate bids. On top of that, our blended e-commerce result hit 89 against our benchmark. That paid search efficiency acted as a vital stabilizer for our blended customer acquisition economics while Meta was absorbing the creative transition.",
        supportingContext: "Direct from your executive brief: Search score 78, volume +12% WoW, E-comm benchmark 89.",
        stuckRecovery: {
          breatheMsg: "Great news here! Search held the line beautifully.",
          questionSummary: "What were Search results?",
          points: ["Score 78", "Volume +12%", "E-comm benchmark 89"],
          easySay: "Search was very strong—quality score 78, volume up 12%, and e-commerce result at 89.",
          stallSay: "Search was our brightest spot this past week, here's the summary."
        }
      },
      {
        id: "q6",
        category: "unexpected",
        speaker: "Sarah (VP Marketing)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Why should we increase the budget?",
        topic: "Capital Allocation Rationale",
        babeTag: "babe 👀 connect volume lift to ROI",
        simplestQuestion: "They're asking why you want to increase budget.",
        glanceSay: "Because our underlying conversion volume on Meta is expanding efficiently when the audience engages, and Search has proven our unit economics are healthy. We aren't asking to spend blindly—we want to scale budget strictly behind the winning variation once Tuesday's test proves out.",
        glanceBullets: [
          "• Conversion volume expanding steadily",
          "• Search proves unit economics are healthy",
          "• Gated on Tuesday's test results",
          "• Capture impression share before Q4 auction inflation"
        ],
        expandedSay: "The rationale for scaling budget comes down to compounding our validated traction. When we look beneath the temporary ad rotation, Meta's underlying conversion velocity is genuinely strong, and customer acquisition volume is pacing ahead of prior months. Search has already proved that brand intent is healthy. Increasing budget allows us to capture higher impression share before Q4 market congestion drives ad auction prices higher across the board. To be clear, we are gating that spend increase on Tuesday's test results—we only scale once the efficiency metrics earn it.",
        supportingContext: "Reasoning from notes: Meta conversion volume improving; Search baseline solid; scale post-test.",
        stuckRecovery: {
          breatheMsg: "Connect the dots: volume is up, Search is solid, scale post-test.",
          questionSummary: "Why increase budget?",
          points: ["Conversion volume pacing up", "Search unit economics healthy", "Scale post-Tuesday test"],
          easySay: "Because conversion velocity is strong and unit economics are proven—we just want to gate the spend on Tuesday's test.",
          stallSay: "I want to be precise about why the math and timing work here."
        }
      },
      {
        id: "q7",
        category: "jargon",
        speaker: "Marcus (Growth Lead)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Can you speak to the implications of the Q3 attribution model relative to our acquisition strategy?",
        topic: "Attribution Strategy (Corporate Translation)",
        babeTag: "babe, they're basically asking:",
        simplestQuestion: "“What changed with attribution, and what does it mean for strategy?”",
        glanceSay: "Yeah, absolutely. In plain terms, the new model credits early discovery touchpoints instead of just the final click. So while direct Meta ROAS looks softer on paper, our overall sales and blended volume haven't declined at all. It gives us a much more honest view of how social feeds search.",
        glanceBullets: [
          "• Discovery touchpoints get earned credit",
          "• Direct Meta ROAS appears lower on paper",
          "• Total sales & blended volume unchanged",
          "• Explains the +12% lift in paid search"
        ],
        startWithPrompt: "Start with: “Yeah, basically, the main change is…”",
        expandedSay: "Yeah, happy to demystify that, Marcus. The shift from last-touch to data-driven multi-touch attribution essentially reallocates credit toward the discovery touchpoints that initiate the customer journey. On paper, that makes direct Meta ROAS appear slightly lower because it's no longer claiming sole credit for purchases that closed on Google Search. But looking at our blended top-line revenue, volume has remained completely intact. The strategic implication is that we shouldn't penalize top-of-funnel campaigns for lower direct ROAS—they're the feeder engine driving the 12% lift we're seeing in paid search.",
        supportingContext: "Jargon unpacked: Attribution models shift how credit is shared, not the actual dollars collected.",
        stuckRecovery: {
          breatheMsg: "Classic corporate jargon. Don't let big words rattle you.",
          questionSummary: "What changed with attribution?",
          points: ["Top-of-funnel gets credit", "Direct ROAS looks softer", "Total sales steady"],
          easySay: "Yeah, basically top-of-funnel clicks get more credit now, but total sales are completely steady.",
          stallSay: "Give me one second — I want to make sure I explain that attribution shift simply."
        }
      },
      {
        id: "q8",
        category: "unknown",
        speaker: "Alex (Finance Lead)",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "What was our exact CPA variance in Germany last Tuesday?",
        topic: "Unknown Granular Metric (Credibility Defense)",
        babeTag: "babe, this isn't in your notes 🔒 (preserve credibility)",
        simplestQuestion: "They're asking for a hyper-specific Germany stat not in your notes.",
        isUnknown: true,
        glanceSay: "I want to be precise and not give you an off-the-cuff figure—our notes cover our blended domestic CPA and regional benchmarks, but not the isolated Germany breakdown for last Tuesday. Let me pull that exact audit report with the finance team right after this call and send it over.",
        glanceBullets: [
          "• Germany day-level breakout not in notes",
          "• Do not invent or estimate figures",
          "• Commit to immediate verified follow-up"
        ],
        expandedSay: "Alex, I want to make sure I give you exact audited numbers rather than an off-the-cuff estimate. Our current dashboard tracks our aggregate campaign CPA and blended variances, but that specific day-level breakout for the German market isn't in front of me right now. Let me pull the regional ledger right after we wrap up today and follow up with you and Marcus with the verified figures.",
        supportingContext: "Executive safety guardrail: Notes contain blended benchmarks, but zero Germany-specific breakouts.",
        stuckRecovery: {
          breatheMsg: "babe, do NOT guess. It is 100% fine not to know.",
          questionSummary: "Germany CPA last Tuesday?",
          points: ["Not in notes", "Do not invent numbers", "Check after call"],
          easySay: "I'm not sure off the top of my head — let me verify that exact figure right after the call.",
          stallSay: "I don't want to give you the wrong number. Let me pull that up post-meeting."
        }
      },
      {
        id: "q9",
        category: "clarification",
        speaker: "Sarah (VP Marketing)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "What do you mean by that?",
        topic: "Executive Clarification & Plain English",
        babeTag: "babe 👀 plain English translation",
        simplestQuestion: "They want you to explain bidding mechanics simply.",
        glanceSay: "In simple terms: if we pump budget into an algorithm while it's still testing who to show the ad to, we'll waste money on high-cost impressions. Let's let the algorithm find its footing over 48 hours so every additional dollar is spent efficiently.",
        glanceBullets: [
          "• Algorithm needs 50 conversions to calibrate",
          "• Pouring budget in early spikes CPA",
          "• Stabilize creative first, scale with efficiency"
        ],
        expandedSay: "To put it plainly: ad platform bidding algorithms require roughly 50 conversion events in a calm environment to calibrate who is most likely to buy. If we pour substantial budget in while the ad is still in that volatile learning window, the bidding engine overpays for impressions, unnecessarily inflating our CPA. By waiting 48 hours for the conversion curve to flatten, every subsequent dollar we deploy works at maximum efficiency.",
        supportingContext: "Plain-language translation of ad bidding dynamics and learning phase stabilization.",
        stuckRecovery: {
          breatheMsg: "They just want plain English. You've got this.",
          questionSummary: "What do you mean?",
          points: ["Early spend raises CPA", "Algorithm needs 48h to calibrate", "Scale when steady"],
          easySay: "Just that pouring budget in while the algorithm is learning will spike our CPA—we need 48 hours of stability first.",
          stallSay: "Let me clarify the bidding mechanics so the logic is clear."
        }
      },
      {
        id: "q10",
        category: "reflective",
        speaker: "Alex (Finance Lead)",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "Why didn't we catch this delay earlier?",
        topic: "Accountability & Process Governance",
        babeTag: "babe 👀 stay calm, don't get defensive",
        simplestQuestion: "They're asking about the 3-day creative delay.",
        glanceSay: "That's a fair question. The delay stemmed from compliance and legal review taking 3 days longer than typical on creative claims. We've already addressed the root cause by establishing a 48-hour pre-clearance SLA and building a 2-day approval buffer into all future sprint timelines.",
        glanceBullets: [
          "• Compliance review took 3 extra days on claims",
          "• Acknowledge friction without defensiveness",
          "• Instituted 48-hour SLA & 2-day buffer for future launches"
        ],
        expandedSay: "It's a completely valid critique, Alex, and accountability is important here. The bottleneck occurred because our updated messaging incorporated specific product claims that required multi-party legal and compliance review, which extended our turnaround by 3 days beyond our standard window. Rather than treating this as an anomaly, we've formalized a two-day mandatory compliance buffer into our campaign calendar, and we're setting up a pre-approved claims library with legal so our creative team never hits this friction again.",
        supportingContext: "From notes: Creative delayed 3 days due to legal approval. Framed as systemic process improvement.",
        stuckRecovery: {
          breatheMsg: "Take a breath. Acknowledge the delay and give the forward solution.",
          questionSummary: "Why the delay?",
          points: ["Legal approval took 3 days", "Acknowledge without defensiveness", "Added 2-day buffer SLA"],
          easySay: "Legal sign-off took 3 extra days for compliance claims. We've now built a mandatory 2-day buffer into the calendar.",
          stallSay: "That's a fair question — the bottleneck was around legal claims sign-off."
        }
      }
    ];
  }

  // If this matches the Senior Product Manager interview template
  if (templateId === "product-interview" || (textLower.includes("onboarding") && textLower.includes("retention") && textLower.includes("tech debt"))) {
    return [
      {
        id: "pm-q1",
        category: "expected",
        speaker: "Elena (VP Product)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Can you walk us through a recent product initiative where you drove measurable impact?",
        topic: "Onboarding Revamp & Retention Impact",
        babeTag: "babe 👀 STAR method: lead with the 28% retention lift",
        simplestQuestion: "Tell the onboarding revamp story and the +28% retention result.",
        glanceSay: "Absolutely. I led our mobile onboarding overhaul after diagnosing that drop-off was occurring at registration. By condensing the flow into a 3-step value-first experience, we increased Day 7 retention by 28% and helped drive our 6-month NPS from 34 to 58.",
        glanceBullets: [
          "• Redesigned mobile onboarding into 3-step flow",
          "• Day 7 retention increased by +28%",
          "• NPS lifted from 34 to 58 over 6 months",
          "• Balanced customer delight with business conversion"
        ],
        expandedSay: "I'd love to highlight our mobile onboarding redesign. When I audited the funnel, users were experiencing high cognitive load during initial setup, creating severe churn before experiencing core value. I partnered closely with design and analytics to streamline the flow into a progressive 3-step experience that highlighted immediate personal utility. The outcome was a 28% improvement in Day 7 retention cohorts, and over the subsequent two quarters, our customer satisfaction index climbed significantly, with NPS advancing from 34 to 58.",
        supportingContext: "Notes: Mobile onboarding revamp improved Day 7 retention by 28%; NPS rose from 34 to 58 in 6 months.",
        stuckRecovery: {
          breatheMsg: "You led this. You know the numbers: 28% retention, NPS 34 to 58.",
          questionSummary: "Impactful product initiative?",
          points: ["Onboarding revamp", "+28% Day 7 retention", "NPS 34 -> 58"],
          easySay: "I led our mobile onboarding redesign, which drove a 28% increase in Day 7 retention and lifted NPS from 34 to 58.",
          stallSay: "I'd love to walk through the mobile onboarding revamp I led."
        }
      },
      {
        id: "pm-q2",
        category: "expected",
        speaker: "David (Director of Eng)",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "How do you navigate tension between shipping new features and addressing engineering tech debt?",
        topic: "Engineering Partnership & Tech Debt Allocation",
        babeTag: "babe 👀 highlight the 20% sprint buffer compromise",
        simplestQuestion: "David wants to hear how you partner with engineering on tech debt.",
        glanceSay: "I view tech debt as a balance sheet item that directly affects long-term velocity. When we hit friction, I established an agreement with engineering to dedicate a 20% sprint buffer to refactoring, which preserved our feature roadmap while giving engineers dedicated room to stabilize the architecture.",
        glanceBullets: [
          "• Tech debt directly impacts product velocity",
          "• Negotiated a dedicated 20% sprint buffer",
          "• Shared prioritization on critical technical bottlenecks",
          "• Resulted in higher team velocity and fewer regressions"
        ],
        expandedSay: "I never treat tech debt as an afterthought or a fight between product and engineering. In my previous role, our velocity was beginning to suffer from legacy architectural debt. Rather than having ad-hoc debates every sprint, I worked with the engineering leads to establish a permanent 20% sprint capacity allocation specifically for infrastructure health and refactoring. We co-owned that backlog: engineering prioritized the highest-risk technical bottlenecks, and product ensured we maintained our strategic roadmap commitments. It built tremendous trust and dramatically reduced production incidents.",
        supportingContext: "Notes: Negotiated 20% sprint buffer for refactoring; partner with engineering proactively.",
        stuckRecovery: {
          breatheMsg: "David wants to hear collaboration. Cite the 20% sprint buffer.",
          questionSummary: "How do you handle tech debt?",
          points: ["20% sprint buffer", "Co-owned backlog", "Protects long-term velocity"],
          easySay: "I negotiated a dedicated 20% sprint buffer for engineering refactoring so we protected velocity and stability together.",
          stallSay: "I have a very collaborative philosophy on technical debt."
        }
      },
      {
        id: "pm-q3",
        category: "opinion",
        speaker: "Elena (VP Product)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "How do you think squad autonomy should be balanced against executive direction?",
        topic: "Organizational Autonomy vs Alignment",
        babeTag: "babe 👀 ask them about team autonomy",
        simplestQuestion: "They're asking for your philosophy on team autonomy.",
        glanceSay: "I strongly subscribe to the 'tight on strategy, loose on execution' model. Leadership defines the strategic boundaries, customer outcomes, and guardrails, while the squad has full autonomy over discovery, prioritization, and solution design. That creates deep ownership without organizational misalignment.",
        glanceBullets: [
          "• Tight on strategy, loose on execution",
          "• Leadership sets outcomes & guardrails",
          "• Squad owns discovery, design & delivery",
          "• Alignment enables true autonomous velocity"
        ],
        expandedSay: "I believe the most effective teams operate under high alignment and high autonomy. As product leaders, our responsibility is to provide crisp strategic clarity—the 'why', the measurable customer metrics, and the enterprise guardrails. Once that foundation is locked, the squad must have genuine agency to talk to customers, test hypotheses, and determine the 'how'. My job is to protect that autonomy, remove organizational roadblocks, and ensure our outcomes directly advance company OKRs.",
        supportingContext: "Notes: Remember to discuss squad autonomy and roadmap ownership.",
        stuckRecovery: {
          breatheMsg: "High alignment, high autonomy. Speak with conviction.",
          questionSummary: "Autonomy vs executive direction?",
          points: ["Tight on strategy, loose on execution", "Squad owns solution discovery", "Alignment enables speed"],
          easySay: "I believe in high alignment and high autonomy: leadership defines the strategic outcomes, and the squad owns the execution.",
          stallSay: "I have a clear framework for balancing autonomy with alignment."
        }
      },
      {
        id: "pm-q4",
        category: "reflective",
        speaker: "Elena (VP Product)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about a time a product launch didn't go the way you anticipated.",
        topic: "Failure Story & Executive Reflection",
        babeTag: "babe 👀 keep it under 90s, focus on learnings",
        simplestQuestion: "Tell the failure story concisely without rambling.",
        glanceSay: "Early on, we launched an automated recommendation widget without sufficient mid-funnel testing. Adoption was 40% below forecast because users didn't trust the automated logic. We immediately added transparent control toggles, recovering 70% of projected volume within six weeks, and I established pre-launch user trust audits as a team standard.",
        glanceBullets: [
          "• Feature had 40% lower adoption due to lack of user trust",
          "• Rapidly iterated with transparent user control toggles",
          "• Recovered 70% of projected volume in 6 weeks",
          "• Instituted trust audits as a permanent launch requirement"
        ],
        expandedSay: "Early in my tenure, we launched an algorithmic recommendations module based on strong backtested data, but real-world adoption fell 40% short of our target in week two. When I conducted rapid qualitative debriefs with churned users, we discovered a trust barrier: users felt the algorithm was a black box. Instead of defensively pushing more notifications, we immediately pivoted the UI to explain why each item was recommended and gave users manual filter controls. Within six weeks, engagement rebounded by 70%, and I instituted mandatory trust-and-transparency testing into our pre-launch validation checklist.",
        supportingContext: "Notes: Keep failure story crisp and under 90 seconds; highlight resilience and systematic learning.",
        stuckRecovery: {
          breatheMsg: "Crisp and honest. Acknowledge, explain pivot, share institutional learning.",
          questionSummary: "Launch failure story?",
          points: ["Recommendation feature lacked trust", "Added transparency toggles", "Recovered 70% volume"],
          easySay: "We had an early recommendation feature underperform due to user trust barriers. We added transparency controls, recovered 70% of adoption, and turned it into an institutional review standard.",
          stallSay: "I have a specific example where an early assumption proved wrong."
        }
      }
    ];
  }

  // Dynamic Generator for ANY custom user notes!
  // Extracts facts and constructs 6 tailored questions reflecting the user's specific text
  const customQuestions = [];
  const primaryTopic = brief.coreNarrative.slice(0, 45) || "Project Overview";

  // Q1: The Core Status / Background Question
  const corePoint = remember[0] || "We are tracking against our primary goals.";
  const topMetric = metrics[0] ? `${metrics[0].label} (${metrics[0].value})` : "core performance benchmarks";
  customQuestions.push({
    id: `dyn-q1`,
    category: "expected",
    speaker: "Executive Stakeholder",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    question: `Can you walk us through the current status of ${primaryTopic}?`,
    topic: "Status & Core Brief",
    babeTag: "babe 👀 lead with the strategic outcome",
    simplestQuestion: "They want a comprehensive status update from your notes.",
    glanceSay: `Yeah, absolutely. Looking at our overall progress, ${corePoint.replace(/^[-*•]\s*/, '')}. We're closely monitoring ${topMetric}, and our cross-functional execution is structured to keep milestones on schedule.`,
    glanceBullets: [
      `• Status: ${corePoint.slice(0, 42)}`,
      `• Key metric: ${topMetric}`,
      `• Execution aligned to sprint milestones`
    ],
    expandedSay: `Yeah, happy to provide the full overview. Looking across our deliverables, ${corePoint.replace(/^[-*•]\s*/, '')}. In terms of measurable traction, ${topMetric} serves as our core indicator right now. Our operating priority is maintaining steady cadence while mitigating any downstream dependencies, ensuring we deliver value without operational surprises.`,
    supportingContext: `Derived directly from your notes: "${corePoint.slice(0, 80)}..."`,
    stuckRecovery: {
      breatheMsg: "Take a breath babe. You know your core status.",
      questionSummary: "What is the current status?",
      points: [corePoint.slice(0, 40), topMetric, "Steady progress"],
      easySay: `Overall, ${corePoint.slice(0, 60)}. We're monitoring ${topMetric} closely.`,
      stallSay: "Give me one second — I want to give you the clean status overview."
    }
  });

  // Q2: The Strategic Recommendation / Next Steps Question
  const secondPoint = remember[1] || remember[0] || "Execute planned phases with discipline";
  customQuestions.push({
    id: `dyn-q2`,
    category: "opinion",
    speaker: "Project Lead",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    question: "What is your recommendation on our immediate next steps?",
    topic: "Strategic Direction",
    babeTag: "They want YOUR strategic recommendation. 👀",
    simplestQuestion: "They want your recommendation on what to do next.",
    glanceSay: `My recommendation is that we focus our attention on ${secondPoint.replace(/^[-*•]\s*/, '')}. Rather than stretching across secondary priorities, locking down this phase gives us the empirical proof we need to scale confidently.`,
    glanceBullets: [
      `• Focus on: ${secondPoint.slice(0, 40)}`,
      `• Ensure baseline validation before scaling`,
      `• Coordinate cross-functional handoffs`
    ],
    expandedSay: `From an execution perspective, my clear recommendation is that we prioritize ${secondPoint.replace(/^[-*•]\s*/, '')}. Moving methodically through this checkpoint prevents costly rework and validates our core assumptions before broader rollout. Once we verify performance against our targets, we can aggressively expand our operational footprint.`,
    supportingContext: `Synthesized from your notes' priorities: "${secondPoint.slice(0, 80)}..."`,
    stuckRecovery: {
      breatheMsg: "This is your strategic opinion. Speak with calm authority.",
      questionSummary: "What should we do next?",
      points: [secondPoint.slice(0, 40), "Validate first", "Scale with data"],
      easySay: `I recommend we prioritize ${secondPoint.slice(0, 50)} to validate baseline performance.`,
      stallSay: "Let me frame the most strategic sequence of events for a second."
    }
  });

  // Q3: Data & Metrics Question
  if (metrics.length > 0) {
    const m = metrics[0];
    customQuestions.push({
      id: `dyn-q3`,
      category: "expected",
      speaker: "Operations Director",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      question: `What are the latest figures regarding ${m.label}?`,
      topic: `${m.label} Performance`,
      babeTag: "babe 👀 verified numbers from your brief",
      simplestQuestion: `They want the exact figures on ${m.label}.`,
      glanceSay: `On ${m.label}, our confirmed figure is currently ${m.value}. That performance is holding consistent with our expectations and provides the stability we need for our upcoming review.`,
      glanceBullets: [
        `• ${m.label}: ${m.value}`,
        `• Pacing aligned with benchmark targets`,
        `• Monitored continuously across sprints`
      ],
      expandedSay: `Looking directly at ${m.label}, our confirmed measurement is sitting at ${m.value}. That metric gives us clear validation that our baseline operations are functioning as intended. We're continuing to track this day-over-day to ensure there is no unexpected volatility as we scale.`,
      supportingContext: `Direct from your executive brief: ${m.label} = ${m.value}.`,
      stuckRecovery: {
        breatheMsg: `You have the exact metric: ${m.label} is ${m.value}.`,
        questionSummary: `What is the figure for ${m.label}?`,
        points: [`${m.label}: ${m.value}`, "On track with target", "Monitoring daily"],
        easySay: `On ${m.label}, the figure is currently ${m.value}, which meets our expectations.`,
        stallSay: "I want to confirm the exact figure from our latest report."
      }
    });
  }

  // Q4: Guardrail / Constraint / Risk Question
  if (guardrails.length > 0) {
    const g = guardrails[0];
    customQuestions.push({
      id: `dyn-q4`,
      category: "unexpected",
      speaker: "Risk & Governance Lead",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      question: "Are there any specific risks or operational boundaries we need to respect?",
      topic: "Operational Guardrails",
      babeTag: "babe 👀 highlight your risk boundary",
      simplestQuestion: "They want to know what constraints we must respect.",
      glanceSay: `Yes, we have a very clear guardrail here: ${g.replace(/^[-*•]\s*/, '')}. Maintaining that discipline protects our team from unnecessary exposure while we finalize our validation phase.`,
      glanceBullets: [
        `• Boundary: ${g.slice(0, 42)}`,
        `• Protects team from premature commitments`,
        `• Enforces quality before volume`
      ],
      expandedSay: `We've established explicit governance around this initiative, specifically: ${g.replace(/^[-*•]\s*/, '')}. It is crucial that we don't rush into premature scaling before our test gates pass. By adhering to this boundary, we ensure high execution fidelity and protect our blended unit economics.`,
      supportingContext: `Guardrail from your notes: "${g.slice(0, 80)}"`,
      stuckRecovery: {
        breatheMsg: "Point directly to your stated guardrail. It shows foresight.",
        questionSummary: "What risks or boundaries exist?",
        points: [g.slice(0, 45), "Discipline protects quality", "Gate before scaling"],
        easySay: `Our primary boundary is to ${g.slice(0, 50)} so we don't overextend prematurely.`,
        stallSay: "We have established very clear guardrails on that front."
      }
    });
  }

  // Q5: Strategic Question to Ask the Room
  if (ask.length > 0) {
    const a = ask[0];
    customQuestions.push({
      id: `dyn-q5`,
      category: "contextual",
      speaker: "Executive Chair",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      question: "What open questions do you need leadership alignment on today?",
      topic: "Executive Alignment Ask",
      babeTag: "babe 👀 this is your moment to ask your question!",
      simplestQuestion: "They are inviting you to ask your strategic question.",
      glanceSay: `The primary area where we need alignment is: ${a.replace(/^[-*•]\s*/, '')}. Having clarity on that decision allows our team to unblock our timeline and execute without ambiguity.`,
      glanceBullets: [
        `• Question: ${a.slice(0, 45)}`,
        `• Unblocks team velocity`,
        `• Aligns cross-functional dependencies`
      ],
      expandedSay: `The most impactful item where leadership alignment will accelerate our progress is: ${a.replace(/^[-*•]\s*/, '')}. Clarifying this direction today removes ambiguity for the team, protects our sprint velocity, and ensures we deploy resources against the highest-leverage outcome.`,
      supportingContext: `Identified from your pre-meeting brief: "${a.slice(0, 80)}"`,
      stuckRecovery: {
        breatheMsg: "Ask the exact question you came prepared with.",
        questionSummary: "What do you need alignment on?",
        points: [a.slice(0, 45), "Unblocks the team", "Ensures clarity"],
        easySay: `We'd love clarity on: ${a.slice(0, 60)}.`,
        stallSay: "There is one pivotal decision we would love leadership alignment on today."
      }
    });
  }

  // Q6: Unknown Detail (Credibility Defense)
  customQuestions.push({
    id: `dyn-q6`,
    category: "unknown",
    speaker: "Finance Lead",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    question: "Do you have the exact historical variance for regional vendor contracts from Q1 last year?",
    topic: "External Historical Data Point",
    babeTag: "babe, this isn't in your notes 🔒 (preserve credibility)",
    simplestQuestion: "They're asking for historical details not in your notes.",
    isUnknown: true,
    glanceSay: "I want to be precise and not give you an off-the-cuff estimate—our current dashboard covers our active operational metrics, but not that specific Q1 vendor breakout. Let me pull that report with finance right after this call and follow up with the audited figures.",
    glanceBullets: [
      "• Historical vendor breakout not in current notes",
      "• Preserve credibility (never guess figures)",
      "• Commit to immediate post-call follow-up"
    ],
    expandedSay: "I want to ensure we are looking at audited, verified data rather than an estimate, so I won't guess on that historical breakout off the top of my head. Let me pull the archival records right after our session wraps up today and provide you and the team with the exact figures.",
    supportingContext: "Executive safety guardrail: Outside active notes. Preserve credibility.",
    stuckRecovery: {
      breatheMsg: "Leaders never guess numbers. Deflect with confidence.",
      questionSummary: "Historical Q1 variance?",
      points: ["Not in notes", "Do not invent data", "Follow up after call"],
      easySay: "I want to verify that exact figure rather than guess—let me follow up right after the call.",
      stallSay: "I want to verify that specific line item before speaking to it."
    }
  });

  return customQuestions;
}
