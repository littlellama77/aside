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
 * Extracts the core question and intent from a long, rambling, or compound speech turn.
 * In conversational English (and interview questions in particular), speakers often start
 * with conversational context, preamble, or pleasantries, and place the actual ask in the
 * final sentence or interrogative clause.
 */
export function extractCoreQuestionFromSpeech(fullText) {
  if (!fullText || typeof fullText !== 'string') {
    return { coreQuestion: '', fullText: '', isCompound: false };
  }

  const cleaned = fullText.trim();
  if (cleaned.length < 15) {
    return { coreQuestion: cleaned, fullText: cleaned, isCompound: false };
  }

  // Split into sentences / major clauses
  const sentences = cleaned
    .split(/(?<=[.?!;])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return { coreQuestion: cleaned, fullText: cleaned, isCompound: false };
  }

  // Look from the back towards the front for the sentence that contains an interrogative or meeting prompt
  const INTERROGATIVE_REGEX = /\b(what|how|why|where|when|who|which|can you|could you|would you|will you|tell me|tell us|walk me|walk us|explain|describe|share|give us|give me|thoughts on|think about|your take|your view|result|outcome|learn|takeaway|scale|handle|manage|approach|evaluate|outcome)\b|\?/i;

  let chosenSentence = '';
  for (let i = sentences.length - 1; i >= 0; i--) {
    const s = sentences[i];
    if (INTERROGATIVE_REGEX.test(s)) {
      chosenSentence = s;
      break;
    }
  }

  // If no specific sentence matched the interrogative regex, take the last sentence
  if (!chosenSentence) {
    chosenSentence = sentences[sentences.length - 1];
  }

  // If the chosen sentence is very short (< 4 words), combine it with the penultimate sentence
  if (chosenSentence.split(/\s+/).length < 4 && sentences.length >= 2) {
    chosenSentence = `${sentences[sentences.length - 2]} ${chosenSentence}`;
  }

  return {
    coreQuestion: chosenSentence.trim(),
    fullText: cleaned,
    isCompound: true
  };
}

/**
 * BM25 / Ranked relevance search across thousands of lines & sections
 * Gives 3x boost to the closing core question so long preamble never dilutes results!
 */
