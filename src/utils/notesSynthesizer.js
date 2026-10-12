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
      /\bnfl\b/i.test(coreLower) || coreLower.includes("football") || coreLower.includes("from scratch") ||
      qLower.includes("comfort zone") || qLower.includes("learn quickly") || qLower.includes("new domain") || qLower.includes("from scratch")
    );
    if (isAdaptability) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q6");
    }

    // 5. Why Crealytics / Culture Fit / Profitable Growth / Good Fit / CLV / iCLV / Sharpen the Saw
    const isWhyCrealytics = !matchedScenario && (
      coreLower.includes("why crealytics") || coreLower.includes("why this role") || coreLower.includes("why us") ||
      coreLower.includes("profitable growth") || coreLower.includes("retail media") || coreLower.includes("what draws you") ||
      coreLower.includes("good fit") || coreLower.includes("why you") || coreLower.includes("why should we hire") ||
      coreLower.includes("fit for") || coreLower.includes("why do you want") ||
      coreLower.includes("clv") || coreLower.includes("iclv") || coreLower.includes("lifetime value") ||
      coreLower.includes("sharpen the saw") || coreLower.includes("status quo") || coreLower.includes("cliché") ||
      qLower.includes("why crealytics") || qLower.includes("why this role") || qLower.includes("why do you want to work") ||
      qLower.includes("good fit") || qLower.includes("why should we hire") || qLower.includes("fit for this role") ||
      qLower.includes("clv") || qLower.includes("iclv") || qLower.includes("sharpen the saw")
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

    // 6.5. Scrimba Certificate, Cursor AI, Claude Code & Model Context Protocol (MCP)
    const isAiCertificateMcp = !matchedScenario && (
      coreLower.includes("scrimba") || coreLower.includes("certificate") || coreLower.includes("cursor") ||
      coreLower.includes("mcp") || coreLower.includes("model context protocol") || coreLower.includes("claude code") ||
      coreLower.includes("ai agent") || coreLower.includes("ai agents") ||
      qLower.includes("scrimba") || qLower.includes("certificate") || qLower.includes("cursor") || qLower.includes("mcp") || qLower.includes("model context protocol")
    );
    if (isAiCertificateMcp) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q18");
    }

    // 6.6. Are you a developer? / Why learn outside marketing?
    const isAreYouDeveloper = !matchedScenario && (
      coreLower.includes("are you a developer") || coreLower.includes("software developer") || coreLower.includes("outside marketing") ||
      coreLower.includes("why learn coding") || coreLower.includes("why learn to code") || coreLower.includes("why learn code") ||
      qLower.includes("are you a developer") || qLower.includes("outside marketing") || qLower.includes("why learn coding")
    );
    if (isAreYouDeveloper) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q17");
    }

    // 6.7. Applying AI to Performance Marketing
    const isAiInMarketing = !matchedScenario && (
      coreLower.includes("apply ai") || coreLower.includes("use ai in") || coreLower.includes("ai to performance") ||
      coreLower.includes("ai in performance") || coreLower.includes("ai in marketing") || coreLower.includes("ai for marketing") ||
      coreLower.includes("how would you use ai") || coreLower.includes("ai ad copy") || coreLower.includes("ai reporting") ||
      qLower.includes("apply ai") || qLower.includes("use ai in performance") || qLower.includes("how would you use ai") || qLower.includes("ai in marketing")
    );
    if (isAiInMarketing) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q16");
    }

    // 6.8. The Spare Room Productivity App / Calendar App
    const isSpareRoomApp = !matchedScenario && (
      coreLower.includes("spare room") || coreLower.includes("calendar app") || coreLower.includes("productivity app") ||
      coreLower.includes("to-do app") || coreLower.includes("therapy session") || coreLower.includes("app you built") ||
      coreLower.includes("app you made") || coreLower.includes("app concept") || coreLower.includes("personal app") ||
      qLower.includes("spare room") || qLower.includes("calendar app") || qLower.includes("productivity app") || qLower.includes("app you built")
    );
    if (isSpareRoomApp) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q14");
    }

    // 6.9. Gaming Projects in Roblox Studio
    const isGamingProjects = !matchedScenario && (
      coreLower.includes("game") || coreLower.includes("gaming") || coreLower.includes("roblox") ||
      coreLower.includes("cosy") || coreLower.includes("mystery game") || coreLower.includes("supernatural") ||
      qLower.includes("game") || qLower.includes("gaming") || qLower.includes("roblox")
    );
    if (isGamingProjects) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q15");
    }

    // 6.10. Vibe Coding (What is vibe coding, how you use it)
    const isVibeCoding = !matchedScenario && (
      coreLower.includes("vibe coding") || coreLower.includes("vibe code") || coreLower.includes("what is vibe") ||
      qLower.includes("vibe coding") || qLower.includes("vibe code")
    );
    if (isVibeCoding) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q13");
    }

    // 7.1. Favourite Books / Reading Deep Dive (Sanderson, Stormlight, Night Circus, Cerulean Sea)
    const isBooksReading = !matchedScenario && (
      coreLower.includes("favorite book") || coreLower.includes("favourite book") ||
      coreLower.includes("favorite books") || coreLower.includes("favourite books") ||
      coreLower.includes("what do you read") || coreLower.includes("what kind of books") ||
      coreLower.includes("what books") || coreLower.includes("stormlight") || coreLower.includes("sanderson") ||
      coreLower.includes("night circus") || coreLower.includes("cerulean sea") || coreLower.includes("what are you reading") ||
      coreLower.includes("reading habits") || coreLower.includes("fictional characters") ||
      qLower.includes("favorite book") || qLower.includes("favourite book") || qLower.includes("favorite books") ||
      qLower.includes("favourite books") || qLower.includes("what do you read") || qLower.includes("what kind of books") ||
      qLower.includes("what books") || qLower.includes("reading")
    );
    if (isBooksReading) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q23");
    }

    // 7.2. Outside Interests / Not on CV / Rabbit-Hole Curiosity
    const isPersonalInterests = !matchedScenario && (
      coreLower.includes("not on your cv") || coreLower.includes("isn't on your cv") || coreLower.includes("not in your cv") ||
      coreLower.includes("outside work") || coreLower.includes("outside of work") || coreLower.includes("free time") ||
      coreLower.includes("rabbit hole") || coreLower.includes("curious about") || coreLower.includes("curiosity") ||
      coreLower.includes("hobbies") || coreLower.includes("something interesting about yourself") ||
      qLower.includes("not on your cv") || qLower.includes("isn't on your cv") || qLower.includes("outside of work") || qLower.includes("outside work")
    );
    if (isPersonalInterests) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q8");
    }

    // 7.3. Good Teammate / Teamwork / Collaboration Philosophy
    const isTeammateCollaboration = !matchedScenario && (
      coreLower.includes("good teammate") || coreLower.includes("great teammate") || coreLower.includes("teamwork") ||
      coreLower.includes("collaboration") || coreLower.includes("work in a team") || coreLower.includes("team player") ||
      coreLower.includes("collaborate") || coreLower.includes("working with others") || coreLower.includes("working with a team") ||
      coreLower.includes("team dynamic") || coreLower.includes("team member") ||
      qLower.includes("good teammate") || qLower.includes("teamwork") || qLower.includes("collaboration") ||
      qLower.includes("what makes someone a good teammate") || qLower.includes("how do you collaborate")
    );
    if (isTeammateCollaboration) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q21");
    }

    // 7.4. Handling Disagreements with Colleagues (Interpersonal / Differing Views)
    const isDisagreementsColleagues = !matchedScenario && (
      coreLower.includes("disagreement") || coreLower.includes("disagree with") || coreLower.includes("disagreements") ||
      coreLower.includes("differing opinion") || coreLower.includes("differing opinions") || coreLower.includes("difference of opinion") ||
      coreLower.includes("disagree with colleagues") || coreLower.includes("disagree with colleague") ||
      (coreLower.includes("disagree") && !coreLower.includes("agree to disagree")) ||
      qLower.includes("disagreement") || qLower.includes("disagree with colleagues") || qLower.includes("differing opinions") ||
      qLower.includes("how do you handle disagreements") || qLower.includes("disagreements with colleagues")
    );
    if (isDisagreementsColleagues) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q22");
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

    // 8.5. Trust, Reliability & Hard Work (Can we trust you / Why should we believe you / Hardworking)
    const isTrustReliability = !matchedScenario && (
      coreLower.includes("trust you") || coreLower.includes("trust that") || coreLower.includes("believe you") ||
      coreLower.includes("hardworking") || coreLower.includes("hard-working") || coreLower.includes("hard working") ||
      coreLower.includes("reliable") || coreLower.includes("reliability") || coreLower.includes("good job for us") ||
      coreLower.includes("ownership") || coreLower.includes("earn that trust") || coreLower.includes("earn trust") ||
      qLower.includes("trust you") || qLower.includes("believe you") || qLower.includes("hardworking") ||
      qLower.includes("hard-working") || qLower.includes("reliable") || qLower.includes("good job for us") ||
      (qLower.includes("trust") && !qLower.includes("antitrust"))
    );
    if (isTrustReliability) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q20");
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
      qLower.includes("dehradun") || qLower.includes("remote") || qLower.includes("international team")
    );
    if (isDehradunRemote) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q11");
    }

    // 10.5. Conflict / Competing Priorities / Competing Deadlines
    const isConflictPriorities = !matchedScenario && (
      coreLower.includes("conflict") || coreLower.includes("competing priority") || coreLower.includes("competing priorities") ||
      coreLower.includes("competing deadline") || coreLower.includes("competing deadlines") || coreLower.includes("prioritise competing") ||
      coreLower.includes("prioritize competing") || coreLower.includes("trade-off") || coreLower.includes("trade off") ||
      (coreLower.includes("performance drop") && (coreLower.includes("report") || coreLower.includes("urgent"))) ||
      qLower.includes("conflict") || qLower.includes("competing priorities") || qLower.includes("competing deadlines") ||
      qLower.includes("competing priority") || qLower.includes("competing deadline") ||
      (qLower.includes("performance drop") && qLower.includes("report"))
    );
    if (isConflictPriorities) {
      matchedScenario = interviewScenarios.find(s => s.id === "crealytics-q19");
    }

    // 11. Pressure / Constructive Feedback / Disagreement / Difficult Situations
    const isBehaviouralPressure = !matchedScenario && (
      coreLower.includes("pressure") || coreLower.includes("criticism") || coreLower.includes("difficult feedback") ||
      coreLower.includes("disagree") || coreLower.includes("disagreement") || coreLower.includes("difficult stakeholder") ||
      coreLower.includes("colleague") ||
      coreLower.includes("under pressure") || coreLower.includes("tight deadline") || coreLower.includes("constructive feedback") ||
      qLower.includes("pressure") || qLower.includes("feedback") || qLower.includes("disagree") || qLower.includes("stakeholder")
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
    const glanceSay = "I'm really drawn to the intersection of audience psychology and quantitative performance data. I started out in editorial where I learned how to capture attention under daily deadlines, but what really hooked me was understanding the quantitative mechanics—why users convert, how auctions price impressions, and how algorithmic feeds optimize delivery.";
    const expandedSay = "To build on that, editing over 1,000 articles and writing 600+ pieces gave me a strong intuition for audience intent. But in performance marketing, what really fascinates me is that you have continuous mathematical feedback: you test query intent, watch the auction respond, and optimize for real margin.\n\nRunning campaigns across Google, Meta, and Amazon while building AI web prototypes on the side reinforced how much I love rolling up my sleeves and understanding systems from first principles. I'm eager to learn from high-standard practitioners and build deep fundamentals.";
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
        "• Editorial foundation: 1,000+ edited, 600+ written under daily deadlines",
        "• Hands-on across Google Search, Meta Ads, and Amazon PPC",
        "• Builder mindset: created 5+ functional AI web prototypes"
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
    const expandedSay = "Let me pull the audited granular data right after we wrap up today and send the exact breakdown over to the team so we're working off verified facts rather than an estimate.";
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

  // Assemble Conversational 2-Paragraph Narrative that continues directly from glanceSay
  const expandedSay = `To build on that and explain what was happening under the hood: when you analyze how users interact with that flow, the real unlock comes from understanding intent and eliminating friction before the conversion point.\n\nWhat that experience reinforced for me was treating every initiative as an empirical test. By focusing on root-cause mechanics rather than surface-level metrics, we were able to protect unit economics and build rock-solid fundamentals.`;

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
        babeTag: "babe 👀 Dehradun roots + storytelling, human psychology & data to see what works",
        simplestQuestion: "Torsten wants to know who you are as a person, what drives your curiosity, and how you got here.",
        startWithPrompt: "Start with: “I'm from Dehradun, a valley nestled in the foothills of the Himalayas…”",
        glanceSay: "I'm from Dehradun, a valley nestled in the foothills of the Himalayas, and growing up there shaped me into someone who loves observing people, having conversations, and being curious about what makes people tick. My background is in media and communication, and I worked in writing and editing covering the NFL. Writing over 600 articles taught me audience psychology and deadline discipline—because you can be as creative as you like, but you still have deadlines to meet! But over time, I became curious about what happens beyond the content itself: why one headline gets the click while another gets ignored, and how we measure that human response. That’s what drew me into performance marketing—it brings together creativity, understanding human behaviour, and working with data to make better decisions.",
        glanceBullets: [
          "• Dehradun valley roots: observing people and curious about what makes them tick",
          "• Media & communication: 600+ NFL articles (audience psychology & deadline discipline)",
          "• The turning point: curious about what happens beyond content (why one headline clicks & another doesn't)",
          "• Performance marketing: bringing together creativity, human psychology, and evidence-based data",
          "• Outside work: fiction writing & AI app/game prototypes (imagining ideas & bringing them to life)"
        ],
        expandedSay: "What I find especially exciting about performance marketing is that you start with a hypothesis, test it, look at the results, and learn something concrete from the evidence rather than relying entirely on intuition. During my digital marketing training at Kraftshala, I've been able to explore that practically across Google Ads, Meta Ads, and Amazon projects, seeing how small adjustments influence real outcomes. It's made the connection between my communication background and analytical problem-solving feel very natural.\n\nOutside of work, I write fiction and experiment with creative projects like building app and game prototypes with AI tools, because I like imagining possibilities and figuring out how to bring ideas to life. So for me, moving into performance marketing hasn’t felt like abandoning my previous experience—it feels like building on it: combining storytelling with an understanding of people, and using data to figure out what actually works.",
        supportingContext: "Notes Part 1 & 2: Garima's authentic introduction (Dehradun foothills, observing people, 600+ NFL articles, beyond content, hypothesis testing, fiction & AI prototypes).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Dehradun roots → NFL writing discipline → beyond content to performance marketing.",
          questionSummary: "Tell me about yourself?",
          points: ["Dehradun foothills: observing people and curiosity", "600+ NFL articles: audience psychology & deadline discipline", "Performance marketing: creativity + human behaviour + data"],
          easySay: "I'm from Dehradun, started in NFL writing where I learned audience psychology and deadlines, and got drawn into performance marketing because it combines creativity, human behaviour, and data.",
          stallSay: "I'd love to share that—it really started with growing up in Dehradun and a curiosity for how people tick."
        }
      },
      {
        id: "crealytics-q2",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Why Crealytics specifically, and why do you think you'd be a good fit for this role?",
        topic: "Why Crealytics & Candidate Fit",
        babeTag: "babe 👀 vibe coding to real problem solving + AI to improve decisions responsibly",
        simplestQuestion: "Why Crealytics: connecting vibe coding and technology with practical, measurable business outcomes and human judgment.",
        startWithPrompt: "Start with: “What initially attracted me to Crealytics was…”",
        glanceSay: "What initially attracted me to Crealytics was its established presence in performance marketing and, particularly, its approach to AI and technology. Interestingly, during my time at Kraftshala, I honestly didn't expect vibe coding to become my favourite subject, but I got really into it! I started experimenting with tools like Antigravity and Claude, building prototypes just to see if I could turn an idea into something tangible. What surprised me was how much I enjoyed the process itself: identifying a problem, experimenting with solutions, and refining things when they didn't work. It showed me that I'm genuinely interested in how technology can make processes more efficient and solve real problems, which directly connects with how Crealytics uses AI and automation to drive measurable business outcomes.",
        glanceBullets: [
          "• Initial attraction: Established presence in performance marketing & approach to AI/tech",
          "• Authentic spark: 'I honestly didn't expect vibe coding to become my favourite subject, but I got really into it'",
          "• Problem-solving process: Loved identifying problems, testing approaches, and refining solutions",
          "• Purposeful AI: Using AI to improve marketing decisions, not just as a trendy novelty",
          "• Human in the loop: Human judgement complementing automation and ensuring responsible application"
        ],
        expandedSay: "What really interests me about your approach is the idea of using AI to improve the way marketing decisions are made, rather than using it simply because it's a new technology. Through vibe coding, I've experienced how AI helps you move from an idea to a working prototype much faster, but I've also learnt that you still have to understand the core problem, evaluate the output critically, and keep refining the solution.\n\nComing from a media and communication background, performance marketing brings together creativity, consumer psychology, and data. I'd love to work in an environment where I can contribute the skills I'm developing, learn from people with industry experience, understand how AI and data solve marketing challenges at scale, and see how human judgement complements automated systems responsibly.",
        supportingContext: "Notes Section 2: Garima's authentic Why Crealytics response (vibe coding, Antigravity & Claude, AI to improve decisions, human judgment + automation, responsible AI at scale).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Vibe coding spark → AI to improve decisions (not hype) → human judgment at scale.",
          questionSummary: "Why Crealytics & why a good fit?",
          points: ["Vibe coding at Kraftshala sparked interest in tech efficiency", "AI to improve decisions, not just as a buzzword", "Human judgment complementing automation responsibly"],
          easySay: "I got fascinated by vibe coding and AI problem-solving at Kraftshala, and I love that Crealytics connects AI, automation, and data with practical business outcomes rather than just chasing hype.",
          stallSay: "What initially attracted me to Crealytics was your approach to AI and technology."
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
        startWithPrompt: "Start with: “In my Google Search project at Kraftshala, the biggest breakthrough came from…”",
        glanceSay: "In my Google Search project at Kraftshala, the biggest breakthrough came from diagnosing our query intent. Our original ad groups were casting too broad a net, so we split them into tight, intent-driven themes and aggressively sculpted negative keywords. That immediately drove our CTR from around 5% up to 14.8%, and cut our CPC by 21% down to ₹4.21, delivering 17 of our 19 planned conversions on a ₹777 spend.",
        glanceBullets: [
          "• 1,252 impressions and 185 clicks",
          "• CTR surged: 5.20% → 14.78% via intent-based ad groups",
          "• CPC dropped 21%: ₹5.33 → ₹4.21 through negative keyword sculpting",
          "• 17 of 19 conversions achieved on ₹777 spend (₹800 budget)",
          "• Analyzed search terms to understand the 2 unachieved conversions"
        ],
        expandedSay: "Going a layer deeper into what the data revealed, what fascinated me most was actually the two conversions we missed. When I analyzed the search query reports, I noticed that while our high-intent clusters were converting efficiently, certain exploratory queries were still triggering our ads and bouncing on the landing page.\n\nThat showed me that Google's auction isn't just about winning the bid—it's about query alignment and landing page friction. It gave me a huge appreciation for negative keyword hygiene and quality score dynamics under the hood. Rather than just taking the top-line CTR lift as a win, digging into the mechanics of where the drop-off happened taught me how to treat every campaign as a rigorous feedback loop.",
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
        startWithPrompt: "Start with: “For Unleavables, our core experiment was…”",
        glanceSay: "For Unleavables, our core experiment was testing Meta's default Highest Volume bidding against an explicit Cost Cap. Meta naturally optimizes for conversion volume without respecting cost volatility, but by setting strict cost caps, we forced the algorithm to bid selectively. During our test, that drove our cost per add-to-cart down from ₹91 all the way to ₹29, with an 11% CTR and 15 add-to-carts.",
        glanceBullets: [
          "• Head-to-head experiment: Cost Cap vs Highest Volume bidding",
          "• Cost per add-to-cart dropped: ₹91 → ₹29 during test period",
          "• High engagement: 11.04% overall CTR with 15 add-to-carts",
          "• Blended benchmark: ₹54.52 across full campaign lifecycle",
          "• Key learning: question platform defaults and test algorithms against real margins"
        ],
        expandedSay: "To explain the mechanics of why that worked: Highest Volume essentially tells Meta to spend the entire daily budget regardless of auction pressure, which often results in overpaying during peak competition windows. By switching to Cost Cap, we set an algorithmic ceiling. The delivery slowed down slightly, but the algorithm was forced to wait for impressions with higher conversion probability relative to bid price.\n\nThat experiment really taught me not to treat platform automation as a black box. Understanding how auction dynamics and pacing work under the hood is what separates true performance marketing from just pushing buttons in Ads Manager. It made me really eager to explore how enterprise retail media platforms manage algorithmic bidding at scale.",
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
        startWithPrompt: "Start with: “Homecrust was probably the most valuable learning experience I had…”",
        glanceSay: "Homecrust was probably the most valuable learning experience I had because it highlighted the exact difference between traffic efficiency and commercial viability. We ran an Amazon Sponsored Products campaign with dayparting and negative targeting: impressions grew, clicks surged 40%, and CTR improved to over 1%. But our conversion rate dipped to 1.58%, which pushed ACoS up to 173% on our ₹700 budget.",
        glanceBullets: [
          "• Traffic surged: impressions +5% (5,955), clicks +40% (45 → 63), CTR 0.80% → 1.06%",
          "• Conversion challenge: rate dipped 2.20% → 1.58%, ACoS rose to 173.59%",
          "• Honest realization: traffic without listing readiness just burns budget",
          "• Key learning: analyze product page friction, pricing elasticity, and negative targeting"
        ],
        expandedSay: "Diagnosing why that happened was what made the project so intellectually interesting. At first glance, a 40% click lift looks like an optimization win. But when we audited the funnel, we realized the advertising was doing its job—bringing relevant shoppers to the listing—but the listing itself wasn't conversion-ready. The product had limited review velocity, and our dayparted bids were driving clicks during browsing hours rather than checkout hours.\n\nThat was a huge lesson in full-funnel thinking. It proved that PPC can never be viewed in a vacuum—it's deeply intertwined with buy-box dynamics, social proof, pricing elasticity, and buyer psychology. Understanding how to diagnose whether a bottleneck is algorithmic, creative, or product-related is exactly the kind of analytical problem-solving I find most exciting.",
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
        startWithPrompt: "Start with: “When I was first assigned to cover the NFL at Sportskeeda…”",
        glanceSay: "When I was first assigned to cover the NFL and college football at Sportskeeda, I started with zero background in American football. It was a steep learning curve because football analytics and playbooks are notoriously intricate. But I actually enjoy the process of being a beginner: I studied coverage schemes, watched game film, analyzed beat writers, and asked our editors for critical feedback on every single piece. Over that year, I authored more than 600 articles with strong search traction.",
        glanceBullets: [
          "• Embraced being a beginner with zero prior American football knowledge",
          "• Deep immersion: researched playbooks, film, and terminology daily",
          "• Welcomed feedback: iterated constantly with senior editors",
          "• 600+ articles published with strong readership and organic SEO",
          "• Growth mindset: genuinely excited to explore and conquer unfamiliar topics"
        ],
        expandedSay: "What that experience really taught me about learning quickly is to focus on the underlying mental models first. Instead of trying to memorize hundreds of player names, I focused on understanding the core mechanics—how defensive coverages dictate route trees, how the draft salary cap works, and what questions fans were searching for.\n\nThat exact same research rigor applies directly to performance marketing. Whether it's dissecting a new attribution methodology, understanding how Amazon's A9 algorithm evaluates relevance, or exploring AI workflow automation, I don't wait for someone to teach me. I love rolling up my sleeves, testing hypotheses, asking the right questions, and building deep intuition from first principles.",
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
        babeTag: "babe 👀 warm, thoughtful questions on 90-day success & thriving culture",
        simplestQuestion: "Ask real, thoughtful questions about first 90-day expectations, what makes someone thrive, and team dynamics.",
        startWithPrompt: "Start with: “I do, Torsten, thank you! I'm really curious…”",
        glanceSay: "I do, Torsten, thank you! First, for someone stepping into this role, what does a really successful first ninety days look like from your perspective? And second, what tends to separate someone who is just technically good at setting up campaigns from someone who truly thrives on the team?",
        glanceBullets: [
          "• 1. What does an exceptional first 90 days look like for someone joining as an associate?",
          "• 2. What separates technically competent associates from those who truly thrive here?",
          "• 3. How does the culture of questioning assumptions and healthy debate play out day to day?",
          "• 4. What do you personally find most rewarding about working with the team?"
        ],
        expandedSay: "And building on that, I really value environments where people challenge assumptions and disagree constructively to build better solutions. How does that collaborative dynamic and open feedback play out across the distributed international team on a day-to-day level?\n\nI'd also love to hear your personal perspective on what you've enjoyed most about the culture here over your time at Crealytics.",
        supportingContext: "Notes Part 7: Questions to Ask Torsten (90-day ramp-up, thriving vs competent, healthy debate culture, personal perspective).",
        stuckRecovery: {
          breatheMsg: "Ask about first 90 days and what makes someone thrive. Keep it warm and curious.",
          questionSummary: "Questions to ask Torsten?",
          points: ["What does a great first 90 days look like?", "What separates good from exceptional on the team?", "How does constructive debate work day to day?"],
          easySay: "What does a successful first 90 days look like, and what separates someone who is technically good from someone who truly thrives here?",
          stallSay: "I do have a couple of questions about the team dynamic and the first ninety days."
        }
      },
      {
        id: "crealytics-q8",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me something about yourself that isn't on your CV.",
        topic: "Curiosity, Rabbit Holes & Creative Making",
        babeTag: "babe 👀 rabbit-hole curiosity + vibe coding apps/games + sci-fi reading + starting small",
        simplestQuestion: "Share your curiosity to a slightly ridiculous extent, building little apps/games from scratch, sci-fi reading, and learning to start small.",
        startWithPrompt: "Start with: “Oh, that's a fun question! Something that isn't really reflected in my CV is…”",
        glanceSay: "Oh, that's a fun question! I think something that isn't really reflected in my CV is how curious I am about things, sometimes to a slightly ridiculous extent. If something catches my interest, I tend to go down a rabbit hole trying to understand it. For example, what started as a subject I was learning at Kraftshala turned into me experimenting with building my own little apps and game concepts through vibe coding—taking an idea floating around in my head and seeing if I can actually make something tangible out of it. I'm also a big reader, particularly fantasy and science fiction. I love stories that make you look at the world a little differently, and that curiosity about people carries into other parts of my life, too. Sometimes I have far more ideas than hours in the day to execute them, but I'm learning to pick one, start small, and see where it goes!",
        glanceBullets: [
          "• Rabbit-hole curiosity: curious about things to a slightly ridiculous extent when something catches interest",
          "• Making things tangible: taking ideas floating in my head and building little apps & game concepts with vibe coding",
          "• Big reader: drawn to fantasy & sci-fi; stories that look at the world differently and explore how people think",
          "• Imaginative & practical: love the creative side of things and figuring out how they work in practice",
          "• Balancing ideas: 'Sometimes I have far more ideas than hours in the day, but I'm learning to pick one, start small, and see where it goes!'"
        ],
        expandedSay: "I guess I'm someone who enjoys both the imaginative side of things and figuring out how they work in practice. I really enjoy having conversations with people who see things differently from me because I usually come away having learnt something new.\n\nAnd, well, sometimes I have far more ideas than I have hours in the day to execute them, but I'm learning to pick one, start small, and see where it goes!",
        supportingContext: "Notes Section 7: Personal Interview Notes (rabbit-hole curiosity, vibe coding apps and games, fantasy/sci-fi reading, starting small).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Rabbit hole curiosity + building app/game prototypes + sci-fi reading + starting small.",
          questionSummary: "Tell me something not on your CV",
          points: ["Curiosity to a slightly ridiculous extent", "Building little apps and game concepts from floating ideas", "Big reader in fantasy & sci-fi", "More ideas than hours: learning to pick one, start small"],
          easySay: "I'm curious to a slightly ridiculous extent! If something catches my interest, I go down a rabbit hole—like experimenting with building apps and games through vibe coding, or getting absorbed in fantasy and sci-fi books. I have more ideas than hours in the day, but I'm learning to start small!",
          stallSay: "Oh, that's a fun question! I think something that isn't really reflected in my CV is how curious I am about things."
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
        startWithPrompt: "Start with: “My greatest strength is analytical research rigor…”",
        glanceSay: "My greatest strength is analytical research rigor combined with attention to detail. Having edited over a thousand articles and verified thousands of factual claims under daily deadlines, I don't just glance at data—I look for anomalies and question underlying assumptions. On the flip side, because I care so much about accuracy, my natural tendency in unfamiliar territory can be wanting 100% of the information before taking action.",
        glanceBullets: [
          "• Strengths: attention to detail, research rigor, and clear cross-team communication",
          "• Track record: 1,000+ articles edited/fact-checked, 600+ written, 20+ writers/managers coordinated",
          "• Genuine weakness: tendency to over-analyze before acting in unfamiliar scenarios",
          "• Active solution: balance accuracy with action by running small, measurable tests"
        ],
        expandedSay: "How I actively balance that weakness is by adopting a hypothesis-driven testing mindset. In digital marketing, you rarely have perfect data, and waiting for complete certainty means missing auction opportunities. So instead of over-analyzing, I define the core assumption, set up a small controlled test with strict cost guardrails, and let empirical results give me the clarity to scale.",
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
        startWithPrompt: "Start with: “I evaluate metrics as an interconnected system…”",
        glanceSay: "I evaluate metrics as an interconnected system rather than celebrating them in isolation. For instance, if CTR is increasing but conversions are falling, that's a classic signal of funnel disconnect—either search intent drifted into broad browsing queries, or the landing page failed to deliver on the ad hook. Similarly, a high ROAS on small spend doesn't guarantee you can scale budget linearly, because marginal returns compress as you exhaust the highest-intent audience.",
        glanceBullets: [
          "• Metrics in context: high CTR alone does not equal profitability",
          "• Diagnosing conversion drop: search query intent drift, landing page mismatch, or tracking bugs",
          "• High ROAS low volume: check diminishing marginal returns and available demand headroom",
          "• Incremental testing: scale budgets gradually while protecting bottom-line client margins"
        ],
        expandedSay: "To look at the commercial reality behind that: platform algorithms naturally harvest the lowest-hanging fruit first. When you double spend, the algorithm is forced into broader auction pools where customer acquisition costs naturally rise. Before scaling, I examine available impression share, competitor bid pressure, and product margins to determine whether incremental revenue actually translates to incremental profit.",
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
        babeTag: "babe 👀 grounded valley pace + quiet focus & asynchronous discipline",
        simplestQuestion: "Living in Dehradun gives calm perspective and focus; remote work allows bringing that discipline to fast global teams.",
        startWithPrompt: "Start with: “Living in Dehradun gives you a really grounded perspective…”",
        glanceSay: "Living in Dehradun gives you a really grounded sense of perspective. Being surrounded by the hills and an unhurried rhythm makes it easy to stay calm, focused, and thoughtful about the work you do. What I love about remote work is that it lets you bring that quiet, steady focus to fast-paced global teams without needing to be in the middle of a noisy metro.",
        glanceBullets: [
          "• Dehradun perspective: grounded, calm, and thoughtful approach to work",
          "• Quiet focus: unhurried environment that fosters deep concentration and craft",
          "• Remote experience: collaborated daily with 20+ writers and editors across time zones at Sportskeeda",
          "• Asynchronous discipline: clear documentation, intentional handoffs, and proactive communication"
        ],
        expandedSay: "In terms of collaboration, working remotely across different time zones has become second nature. When I was covering US sports, almost everything had to happen asynchronously with editors and writers. That taught me the value of over-communicating context in writing, keeping documentation clean, and being proactive rather than waiting to be asked.\n\nWhen people have clear written context and mutual trust, remote teams can move faster and think clearer than in an office. It gives you the space to do deep work while staying completely aligned on goals.",
        supportingContext: "Notes Section 7: Dehradun perspective, remote work, international team collaboration.",
        stuckRecovery: {
          breatheMsg: "Dehradun calm + quiet focus. Remote work: asynchronous discipline and clear communication.",
          questionSummary: "Dehradun and remote work?",
          points: ["Dehradun: calm, grounded focus in the hills", "Remote work brings quiet discipline to global teams", "Proven asynchronous habits from Sportskeeda"],
          easySay: "Living in Dehradun gives me a calm, focused perspective. Working remotely covering US sports trained me in asynchronous communication, clear documentation, and steady routines.",
          stallSay: "I love living in Dehradun—it gives you a really quiet, grounded focus that works beautifully with remote work."
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
        startWithPrompt: "Start with: “Working in sports journalism under breaking news deadlines…”",
        glanceSay: "Working in sports journalism under breaking news deadlines made pressure and critique a completely normal part of my workflow. When publishing multiple pieces a day across twenty writers, speed and factual accuracy had to coexist. That environment taught me to welcome critical feedback without ego—I view constructive criticism as free coaching to upgrade my craft.",
        glanceBullets: [
          "• Pressure at Sportskeeda: high-velocity publishing where speed and accuracy had to coexist",
          "• Organized under stress: systematic fact-checking and prioritized workflows",
          "• Constructive feedback mindset: never confuse effort with effectiveness",
          "• Growth attitude: treat critical feedback as free coaching to upgrade skills"
        ],
        expandedSay: "That mindset applies directly when things don't go according to plan in marketing—like our Homecrust Amazon campaign where ACoS rose to 173%. Rather than getting defensive about the numbers, my instinct was to dissect the data: why did the conversion rate drop, where did users bounce, and what was the root cause? Confronting the data honestly and fixing the underlying process is how you turn mistakes into compounding expertise.",
        supportingContext: "Notes Section 5: Working under pressure, constructive criticism, mistake accountability.",
        stuckRecovery: {
          breatheMsg: "Sportskeeda pressure: accuracy + speed. Feedback: never confuse effort with effectiveness.",
          questionSummary: "Pressure, feedback, or mistakes?",
          points: ["Sportskeeda publishing pressure", "Feedback is free coaching to improve", "Never confuse effort with effectiveness"],
          easySay: "Sportskeeda taught me to deliver accurate work under tight deadlines, and editorial revisions trained me to welcome constructive feedback without taking it personally.",
          stallSay: "My background in editorial work actually shaped how I handle both pressure and feedback."
        }
      },
      {
        id: "crealytics-q13",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "What is vibe coding, and how do you use it?",
        topic: "Vibe Coding & Practical Experimentation",
        babeTag: "babe 👀 lowering barrier to experimentation + natural language to working code",
        simplestQuestion: "Explain vibe coding as using natural language with AI to build working software, test, and iterate.",
        startWithPrompt: "Start with: “I honestly didn't expect vibe coding to become my favourite subject, but I got really into it…”",
        glanceSay: "I honestly didn't expect vibe coding to become my favourite subject, but I got really into it. For me, vibe coding is a way of building software with the help of AI, using natural-language instructions to translate an idea into working code. It lowers the barrier to experimentation—instead of leaving a concept at the brainstorming stage, I can build and test a functional prototype. But AI-generated code isn't automatically correct; you still have to understand the core problem, give clear instructions, troubleshoot errors, and make product decisions.",
        glanceBullets: [
          "• Authentic hook: 'I honestly didn't expect vibe coding to become my favourite subject, but I got really into it'",
          "• Lowers barrier to experimentation: Turns conceptual ideas into tangible working prototypes",
          "• Human in the loop: Defining product purpose, user experience, and testing functionality",
          "• Real constraint: AI code isn't magic; requires debugging, troubleshooting, and iteration"
        ],
        expandedSay: "What excites me most about it is how it combines creative vision with structured problem-solving. AI handles the heavy lifting of repetitive syntax, but you still need product thinking: what problem are we actually solving, how does the user navigate, and what features make practical sense?\n\nIt’s given me a very structured, iterative development workflow: defining the problem, breaking it into smaller tasks, having AI implement each piece, testing functionality incrementally, and debugging errors before moving to the next feature. That exact feedback loop is identical to how I look at performance marketing: you don't rely on algorithms blindly; you define the objective, test hypotheses in stages, and let real performance guide iterations.",
        supportingContext: "Notes Section 8: Introduction to Vibe Coding, AI-assisted development workflows, iterative debugging.",
        stuckRecovery: {
          breatheMsg: "Vibe coding: natural language + AI to build prototypes. Human in loop for UX & testing.",
          questionSummary: "What is vibe coding?",
          points: ["Natural language to working code", "Lowers barrier to experimentation", "Human in loop for UX & testing"],
          easySay: "I honestly didn't expect vibe coding to become my favourite subject, but I got really into it! It's using natural language with AI to turn ideas into working prototypes—testing, debugging, and solving real problems.",
          stallSay: "I honestly didn't expect vibe coding to become my favourite subject at Kraftshala, but I got really fascinated by it."
        }
      },
      {
        id: "crealytics-q14",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about a personal project you've worked on — like your productivity app 'The Spare Room'.",
        topic: "The Spare Room (Productivity App)",
        babeTag: "babe 👀 therapy-inspired, visual calendar, 6 friends feedback: feature creep vs MVP",
        simplestQuestion: "Tell the story of The Spare Room: therapy session origin, visual calendar, testing with 6 friends, and MVP simplicity lesson.",
        startWithPrompt: "Start with: “One project I've been experimenting with is…”",
        glanceSay: "One project I've been experimenting with is a productivity app concept called 'The Spare Room,' inspired by an overwhelm problem discussed in someone's therapy session. When responsibilities feel like one giant, endless to-do list, people freeze up. So I designed a calendar-based interface to visualize time, break tasks into smaller chunks, and introduced a 'Just This for Today' focus mode to help people realistically accomplish what matters without anxiety.",
        glanceBullets: [
          "• Origin: Inspired by overwhelming to-do lists discussed in a therapy session",
          "• Core concepts: Visual calendar, breaking tasks into chunks, 'Just This for Today', visual time dots",
          "• User testing: Shared working prototype with 6 friends; feedback was clunky and overcomplicated",
          "• Product takeaway: Never confuse effort with effectiveness; adding features increases friction",
          "• MVP mindset: Focus on the single core problem and test the primary user journey first"
        ],
        expandedSay: "I used AI-assisted coding to build a working prototype and shared an early version with six friends. Their feedback was candid: they found it clunky and complicated because I had tried to pack in too many features like visual time blocks and progress puzzle systems. That was a profound lesson in product thinking and user empathy: never confuse effort with effectiveness. As a creator, it's easy to fall in love with adding features, but adding complexity often just adds user friction.\n\nIf I were developing it further, I’d build a ruthless MVP solving only the single most important problem, testing the main user journey first. That takeaway connects directly back to performance marketing: whether you're designing an ad journey, an onboarding funnel, or a campaign structure, simplicity, clarity, and listening to real user feedback always beat complex feature creep.",
        supportingContext: "Notes Section 8: The Spare Room productivity app, 6 friends user testing, MVP prioritization, user empathy.",
        stuckRecovery: {
          breatheMsg: "The Spare Room: therapy origin, visual calendar, 6 friends feedback = don't confuse effort with effectiveness.",
          questionSummary: "Tell me about your productivity app?",
          points: ["Therapy session origin: overwhelming to-do lists", "Visual calendar & 'Just This for Today'", "6 friends feedback: simplify into an MVP"],
          easySay: "I built 'The Spare Room,' a visual calendar app to make planning less overwhelming. Testing it with 6 friends taught me not to confuse effort with effectiveness and to keep MVPs simple.",
          stallSay: "I'd love to share that—it's a productivity app called The Spare Room inspired by a real-world problem."
        }
      },
      {
        id: "crealytics-q15",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about your gaming projects in Roblox Studio and what they taught you.",
        topic: "Gaming Concepts & User Retention",
        babeTag: "babe 👀 cosy exploration, supernatural mystery, player retention & UX pacing",
        simplestQuestion: "Cosy exploration world + supernatural mystery in Roblox Studio; lessons on player curiosity, retention, and UX.",
        startWithPrompt: "Start with: “I've also explored game concepts in Roblox Studio because…”",
        glanceSay: "I’ve explored game concepts in Roblox Studio to experiment with interactive storytelling and user engagement. One concept was a cosy exploration world where players customize a little home, explore a garden, and discover mini planets with unexpected visitors like a cute ghost or deer. Another was an atmospheric supernatural mystery in a city setting featuring a missing-person investigation and a cinematic twist.",
        glanceBullets: [
          "• Concept 1: Cosy exploration with home customisation, gardens, and whimsical planets",
          "• Concept 2: Supernatural mystery in Roblox Studio with missing-person investigation and cinematic twist",
          "• Core takeaway: Viewing experiences entirely from the user's perspective (pacing & curiosity)",
          "• Marketing connection: Audience understanding, engagement, retention, and hypothesis testing"
        ],
        expandedSay: "What game development taught me is to view experiences entirely from the player's perspective. It's not enough to have an imaginative concept or an attractive visual world; you have to understand player psychology: what makes someone curious enough to explore the next room, what keeps them engaged, and what gives them a reason to return.\n\nThat connects directly to marketing fundamentals: audience understanding, engagement, retention, storytelling, and testing mechanics one working piece at a time. It reinforced how to take an ambitious creative vision, break it into manageable building blocks, and test how real users navigate the experience.",
        supportingContext: "Notes Section 8: Gaming projects in Roblox Studio (cosy exploration, supernatural mystery), player retention, marketing parallels.",
        stuckRecovery: {
          breatheMsg: "Roblox concepts: cosy exploration + supernatural mystery. Taught player retention & pacing.",
          questionSummary: "Tell me about your gaming projects?",
          points: ["Roblox Studio concepts: cosy home & mystery", "Taught user perspective, pacing, and retention", "Direct parallels to marketing engagement"],
          easySay: "I explored game concepts in Roblox Studio—a cosy home customization game and a supernatural mystery—which taught me how to design for user curiosity, pacing, and retention.",
          stallSay: "I've experimented with game concepts in Roblox Studio to explore interactive storytelling."
        }
      },
      {
        id: "crealytics-q16",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "How would you apply AI and automation to performance marketing?",
        topic: "Applying AI to Performance Marketing",
        babeTag: "babe 👀 AI as strategic force multiplier: reporting, ad copy, workflow automation",
        simplestQuestion: "AI as force multiplier: campaign reporting, ad copy variations, workflow automation, checked by real data.",
        startWithPrompt: "Start with: “I view AI as a strategic force multiplier…”",
        glanceSay: "I view AI as a strategic force multiplier rather than a replacement for human judgment. In performance marketing, I’d apply it to eliminate repetitive manual work across four areas: analyzing campaign reporting trends, generating and categorizing ad-copy variations for rapid testing, organizing competitor research, and automating routine cross-platform data transfers.",
        glanceBullets: [
          "• AI as force multiplier: Amplifies human potential, frees minds for high-leverage strategy",
          "• 1. Reporting & analysis: Spotting anomalies and summarizing trends against verified metrics",
          "• 2. Ad-copy experimentation: Rapid angle generation tested against real conversion data",
          "• 3. Workflow automation: Eliminating manual repetitive transfers with error handling",
          "• Human focus: Automation does repetitive heavy lifting so humans focus on strategic problems"
        ],
        expandedSay: "The critical principle is that you never assume AI output is correct just because it sounds persuasive. For ad copy, AI can produce twenty different angles around customer pain points or urgency in seconds, but real conversion data and CTR have to determine the winner. For reporting, AI can surface pacing anomalies, but the marketer has to verify the underlying unit economics.\n\nBy letting automation and machine learning handle the repetitive heavy lifting, marketers can focus their energy on high-leverage strategic thinking, creative problem-solving, and diagnosing where users experience friction.",
        supportingContext: "Notes Section 8: Applying AI to Performance Marketing (reporting, ad copy testing, research, workflow automation).",
        stuckRecovery: {
          breatheMsg: "AI is a force multiplier: reporting, ad copy variations, workflow automation. Verified by data.",
          questionSummary: "How apply AI to performance marketing?",
          points: ["Force multiplier, not replacement", "Reporting trends & ad copy angle testing", "Automation frees humans for strategy"],
          easySay: "I use AI as a force multiplier for repetitive tasks—summarizing reports, generating ad-copy tests, and automating workflows—while letting real conversion data validate the output.",
          stallSay: "I look at AI as a strategic force multiplier for repetitive workflows."
        }
      },
      {
        id: "crealytics-q17",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Are you a software developer, and why are you learning to build apps outside of marketing?",
        topic: "Are You a Developer & Learning Outside Marketing",
        babeTag: "babe 👀 not a dev, but curious builder combining product thinking and user empathy",
        simplestQuestion: "Clarify you're not a developer, but building apps teaches user friction, product journeys, and first-principles thinking.",
        startWithPrompt: "Start with: “I'm definitely not a professional developer…”",
        glanceSay: "I’m definitely not a professional software developer, and I wouldn't present myself as one. My strength is combining curiosity, user empathy, and AI tools to turn ideas into tangible prototypes. I learn outside marketing because building products forces me to think deeply about user friction, user journeys, and why people drop off—which directly sharpens how I analyze marketing funnels.",
        glanceBullets: [
          "• Candid clarity: Not a professional developer; combining curiosity and practical experimentation",
          "• Why learn coding: Forces deep thinking about user friction and product journeys",
          "• Marketing crossover: Building apps teaches what causes drop-off far better than textbooks",
          "• Technical affinity: Eases cross-functional communication with data squads and engineers"
        ],
        expandedSay: "When you build an app and watch real users get stuck or confused, you understand user psychology and conversion friction in a way that reading marketing textbooks never teaches. You realize that a great ad pitch means nothing if the onboarding experience is clunky.\n\nIt also makes me much more technically comfortable when talking to data squads, working with APIs, or understanding algorithmic ad platforms. I love learning things that let me look at problems from a different angle, and that hands-on technical affinity helps me communicate and execute with far more confidence.",
        supportingContext: "Notes Section 8: Are you a developer? Why learn outside marketing? User friction and marketing crossover.",
        stuckRecovery: {
          breatheMsg: "Not a developer, but a curious builder. Building apps teaches user friction and product thinking.",
          questionSummary: "Are you a developer?",
          points: ["Not a professional developer", "Curious problem solver using AI tools", "Building apps teaches user friction and funnel drop-off"],
          easySay: "I'm not a professional developer, but building apps with AI teaches me user empathy and conversion friction, which directly strengthens my marketing skills.",
          stallSay: "I'm definitely not a developer, but learning to build prototypes gives me a unique perspective on user friction."
        }
      },
      {
        id: "crealytics-q18",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about your Scrimba Vibe Coding Specialization and tools like Cursor or Model Context Protocol (MCP).",
        topic: "Scrimba Certificate, Cursor AI & MCP",
        babeTag: "babe 👀 Scrimba Specialization, Cursor, Claude Code, MCP & iterative development",
        simplestQuestion: "Explain your Scrimba course, Cursor AI, Claude Code agents, MCP, and iterative testing workflow.",
        startWithPrompt: "Start with: “Through the Scrimba Vibe Coding Specialization…”",
        glanceSay: "Through the Scrimba Vibe Coding Specialization, I explored modern AI-assisted development tools including Cursor AI, GitHub Copilot, Claude Code, and Model Context Protocol (MCP). The course showed me how AI workflows operate beyond simple chat prompts—using AI agents to inspect codebases and MCP as an open standard to connect models with external tools and live databases.",
        glanceBullets: [
          "• Scrimba Specialization: Hands-on exploration of Cursor AI, Copilot, Claude Code, and MCP",
          "• MCP (Model Context Protocol): Open standard connecting AI with external tools and data sources",
          "• AI Agents: Autonomous multi-step planning, file editing, and testing under human oversight",
          "• Iterative workflow: Problem definition → breaking into tasks → AI implementation → testing → debugging"
        ],
        expandedSay: "The biggest takeaway was mastering iterative development under constraint: defining the problem clearly, breaking it into bite-sized tasks, letting the AI generate the implementation, and rigorously testing the output. AI agents are powerful, but they can easily introduce bugs or hallucinate if you don't verify their changes.\n\nUnderstanding tools like MCP and AI coding workflows gives me strong technical intuition. As marketing platforms become increasingly automated and algorithmic, having hands-on familiarity with how AI connects to tools and data sources is an invaluable asset when managing modern, data-driven advertising campaigns.\n\nIt makes me much more confident diving into technical platforms and diagnosing what's happening underneath the surface.",
        supportingContext: "Notes Section 8: Scrimba Vibe Coding Specialization, Cursor AI, Claude Code, MCP, iterative development.",
        stuckRecovery: {
          breatheMsg: "Scrimba course: Cursor, Claude Code, MCP. Taught iterative development and AI verification.",
          questionSummary: "Tell me about your Scrimba certificate?",
          points: ["Scrimba Vibe Coding Specialization", "Cursor, Claude Code, MCP open standard", "Iterative development and verification"],
          easySay: "Through the Scrimba specialization, I explored Cursor AI, Claude Code, and MCP, which taught me structured iterative workflows and how to verify AI outputs.",
          stallSay: "I explored AI development through the Scrimba Vibe Coding Specialization."
        }
      },
      {
        id: "crealytics-q19",
        category: "situational",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "If there is a conflict or competing priorities — like an immediate performance drop while an urgent report is due — how would you handle it?",
        topic: "Conflict, Competing Priorities & Urgent Deadlines",
        babeTag: "babe 👀 assess severity, communicate trade-offs early, protect both outcomes",
        simplestQuestion: "Assess performance risk vs report urgency, communicate trade-offs to manager immediately, contain live risk first.",
        startWithPrompt: "Start with: “I'd first assess the severity of the performance drop…”",
        glanceSay: "I'd first assess the severity of the performance drop and how urgently the report is needed. Since the issue could affect campaign results, I'd quickly communicate the competing deadlines to my manager and explain the trade-offs. I'd suggest investigating the immediate issue first if it poses a significant risk, while agreeing on a realistic timeline for the report. I'd then keep the relevant stakeholders updated and ensure both responsibilities are addressed.",
        glanceBullets: [
          "• Assess severity & urgency: evaluate commercial risk of performance drop vs report timeline",
          "• Proactive manager communication: flag competing deadlines early and outline the trade-offs",
          "• Prioritize containment: triage live revenue risk first while agreeing on realistic report delivery",
          "• Stakeholder transparency: keep all parties informed so expectations remain aligned without surprises"
        ],
        expandedSay: "The key for me is proactive communication and risk containment rather than trying to silently juggle both and dropping the ball. When a live campaign starts leaking budget or conversions drop, every hour of delay costs money, whereas report deadlines often have a little room for renegotiation once stakeholders understand the commercial trade-off.\n\nOnce the immediate campaign leak is contained or paused, I'd dive straight into completing the report with full context on what was diagnosed. By communicating early, agreeing on trade-offs with leadership, and managing expectations transparently, you protect client trust and campaign performance at the same time.",
        supportingContext: "Notes Section 5: Behavioural & Situational (handling conflict, competing deadlines, communicating trade-offs to managers, stakeholder transparency).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Assess severity → communicate trade-offs to manager → contain live risk first.",
          questionSummary: "Conflict or competing deadlines?",
          points: ["Assess drop severity vs report urgency", "Communicate trade-offs to manager immediately", "Contain live campaign risk, set realistic report timeline", "Keep stakeholders updated"],
          easySay: "I'd assess the risk, communicate competing deadlines to my manager immediately, prioritize containing the live campaign drop, and set a clear timeline for the report.",
          stallSay: "For me, handling competing priorities comes down to assessing risk and communicating trade-offs early."
        }
      },
      {
        id: "crealytics-q20",
        category: "behavioural",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Can we trust that you'll do a good job for us? Everyone says they're hardworking — why should we believe you?",
        topic: "Trust, Reliability & Hard Work",
        babeTag: "babe 👀 ownership over hours + early honesty & earning trust over time",
        simplestQuestion: "Hard work means taking ownership and persisting; trust comes from early honesty and consistency over time.",
        startWithPrompt: "Start with: “I believe being hardworking is not just about…”",
        glanceSay: "I believe being hardworking is not just about how much time you spend on something, but about how much ownership you take of the work you're responsible for. In writing, delivering over 600 articles taught me discipline and meeting deadlines even when things required more effort than expected. At Kraftshala, it taught me never to treat something as a dead end just because I don't understand it immediately. As for trust, that comes from consistency and honesty: if I commit to something, I take that commitment seriously, and if I hit a problem, I’d always rather communicate it early and work toward a solution than hide it.",
        glanceBullets: [
          "• Hard work = ownership: taking full accountability rather than just counting hours",
          "• Persistence: never treating an unfamiliar problem as a dead end; practicing until confident",
          "• Trust through honesty: communicating roadblocks early rather than hiding them",
          "• Coachable humility: comfortable acknowledging what to learn, asking questions, taking feedback seriously",
          "• Earning it over time: 'I'd want you to judge me by my consistency over time, not just what I say today'"
        ],
        expandedSay: "I'm still at a stage where I have a lot to learn, and I'm very comfortable acknowledging that. If I'm given responsibility, I'll make a genuine effort to understand what's expected, ask questions when necessary, take feedback seriously, and keep working until I've done the job to the best of my ability.\n\nAnd if you ask why you should believe that today—that’s completely fair. I don’t think saying it in an interview is enough to prove it; I’d rather demonstrate it through my work. Reliability means being honest about what you can deliver, asking for help before a problem becomes bigger, and taking responsibility for the outcome. I'd want you to judge me by those things over time, rather than just by what I say today.",
        supportingContext: "Notes Section 3 & 5: Garima's authentic response on trust, ownership, deadline discipline, early honesty, and earning credibility over time.",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Ownership over hours + communicate problems early + earn trust over time.",
          questionSummary: "Can we trust you to do a good job?",
          points: ["Hard work = ownership and never treating issues as dead ends", "Trust = consistency & communicating roadblocks early", "Wanting to earn trust through work over time, not just interview words"],
          easySay: "Hard work is about taking ownership, and trust comes from consistency and communicating problems early. I don't expect you to take my word for it today—I want to earn that trust through my work over time.",
          stallSay: "That's a really fair question—for me, trust and work ethic come down to ownership and honesty."
        }
      },
      {
        id: "crealytics-q21",
        category: "behavioural",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "What makes someone a good teammate, and how do you approach collaboration?",
        topic: "Teamwork, Dependability & Collaborative Energy",
        babeTag: "babe 👀 dependable, honest communication + making space for others + celebrate wins",
        simplestQuestion: "Dependable, honest communication, ownership + big picture, and celebrating others instead of competing.",
        startWithPrompt: "Start with: “For me, a good teammate is someone who's dependable…”",
        glanceSay: "For me, a good teammate is someone who's dependable, communicates honestly, and makes space for other people to contribute. I think it's important to take ownership of your own responsibilities while also understanding that you're part of something bigger than your individual tasks. A good teammate should be able to give and receive feedback, disagree respectfully, and offer support when someone needs it. I also think it's important to celebrate other people's contributions rather than viewing everything as a competition. Ultimately, I want to be someone who brings both ideas and positive energy to a team. I care about doing good work, but I also care about the people I'm doing it with.",
        glanceBullets: [
          "• Core qualities: dependable, communicates honestly, and makes space for others to contribute",
          "• Ownership & big picture: taking full responsibility while understanding you're part of something bigger",
          "• Constructive feedback: give/receive feedback and disagree respectfully without personal friction",
          "• Celebrate teammates: celebrate others' contributions rather than viewing work as a competition",
          "• Ideas & positive energy: 'I care about doing good work, but I also care about the people I'm doing it with'"
        ],
        expandedSay: "I think one of the things that genuinely defines me is how much I enjoy connecting with people. I'm naturally curious about people, how they think, what they care about, and how they approach things differently from me. That's also why I was drawn to media and communication in the first place: communication isn't just about putting a message out there; it's about understanding the person on the other side of it.\n\nThat carries straight over into how I think about collaboration. I don't believe good teamwork means everyone has to think alike or agree on everything. Some of the best work comes from people with different strengths and perspectives challenging each other's ideas respectfully. Good collaboration requires consideration—recognising different working styles, communicating clearly, and making it easier for everyone to do their best work together.",
        supportingContext: "Notes Page 1: Garima's authentic teamwork and collaboration notes (dependability, honest communication, making space for others, celebrating teammates, positive energy).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Dependable + honest communication + making space for others + celebrate teammates.",
          questionSummary: "What makes a good teammate?",
          points: ["Dependable, communicates honestly, makes space for others", "Ownership of tasks while seeing the bigger picture", "Disagree respectfully and celebrate contributions rather than competing", "Bring ideas and positive energy"],
          easySay: "For me, a good teammate is dependable, communicates honestly, and makes space for others. It's about bringing positive energy, celebrating each other's wins, and producing better work together than individually.",
          stallSay: "For me, what makes a great teammate really comes down to dependability, honest communication, and making space for others."
        }
      },
      {
        id: "crealytics-q22",
        category: "behavioural",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "How do you handle disagreements with colleagues?",
        topic: "Constructive Disagreement & Data-Driven Alignment",
        babeTag: "babe 👀 understand why first + shared goal over whose idea wins + test competing ideas",
        simplestQuestion: "Understand why we disagree first, listen openly, focus on the shared goal over winning, and test with data.",
        startWithPrompt: "Start with: “I'd first try to understand why we disagree…”",
        glanceSay: "I'd first try to understand why we disagree, because sometimes people are approaching the same problem with different information or priorities. I'd explain my perspective, but I'd also listen to theirs and be open to the possibility that they've noticed something I haven't. If we're working towards a shared goal, I'd want us to focus on what best serves that goal rather than on whose idea wins. In a marketing environment, for example, I'd be happy to test competing ideas or look at the available data instead of relying entirely on personal opinions. I think it's possible to disagree with someone's approach while still respecting them.",
        glanceBullets: [
          "• Understand why: diagnose whether disagreement stems from different info or different priorities",
          "• Open listening: explain my perspective while genuinely staying open to what they noticed",
          "• Shared goal over winning: focus on what best serves the goal, not on 'whose idea wins'",
          "• Test with data: in marketing, test competing ideas or look at empirical performance over opinions",
          "• Mutual respect: disagree with someone's approach while maintaining complete respect for the person"
        ],
        expandedSay: "I don't believe good teamwork means everyone has to think alike. In fact, some of the best work comes from people with different strengths being able to challenge each other's ideas respectfully. If someone has a better idea, I'm happy to learn from them. If I disagree with something, I'd rather have a constructive conversation about it than turn it into a personal issue.\n\nKeeping the focus on the business objective and testing hypotheses against real data takes the ego out of disagreement and turns it into a collaborative problem-solving session.",
        supportingContext: "Notes Page 1 & 2: Garima's authentic response on disagreements (understanding why, shared goal over winning, testing competing ideas with data, respecting the person).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Understand why first + listen openly + shared goal > winning + test competing ideas with data.",
          questionSummary: "How do you handle disagreements?",
          points: ["Understand why we disagree (different info or priorities)", "Listen openly to what they noticed", "Shared goal over whose idea wins", "Test competing ideas with data"],
          easySay: "I first try to understand why we disagree, listen to their perspective, and focus on the shared goal rather than whose idea wins. In marketing, the best approach is to test competing ideas with real data.",
          stallSay: "I always start by trying to understand why we disagree, because usually people just have different information or priorities."
        }
      },
      {
        id: "crealytics-q23",
        category: "reflective",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "What kind of books do you read, and what are some of your favourites?",
        topic: "Favourite Books, World-Building & Human Emotion",
        babeTag: "babe 👀 Stormlight, Night Circus, Cerulean Sea + attached to fictional characters *laughs*",
        simplestQuestion: "Drawn to fantasy/sci-fi; Brandon Sanderson, Erin Morgenstern, TJ Klune; world-building meets emotional investment.",
        startWithPrompt: "Start with: “I'm mostly drawn to fantasy and science fiction…”",
        glanceSay: "I'm mostly drawn to fantasy and science fiction. I love getting completely absorbed in a story, especially when the author has built an entire world that feels like it exists beyond the pages. I'm a big fan of The Stormlight Archive by Brandon Sanderson—I love the scale of the world-building and how it explores people, their flaws, their responsibilities, and how they change over time. I also love The Night Circus by Erin Morgenstern; its dreamlike atmosphere makes the world feel magical without needing to explain every little thing. And The House in the Cerulean Sea by TJ Klune is another favourite for its warmth, found family, and looking beyond first impressions.",
        glanceBullets: [
          "• Genre love: fantasy & sci-fi—getting absorbed in worlds that feel like they exist beyond the pages",
          "• *The Stormlight Archive* (Brandon Sanderson): massive world-building, flawed people carrying responsibility",
          "• *The Night Circus* (Erin Morgenstern): dreamlike, atmospheric magic without needing to over-explain",
          "• *The House in the Cerulean Sea* (TJ Klune): pure warmth, found family, looking beyond first impressions",
          "• Human connection: 'I'm probably the kind of person who gets attached to fictional characters and then has to deal with the consequences of that attachment! *Laughs*'"
        ],
        expandedSay: "They're almost opposites! But I think I just enjoy stories that make me feel something, whether that's genuine unease or that very quiet feeling you get from watching an ordinary moment unfold. I don't necessarily need every story to be exciting in the conventional sense. Sometimes I want something that completely messes with my head, and sometimes I just want to watch people exist and figure life out.\n\nI think I enjoy books that can transport me somewhere completely different but still leave me thinking about something very human. I want the world-building and the imagination, but I also want characters I can get emotionally invested in.",
        supportingContext: "Notes Page 2 & 3: Garima's favourite books (The Stormlight Archive, The Night Circus, The House in the Cerulean Sea, getting attached to fictional characters, feeling something).",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Stormlight (Sanderson) + Night Circus (Morgenstern) + Cerulean Sea (Klune) + attached to characters *laughs*.",
          questionSummary: "What are your favourite books?",
          points: ["Fantasy & sci-fi: immersive world-building", "Stormlight Archive: flawed characters & responsibility", "Night Circus: dreamlike magic without over-explaining", "House in the Cerulean Sea: warmth, found family, beyond first impressions"],
          easySay: "I love fantasy and sci-fi: The Stormlight Archive for epic world-building and character growth, The Night Circus for atmospheric magic, and The House in the Cerulean Sea for heart and found family.",
          stallSay: "I'm mostly drawn to fantasy and science fiction—I love getting completely absorbed in a story."
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
        glanceSay: "We rotated our primary creative mid-week because older assets were hitting audience fatigue, which temporarily reset Meta's learning phase and pushed CPC up. The positive signal is our baseline held firm—Google Search stayed solid at a 78 quality score with conversion volume up 12% WoW, so this was transient friction from the ad refresh.",
        glanceBullets: [
          "• Creative rotated mid-week to combat fatigue",
          "• Algorithmic learning phase caused temporary CPC bump",
          "• Search fundamentals strong: 78 score, +12% volume lift",
          "• Tuesday creative test will validate stabilization"
        ],
        expandedSay: "To build on that, the reason CPC spiked is algorithmic: when you introduce new assets, Meta's pacing engine runs exploratory auctions to find high-probability converters, temporarily driving up cost-per-click before settling.\n\nThe search data confirms that user intent never degraded—conversion volume grew 12% without needing higher bids. Our Tuesday test will let the algorithm exit learning mode, and we anticipate CPA returning to target ranges once delivery stabilizes.",
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
        expandedSay: "Going a layer deeper into why I recommend that sequence: if we increase budget while the algorithm is still in learning mode, the bidding engine overpays for impression share.\n\nBy waiting for Tuesday's test to establish a clear conversion baseline, we protect unit economics and ensure every incremental dollar works at peak efficiency.",
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
        expandedSay: "In digital acquisition, keeping tired creative live inevitably leads to margin decay as ad fatigue sets in.\n\nWe introduced fresh visual angles to re-engage our core audience before Q4 auction competition intensifies, accepting a transient learning-phase variance to protect long-term efficiency.",
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
        expandedSay: "Diagnosing that funnel disconnect showed us that the ad hook successfully captured attention, but the landing page wasn't reinforcing the specific angle the user clicked on.\n\nBridging that continuity gap between the ad narrative and the checkout experience is our exact testing focus for Tuesday.",
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
        expandedSay: "What that data proves is that baseline purchase intent remained exceptionally healthy.\n\nThat paid search stability acted as a vital stabilizer, protecting our blended customer acquisition economics while social absorbed the creative transition.",
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
        expandedSay: "To look at the auction timing behind that: capturing impression share right now allows us to build volume before Q4 seasonal competition drives up CPMs across the board.\n\nGating that expansion on Tuesday's test ensures we scale with proven data rather than speculation.",
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
        expandedSay: "The key strategic implication is that we shouldn't cut top-of-funnel budget based solely on last-click reporting.\n\nThose social discovery touchpoints are the feeder engine driving the 12% conversion lift we're seeing downstream in Google Search. The new model gives us a much more honest picture of cross-channel incrementality.",
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
        expandedSay: "Let me pull the regional ledger with the finance team right after we wrap up today and follow up with you and Marcus with the verified audited figures.",
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
        expandedSay: "Ad platform bidding algorithms require roughly 50 conversion events in a calm environment to calibrate who is most likely to buy.\n\nIf we pour substantial budget in while the ad is still in that volatile learning window, the bidding engine overpays for impressions. By waiting 48 hours for the conversion curve to flatten, every subsequent dollar works at maximum efficiency.",
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
        expandedSay: "Rather than treating that bottleneck as an anomaly, we've formalized a two-day mandatory compliance buffer into our campaign calendar.\n\nWe're also setting up a pre-approved claims library with legal so our creative team never hits that friction again during rapid testing.",
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
    glanceSay: `Looking at our overall progress, ${corePoint.replace(/^[-*•]\s*/, '')}. We're closely monitoring ${topMetric}, and our cross-functional execution is structured to keep milestones on schedule.`,
    glanceBullets: [
      `• Status: ${corePoint.slice(0, 42)}`,
      `• Key metric: ${topMetric}`,
      `• Execution aligned to sprint milestones`
    ],
    expandedSay: `To build on that and go a layer deeper into what the data is showing: our core operating priority is maintaining steady execution velocity while monitoring ${topMetric} day-over-day.\n\nBy keeping cross-functional handoffs tight and addressing potential dependencies early, we ensure that every milestone delivers real measurable impact without operational surprises.`,
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
    expandedSay: `Going a layer deeper into why I recommend that sequence: moving methodically through this checkpoint prevents costly rework and validates our core assumptions before broader rollout.\n\nOnce we verify performance against our targets, we can aggressively expand our operational footprint with high confidence.`,
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
      expandedSay: `To put that metric into context: having verified stability on ${m.label} proves that our baseline operations are functioning as intended.\n\nWe're continuing to track this day-over-day to ensure there is no unexpected volatility as we scale into the next phase.`,
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
      expandedSay: `To explain the strategic reasoning behind that boundary: it is crucial that we don't rush into premature scaling before our test gates pass.\n\nBy adhering strictly to this guardrail, we ensure high execution fidelity and protect our blended unit economics.`,
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
      expandedSay: `To explain why this decision is pivotal right now: having executive clarity on this direction today removes ambiguity across squads, protects our sprint velocity, and ensures we deploy resources against the highest-leverage outcome.`,
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
    expandedSay: "Let me pull the archival records right after our session wraps up today and provide you and the team with the verified figures so we're working off exact data.",
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