export function findTopMatchingSections(query, chunks, maxSections = 3) {
  if (!chunks || chunks.length === 0) return [];
  const normalizedQuery = normalizeSpokenPhonetics(query);
  const qLower = normalizedQuery.toLowerCase();

  // Extract core closing question to prioritize what is actually being asked
  const { coreQuestion } = extractCoreQuestionFromSpeech(normalizedQuery);
  const coreLower = (coreQuestion || normalizedQuery).toLowerCase();
  const coreTokens = coreLower.split(/[^a-z0-9%$\-+]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const queryTokens = qLower.split(/[^a-z0-9%$\-+]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const chunkLower = chunk.text.toLowerCase();
    const titleLower = chunk.title.toLowerCase();

    // 1. Core question exact phrase match boost (+35)
    if (coreLower.length > 8 && chunkLower.includes(coreLower)) {
      score += 35;
    } else if (chunkLower.includes(qLower)) {
      score += 25;
    }

    // 2. Query words in Title: core tokens get +16, general preamble tokens get +6
    coreTokens.forEach(t => {
      if (titleLower.includes(t)) {
        score += 16;
      }
    });
    queryTokens.forEach(t => {
      if (!coreTokens.includes(t) && titleLower.includes(t)) {
        score += 6;
      }
    });

    // 3. Query words in Chunk Body: core tokens get +8, general preamble tokens get +3
    coreTokens.forEach(t => {
      if (chunk.wordTokens.has(t)) {
        score += 8;
      }
    });
    queryTokens.forEach(t => {
      if (!coreTokens.includes(t) && chunk.wordTokens.has(t)) {
        score += 3;
      }
    });

    // 4. Metric matches (e.g. searching for a number or label)
    chunk.metrics.forEach(m => {
      const mLabel = m.label.toLowerCase();
      const mVal = m.value.toLowerCase();
      if (coreLower.includes(mLabel) || coreLower.includes(mVal)) {
        score += 16;
      } else if (qLower.includes(mLabel) || qLower.includes(mVal)) {
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
 * using intelligent scenario matching and BM25 chunk retrieval across even huge amounts of notes!
 */
export function synthesizeLeaderAnswerForCustomQuestion(questionText, rawNotesText, executiveBrief, speakingStyle = {}) {
  const normalizedQuery = normalizeSpokenPhonetics(questionText);
  const qLower = normalizedQuery.toLowerCase();

  // Extract core closing question to avoid getting misled by opening preamble
  const { coreQuestion } = extractCoreQuestionFromSpeech(normalizedQuery);
  const coreLower = (coreQuestion || normalizedQuery).toLowerCase();
  const chunks = chunkLargeNotes(rawNotesText);
  const topSections = findTopMatchingSections(questionText, chunks, 3);
  const bestSection = topSections[0] || null;

  const metrics = executiveBrief?.importantNumbers || [];
  const guardrails = executiveBrief?.guardrails || [];
  const rememberItems = executiveBrief?.thingsToRemember || [];

  // =========================================================================
  // SMART INTERVIEW SCENARIO MATCHER (Crealytics / Performance Marketing)
  // Ensures long, compound, or conversational questions map to the exact verified answer
  // =========================================================================
  const textLower = (rawNotesText || "").toLowerCase();
  const isCrealyticsContext = textLower.includes("crealytics") ||
                             textLower.includes("torsten") ||
                             textLower.includes("kraftshala") ||
                             textLower.includes("sportskeeda") ||
                             textLower.includes("unleavables") ||
                             textLower.includes("homecrust");

  if (isCrealyticsContext) {
    const interviewScenarios = generateQuestionsFromNotes(rawNotesText, "crealytics-interview");
    let matchedScenario = null;

    // Check project & topic matches in order of specificity:

    // 1. Google Search Ads (CTR 5.20%->14.78%, CPC ₹5.33->₹4.21, 17/19 conversions)
    const isGoogleSearch = (coreLower.includes("google") || coreLower.includes("search ad") || coreLower.includes("search campaign") || coreLower.includes("negative keyword") || coreLower.includes("quality score") || coreLower.includes("cpc") || (coreLower.includes("ctr") && !coreLower.includes("meta") && !coreLower.includes("unleavables"))) ||
      (qLower.includes("google") || (qLower.includes("search") && qLower.includes("kraftshala")));
    if (isGoogleSearch) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q3");
    }

    // 2. Unleavables Meta Ads (Cost Cap vs Highest Volume, ₹91->₹29, 11.04% CTR)
    const isMetaUnleavables = !matchedScenario && (
      coreLower.includes("unleavables") || coreLower.includes("meta") || coreLower.includes("facebook") ||
      coreLower.includes("cost cap") || coreLower.includes("highest volume") || coreLower.includes("add to cart") ||
      qLower.includes("unleavables") || (qLower.includes("meta") && (qLower.includes("bidding") || qLower.includes("cap") || qLower.includes("apparel")))
    );
    if (isMetaUnleavables) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q4");
    }

    // 3. Homecrust Amazon PPC / Mistakes / Challenges / What went wrong
    const isAmazonHomecrust = !matchedScenario && (
      coreLower.includes("homecrust") || coreLower.includes("amazon") || coreLower.includes("acos") ||
      coreLower.includes("daypart") || coreLower.includes("173") ||
      coreLower.includes("didn't work") || coreLower.includes("didn't go") || coreLower.includes("went wrong") ||
      coreLower.includes("mistake") || coreLower.includes("failed") || coreLower.includes("failure") ||
      coreLower.includes("challenge") || coreLower.includes("not according to plan") || coreLower.includes("hardest campaign") ||
      qLower.includes("homecrust") || (qLower.includes("amazon") && qLower.includes("acos")) ||
      ((qLower.includes("mistake") || qLower.includes("went wrong") || qLower.includes("didn't go") || qLower.includes("not according to plan")) && !qLower.includes("google") && !qLower.includes("meta"))
    );
    if (isAmazonHomecrust) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q5");
    }

    // 4. Adaptability / Learning Quickly / NFL from Scratch
    const isAdaptability = !matchedScenario && (
      coreLower.includes("comfort zone") || coreLower.includes("new field") || coreLower.includes("new domain") ||
      coreLower.includes("learn quickly") || coreLower.includes("adapt") || coreLower.includes("unfamiliar") ||
      coreLower.includes("nfl") || coreLower.includes("football") || coreLower.includes("from scratch") ||
      qLower.includes("comfort zone") || qLower.includes("learn quickly") || qLower.includes("new domain") || qLower.includes("from scratch")
    );
    if (isAdaptability) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q6");
    }

    // 5. Why Crealytics / Culture Fit / Profitable Growth
    const isWhyCrealytics = !matchedScenario && (
      coreLower.includes("why crealytics") || coreLower.includes("why this role") || coreLower.includes("why us") ||
      coreLower.includes("profitable growth") || coreLower.includes("retail media") || coreLower.includes("what draws you") ||
      qLower.includes("why crealytics") || qLower.includes("why this role") || qLower.includes("why do you want to work")
    );
    if (isWhyCrealytics) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q2");
    }

    // 6. Questions for Interviewer (Torsten)
    const isQuestionsToAsk = !matchedScenario && (
      coreLower.includes("questions for me") || coreLower.includes("questions for us") || coreLower.includes("anything to ask") ||
      coreLower.includes("any questions for") || coreLower.includes("have any questions") ||
      qLower.includes("questions for me") || qLower.includes("questions for us") || qLower.includes("any questions for me")
    );
    if (isQuestionsToAsk) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q7");
    }

    // 7. Outside Interests / Books / Sci-Fi / AI Prototypes / Not on CV
    const isPersonalInterests = !matchedScenario && (
      coreLower.includes("outside work") || coreLower.includes("outside of work") || coreLower.includes("free time") ||
      coreLower.includes("books") || coreLower.includes("reading") || coreLower.includes("sci-fi") || coreLower.includes("science fiction") ||
      coreLower.includes("martian") || coreLower.includes("red rising") || coreLower.includes("gideon") ||
      coreLower.includes("hobbies") || coreLower.includes("painting") || coreLower.includes("swimming") ||
      coreLower.includes("prototype") || coreLower.includes("antigravity") || coreLower.includes("claude") ||
      coreLower.includes("personal project") || coreLower.includes("not on your cv") || coreLower.includes("isn't on your cv") ||
      coreLower.includes("something interesting about yourself") ||
      qLower.includes("outside of work") || qLower.includes("outside work") || qLower.includes("books") || qLower.includes("not on your cv") || qLower.includes("prototype")
    );
    if (isPersonalInterests) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q8");
    }

    // 8. Strengths & Weaknesses / Self-Awareness / Why Hire You
    const isStrengthsWeaknesses = !matchedScenario && (
      coreLower.includes("strength") || coreLower.includes("weakness") || coreLower.includes("greatest strength") ||
      coreLower.includes("biggest weakness") || coreLower.includes("area to improve") || coreLower.includes("working on improving") ||
      coreLower.includes("what are you working on") || coreLower.includes("why should we hire you") ||
      qLower.includes("strength") || qLower.includes("weakness") || qLower.includes("why should we hire you")
    );
    if (isStrengthsWeaknesses) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q9");
    }

    // 9. Commercial Judgment / Strategy / Scaling / CTR up but Conversions down
    const isCommercialJudgment = !matchedScenario && (
      coreLower.includes("scale") || coreLower.includes("scaling") || coreLower.includes("roas") ||
      coreLower.includes("high roas") || coreLower.includes("conversions decreased") || coreLower.includes("sales declining") ||
      coreLower.includes("ctr increased but") || coreLower.includes("ctr increasing but") || coreLower.includes("spend money but not") ||
      coreLower.includes("limited budget") || coreLower.includes("allocate budget") || coreLower.includes("worse roas") ||
      coreLower.includes("same conversion rate") || coreLower.includes("commercial judgment") ||
      qLower.includes("scale") || qLower.includes("roas") || qLower.includes("ctr increased but") || qLower.includes("limited budget")
    );
    if (isCommercialJudgment) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q10");
    }

    // 10. Dehradun / Remote Work & Distributed Teams
    const isDehradunRemote = !matchedScenario && (
      coreLower.includes("dehradun") || coreLower.includes("remote") || coreLower.includes("work from home") ||
      coreLower.includes("international team") || coreLower.includes("stay organised") || coreLower.includes("stay organized") ||
      coreLower.includes("prioritise competing") || coreLower.includes("competing deadlines") ||
      qLower.includes("dehradun") || qLower.includes("remote") || qLower.includes("international team")
    );
    if (isDehradunRemote) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q11");
    }

    // 11. Pressure / Constructive Feedback / Disagreement / Conflict / Difficult Situations
    const isBehaviouralPressure = !matchedScenario && (
      coreLower.includes("pressure") || coreLower.includes("criticism") || coreLower.includes("difficult feedback") ||
      coreLower.includes("disagree") || coreLower.includes("disagreement") || coreLower.includes("difficult stakeholder") ||
      coreLower.includes("conflict") || coreLower.includes("colleague") ||
      coreLower.includes("under pressure") || coreLower.includes("tight deadline") || coreLower.includes("constructive feedback") ||
      qLower.includes("pressure") || qLower.includes("feedback") || qLower.includes("disagree") || qLower.includes("stakeholder") || qLower.includes("conflict")
    );
    if (isBehaviouralPressure) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q12");
    }

    // 12. Candidate Story / Background / Tell me about yourself
    // (Only if it's NOT a specific project question!)
    const isCandidateStory = !matchedScenario && (
      coreLower.includes("yourself") || coreLower.includes("background") || coreLower.includes("journey") ||
      coreLower.includes("who are you") || coreLower.includes("sportskeeda") ||
      (coreLower.includes("tell me about") && !coreLower.includes("campaign") && !coreLower.includes("project") && !coreLower.includes("time when")) ||
      qLower.includes("tell me about yourself") || qLower.includes("tell us about yourself") || qLower.includes("walk me through your resume")
    );
    if (isCandidateStory) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q1");
    }

    if (matchedScenario) {
      return {
        ...matchedScenario,
        id: `matched-${Date.now()}`,
        question: questionText, // Keep user's exact spoken question for display!
        speaker: "Meeting Attendee",
        stuckRecovery: {
          ...matchedScenario.stuckRecovery,
          questionSummary: coreQuestion || questionText
        }
      };
    }
  }

  // Determine general intent category
  let category = "expected";
  let topic = bestSection?.title || "Meeting Inquiry";
  let babeTag = "babe 👀 executive answer";
  let isUnknown = false;

  // Check for personal, introductory, or high-level strategic overview questions
  const isIntro = (coreLower.includes("yourself") ||
                   coreLower.includes("who are you") ||
                   (coreLower.includes("background") && !coreLower.includes("campaign")) ||
                   coreLower.includes("introduce yourself")) &&
                  !coreLower.includes("project") &&
                  !coreLower.includes("metric") &&
                  !coreLower.includes("campaign");

  if (isIntro) {
    category = "intro";
    topic = "Executive Overview";
    babeTag = "babe 👀 curious learner & hands-on marketer";
    const glanceSay = "Sure, absolutely! To give you the high-level picture: I'm really passionate about the intersection of audience psychology and performance marketing data. I started out in editorial where I learned what captures attention, but I got genuinely obsessed with the numbers—why people click, what triggers conversions, and how bidding algorithms work. Across Google Search, Meta, and Amazon PPC, I love testing hypotheses and understanding the *why* behind campaign performance, and I'm eager to keep learning and building my fundamentals.";
    const expandedSay = "Sure, absolutely! To give you a complete picture: I started out in editorial where I learned how to engage audiences under tight deadlines, editing over 1,000 articles and writing 600+ pieces. But what truly pulled me into performance marketing was curiosity about human behavior and data—I wanted to measure what happens after the impression and understand how algorithmic systems optimize. At Kraftshala, I ran hands-on campaigns across Google Search, Meta Ads, and Amazon PPC, and I love tinkering with technology—I've built more than 5 AI web prototypes on the side. I'm someone who loves being a beginner, asks lots of questions, and gets genuinely excited to learn from smart practitioners.";
    return {
      id: `custom-${Date.now()}`,
      category,
      speaker: "Meeting Attendee",
      question: questionText,
      topic,
      babeTag,
      simplestQuestion: "They're asking for an introductory overview of your background, curiosity, and learning path.",
      glanceSay,
      glanceBullets: [
        "• Passionate about connecting audience psychology with quantitative data",
        "• Hands-on across Google Search, Meta Ads, and Amazon PPC",
        "• Continuous tinkerer: built 5+ functional AI web prototypes",
        "• Deep curiosity to understand *why* algorithms and audiences behave"
      ],
      expandedSay,
      supportingContext: "Executive introduction radiating curiosity and eager learning.",
      extraInformation: "Grounded in your profile, editorial roots, and passion for performance data.",
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
    const glanceSay = "I want to be precise and check the verified report rather than guess an off-the-cuff number—let me pull that up right after our call.";
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

  // Construct natural, conversational, human framing
  let opening = "In that project, the main focus was";
  if (coreLower.includes("why")) {
    opening = "The main reasoning behind that came down to";
    babeTag = "babe 👀 clear strategic rationale";
  } else if (coreLower.includes("what should") || coreLower.includes("recommend") || coreLower.includes("opinion") || coreLower.includes("next step")) {
    opening = "Looking at the numbers, what I recommend testing is";
    babeTag = "babe 👀 test-driven recommendation";
    category = "opinion";
  } else if (coreLower.includes("how") || coreLower.includes("status")) {
    opening = "To give you the direct picture on that:";
    babeTag = "babe 👀 direct performance update";
  } else if (coreLower.includes("risk") || coreLower.includes("delay") || coreLower.includes("concern") || coreLower.includes("problem") || coreLower.includes("mistake")) {
    opening = "That's a really fair question. In that project, our main takeaway was";
    babeTag = "babe 👀 honest reflection & learning";
    category = "reflective";
  }

  // Format core fact smoothly for natural speech
  let formattedFact = coreFact;
  if (formattedFact.endsWith('.')) formattedFact = formattedFact.slice(0, -1);
  const lowerFirstFact = formattedFact.length > 0
    ? formattedFact.charAt(0).toLowerCase() + formattedFact.slice(1)
    : formattedFact;

  // Build the Spoken Metric Clause
  let metricMention = "";
  if (relevantMetrics.length > 0) {
    metricMention = relevantMetrics.map(m => `${m.label} is at ${m.value}`).join(', and ');
  } else if (metrics.length > 0) {
    const topM = metrics[0];
    metricMention = `${topM.label} is currently at ${topM.value}`;
  }

  // Assemble Natural Spoken Answer (2-3 crisp, human sentences)
  const sentence1 = opening.endsWith(':')
    ? `${opening} ${formattedFact}.`
    : `${opening} ${lowerFirstFact}.`;
  const sentence2 = metricMention ? `Looking at the data, ${metricMention}. ` : '';
  const sentence3 = "The biggest takeaway was making sure we let real performance data guide our iterations rather than making assumptions.";
  const glanceSay = `${sentence1} ${sentence2}${sentence3}`;

  // Assemble Conversational 2-Paragraph Narrative
  const expandedSay = `To give you some background on how we set that up: ${formattedFact}. ${metricMention ? `Looking at the numbers, ${metricMention}, which gave us a really clear baseline to evaluate.` : ''}\n\nWhat that experience really reinforced for me was treating every campaign as an iterative test. By focusing on user intent and incrementality under the hood, we were able to protect unit economics and build rock-solid fundamentals.`;

  // Bullets
  const glanceBullets = [
    `• ${coreFact.slice(0, 50)}`,
    metricMention ? `• Data: ${metricMention.slice(0, 44)}` : `• Execution aligned with targets`,
    `• Key takeaway: test hypotheses and let data guide iterations`
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
      : `Strategic rationale: ${coreFact}.`,
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
        babeTag: "babe 👀 editorial to data: deeply curious, eager learner & hands-on",
        simplestQuestion: "Torsten wants to know who you are, what drives your curiosity, and how you got here.",
        startWithPrompt: "Start with: “I actually started out in editorial at Sportskeeda…”",
        glanceSay: "I actually started out in editorial at Sportskeeda, editing over 1,000 articles and then writing about 600 pieces covering the NFL. Working on daily deadlines taught me a ton about audience attention, but over time I found myself getting really drawn to the data side—why people click, what triggers conversions, and what the numbers reveal about user intent. That’s what pulled me into performance marketing at Kraftshala, where I ran hands-on campaigns across Google Search, Meta, and Amazon PPC. I also love building things—I've built five AI web prototypes on the side just to experiment with new tools. And what draws me to Crealytics is your focus on real, profitable growth and retail media tech. I'm really looking for an environment with high standards where I can ask questions, learn from great practitioners, and build strong fundamentals.",
        glanceBullets: [
          "• Sportskeeda: edited 1,000+ pieces, wrote 600+ NFL articles under daily deadlines",
          "• Curiosity pivot: fascinated by why people click and what drives conversions",
          "• Kraftshala hands-on: executed Google Search, Meta Ads, and Amazon PPC campaigns",
          "• Continuous builder: created 5+ functional AI web prototypes on the side",
          "• Excited for Crealytics: eager to learn from high standards and master retail media tech"
        ],
        expandedSay: "Hi Torsten, thanks so much for having me! To give you the journey, I started out on the editorial side at Sportskeeda. I spent about a year editing and fact-checking over a thousand articles with 20+ writers and managers, and then wrote over 600 articles covering NFL and college football. It was fast-paced, high-volume work—often 3,000 to 4,000 words a day—which really trained my instincts around audience psychology and hook copy.\n\nOver time, though, as I watched content perform, I found myself getting more and more fascinated by what was happening underneath the hood. I wanted to understand the data: why an audience clicked, what made someone convert, and how algorithms evaluate relevance. That curiosity pulled me into performance marketing at Kraftshala. I got hands-on running campaigns across Google Search, Meta, and Amazon PPC, testing bidding strategies and analyzing keyword search terms. I also love tinkering with new tools—I've built five AI web prototypes on the side just to see how technology can automate and enhance workflows.\n\nLooking at Crealytics, what really excites me is your focus on real, profitable growth and cutting-edge retail media tech. I'm really looking for an environment where people care about deep fundamentals, and where I can ask smart questions, learn from great practitioners, and grow into a master of the craft.",
        supportingContext: "Notes Part 1: Sportskeeda (1,000+ edited, 600+ written), Doon University (BA 2020, MA 2022), Kraftshala Launchpad, AI prototypes.",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Keep it friendly: Sportskeeda → Kraftshala → Crealytics.",
          questionSummary: "Tell me about yourself?",
          points: ["1,000+ edited, 600+ written", "Moved from writing to data at Kraftshala", "Crealytics profitable growth focus"],
          easySay: "I started in editorial editing 1,000+ articles, got drawn to the data behind audience behavior, and moved into performance marketing where I'm eager to keep learning.",
          stallSay: "I'd love to share the journey—it really started with my curiosity about audience behavior."
        }
      },
      {
        id: "crealytics-q2",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Why Crealytics specifically, and what draws you to this role?",
        topic: "Why Crealytics & Culture Fit",
        babeTag: "babe 👀 passionate about profitable growth, retail media tech & learning from the best",
        simplestQuestion: "Why Crealytics? Highlight your excitement about retail media, AI, and learning from high standards.",
        startWithPrompt: "Start with: “What really stands out to me about Crealytics is…”",
        glanceSay: "What really stands out to me about Crealytics is that you focus on real, profitable growth rather than getting distracted by vanity metrics. A lot of places just celebrate big impression spikes, but I care about whether advertising is genuinely profitable for the bottom line. Coming from writing, I have that intuition for audience messaging, but working in performance marketing made me realize how much of modern growth is algorithmic. Crealytics sits right at that intersection of retail media, data, and technology, which is exactly where I want to build my career. I'm looking for a team with high standards where I can learn from experienced practitioners every single day.",
        glanceBullets: [
          "• Profitable growth over vanity metrics (real bottom-line business impact)",
          "• Fascinated by the intersection of retail media, algorithms, and AI",
          "• Eager to bridge creative intuition with quantitative rigor",
          "• Thrives in a high-feedback learning culture with demanding standards"
        ],
        expandedSay: "What really draws me to Crealytics is your intersection of performance marketing, retail media, and technology. I'm at a stage in my career where I want to build deep, rock-solid fundamentals—not just learning how to push buttons in an ad manager, but understanding the underlying economics and algorithmic mechanisms.\n\nThe focus on profitable growth particularly resonated with me. So many agencies celebrate top-of-funnel clicks while ignoring incrementality and unit economics. Crealytics looks retailers in the eye and asks the harder question: is this advertising truly driving incremental margin for the business? That level of analytical honesty is exactly what I want to surround myself with.\n\nMy background in journalism taught me how to research thoroughly and communicate clearly, but working with performance data and building AI prototypes showed me that marketing is becoming deeply technical. Joining a team that builds its own retail media technology and uses AI to solve real client challenges feels like the ultimate environment to learn and contribute with high energy.",
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
        babeTag: "babe 👀 intent restructuring: CTR 5.2%→14.8%, CPC down 21%, curious about dropoffs",
        simplestQuestion: "Torsten wants to hear your numbers, what you learned from the test, and your curiosity on next steps.",
        startWithPrompt: "Start with: “In my Google Search project at Kraftshala, the biggest shift came when…”",
        glanceSay: "In my Google Search project at Kraftshala, the biggest shift came when we restructured our ad groups around search intent. Originally, our groups were casting too wide a net. Once we tightened the themes and sculpted out negative keywords, the results responded almost immediately: our CTR jumped from around 5% up to nearly 15%, and our CPC dropped 21% down to ₹4.21. We ended up hitting 17 out of our 19 planned conversions on a ₹777 spend. But what I actually spent the most time on afterwards was digging into why we missed those last two conversions—analyzing search term dropoffs was probably the best learning experience of the entire project.",
        glanceBullets: [
          "• 1,252 impressions and 185 clicks",
          "• CTR surged: 5.20% → 14.78% via intent-based ad groups",
          "• CPC dropped 21%: ₹5.33 → ₹4.21 through negative keyword sculpting",
          "• 17 of 19 conversions achieved on ₹777 spend (₹800 budget)",
          "• Analyzed search terms to understand the 2 unachieved conversions"
        ],
        expandedSay: "In that Google Search project at Kraftshala, we started with 1,252 impressions and 185 clicks, but our initial structure was simply too broad. I wanted to see if tightening query intent would dramatically shift ad relevance and efficiency.\n\nWe restructured the campaign into tight, intent-based ad groups, focused on high-performing geographic clusters, and rigorously added negative keywords to eliminate wasted spend. The impact in the data was immediate: our CTR surged from 5.20% to 14.78%, while CPC dropped from ₹5.33 down to ₹4.21—a 21% reduction in cost per click. We achieved 17 of our 19 planned conversions within ₹777 against an ₹800 budget.\n\nWhat I appreciated most about that project was what came afterwards. Rather than just celebrating the CTR jump, I was really interested in understanding the two conversions we missed. I dug into search term reports and landing page dropoffs to see where user intent broke down. That habit of digging underneath the top-line numbers to understand user behavior is what I love most about performance marketing.",
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
        babeTag: "babe 👀 bidding tests: Cost Cap beat Highest Volume, ₹91→₹29, 11.04% CTR",
        simplestQuestion: "What did you test on Meta, what did the data show, and what was your takeaway on bidding algorithms?",
        startWithPrompt: "Start with: “For Unleavables, we ran a direct test between bidding strategies…”",
        glanceSay: "For Unleavables, which was a custom apparel brand, we ran a direct head-to-head test between Meta's default Highest Volume bidding and Cost Cap. Meta usually pushes you toward Highest Volume, but we wanted to see if setting cost guardrails would protect margins. And during our test, Cost Cap drove our cost per add-to-cart down from ₹91 all the way to ₹29, with an 11% CTR and 15 add-to-carts, ending at a ₹54.52 blended benchmark. It was a great lesson in questioning platform defaults, and it really got me interested in how bidding algorithms work under the hood.",
        glanceBullets: [
          "• Head-to-head experiment: Cost Cap vs Highest Volume bidding",
          "• Cost per add-to-cart dropped: ₹91 → ₹29 during test period",
          "• High engagement: 11.04% overall CTR with 15 add-to-carts",
          "• Blended benchmark: ₹54.52 across full campaign lifecycle",
          "• Key learning: question platform defaults and test algorithms against real margins"
        ],
        expandedSay: "For Unleavables, a direct-to-consumer custom apparel brand, I worked on audience segmentation, competitor research, and creative hooks. But the most interesting part of the project was running an experiment on bidding strategies.\n\nMeta defaults to Highest Volume, which optimizes purely for conversion volume without respecting cost volatility. I wanted to test whether setting an explicit Cost Cap would force the algorithm to bid more selectively and protect client margins. During our test, Cost Cap was significantly more efficient, driving cost per add-to-cart down from ₹91 to ₹29. The campaign achieved an overall 11.04% CTR and 15 add-to-carts, with a blended benchmark of ₹54.52.\n\nThat test really taught me not to accept platform automation blindly. Algorithms are powerful, but you have to understand their incentives and design smart guardrails. It made me really eager to learn how enterprise retail media tools manage bidding and pacing at scale.",
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
        babeTag: "babe 👀 conversion puzzles: clicks +40%, but ACoS was 173%",
        simplestQuestion: "Be candid about what didn't work and what you learned about full-funnel conversion readiness.",
        startWithPrompt: "Start with: “I actually really appreciate this question, because that campaign…”",
        glanceSay: "I actually really appreciate this question because that campaign was probably my most valuable learning experience. On paper, our traffic metrics looked great—impressions grew, clicks jumped 40% from 45 to 63, and CTR improved to about 1%. But our conversion rate dropped to 1.58%, which pushed ACoS up to 173%. Seeing that contrast was a huge reality check. It taught me that clicks don't mean anything if the listing itself isn't ready to convert. It made me want to look into product page friction, pricing, and review sentiment—and that kind of full-funnel problem solving is something I'm really excited to dive deeper into.",
        glanceBullets: [
          "• Traffic surged: impressions +5% (5,955), clicks +40% (45 → 63), CTR 0.80% → 1.06%",
          "• Conversion challenge: rate dipped 2.20% → 1.58%, ACoS rose to 173.59%",
          "• Honest realization: traffic without listing readiness just burns budget",
          "• Key learning: analyze product page friction, pricing elasticity, and negative targeting"
        ],
        expandedSay: "I worked on an Amazon Sponsored Products campaign for Homecrust, a home and kitchen brand, optimizing a ₹700 budget using negative targeting, placement adjustments, and about nine hours of dayparting. Looking strictly at traffic, the campaign seemed like a win: impressions grew from 5,681 to 5,955, clicks jumped 40% from 45 to 63, and CTR rose from 0.80% to 1.06%, bringing in ₹857 in sales.\n\nHowever, our conversion rate dropped from 2.20% down to 1.58%, which drove our ACoS from 155% up to 173.59%. And that discrepancy was by far the best lesson of my training. It forced me to look beyond the ads dashboard: why did people click our ad but refuse to purchase? Was the price point uncompetitive? Was the product listing lacking reviews or clear imagery? Were our keywords attracting browsing intent rather than buying intent?\n\nIt taught me that PPC doesn't operate in a silo—it's deeply tied to product listings, pricing, and buyer psychology. I loved having to confront that reality, and it gave me a much more holistic, commercially grounded perspective on retail media.",
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
        babeTag: "babe 👀 loves being a beginner: 600+ NFL articles from scratch, eager to research",
        simplestQuestion: "Share how you learned American football writing from scratch and why you love tackling new domains.",
        startWithPrompt: "Start with: “When I was first asked to write about the NFL at Sportskeeda, honestly…”",
        glanceSay: "When I was first asked to cover the NFL at Sportskeeda, I honestly knew almost nothing about American football! It was definitely intimidating at first, but I actually enjoy starting as a beginner. I turned it into a full research project: studied playbooks, watched game film, read beat writers, and asked our senior editors for critical feedback on every single draft. Over time, I ended up writing over 600 published articles. That experience gave me a lot of confidence that when I'm faced with an unfamiliar domain—whether it's a new ad platform, an attribution model, or an AI tool—I know how to roll up my sleeves, ask the right questions, and build real expertise from the ground up.",
        glanceBullets: [
          "• Embraced being a beginner with zero prior American football knowledge",
          "• Deep immersion: researched playbooks, film, and terminology daily",
          "• Welcomed feedback: iterated constantly with senior editors",
          "• 600+ articles published with strong readership and organic SEO",
          "• Growth mindset: genuinely excited to explore and conquer unfamiliar topics"
        ],
        expandedSay: "A defining experience for me was transitioning into NFL and college football writing at Sportskeeda with zero prior background in the sport. I had to learn the terminology, understand complex defensive schemes, and research players and teams fast enough to publish accurate, high-velocity articles on daily publishing cycles.\n\nInstead of being intimidated, I leaned into the learning curve. I spent hours reading beat writers, watching film, studying analytics, and actively asking senior editors for feedback so I could calibrate my writing. Over time, I went on to write over 600 published articles. What that experience really taught me is that I enjoy the process of being a beginner and figuring things out.\n\nIt taught me how to ask the right questions, how to synthesize complex information quickly, and how to stay humble while building expertise. That's the exact same curiosity and learning stamina I bring into performance marketing—whenever there's a new platform update, attribution model, or AI tool, I can't wait to roll up my sleeves and understand how it works.",
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
        babeTag: "babe 👀 thoughtful questions on mentorship, ramp-up & learning curve",
        simplestQuestion: "Ask thoughtful questions about 3-6 month ramp-up, team collaboration, and mentorship.",
        startWithPrompt: "Start with: “I do, Torsten, thank you! I'm really curious about…”",
        glanceSay: "I do, Torsten, thank you! First, for an associate joining the team, what does a great first three to six months look like, and how is the ramp-up structured? Second, because Crealytics does so much around retail media tech and AI, how do associates work with senior team members to build strong algorithmic intuition? And third, what’s a recent campaign or client challenge that the team really enjoyed solving together?",
        glanceBullets: [
          "• 1. What does the ramp-up and learning curve look like in the first 3–6 months?",
          "• 2. How do associates collaborate with senior teams to build algorithmic intuition?",
          "• 3. What is a recent client challenge that the team really enjoyed solving?",
          "• 4. What surprised you most about the culture when you joined Crealytics?"
        ],
        expandedSay: "Yes, thank you Torsten, I do have a few questions! I'm really curious about the development path here. First, what does success look like for someone joining as a Performance Marketing Associate in their first three to six months? Second, given Crealytics' strong focus on retail media technology and AI, how is mentorship structured to help associates build deep intuition around bidding algorithms and incrementality? And third, what is a recent campaign or client challenge that really pushed the team to think outside the box and made everyone excited to solve it?",
        supportingContext: "Notes Part 7: Questions to Ask Torsten (success in 3-6 months, PPC development, team structure, next steps).",
        stuckRecovery: {
          breatheMsg: "Ask about 3-6 month success and learning PPC.",
          questionSummary: "Questions to ask Torsten?",
          points: ["3-6 month success definition", "How Crealytics trains PPC & AI", "Next steps in interview"],
          easySay: "What would success look like in the first 3 to 6 months, and how does Crealytics support associates in developing deep PPC expertise?",
          stallSay: "I have a few questions about the role and team structure."
        }
      },
      {
        id: "crealytics-q8",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me something about yourself that isn't on your CV — your outside interests and personal projects.",
        topic: "Outside Interests, Books & AI Prototypes",
        babeTag: "babe 👀 sci-fi books, painting & building AI prototypes",
        simplestQuestion: "Share your love for sci-fi books, creative hobbies, and building AI prototypes with Antigravity & Claude.",
        startWithPrompt: "Start with: “Outside of my resume, I'm someone who loves exploring how systems work…”",
        glanceSay: "Outside of my resume, I'm a huge sci-fi and fantasy reader—books like The Martian and Red Rising—mostly because I love seeing characters tackle complex problems when things go sideways. I also love painting and swimming, and recently I've been experimenting with AI tools like Antigravity and Claude to build small web apps. I actually built a productivity tool and had six friends test it, and they told me it was way too complicated and clunky! It was a great reality check that taught me never to confuse effort with effectiveness. If there's friction for the user, extra features don't matter—and that mindset is something I think about a lot in marketing too.",
        glanceBullets: [
          "• Sci-fi & fantasy enthusiast (The Martian, Red Rising) fascinated by problem-solving",
          "• Creative outside work: love painting, swimming, and being outdoors",
          "• Built functional web prototypes using Antigravity and Claude",
          "• Tested productivity app with 6 friends; learned to avoid feature creep and user friction",
          "• Core takeaway: never confuse effort with effectiveness; let real user feedback guide iterations"
        ],
        expandedSay: "Outside of my resume, I'd say I'm someone with a natural curiosity for how systems and human psychology connect. I'm a big reader of sci-fi and fantasy—I love The Martian, Red Rising, Ninth House, and The Raven Boys. What draws me to those stories is seeing how characters navigate unfamiliar worlds, test hypotheses, and adapt when things go wrong.\n\nOn the creative side, I enjoy painting and swimming, but recently I've also been building small functional web apps using AI tools like Antigravity and Claude. I love taking an idea and turning it into something interactive. For example, I built a productivity tool and shared it with six friends. They were very honest and told me it felt complicated and clunky! While I wanted them to love it, it was such an eye-opening lesson: an idea can make total sense to the creator but still create friction for the user. It taught me not to confuse effort with effectiveness—whether in product design or marketing campaigns, you have to prioritize the user's experience and let real feedback guide your iterations.",
        supportingContext: "Notes Section 7: Personal Interview Notes (sci-fi books, painting, AI prototypes with Antigravity & Claude, 6 friends test feedback).",
        stuckRecovery: {
          breatheMsg: "Sci-fi books + AI prototypes + 6 friends feedback lesson. Keep it warm and grounded!",
          questionSummary: "What's not on your CV?",
          points: ["Sci-fi enthusiast (The Martian, Red Rising)", "Built web prototypes with Antigravity & Claude", "Tested with 6 friends: don't confuse effort with effectiveness"],
          easySay: "I'm a huge sci-fi reader and love building AI app prototypes on the side—recently tested one with 6 friends, which taught me to never confuse effort with effectiveness.",
          stallSay: "I'd love to share that—outside of work, I'm really curious about systems, books, and experimenting with tech."
        }
      },
      {
        id: "crealytics-q9",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "What are your greatest strengths, and what is an area you're actively working to improve?",
        topic: "Strengths, Weaknesses & Self-Awareness",
        babeTag: "babe 👀 research rigor & editorial discipline + balancing thoroughness with action",
        simplestQuestion: "Detail, research, and communication as strengths; wanting 100% data before acting as the weakness you're actively balancing.",
        startWithPrompt: "Start with: “My biggest strengths are attention to detail, research rigor, and clear communication…”",
        glanceSay: "My biggest strengths are attention to detail, research rigor, and clear communication. From editing over a thousand articles under tight deadlines, I'm very used to checking numbers and catching small discrepancies. In marketing, that means I don't just glance at data—I look for anomalies. On the flip side, because I care so much about accuracy, my instinct in an unfamiliar situation can be to want 100% of the information before taking action. I've been learning to balance that by defining the critical unknowns, running small controlled tests, and letting real data give me the answers rather than over-analyzing.",
        glanceBullets: [
          "• Strengths: attention to detail, research rigor, and clear cross-team communication",
          "• Track record: 1,000+ articles edited/fact-checked, 600+ written, 20+ writers/managers coordinated",
          "• Genuine weakness: tendency to over-analyze before acting in unfamiliar scenarios",
          "• Active solution: balance accuracy with action by running small, measurable tests"
        ],
        expandedSay: "My three biggest strengths are attention to detail, research rigor, and structured communication. Having edited and fact-checked over a thousand articles and written 600+ pieces while coordinating with 20+ writers and managers, I'm used to high-volume accuracy under deadline pressure. In performance marketing, small details make or break campaigns—whether it's negative keywords, tracking pixels, or budget pacing.\n\nAs for a weakness I'm actively working on: because I love accuracy, when I face a completely unfamiliar domain, my instinct can be to want 100% of the information before taking a step. But marketing moves fast, and you rarely have perfect data. So I've trained myself to balance thoroughness with action: figure out the critical must-haves, formulate a clear hypothesis, launch a small controlled test, and let the real data give me the answers.",
        supportingContext: "Notes Section 3: Strengths (detail, research, communication, 1000+ edited) and Weakness (balancing accuracy with taking action).",
        stuckRecovery: {
          breatheMsg: "Strengths: 1,000+ edited, attention to detail. Weakness: balancing accuracy with quick action.",
          questionSummary: "Strengths and weaknesses?",
          points: ["Strengths: detail, research, communication", "1,000+ edited, 600+ written", "Weakness: over-analyzing before acting; solved by testing small"],
          easySay: "My strengths are detail and research rigor from editing 1,000+ articles; my weakness was wanting too much data before moving, which I balance by testing small and iterating.",
          stallSay: "I've thought a lot about this balance between my strengths and where I want to grow."
        }
      },
      {
        id: "crealytics-q10",
        category: "opinion",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "How do you apply commercial judgment — for instance, if CTR improves but conversions fall, or if a campaign has high ROAS but low volume?",
        topic: "Commercial Judgment & Full-Funnel Thinking",
        babeTag: "babe 👀 full-funnel economics: never scale blindly, isolate intent & conversion leakage",
        simplestQuestion: "Look beyond vanity metrics: high ROAS doesn't guarantee incremental return; CTR up + conversions down means diagnosing funnel friction.",
        startWithPrompt: "Start with: “I always look at metrics in context rather than celebrating one in isolation…”",
        glanceSay: "I always look at metrics in context rather than celebrating one in isolation. If CTR is surging but conversions are dropping, that's a clear signal of friction—either our search terms are attracting low-intent clicks, or the landing page isn't delivering on the ad's hook. Similarly, if a campaign has a high ROAS on low spend, I wouldn't scale budget aggressively right away. High ROAS on small budgets often reflects low-hanging fruit. I'd look at marginal returns, audience headroom, and margins, and scale up in controlled steps to protect profitability.",
        glanceBullets: [
          "• Metrics in context: high CTR alone does not equal profitability",
          "• Diagnosing conversion drop: search query intent drift, landing page mismatch, or tracking bugs",
          "• High ROAS low volume: check diminishing marginal returns and available demand headroom",
          "• Incremental testing: scale budgets gradually while protecting bottom-line client margins"
        ],
        expandedSay: "My core rule in performance marketing is that no metric exists in a vacuum. If CTR is surging but conversions or revenue are dropping, that's a classic signal of funnel disconnect. I'd examine whether expanded keywords brought low-intent tire-kickers, whether the landing page failed to deliver on the ad's creative hook, or whether there's a technical checkout or tracking issue.\n\nOn the other hand, if a campaign shows a great ROAS on low volume, I never assume it will maintain that return at scale. Platform algorithms naturally harvest the lowest-hanging fruit first. If you dump budget in, marginal ROAS often compresses. I'd examine available search volume, competitive auction dynamics, and product margins, and increase budget in calibrated increments so we don't destroy profitability.",
        supportingContext: "Notes Section 6: Commercial Judgment (high ROAS low volume scaling, revenue vs ROAS, CTR up conversions down).",
        stuckRecovery: {
          breatheMsg: "Never scale blindly. High CTR != profit. Check search intent & landing page.",
          questionSummary: "Commercial judgment / CTR up conversions down?",
          points: ["Look at metrics together", "CTR up + conversions down = funnel friction", "High ROAS: check marginal returns before scaling"],
          easySay: "I look at metrics together—high CTR with falling conversions means investigating search intent and landing page friction, while high ROAS requires checking marginal returns before scaling.",
          stallSay: "I think that highlights one of the most important lessons in performance marketing."
        }
      },
      {
        id: "crealytics-q11",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about living in Dehradun, and how you stay organized and collaborate in remote or international teams.",
        topic: "Dehradun, Remote Work & Global Collaboration",
        babeTag: "babe 👀 hometown balance + proven remote discipline across distributed teams",
        simplestQuestion: "Dehradun offers nature + education; remote work lets local talent create global impact; stay organized through clear communication and routines.",
        startWithPrompt: "Start with: “I'm from Dehradun, and what I love about it is…”",
        glanceSay: "I'm from Dehradun, and what I love about it is the balance between great schools, city life, and being surrounded by nature. What's exciting today is that remote work lets people from cities like Dehradun contribute to global teams without having to relocate. In terms of staying organized, I've worked in distributed setups for a long time at Sportskeeda, producing content for US audiences with over 20 writers and managers. My approach is to keep written documentation clean, communicate proactively, and have clear daily routines so everyone knows where things stand.",
        glanceBullets: [
          "• Dehradun: educational hub with a grounded balance of nature and urban growth",
          "• Remote work vision: enables regional talent to connect with global opportunities",
          "• Distributed experience: Sportskeeda US sports content with 20+ writers and managers",
          "• Remote habits: clear written documentation, proactive communication, and disciplined daily check-ins"
        ],
        expandedSay: "I grew up in Dehradun, which has always been known as an educational hub with great schools and universities, surrounded by nature. What's great about remote work now is how it's leveling the playing field. Ambitious people don't necessarily have to move to a tier-one metro to work on global, cutting-edge problems—companies can tap into disciplined talent anywhere.\n\nBecause I worked at Sportskeeda covering US sports with distributed teams, remote collaboration feels completely natural to me. I understand the importance of proactive communication, respecting time zones, maintaining structured reporting routines, and never letting assumptions fester. If something needs clarification, I ask early, document the decisions, and ensure the team can rely on me to deliver without constant supervision.",
        supportingContext: "Notes Section 7: Dehradun perspective, remote work, international team collaboration.",
        stuckRecovery: {
          breatheMsg: "Dehradun: nature + education. Remote work: Sportskeeda US audience, disciplined communication.",
          questionSummary: "Dehradun and remote work?",
          points: ["Dehradun: educational hub & nature", "Remote work connects local talent globally", "Proven discipline at Sportskeeda with 20+ writers"],
          easySay: "Dehradun offers a great balance of education and nature, and remote work lets talent here build global careers. At Sportskeeda, I collaborated across distributed teams with clear routines and communication.",
          stallSay: "I really love talking about Dehradun and how remote work has opened up new possibilities."
        }
      },
      {
        id: "crealytics-q12",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about a time you made a mistake, received constructive feedback, or worked under intense pressure.",
        topic: "Mistakes, Constructive Feedback & Pressure",
        babeTag: "babe 👀 separates effort from effectiveness, welcomes feedback as free coaching",
        simplestQuestion: "Editorial deadlines under pressure; welcoming constructive feedback to improve; Homecrust ACoS as an honest learning puzzle.",
        startWithPrompt: "Start with: “Working in sports journalism made deadlines and feedback…”",
        glanceSay: "Working in sports journalism made deadlines and feedback a completely normal part of everyday life. On game days, breaking news had to be published fast, but factual accuracy was non-negotiable. I had to coordinate with multiple writers and fact-check stats in real time. It also taught me not to take feedback personally. When an editor or manager points out a flaw in my work or an assumption in a campaign, I see it as free coaching. I just want to understand the reasoning, fix the root cause, and get sharper.",
        glanceBullets: [
          "• Pressure at Sportskeeda: high-velocity publishing where speed and accuracy had to coexist",
          "• Organized under stress: systematic fact-checking and prioritized workflows",
          "• Constructive feedback mindset: never confuse effort with effectiveness",
          "• Growth attitude: treat critical feedback as free coaching to upgrade skills"
        ],
        expandedSay: "Working in sports journalism was a masterclass in pressure and feedback. During NFL game days and breaking news cycles, we had strict deadlines and zero margin for factual errors. I had to coordinate with multiple writers and editors, prioritize breaking stories, and fact-check names, stats, and quotes in real time. It taught me that staying calm and organized is far more productive than frantic rushing.\n\nIt also gave me very thick skin around feedback. In editing, revisions are routine—your work is constantly critiqued for clarity, hook quality, and style adherence. I learned that feedback is never personal; the question isn't 'why didn't they like what I made?', but 'where did this fall short of the objective and how do we improve it?' In performance marketing, when data or a manager reveals an underperforming ad or flawed assumption—like our Homecrust Amazon ACoS—I lean into it. I'd rather confront the data honestly, understand why it happened, and fix the process.",
        supportingContext: "Notes Section 5: Working under pressure, constructive criticism, mistake accountability.",
        stuckRecovery: {
          breatheMsg: "Sportskeeda pressure: accuracy + speed. Feedback: never confuse effort with effectiveness.",
          questionSummary: "Pressure, feedback, or mistakes?",
          points: ["Sportskeeda publishing pressure", "Feedback is free coaching to improve", "Never confuse effort with effectiveness"],
          easySay: "Sportskeeda taught me to deliver accurate work under tight deadlines, and editorial revisions trained me to welcome constructive feedback without taking it personally.",
          stallSay: "My background in editorial work actually shaped how I handle both pressure and feedback."
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
