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
 * Fixes phonetic speech recognition mishearings for brand and project names
 */
export function cleanSpeechTranscriptText(text) {
  if (!text) return '';
  return text
    .replace(/\b(threetics|three\s*tics|three\s*ticks|three\s*tix|celtics|athletics|create\s*x|crea\s*lytics|crealytic|crealytix|realytics)\b/gi, 'Crealytics')
    .replace(/\b(kraft\s*shala|craftshala|kraft\s*sala)\b/gi, 'Kraftshala')
    .replace(/\b(sports\s*keeda|sport\s*skeeda|sports\s*kida)\b/gi, 'Sportskeeda')
    .replace(/\b(unleavable|un\s*leavables)\b/gi, 'Unleavables')
    .replace(/\b(home\s*crust|home\s*trust)\b/gi, 'Homecrust')
    .replace(/\b(torsten|thorsten|tor\s*sten)\b/gi, 'Torsten');
}

/**
 * Normalizes speech-to-text phonetic approximations, garbled acronyms, and muddled spoken words
 */
export function normalizeSpokenPhonetics(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\b(threetics|three\s*tics|three\s*ticks|three\s*tix|celtics|athletics|create\s*x|crea\s*lytics|crealytic|crealytix|realytics)\b/gi, 'crealytics')
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

const COMMON_MARKETING_WORDS = new Set([
  'campaign', 'campaigns', 'marketing', 'performance', 'approach', 'handling',
  'result', 'results', 'data', 'metrics', 'work', 'working', 'client', 'clients',
  'question', 'questions', 'tell', 'like', 'think', 'look', 'looking', 'project', 'projects'
]);

export function tokenMatchesText(token, textLower, wordTokens) {
  if (wordTokens && wordTokens.has(token)) return true;
  if (textLower && textLower.includes(token)) return true;
  if (token && token.length > 3) {
    const root = token.replace(/(?:ing|ies|es|ed|s)$/, '');
    if (root.length >= 3) {
      if (wordTokens && (wordTokens.has(root) || wordTokens.has(root + 's') || wordTokens.has(root + 'ing') || wordTokens.has(root + 'ed'))) return true;
      if (textLower && textLower.includes(root)) return true;
    }
  }
  return false;
}

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
/**
 * Scored sentence-level retrieval from candidate notes.
 * Extracts individual sentences across matching chunks and scores them by exact query keyword overlap.
 */
export function findBestMatchingSentencesFromNotes(queryText, chunks, maxSentences = 3) {
  if (!chunks || chunks.length === 0 || !queryText) return [];

  const normalized = normalizeSpokenPhonetics(queryText);
  const qLower = normalized.toLowerCase();
  const { coreQuestion } = extractCoreQuestionFromSpeech(normalized);
  const coreLower = (coreQuestion || normalized).toLowerCase();

  const coreTokens = coreLower.split(/[^a-z0-9%$\-+]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const queryTokens = qLower.split(/[^a-z0-9%$\-+]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const topSections = findTopMatchingSections(queryText, chunks, 4);
  if (topSections.length === 0) return [];

  const candidateSentences = [];
  const seenSentences = new Set();

  topSections.forEach(section => {
    let currentTopicHeader = '';
    section.lines.forEach(rawLine => {
      let cleanLine = rawLine.replace(/^[•*\-#>\d.]+\s*/, '').trim();
      if (!cleanLine) return;
      if (cleanLine.match(/^SECTION\s*\d+/i) || cleanLine.match(/^PART\s*\d+/i)) return;

      // Clean prefix labels like "Scenario 1: CTR High but Sales Low:"
      if (cleanLine.match(/^(?:scenario\s*\d+|section\s*\d+|step\s*\d+|part\s*\d+)[:=]/i)) {
        cleanLine = cleanLine.replace(/^(?:scenario\s*\d+|section\s*\d+|step\s*\d+|part\s*\d+)[:=]\s*/i, '').trim();
      }

      // If line ends with colon and is short, it is a topic header (e.g. "A/B Testing:", "Negative Keywords:")
      if (cleanLine.endsWith(':') && cleanLine.length < 80) {
        currentTopicHeader = cleanLine.replace(/[:=]+$/, '').trim();
        return;
      }

      if (cleanLine.length < 12) return;

      // Enrich sub-bullet line with its parent topic header so context is never lost!
      let enrichedLine = cleanLine;
      if (currentTopicHeader && !cleanLine.toLowerCase().includes(currentTopicHeader.toLowerCase())) {
        enrichedLine = `${currentTopicHeader}: ${cleanLine}`;
      }

      const subSentences = enrichedLine.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(s => s.length >= 15 && !s.endsWith(':'));
      const toProcess = subSentences.length > 0 ? subSentences : [enrichedLine];

      toProcess.forEach(sent => {
        const sentLower = sent.toLowerCase();
        const sentKey = sentLower.replace(/[^a-z0-9]+/g, '');
        if (seenSentences.has(sentKey)) return;
        seenSentences.add(sentKey);

        let sentScore = 0;

        // Core question tokens (stemmed & IDF-weighted)
        coreTokens.forEach(token => {
          const isCommon = COMMON_MARKETING_WORDS.has(token);
          if (tokenMatchesText(token, sentLower)) {
            sentScore += isCommon ? 4 : 18;
          }
        });

        // General query tokens
        queryTokens.forEach(token => {
          if (!coreTokens.includes(token)) {
            const isCommon = COMMON_MARKETING_WORDS.has(token);
            if (tokenMatchesText(token, sentLower)) {
              sentScore += isCommon ? 1 : 6;
            }
          }
        });

        // Exact core question phrase match
        if (coreLower.length > 10 && sentLower.includes(coreLower)) {
          sentScore += 40;
        }

        // Numbers/metrics bonus if question asks about quantitative data
        const isQuantitative = /metric|number|data|cpc|ctr|cpa|acos|roas|result|spend|budget|impressions|clicks|conversion|order|revenue|profit/i.test(qLower);
        if (isQuantitative && /[\d%₹$€]/.test(sent)) {
          sentScore += 8;
        }

        // Section relevance bonus
        sentScore += Math.min(8, Math.round(section.score / 5));

        if (sentScore > 12) {
          candidateSentences.push({
            sentence: sent,
            score: sentScore,
            sectionTitle: section.title,
            metrics: section.metrics || []
          });
        }
      });
    });
  });

  return candidateSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences);
}

/**
 * High-confidence signature matcher for verified interview scenarios.
 * ONLY matches when discriminating signature keywords are present.
 * Never misfires on loose words like "curious" or "interest".
 */
export function matchCuratedScenarioBySignature(queryText, allScenarios) {
  if (!queryText || !allScenarios || allScenarios.length === 0) return null;

  const normalized = normalizeSpokenPhonetics(queryText);
  const qLower = normalized.toLowerCase();
  const { coreQuestion } = extractCoreQuestionFromSpeech(normalized);
  const coreLower = (coreQuestion || normalized).toLowerCase();

  // 1. Not on CV / Outside Interests (crealytics-q8)
  // CRITICAL: Requires explicit CV or outside of work inquiry, NEVER matches on single word 'curious'
  const isNotOnCv = (
    coreLower.includes("not on your cv") || coreLower.includes("isn't on your cv") || coreLower.includes("not in your cv") ||
    coreLower.includes("not on the cv") || coreLower.includes("outside of work") || coreLower.includes("outside work") ||
    coreLower.includes("in your free time") || coreLower.includes("your hobbies") ||
    coreLower.includes("something about yourself that isn't on") || coreLower.includes("not reflected in your cv") ||
    qLower.includes("not on your cv") || qLower.includes("outside of work") || qLower.includes("outside work")
  );
  if (isNotOnCv) {
    const s = allScenarios.find(s => s.id === 'crealytics-q8');
    if (s) return s;
  }

  // 2. Campaign C Diagnosis & Anomaly (master-q2)
  const isCampC = (
    coreLower.includes("campaign c") || qLower.includes("campaign c") ||
    ((coreLower.includes("roas") || qLower.includes("roas")) && (coreLower.includes("0.95") || coreLower.includes("31.43")))
  );
  if (isCampC) {
    const s = allScenarios.find(s => s.id === 'master-q2');
    if (s) return s;
  }

  // 3. Excel & VLOOKUP Formula (master-q5)
  const isExcelVlookup = (
    coreLower.includes("vlookup") || qLower.includes("vlookup") ||
    coreLower.includes("conditional formatting") ||
    ((coreLower.includes("excel") || qLower.includes("excel")) && (coreLower.includes("formula") || coreLower.includes("practical") || coreLower.includes("did in excel") || coreLower.includes("sheet")))
  );
  if (isExcelVlookup) {
    const s = allScenarios.find(s => s.id === 'master-q5');
    if (s) return s;
  }

  // 4. Weighted CTR in Pivot Table (master-q7)
  const isWeightedCtr = (
    coreLower.includes("weighted ctr") || qLower.includes("weighted ctr") ||
    ((coreLower.includes("ctr") || qLower.includes("ctr")) && (coreLower.includes("pivot table") || coreLower.includes("pivot")))
  );
  if (isWeightedCtr) {
    const s = allScenarios.find(s => s.id === 'master-q7');
    if (s) return s;
  }

  // 5. Case Study Walkthrough & Opening Approach (master-q1)
  const isWalkthrough = (
    (coreLower.includes("case study") || qLower.includes("case study") || coreLower.includes("presentation") || coreLower.includes("assignment")) &&
    (coreLower.includes("walk through") || coreLower.includes("walk us through") || coreLower.includes("approached") || coreLower.includes("compare campaign") || coreLower.includes("comparing campaign")) &&
    !coreLower.includes("campaign c") && !coreLower.includes("campaign b") && !coreLower.includes("vlookup") && !coreLower.includes("excel")
  );
  if (isWalkthrough) {
    const s = allScenarios.find(s => s.id === 'master-q1');
    if (s) return s;
  }

  // 6. Campaign for Branding (master-q3)
  const isBranding = (
    (coreLower.includes("branding") || qLower.includes("branding") || coreLower.includes("brand awareness") || qLower.includes("brand awareness")) &&
    (coreLower.includes("which campaign") || coreLower.includes("choose") || coreLower.includes("campaign c") || coreLower.includes("objective"))
  );
  if (isBranding) {
    const s = allScenarios.find(s => s.id === 'master-q3');
    if (s) return s;
  }

  // 7. Improve / Scale Campaign B (master-q4)
  const isCampB = (
    (coreLower.includes("campaign b") || qLower.includes("campaign b")) &&
    (coreLower.includes("improve") || coreLower.includes("scale") || coreLower.includes("doing well") || coreLower.includes("strong performance"))
  );
  if (isCampB) {
    const s = allScenarios.find(s => s.id === 'master-q4');
    if (s) return s;
  }

  // 8. Audience Level Findings & Prioritisation (master-q6)
  const isAudienceFindings = (
    (coreLower.includes("audience") || qLower.includes("audience")) &&
    (coreLower.includes("findings") || coreLower.includes("prioritise") || coreLower.includes("prioritize") || coreLower.includes("de prospecting") || coreLower.includes("lookalike"))
  );
  if (isAudienceFindings) {
    const s = allScenarios.find(s => s.id === 'master-q6');
    if (s) return s;
  }

  // 9. PPC Math Calculation Scenario (master-q8)
  const isPpcMath = (
    coreLower.includes("100,000") || coreLower.includes("100k") || coreLower.includes("calculation scenario") ||
    (coreLower.includes("math") && coreLower.includes("ppc")) ||
    (coreLower.includes("3,000 clicks") && coreLower.includes("impressions"))
  );
  if (isPpcMath) {
    const s = allScenarios.find(s => s.id === 'master-q8');
    if (s) return s;
  }

  // 10. Why Crealytics (master-q10 / crealytics-q2)
  const isWhyCrealytics = (
    coreLower.includes("why crealytics") || qLower.includes("why crealytics") ||
    coreLower.includes("why this role") || qLower.includes("why this role") ||
    coreLower.includes("why join crealytics") || coreLower.includes("why work at crealytics") ||
    coreLower.includes("why should we hire you") || qLower.includes("why should we hire you")
  );
  if (isWhyCrealytics) {
    const s = allScenarios.find(s => s.id === 'master-q10') || allScenarios.find(s => s.id === 'crealytics-q2');
    if (s) return s;
  }

  // 11. Candidate Story & Tell Me About Yourself (master-q9 / crealytics-q1 / func-q1)
  const isIntro = (
    (coreLower.includes("tell me about yourself") || qLower.includes("tell me about yourself") ||
     coreLower.includes("introduce yourself") || qLower.includes("introduce yourself") ||
     coreLower.includes("tell us about yourself") || qLower.includes("tell us about yourself") ||
     coreLower.includes("walk me through your background") || qLower.includes("walk me through your background")) &&
    !isNotOnCv && !coreLower.includes("cv") && !coreLower.includes("resume")
  );
  if (isIntro) {
    const s = allScenarios.find(s => s.id === 'master-q9') || allScenarios.find(s => s.id === 'crealytics-q1') || allScenarios.find(s => s.id === 'func-q1');
    if (s) return s;
  }

  // 12. CTR Up, CVR Down Diagnostic (func-q3 / master-q12)
  const isCtrUpCvrDown = (
    (coreLower.includes("ctr") || qLower.includes("ctr")) &&
    (coreLower.includes("cvr") || coreLower.includes("conversion rate") || coreLower.includes("conversions dropped") || coreLower.includes("sales low") || coreLower.includes("conversions down"))
  );
  if (isCtrUpCvrDown) {
    const s = allScenarios.find(s => s.id === 'func-q3') || allScenarios.find(s => s.id === 'master-q12');
    if (s) return s;
  }

  // 13. Zero-Conversion Campaign Triage (func-q4)
  const isZeroConversions = (
    (coreLower.includes("zero conversion") || coreLower.includes("0 conversion") || coreLower.includes("no conversion") || coreLower.includes("zero conversions") || coreLower.includes("no conversions")) &&
    (coreLower.includes("spending") || coreLower.includes("budget") || coreLower.includes("full budget") || coreLower.includes("burn"))
  );
  if (isZeroConversions) {
    const s = allScenarios.find(s => s.id === 'func-q4');
    if (s) return s;
  }

  // 13b. Campaign Underperformance Diagnostic (master-q11)
  const isUnderperforming = (
    coreLower.includes("underperform") || qLower.includes("underperform") ||
    coreLower.includes("under-perform") || qLower.includes("under-perform") ||
    ((coreLower.includes("campaign") || qLower.includes("campaign")) && (coreLower.includes("not performing") || coreLower.includes("struggling") || coreLower.includes("performance drop") || coreLower.includes("dropping in performance")))
  );
  if (isUnderperforming) {
    const s = allScenarios.find(s => s.id === 'master-q11');
    if (s) return s;
  }



  // 14. Account Audit Playbook (func-q2)
  const isAccountAudit = (
    coreLower.includes("audit playbook") || coreLower.includes("account audit") ||
    coreLower.includes("auditing an underperforming") || coreLower.includes("take over an account") ||
    coreLower.includes("taking over an account") || coreLower.includes("6-step audit")
  );
  if (isAccountAudit) {
    const s = allScenarios.find(s => s.id === 'func-q2');
    if (s) return s;
  }

  // 15. Attribution vs Incrementality vs MMM (master-q15)
  const isAttribution = (
    coreLower.includes("incrementality") || qLower.includes("incrementality") ||
    (coreLower.includes("attribution") && (coreLower.includes("mmm") || coreLower.includes("marketing mix") || coreLower.includes("difference")))
  );
  if (isAttribution) {
    const s = allScenarios.find(s => s.id === 'master-q15');
    if (s) return s;
  }

  // 16. Unfamiliar Platforms (PMax, Microsoft Ads, LinkedIn) (master-q14)
  const isUnfamiliarPlatforms = (
    coreLower.includes("microsoft ads") || coreLower.includes("pmax") || coreLower.includes("performance max") ||
    (coreLower.includes("unfamiliar platform") || coreLower.includes("other platforms"))
  );
  if (isUnfamiliarPlatforms) {
    const s = allScenarios.find(s => s.id === 'master-q14');
    if (s) return s;
  }

  // 17. Client Wants to Increase Spend on High CTR (master-q12)
  const isHighCtrSpend = (
    coreLower.includes("high ctr") &&
    (coreLower.includes("spend more") || coreLower.includes("increase spend") || coreLower.includes("increase budget") || coreLower.includes("more budget"))
  );
  if (isHighCtrSpend) {
    const s = allScenarios.find(s => s.id === 'master-q12');
    if (s) return s;
  }

  // 18. Data Doesn't Give Clear Answer (master-q13)
  const isDataAmbiguity = (
    coreLower.includes("clear answer") || coreLower.includes("ambiguous data") || coreLower.includes("unclear data") ||
    coreLower.includes("data doesn't give")
  );
  if (isDataAmbiguity) {
    const s = allScenarios.find(s => s.id === 'master-q13');
    if (s) return s;
  }

  // 19. Google Search Ads Unleavables Project (crealytics-q3)
  const isGoogleSearch = (
    coreLower.includes("unleavables") &&
    (coreLower.includes("google search") || coreLower.includes("search project") || coreLower.includes("search ad"))
  );
  if (isGoogleSearch) {
    const s = allScenarios.find(s => s.id === 'crealytics-q3');
    if (s) return s;
  }

  // 20. Meta Ads Unleavables Project & Cost Cap (crealytics-q4)
  const isMetaUnleavables = (
    (coreLower.includes("unleavables") && (coreLower.includes("meta") || coreLower.includes("facebook") || coreLower.includes("add-to-cart") || coreLower.includes("cost cap"))) ||
    ((coreLower.includes("cost cap") || qLower.includes("cost cap")) && (coreLower.includes("highest volume") || coreLower.includes("bidding strategy")))
  );
  if (isMetaUnleavables) {
    const s = allScenarios.find(s => s.id === 'crealytics-q4');
    if (s) return s;
  }

  // 21. Homecrust Amazon PPC / What Went Wrong (crealytics-q5)
  const isHomecrustAmazon = (
    coreLower.includes("homecrust") ||
    ((coreLower.includes("amazon") || qLower.includes("amazon")) && (coreLower.includes("acos") || coreLower.includes("173") || (coreLower.includes("went wrong") && coreLower.includes("ppc"))))
  );
  if (isHomecrustAmazon) {
    const s = allScenarios.find(s => s.id === 'crealytics-q5');
    if (s) return s;
  }

  // 22. Vibe Coding (crealytics-q13)
  const isVibeCoding = (
    coreLower.includes("vibe coding") || qLower.includes("vibe coding") ||
    coreLower.includes("vibe code") || qLower.includes("vibe code") ||
    coreLower.includes("what is vibe") || qLower.includes("what is vibe")
  );
  if (isVibeCoding) {
    const s = allScenarios.find(s => s.id === 'crealytics-q13');
    if (s) return s;
  }

  // 23. Spare Room Productivity App (crealytics-q14)
  const isSpareRoom = (
    coreLower.includes("spare room") || qLower.includes("spare room") ||
    coreLower.includes("calendar app") || coreLower.includes("productivity app") ||
    coreLower.includes("therapy session") || coreLower.includes("app you built")
  );
  if (isSpareRoom) {
    const s = allScenarios.find(s => s.id === 'crealytics-q14');
    if (s) return s;
  }

  // 24. Gaming Projects in Roblox (crealytics-q15)
  const isRoblox = (
    coreLower.includes("roblox") || qLower.includes("roblox") ||
    (coreLower.includes("gaming") && (coreLower.includes("project") || coreLower.includes("concept")))
  );
  if (isRoblox) {
    const s = allScenarios.find(s => s.id === 'crealytics-q15');
    if (s) return s;
  }

  // 25. Dehradun / Remote Work (crealytics-q11)
  const isDehradunRemote = (
    coreLower.includes("dehradun") || qLower.includes("dehradun") ||
    ((coreLower.includes("remote") || qLower.includes("remote")) && (coreLower.includes("work from home") || coreLower.includes("international team") || coreLower.includes("stay organised") || coreLower.includes("stay organized")))
  );
  if (isDehradunRemote) {
    const s = allScenarios.find(s => s.id === 'crealytics-q11');
    if (s) return s;
  }

  // 26. Strengths & Weaknesses (crealytics-q9)
  const isStrengthsWeaknesses = (
    coreLower.includes("greatest strength") || coreLower.includes("biggest weakness") ||
    (coreLower.includes("strength") && coreLower.includes("weakness")) ||
    (coreLower.includes("what are you working on") && coreLower.includes("improving"))
  );
  if (isStrengthsWeaknesses) {
    const s = allScenarios.find(s => s.id === 'crealytics-q9');
    if (s) return s;
  }

  // 27. Disagreements with Colleagues (crealytics-q22)
  const isDisagreements = (
    coreLower.includes("disagree with colleague") || coreLower.includes("disagreements with colleagues") ||
    coreLower.includes("disagree with a colleague") || coreLower.includes("handling disagreements")
  );
  if (isDisagreements) {
    const s = allScenarios.find(s => s.id === 'crealytics-q22');
    if (s) return s;
  }

  // 28. Favourite Books / Reading (crealytics-q23)
  const isBooks = (
    coreLower.includes("favorite book") || coreLower.includes("favourite book") ||
    coreLower.includes("favorite books") || coreLower.includes("favourite books") ||
    coreLower.includes("stormlight") || coreLower.includes("sanderson") ||
    (coreLower.includes("what do you read") || coreLower.includes("reading habits"))
  );
  if (isBooks) {
    const s = allScenarios.find(s => s.id === 'crealytics-q23');
    if (s) return s;
  }

  // 29. CV / Resume Walkthrough (crealytics-q24)
  const isCvWalkthrough = (
    (coreLower.includes("walk me through your cv") || qLower.includes("walk me through your cv") ||
     coreLower.includes("walk through your cv") || qLower.includes("walk through your cv") ||
     coreLower.includes("walk me through your resume") || qLower.includes("walk me through your resume") ||
     coreLower.includes("take me through your cv") || qLower.includes("take me through your cv"))
  );
  if (isCvWalkthrough) {
    const s = allScenarios.find(s => s.id === 'crealytics-q24');
    if (s) return s;
  }

  // 30. Questions for Interviewer (crealytics-q7)
  const isQuestionsForInterviewer = (
    coreLower.includes("questions for me") || coreLower.includes("questions for us") ||
    coreLower.includes("anything to ask us") || coreLower.includes("any questions for me")
  );
  if (isQuestionsForInterviewer) {
    const s = allScenarios.find(s => s.id === 'crealytics-q7');
    if (s) return s;
  }

  return null;
}

/**
 * Synthesizes human, leader-like answers for ANY question
 * using high-precision scenario matching and intelligent sentence-level notes retrieval.
 */
export function synthesizeLeaderAnswerForCustomQuestion(questionText, rawNotesText, executiveBrief, speakingStyle = {}) {
  const normalizedQuery = normalizeSpokenPhonetics(questionText);
  const qLower = normalizedQuery.toLowerCase();

  // Extract core closing question to avoid getting misled by opening preamble
  const { coreQuestion } = extractCoreQuestionFromSpeech(normalizedQuery);
  const coreLower = (coreQuestion || normalizedQuery).toLowerCase();
  const chunks = chunkLargeNotes(rawNotesText);

  const metrics = executiveBrief?.importantNumbers || [];
  const textLower = (rawNotesText || "").toLowerCase();

  // 1. High-Precision Curated Scenario Matching
  const isCrealyticsContext = textLower.includes("functional") ||
                             textLower.includes("account diagnostics") ||
                             textLower.includes("account audit") ||
                             textLower.includes("crealytics") ||
                             textLower.includes("torsten") ||
                             textLower.includes("kraftshala") ||
                             textLower.includes("sportskeeda") ||
                             textLower.includes("unleavables") ||
                             textLower.includes("homecrust");

  if (isCrealyticsContext) {
    const masterScenarios = generateQuestionsFromNotes(rawNotesText, "crealytics-technical-master");
    const funcScenarios = generateQuestionsFromNotes(rawNotesText, "crealytics-functional");
    const interviewScenarios = generateQuestionsFromNotes(rawNotesText, "crealytics-interview");
    const allScenarios = [...masterScenarios, ...funcScenarios, ...interviewScenarios];

    const matchedScenario = matchCuratedScenarioBySignature(questionText, allScenarios);

    if (matchedScenario) {
      return {
        ...matchedScenario,
        id: `matched-${Date.now()}`,
        question: questionText,
        speaker: "Meeting Attendee",
        isCuratedScenario: true,
        stuckRecovery: {
          ...matchedScenario.stuckRecovery,
          questionSummary: coreQuestion || questionText
        }
      };
    }
  }

  // 2. Intelligent Sentence-Level Synthesis from Notes (Context-Aware for ANY Question!)
  const bestSentences = findBestMatchingSentencesFromNotes(questionText, chunks, 3);

  if (bestSentences.length > 0) {
    const leadSentence = bestSentences[0].sentence.replace(/[.,:;]+$/, '').trim();
    const contextSentence = bestSentences[1] ? bestSentences[1].sentence.replace(/[.,:;]+$/, '').trim() : '';
    const supportSentence = bestSentences[2] ? bestSentences[2].sentence.replace(/[.,:;]+$/, '').trim() : '';
    const sectionTitle = bestSentences[0].sectionTitle || "Meeting Notes Context";

    // Extract relevant metric if question asks for data
    const isQuantitativeQuery = /metric|number|data|cpc|ctr|cpa|acos|roas|result|spend|budget|impressions|clicks|conversion|orders|revenue|profit/i.test(qLower);
    const relevantMetrics = bestSentences[0].metrics?.length > 0
      ? bestSentences[0].metrics
      : (isQuantitativeQuery ? metrics.slice(0, 2) : []);

    let metricMention = "";
    if (relevantMetrics.length > 0) {
      metricMention = relevantMetrics.map(m => `${m.label} is at ${m.value}`).join(', and ');
    }

    // Natural human opening tailored to question structure
    let opening = "To answer that directly:";
    if (coreLower.startsWith("why") || coreLower.includes("why did") || coreLower.includes("why is")) {
      opening = "The main reasoning behind that comes down to:";
    } else if (coreLower.startsWith("how") || coreLower.includes("how do") || coreLower.includes("how would")) {
      opening = "Our direct approach on that is:";
    } else if (coreLower.includes("what would you recommend") || coreLower.includes("opinion") || coreLower.includes("what should")) {
      opening = "Looking at the performance data, what I'd recommend is:";
    } else if (coreLower.includes("campaign") || coreLower.includes("project")) {
      opening = "In that campaign, the key outcome was that";
    } else if (coreLower.includes("risk") || coreLower.includes("problem") || coreLower.includes("mistake") || coreLower.includes("challenge") || coreLower.includes("went wrong")) {
      opening = "That's a really fair question. For me, the main learning was:";
    }

    // Spoken glance answer (Box 1)
    const s1 = opening.endsWith(':') ? `${opening} ${leadSentence}.` : `${opening} ${leadSentence.charAt(0).toLowerCase() + leadSentence.slice(1)}.`;
    const s2 = contextSentence ? ` ${contextSentence}.` : '';
    const s3 = metricMention ? ` In terms of numbers, ${metricMention}.` : '';
    const s4 = " The key takeaway is letting verified performance data guide decisions rather than relying on assumptions.";
    const glanceSay = `${s1}${s2}${s3}${s4}`;

    // Strategic continuation (Box 2)
    const p1 = `To build on that and explain what was happening under the hood: when you analyze how users interact with that flow, the real unlock comes from understanding intent and eliminating friction before the conversion point. ${supportSentence ? `${supportSentence}.` : ''}`;
    const p2 = `What that experience reinforced for me was treating every campaign decision as an empirical test. By focusing on root-cause mechanics rather than surface-level vanity metrics, we protect unit economics and build rock-solid fundamentals.`;
    const expandedSay = `${p1}\n\n${p2}`;

    // Bullets (Box 1 Anchors)
    const glanceBullets = [
      `• ${leadSentence}`,
      contextSentence ? `• ${contextSentence}` : `• Grounded in verified notes: ${sectionTitle}`,
      metricMention ? `• Data: ${metricMention}` : `• Focus on margin efficiency and verified feedback loops`
    ];

    return {
      id: `custom-${Date.now()}`,
      category: "expected",
      speaker: "Meeting Attendee",
      question: questionText,
      topic: sectionTitle,
      babeTag: `babe 👀 ${sectionTitle}`,
      simplestQuestion: `Directly addressing: ${coreQuestion || questionText}`,
      glanceSay,
      glanceBullets,
      expandedSay,
      supportingContext: `Retrieved from Section: "${sectionTitle}" · ${leadSentence}`,
      extraInformation: `Context from "${sectionTitle}": ${leadSentence}. ${contextSentence}`,
      isCuratedScenario: false,
      isUnknown: false,
      stuckRecovery: {
        breatheMsg: "Take a breath babe. Lead with your verified notes.",
        questionSummary: coreQuestion || questionText,
        points: [leadSentence.slice(0, 45), contextSentence ? contextSentence.slice(0, 45) : "Data-driven approach", "Next steps planned"],
        easySay: glanceSay,
        stallSay: "Give me two seconds on that—just pulling up the exact context."
      }
    };
  }

  // 3. Fallback Safeguard: Query asks for unverified information completely absent from notes
  return {
    id: `custom-${Date.now()}`,
    category: "unknown",
    speaker: "Meeting Attendee",
    question: questionText,
    topic: "Unverified Data Point",
    babeTag: "babe, this isn't in your notes 🔒 (preserve credibility)",
    simplestQuestion: "They're asking for a detail outside your provided notes.",
    glanceSay: "I want to be precise and check the verified report rather than guess an off-the-cuff number—let me pull that up right after our call.",
    glanceBullets: [
      "• Specific detail not in current notes",
      "• Protect executive credibility (do not guess)",
      "• Commit to immediate post-call follow-up"
    ],
    expandedSay: "Let me pull the audited granular data right after we wrap up today and send the exact breakdown over so we're working off verified facts rather than an estimate.",
    supportingContext: "Executive safety guardrail: Grounded in your actual notes. No hallucinations.",
    extraInformation: "Grounded defense: Notes contain other sections, but zero verified mentions of this specific inquiry.",
    isCuratedScenario: false,
    isUnknown: true,
    stuckRecovery: {
      breatheMsg: "Take a breath. Leaders never guess numbers on the fly.",
      questionSummary: coreQuestion || questionText,
      points: ["Not in notes", "Do not invent data", "Follow up immediately after call"],
      easySay: "I want to be precise and check the verified report rather than guess an off-the-cuff number—let me pull that up right after our call.",
      stallSay: "I want to ensure the numbers are 100% verified before I speak to that."
    }
  };
}

export function generateQuestionsFromNotes(rawNotesText, templateId = "custom") {
  const brief = parseNotesToExecutiveBrief(rawNotesText);
  const metrics = brief.importantNumbers;
  const remember = brief.thingsToRemember;
  const ask = brief.thingsToAsk;
  const guardrails = brief.guardrails;

  // Extract candidate themes from notes
  const textLower = rawNotesText.toLowerCase();

  // If this matches Crealytics Functional / Department Round (Diagnostics, Account Audits, Client Scenarios)
  
  // If this matches Crealytics interview template (Torsten Christ, Performance Marketing Associate, Sportskeeda, Kraftshala)
  if (templateId === "crealytics-interview" || (templateId === "custom" && (textLower.includes("torsten christ") || textLower.includes("the roo edition")))) {
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
      },
      {
        id: "crealytics-q24",
        category: "expected",
        speaker: "Torsten Christ (Head of HR)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Can you take me through your CV?",
        topic: "CV & Professional Journey Overview",
        babeTag: "babe 👀 Sportskeeda NFL discipline + Kraftshala campaigns + vibe coding",
        simplestQuestion: "Torsten wants a concise, structured walk through your CV milestones from media to performance marketing.",
        startWithPrompt: "Start with: “Walking through my CV, it really connects editorial discipline…”",
        glanceSay: "Walking through my CV, it connects audience psychology, editorial discipline, and hands-on performance marketing. I started in media and communication covering the NFL at Sportskeeda—writing over 600 articles taught me strict deadline discipline and understanding what captures attention. From there, I transitioned into digital marketing at Kraftshala to work directly with quantitative data and auction mechanics. On my CV, that spans three core hands-on campaigns: in Google Search Ads, I restructured ad groups into tight intent clusters, driving CTR from 5.2% to 14.8% and cutting CPC by 21% down to ₹4.21. On Meta Ads for Unleavables, I ran a Cost Cap experiment that brought cost per add-to-cart down from ₹91 to ₹29 with an 11% CTR. And on Amazon for Homecrust, I managed sponsored ads delivering an ACoS of 28.7% against a 35% benchmark. Most recently, I've been vibe coding and building AI prototypes with tools like Antigravity and Claude, exploring how technology and automation make marketing smarter and more efficient.",
        glanceBullets: [
          "• Media & Editorial (Sportskeeda): 600+ NFL articles, audience psychology & deadline discipline",
          "• Google Search Ads: CTR surged 5.2% → 14.8%, CPC cut 21% to ₹4.21, 17/19 conversions on ₹777 spend",
          "• Meta Ads (Unleavables): Cost Cap bidding dropped cost/ATC from ₹91 → ₹29, 11.04% CTR, 15 ATCs",
          "• Amazon Ads (Homecrust): ACoS 28.7% vs 35% target, ₹6,432 sales on ₹1,848 spend",
          "• Vibe Coding & AI: Hands-on prototypes (Antigravity/Claude) exploring technology & marketing efficiency"
        ],
        expandedSay: "What ties my entire CV together is a natural evolution from storytelling to evidence-based optimization. In sports journalism, you learn very quickly what hooks a reader and what gets ignored. But in performance marketing, you get immediate feedback from auction algorithms, search queries, and conversion funnels.\n\nWhether it was diagnosing query intent in Google Search, testing bidding caps on Meta, or balancing margins on Amazon, I've loved the process of forming a hypothesis, testing it against real data, and learning from the evidence. Combining that with vibe coding has made me really excited about how automated systems and AI can solve enterprise marketing challenges when guided by critical human judgment.",
        supportingContext: "Notes Part 1, 4 & 7: Complete CV walkthrough spanning Sportskeeda (600+ articles), Google Search (CTR 14.78%, CPC ₹4.21), Meta (Cost Cap ₹91→₹29), Amazon (ACoS 28.7%), and Vibe Coding.",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Sportskeeda (600 NFL articles) → Google Search (14.8% CTR) → Meta (Cost Cap ₹29) → Vibe coding.",
          questionSummary: "Walk me through your CV?",
          points: ["Sportskeeda: 600+ NFL articles (audience psychology & deadlines)", "Google Search Ads: CTR surged to 14.8%, CPC cut 21% to ₹4.21", "Meta Ads (Unleavables): Cost Cap dropped cost/ATC to ₹29", "Amazon (Homecrust): ACoS 28.7%", "Vibe coding with Antigravity & Claude"],
          easySay: "My CV spans sports journalism at Sportskeeda (600+ NFL articles), hands-on campaigns across Google, Meta, and Amazon at Kraftshala, and vibe coding prototypes using AI.",
          stallSay: "I'd love to walk you through my CV—it connects editorial discipline, quantitative marketing, and tech prototypes."
        }
      }
    ];
  }



  if (templateId === "crealytics-functional" || (templateId === "custom" && (textLower.includes("account diagnostics") || textLower.includes("account audit")))) {
    return [
      {
        id: "func-q1",
        category: "expected",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about yourself and your transition from editorial into performance marketing.",
        topic: "Professional Profile & Transition",
        babeTag: "babe 👀 editorial discipline + audience psychology to quantitative auction testing",
        simplestQuestion: "How your editorial research and headline testing evolved into quantitative auction and performance marketing problem-solving.",
        startWithPrompt: "Start with: “I started out in writing and editing at Sportskeeda…”",
        glanceSay: "I started in writing and editing at Sportskeeda, where editing over a thousand articles and authoring six hundred NFL pieces taught me audience psychology and strict deadline discipline. But over time, I became fascinated by what happens beyond the content itself—how auction pacing works, why users drop off in checkout funnels, and how quantitative data can validate creative hypotheses. That led me to Kraftshala, where I've managed campaigns across Google Search, Meta Ads, and Amazon PPC. I love bringing together communication intuition and rigorous data to test hypotheses and optimize for real margins.",
        glanceBullets: [
          "• Editorial foundation: 1,000+ edited, 600+ written under daily deadlines (audience psychology & headline resonance)",
          "• Quantitative pivot: moving beyond content into auction mechanics, pacing, and conversion funnels",
          "• Hands-on execution: Google Search (CTR 5.2%→14.8%, CPC -21%), Meta Cost Cap (₹91→₹29), Amazon PPC",
          "• Core philosophy: Treat every campaign as a structured hypothesis and optimize for true profit"
        ],
        expandedSay: "In editorial work, you have to understand what makes a headline capture attention and deliver accurate research under daily pressure. Moving into performance marketing felt like a natural quantitative evolution: instead of guessing what works, you test intent-based ad groups, analyze auction pacing, and measure post-click conversion rates.\n\nRunning campaigns across Google, Meta, and Amazon taught me to treat platform automation as a system to be understood rather than an unexamined black box. I'm excited about Crealytics because you connect algorithmic technology and first-party data directly with bottom-line profitability rather than vanity ROAS.",
        supportingContext: "Notes Section 1: Professional Profile & Performance Marketing Foundation.",
        stuckRecovery: {
          breatheMsg: "Take a breath babe. Editorial discipline → auction curiosity → hands-on Search, Meta, Amazon campaigns.",
          questionSummary: "Tell me about yourself & performance marketing transition?",
          points: ["1,000+ edited, 600+ written at Sportskeeda", "Curious about auction mechanics & conversion funnels", "Hands-on across Google, Meta, and Amazon PPC", "Hypothesis-driven & margin-first"],
          easySay: "I started in NFL sports writing where I learned audience psychology and deadlines, and moved into performance marketing to combine that communication background with quantitative data and auction testing.",
          stallSay: "I'd love to share that transition—it really started with audience psychology in editorial writing."
        }
      },
      {
        id: "func-q2",
        category: "expected",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "How would you approach auditing a new or underperforming client account?",
        topic: "Account Audit Framework",
        babeTag: "babe 👀 6-step diagnostic: Tracking → Structure → SQR/Negatives → Bidding/IS → Creative → Landing Page",
        simplestQuestion: "Step-by-step diagnostic sequence: never touch campaigns before verifying tracking; isolate brand vs generic; eliminate SQR waste.",
        startWithPrompt: "Start with: “When taking over an account, I follow a disciplined six-step diagnostic sequence…”",
        glanceSay: "When taking over an account, I follow a disciplined six-step diagnostic sequence. Step zero is always tracking and measurement integrity—verifying GA4, conversion tags, and deduplication before touching a single campaign. From there, I audit account structure to ensure brand and generic queries are isolated, analyze the Search Query Report to eliminate budget-draining search terms, evaluate bidding strategy alignment and impression share loss, inspect creative fatigue, and finally diagnose landing page mobile speed and conversion friction.",
        glanceBullets: [
          "• Step 0: Tracking health (GA4, CAPI, conversion deduplication, primary actions)",
          "• Step 1: Account structure & intent isolation (Brand vs Generic separation, match type leakage)",
          "• Step 2: SQR & negative keyword hygiene (identifying runaway search queries burning spend)",
          "• Step 3: Bidding strategy & Impression Share (IS lost to budget vs IS lost to rank, learning phases)",
          "• Step 4: Creative & copy health (RSA strength, headline-keyword alignment, fatigue)",
          "• Step 5: Post-click funnel & landing page (mobile load speed, message consistency, checkout friction)"
        ],
        expandedSay: "The reason I always begin with tracking is that making bid or budget changes on inaccurate data just compounds the problem. If conversions are double-counted or primary events are misconfigured, smart bidding algorithms optimize toward false signals.\n\nOnce tracking is verified, the biggest quick win usually comes from the Search Query Report and intent isolation. Separating brand keywords from generic terms prevents branded demand from inflating top-line ROAS and masking unprofitable generic spend. Then, by sculpting negative keywords and fixing post-click landing page disconnects, we can quickly reallocate wasted spend toward high-intent conversion clusters.",
        supportingContext: "Notes Section 3: Step-by-Step Account Audit Playbook.",
        stuckRecovery: {
          breatheMsg: "6-step sequence: 1. Tracking → 2. Structure → 3. SQR/Negatives → 4. Bidding/IS → 5. Creative → 6. Landing Page.",
          questionSummary: "How to audit a client account?",
          points: ["Step 0: Verify tracking before touching campaigns", "Isolate brand vs generic in structure", "Audit SQR for budget drainers", "Check landing page mobile speed & friction"],
          easySay: "I start by verifying tracking integrity so we never make decisions on bad data, then audit account structure to separate brand from generic, sculpt negative keywords in the SQR, and review landing page checkout friction.",
          stallSay: "When auditing a client account, I always walk through a structured six-step sequence."
        }
      },
      {
        id: "func-q3",
        category: "situational",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Our campaign CTR increased, but conversion rate and total conversions dropped. How would you diagnose what happened?",
        topic: "CTR Up, CVR Down Diagnostic",
        babeTag: "babe 👀 ad hook vs post-click disconnect: check tracking, intent leakage, and landing page mismatch",
        simplestQuestion: "Clicks up + conversions down means curiosity without buying intent: tag breaks, broad query drift, or landing page disconnect.",
        startWithPrompt: "Start with: “When CTR rises while conversion rate drops, that immediately signals a disconnect…”",
        glanceSay: "When CTR rises while conversion rate drops, that immediately signals a disconnect between the ad hook and the post-click experience. First, I verify whether conversion tracking broke or tag containers were altered. If tracking is healthy, I audit the Search Query Report to see if broad match expansion or a curiosity-driven creative hook attracted high click volume with zero buying intent. Finally, I check the landing page to ensure the specific promotion, price, or product promised in the ad is prominently visible above the fold on mobile.",
        glanceBullets: [
          "• 1. Technical check: Verify conversion tag firing, tag manager triggers, and checkout events",
          "• 2. Intent leakage: SQR audit to check if broad match or catchy copy attracted non-buyers",
          "• 3. Post-click mismatch: Ensure the ad hook and discount are immediately visible on the landing page",
          "• 4. Commercial friction: Check for sudden out-of-stock variants, price changes, or shipping fees at checkout"
        ],
        expandedSay: "In digital advertising, high CTR is not an automatic victory. A click simply represents curiosity; the conversion represents value alignment. When CTR spikes while conversions fall, it often means the ad over-promised or cast too wide a net—for example, advertising a massive promotional discount or broad solution that users cannot find once they land on the site.\n\nI’d also look at device segmentation and bounce rates. If mobile clicks surged because of accidental taps or responsive display placement leakage, mobile conversion rates will crater. Isolating the traffic by placement, query, and device allows us to prune the wasteful clicks and restore funnel alignment.",
        supportingContext: "Notes Section 4: Situational Diagnostic Scenarios (Case 1: CTR up, CVR down).",
        stuckRecovery: {
          breatheMsg: "CTR up, CVR down: 1. Tag break? 2. Intent drift? 3. Landing page mismatch? 4. Price/stock friction?",
          questionSummary: "Why did CTR rise but conversions drop?",
          points: ["Verify conversion tracking tags first", "Check SQR for curiosity clickers vs buyers", "Ensure landing page matches ad promise", "Check mobile speed and checkout friction"],
          easySay: "I check if conversion tags broke first, then audit search terms to see if broad keywords attracted curiosity clickers, and verify that the landing page delivers exactly what the ad promised.",
          stallSay: "That's a classic performance puzzle—for me, it always comes down to isolating technical issues versus intent drift."
        }
      },
      {
        id: "func-q4",
        category: "situational",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "A campaign is spending its full daily budget with zero conversions. What is your diagnostic checklist?",
        topic: "Zero-Conversion Campaign Triage",
        babeTag: "babe 👀 immediate triage: fire test transaction, open SQR for budget drainers, test mobile checkout",
        simplestQuestion: "Triage sequence: test transaction to rule out tag failure; audit SQR for 2-3 runaway queries; test mobile checkout live.",
        startWithPrompt: "Start with: “If a campaign is burning its full daily budget with zero conversions…”",
        glanceSay: "If a campaign is burning its full daily budget with zero conversions, my immediate triage has four steps. First, I fire a test transaction to verify whether conversion tracking is actually recording. Second, I open the Search Query Report immediately to see if two or three broad runaway queries sucked up eighty percent of the spend. Third, I test the landing page on an actual mobile device to ensure it isn't broken, slow, or showing out-of-stock errors. And fourth, I check whether a bidding strategy like Maximize Clicks is bidding aggressively on low-quality exploratory impressions.",
        glanceBullets: [
          "• 1. Test transaction: Confirm pixel/GA4 conversion tags are recording events live",
          "• 2. SQR audit: Identify runaway broad search queries draining 70-80% of daily spend",
          "• 3. Live mobile audit: Verify page load speed, mobile UX, and checkout button functionality",
          "• 4. Bidding strategy review: Check if automated bidding is overpaying for low-intent traffic",
          "• Action: Pause runaway wasteful queries, add negative match terms, and set bid guardrails"
        ],
        expandedSay: "The most common culprit when spend burns without conversions is runaway search term leakage. A single broad match keyword can trigger hundreds of completely irrelevant user searches that eat through the daily budget before noon.\n\nIf the search queries look reasonably relevant, then the problem is almost certainly post-click or technical: either the tracking tag failed to pass transaction values, or the landing page has a technical blocker like a broken payment gateway or slow mobile load time. By systematically checking tracking, search terms, and the checkout journey, you can contain the leak within hours rather than wasting days of budget.",
        supportingContext: "Notes Section 4: Situational Diagnostic Scenarios (Case 2: Spending with zero conversions).",
        stuckRecovery: {
          breatheMsg: "Zero conversions triage: 1. Test transaction 2. SQR query drain 3. Mobile landing page test 4. Bidding guardrail.",
          questionSummary: "Spending full budget with 0 conversions?",
          points: ["Verify tracking with a test transaction", "Check SQR for runaway broad queries", "Test mobile checkout live", "Pause wasteful queries and add negatives"],
          easySay: "I fire a test transaction to verify tracking, check the Search Query Report to pause runaway broad terms eating the budget, and test the mobile checkout page live.",
          stallSay: "If a campaign is spending with zero conversions, my first instinct is a rapid four-step triage."
        }
      },
      {
        id: "func-q5",
        category: "commercial",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "A campaign is hitting high ROAS on a small spend, and the client wants to double the budget immediately. How do you evaluate and scale?",
        topic: "Budget Scaling & Marginal Return Analysis",
        babeTag: "babe 👀 never double overnight: marginal returns compress, scale 15-20% in stages, check Impression Share",
        simplestQuestion: "Never double spend instantly—marginal ROAS drops. Scale in 15-20% increments every 3-5 days and track incremental return.",
        startWithPrompt: "Start with: “I would advise against doubling the budget overnight…”",
        glanceSay: "I would advise against doubling the budget overnight, because ad auction algorithms harvest the lowest-hanging, highest-intent users first. When you double spend instantly, the algorithm is forced into broader, lower-intent auctions, which compresses marginal returns and causes CPA to spike. Instead, I recommend scaling budget in disciplined fifteen to twenty percent increments every three to five days, while monitoring marginal ROAS and Search Impression Share lost to budget.",
        glanceBullets: [
          "• The trap: Doubling budget overnight pushes algorithms into broader, lower-converting auctions",
          "• Algorithmic reset: Massive budget jumps reset machine learning phases and trigger bid volatility",
          "• Disciplined scaling: Increase budget by 15-20% every 3-5 days to maintain algorithmic stability",
          "• Marginal metrics: Calculate marginal ROAS and marginal CPA on incremental spend, not just blended ROAS",
          "• Impression Share check: High IS lost to budget confirms safe expansion headroom"
        ],
        expandedSay: "Platform dashboards show blended ROAS, which masks diminishing marginal returns. If an account generates ₹10,000 on a ₹1,000 spend (10x ROAS), and spending an extra ₹1,000 only brings ₹1,200 of revenue (1.2x marginal ROAS), the blended ROAS looks like 5.6x, but that extra thousand was barely profitable.\n\nBefore increasing budget, I look at Search Impression Share lost to budget versus rank. If Impression Share lost to budget is high, there is genuine uncaptured demand in our existing high-intent keywords. We can scale incrementally, let the algorithm absorb the increased volume without bid spikes, and protect the client's bottom-line profitability.",
        supportingContext: "Notes Section 4: Situational Diagnostic Scenarios (Case 3: Budget scaling).",
        stuckRecovery: {
          breatheMsg: "Never double overnight. Marginal returns compress. Scale 15-20% every 3-5 days. Watch marginal ROAS.",
          questionSummary: "Client wants to double budget on high ROAS?",
          points: ["Never double overnight; marginal returns compress", "Scale in 15-20% steps every 3-5 days", "Monitor marginal ROAS on incremental spend", "Check Impression Share lost to budget"],
          easySay: "I explain that algorithms harvest high-intent users first, so doubling budget instantly drives up CPA. I recommend scaling in 15-20% increments every few days while tracking marginal ROAS.",
          stallSay: "That's a classic scaling dilemma—for me, the math of marginal returns comes first."
        }
      },
      {
        id: "func-q6",
        category: "expected",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Walk me through your Google Search Ads project and your results.",
        topic: "Google Search Ads Project",
        babeTag: "babe 👀 intent restructuring: CTR 5.2%→14.8%, CPC cut 21% (₹5.33→₹4.21), 17/19 conversions",
        simplestQuestion: "Google Search results: intent-based ad groups and negative keywords tripled CTR and reduced CPC by 21%.",
        startWithPrompt: "Start with: “In my Google Search project for Unleavables, our core breakthrough was…”",
        glanceSay: "In my Google Search project for Unleavables, our core breakthrough was diagnosing query intent and restructuring the ad groups. Originally, broad keyword matching was causing intent leakage and dragging down CTR. We split the account into tight, intent-driven ad groups and aggressively sculpted negative keywords. That drove our CTR from 5.20% up to 14.78%, cut CPC by 21% from ₹5.33 down to ₹4.21, and delivered 17 out of 19 planned conversions on a ₹777 spend.",
        glanceBullets: [
          "• 1,252 impressions and 185 clicks",
          "• CTR surged from 5.20% to 14.78% through intent-based ad group restructuring",
          "• CPC cut by 21% from ₹5.33 to ₹4.21 via negative keyword sculpting",
          "• 17 of 19 planned conversions achieved on ₹777 spend (₹800 budget)",
          "• Deep dive: SQR analysis of the 2 missed conversions revealed exploratory query bounce"
        ],
        expandedSay: "What was most valuable about that project was digging into the search query reports to analyze the two conversions we missed. I found that while our high-intent clusters were converting efficiently, certain exploratory queries were still triggering our ads and bouncing on the landing page.\n\nThat showed me that Google's auction isn't just about winning the bid—it's about query alignment and post-click friction. It gave me a strong appreciation for negative keyword hygiene, Quality Score components (expected CTR, ad relevance, landing page experience), and treating every campaign as a continuous feedback loop.",
        supportingContext: "Notes Section 2: Google Search Ads Project (Unleavables).",
        stuckRecovery: {
          breatheMsg: "Google Search: 1,252 impressions, CTR 5.2% → 14.78%, CPC ₹5.33 → ₹4.21 (-21%), 17/19 conversions on ₹777 spend.",
          questionSummary: "Google Search Ads results?",
          points: ["CTR 5.20% to 14.78%", "CPC cut 21% to ₹4.21", "17 of 19 conversions on ₹777 spend", "Intent restructuring & negative sculpting"],
          easySay: "We increased CTR from 5.20% to 14.78% and reduced CPC by 21% to ₹4.21 through intent-based ad groups and negative keyword sculpting, delivering 17 of 19 conversions on ₹777 spend.",
          stallSay: "I'd love to walk through the metrics from that Google Search project."
        }
      },
      {
        id: "func-q7",
        category: "expected",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "In your Unleavables Meta Ads project, how did Cost Cap compare to Highest Volume?",
        topic: "Meta Ads Bidding Test (Cost Cap vs Highest Volume)",
        babeTag: "babe 👀 Cost Cap beat Highest Volume: cost per ATC dropped from ₹91 to ₹29, 11.04% CTR",
        simplestQuestion: "Highest Volume spent unconditionally; Cost Cap set an algorithmic ceiling that dropped cost/ATC to ₹29.",
        startWithPrompt: "Start with: “In the Unleavables Meta Ads project, we ran a direct test…”",
        glanceSay: "In the Unleavables Meta Ads project, we ran a direct test comparing Meta's default Highest Volume bidding against an explicit Cost Cap. Highest Volume prioritizes exhausting the daily budget, which caused our cost per add-to-cart to surge to ₹91 during competitive auction spikes. When we switched to Cost Cap, we set an algorithmic ceiling that forced Meta to pace delivery and bid selectively, dropping our cost per add-to-cart down to ₹29 during the test with an 11.04% CTR.",
        glanceBullets: [
          "• Direct test: Meta Highest Volume vs Cost Cap bidding",
          "• Cost per add-to-cart dropped from ₹91 to ₹29 during the Cost Cap test period",
          "• Overall campaign benchmark: 11.04% CTR, 15 add-to-carts, ₹54.52 blended CV benchmark",
          "• Auction mechanism: Highest Volume spends budget regardless of cost; Cost Cap bids only when conversion probability justifies the bid",
          "• Key takeaway: Algorithmic bid caps protect unit economics during auction volatility"
        ],
        expandedSay: "Highest Volume is essentially an unconstrained pacing model: if competition rises on a Thursday evening, Meta will happily bid up impression prices just to spend the remaining daily budget. By implementing Cost Cap, we gave the algorithm a clear economic boundary.\n\nDelivery slowed down slightly during high-competition hours, but the conversions we acquired were far more cost-effective. That test proved that you should never let platform automation run unconstrained—understanding how auction bidding dynamics interact with unit economics is essential for maintaining client margins.",
        supportingContext: "Notes Section 2: Meta Ads Project (Unleavables).",
        stuckRecovery: {
          breatheMsg: "Meta test: Cost Cap vs Highest Volume. Cost/ATC dropped ₹91 to ₹29. 11.04% CTR.",
          questionSummary: "Cost Cap vs Highest Volume results?",
          points: ["Highest Volume spent budget unconditionally at ₹91/ATC", "Cost Cap forced selective bidding at ₹29/ATC", "11.04% CTR, 15 add-to-carts"],
          easySay: "Cost Cap dropped our cost per add-to-cart from ₹91 to ₹29 by forcing Meta to bid selectively rather than spending the budget unconditionally, delivering an 11.04% CTR.",
          stallSay: "In that project, the core experiment was comparing bidding strategies."
        }
      },
      {
        id: "func-q8",
        category: "reflective",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "In your Homecrust Amazon campaign, clicks grew 40% but ACoS was 173%. What was the diagnosis?",
        topic: "Homecrust Amazon PPC & Commercial Diagnosis",
        babeTag: "babe 👀 clicks +40% but ACoS 173%: traffic without listing readiness and price elasticity burns budget",
        simplestQuestion: "Ad drove traffic efficiently (+40% clicks), but the product listing lacked reviews and price readiness, hurting conversion rate.",
        startWithPrompt: "Start with: “Homecrust was a defining learning experience because it demonstrated…”",
        glanceSay: "Homecrust was a defining learning experience because it demonstrated that traffic efficiency means nothing without listing conversion readiness. We ran Amazon Sponsored Products with negative targeting and a nine-hour dayparting window: impressions grew five percent, clicks surged forty percent, and CTR improved to 1.06%. But conversion rate dropped from 2.20% to 1.58%, pushing ACoS up to 173% on our ₹700 budget.",
        glanceBullets: [
          "• Top of funnel improved: impressions +5% (5,955), clicks +40% (45 → 63), CTR 0.80% → 1.06%",
          "• Conversion headwind: conversion rate dipped to 1.58%, generating 2 orders (₹857 sales) and 173.59% ACoS",
          "• Diagnostic root cause: Product listing lacked social proof/reviews, uncompetitive price point, and dayparting bids drove traffic during browsing hours",
          "• Commercial truth: Advertising can solve visibility, but it cannot solve product-market fit or listing friction"
        ],
        expandedSay: "At surface level, a 40% click lift looks like an optimization success. But when we audited the entire conversion funnel, we realized the advertising was successfully driving shoppers to the detail page, but the listing itself wasn't ready to convert them. The listing had low review velocity compared to category competitors, and our dayparting window was capturing lunchtime research clicks rather than evening purchasing sessions.\n\nThat experience taught me to look at retail media holistically: you cannot evaluate PPC in a silo from buy box ownership, customer review sentiment, price elasticity, and listing readiness. It gave me a deep commitment to commercial honesty over vanity traffic.",
        supportingContext: "Notes Section 2: Amazon Sponsored Products Project (Homecrust).",
        stuckRecovery: {
          breatheMsg: "Homecrust: Clicks +40%, CTR 1.06%, but ACoS 173%. Lesson: Traffic without listing readiness burns spend.",
          questionSummary: "Why did Homecrust ACoS rise to 173%?",
          points: ["Clicks rose 40% and CTR improved", "Conversion rate dropped to 1.58% (ACoS 173%)", "Listing lacked reviews and price competitiveness", "Advertising cannot compensate for listing friction"],
          easySay: "Clicks surged 40% but conversion rate fell, pushing ACoS to 173%. It proved that advertising can drive traffic, but if the product listing lacks review velocity and price competitiveness, you just burn spend.",
          stallSay: "That project gave me a really valuable lesson about the difference between traffic and profitability."
        }
      },
      {
        id: "func-q9",
        category: "expected",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "How do you evaluate bidding strategies across Google, Meta, and Amazon?",
        topic: "Cross-Platform Bidding Strategy Playbook",
        babeTag: "babe 👀 match bidding to data maturity: Max Conversions to build signal, tCPA with 30+ conv, Cost Cap for Meta margins",
        simplestQuestion: "Align bidding with conversion volume maturity: build volume first, cap bids when data stabilizes, use placement modifiers on Amazon.",
        startWithPrompt: "Start with: “I evaluate bidding strategies based on conversion data maturity…”",
        glanceSay: "I evaluate bidding strategies based on conversion data maturity and the client's commercial objective. On Google Ads, I use Maximize Clicks only for keyword discovery on new campaigns, transition to Maximize Conversions to build conversion volume, and only activate Target CPA or Target ROAS once the campaign has at least twenty to thirty monthly conversions. On Meta Ads, I use Highest Volume when scaling flexible budgets, but rely on Cost Cap when protecting strict customer acquisition margins. And on Amazon, I combine Sponsored Products with Top-of-Search placement modifiers and dayparting to avoid off-peak browsing clicks.",
        glanceBullets: [
          "• Google Ads progression: Max Clicks (discovery) → Max Conversions (data ramp) → Target CPA/ROAS (stable data)",
          "• Threshold rule: Do not activate tCPA / tROAS without at least 20-30 historical conversions per month",
          "• Meta Ads: Highest Volume for fast scale; Cost Cap to enforce unit economics and margin ceilings",
          "• Amazon Ads: Placement multipliers (Top of Search vs Product Pages) + dayparting to capture buying hours"
        ],
        expandedSay: "The biggest mistake in bidding management is switching to smart bidding too early. Automated bidding algorithms rely on Bayesian probability: if they don't have enough conversion event signals, they bid erratically or choke impression delivery. By respecting the learning curve—building signal density before setting rigid target CPAs—you set the algorithm up for success.\n\nSimilarly, on retail media like Amazon, placement multipliers allow you to bid aggressively on Top of Search placements where conversion rates are 2x to 3x higher, while bidding conservatively on lower-converting product detail pages.",
        supportingContext: "Notes Section 4: Platform Bidding Strategies.",
        stuckRecovery: {
          breatheMsg: "Google: Max Clicks → Max Conversions → tCPA/tROAS. Meta: Cost Cap protects margin. Amazon: Top of Search modifiers.",
          questionSummary: "How evaluate bidding strategies?",
          points: ["Match bidding strategy to conversion data maturity", "Need 20-30 conversions before tCPA/tROAS", "Cost Cap on Meta protects unit economics", "Top of Search multipliers on Amazon"],
          easySay: "I align bidding with data maturity—using Max Conversions to build signals on Google before switching to Target CPA, using Cost Cap on Meta to protect margins, and using placement modifiers on Amazon.",
          stallSay: "I look at bidding strategies through the lens of conversion data maturity."
        }
      },
      {
        id: "func-q10",
        category: "commercial",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "How do you explain Crealytics' focus on POAS (Profit on Ad Spend) and iCLV over vanity ROAS?",
        topic: "Crealytics POAS & iCLV Commercial Edge",
        babeTag: "babe 👀 POAS optimizes for true cash profit after COGS; iCLV bids higher for repeat lifetime buyers",
        simplestQuestion: "ROAS treats low and high margin sales identically; POAS bids on true gross profit contribution, and iCLV bids on repeat LTV.",
        startWithPrompt: "Start with: “Standard ROAS is fundamentally flawed because…”",
        glanceSay: "Standard ROAS is fundamentally flawed because it treats every rupee of top-line revenue as equally profitable. A ten-thousand-rupee sale on a low-margin electronic item with ten percent margin generates only one thousand rupees of gross profit, while the same revenue on apparel with sixty percent margin generates six thousand. Crealytics POAS integrates COGS, returns, and shipping into bidding algorithms so ad spend is allocated toward true gross profit contribution. Similarly, iCLV predicts customer repeat value so brands bid higher to acquire high-lifetime-value customers rather than one-and-done discount hunters.",
        glanceBullets: [
          "• The ROAS flaw: Treats low-margin and high-margin revenue identically; high ROAS can still cause net loss",
          "• Crealytics POAS: Profit on Ad Spend incorporates Cost of Goods Sold (COGS) and returns to optimize gross profit",
          "• Crealytics iCLV: Predictive Customer Lifetime Value models identify repeat-purchase probability",
          "• Commercial impact: Bid aggressively on high-margin, high-LTV cohorts; bid conservatively on low-margin one-offs"
        ],
        expandedSay: "In modern e-commerce and retail media, optimizing for top-line revenue is dangerous. You can easily scale an account to a 4x ROAS and celebrate, while the client's finance director is looking at empty bank accounts because ad spend exceeded gross product margin after fulfillment.\n\nBy feeding real margin data and predictive customer lifetime value into automated bidding feeds, Crealytics bridges the gap between marketing execution and real business profitability. It transforms performance marketing from a media buying exercise into a true revenue and profit engine.",
        supportingContext: "Notes Section 4: Crealytics Principles (POAS & iCLV).",
        stuckRecovery: {
          breatheMsg: "POAS > ROAS: ROAS ignores product margins. POAS bids on true gross profit. iCLV bids on repeat customer value.",
          questionSummary: "Why POAS and iCLV over ROAS?",
          points: ["ROAS treats low and high margin revenue identically", "POAS incorporates COGS and returns to bid on gross profit", "iCLV predicts repeat customer lifetime value", "Protects actual client bank balance"],
          easySay: "Standard ROAS ignores product margins, so a high ROAS can still lose money. Crealytics POAS bids on actual gross profit contribution, while iCLV bids higher for customers with high repeat lifetime value.",
          stallSay: "I think that's one of the most exciting aspects of Crealytics' approach to retail media."
        }
      },
      {
        id: "func-q11",
        category: "behavioural",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "If a client or colleague strongly disagrees with your campaign recommendations, how do you handle it?",
        topic: "Constructive Disagreement & Data-Driven A/B Testing",
        babeTag: "babe 👀 understand why first + shared goal over winning + design A/B test with data guardrails",
        simplestQuestion: "Diagnose whether disagreement is about information or priorities; focus on shared goal; propose controlled A/B test.",
        startWithPrompt: "Start with: “I always start by understanding why we disagree…”",
        glanceSay: "I always start by understanding why we disagree—whether we're looking at different data or approaching the problem with different business priorities. I keep the focus strictly on our shared goal rather than on whose idea wins. In performance marketing, we don't need to debate personal opinions; the best approach is to design a controlled A/B split test with strict budget guardrails and let empirical conversion data give us the answer.",
        glanceBullets: [
          "• Diagnose the root cause: Different information vs different commercial priorities",
          "• Shared goal over winning: Keep the focus on business outcomes, not personal ego",
          "• Test with data: Propose a structured A/B split test with controlled budget to let real numbers decide",
          "• Professional respect: Disagree constructively on strategy while maintaining strong collaboration"
        ],
        expandedSay: "When a client pushes back—for example, wanting to keep a high-spending, non-converting keyword running because of emotional attachment—I don't just tell them they're wrong. I walk them through the data, show the opportunity cost in terms of wasted budget, and propose a low-risk test.\n\nBy presenting solutions as data-driven experiments rather than confrontations, you protect client relationships and ensure campaign capital is deployed responsibly.",
        supportingContext: "Notes Section 5: Collaboration, Stakeholder Management & Disagreements.",
        stuckRecovery: {
          breatheMsg: "Understand why first → shared goal over winning → design an A/B split test with real data.",
          questionSummary: "How to handle disagreements on campaign strategy?",
          points: ["Understand why: different data or priorities", "Focus on shared goal, not personal winning", "Design a controlled A/B test to let data decide", "Constructive and respectful"],
          easySay: "I first understand whether we have different data or priorities, focus on the shared business goal, and propose a controlled A/B test with data guardrails to let empirical results decide.",
          stallSay: "I always start by trying to understand why we disagree, because usually people just have different data or priorities."
        }
      },
      {
        id: "func-q12",
        category: "opinion",
        speaker: "Senior Performance Marketing Lead",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "Do you have any questions for the performance marketing team today?",
        topic: "Questions for the Functional Team",
        babeTag: "babe 👀 strategic questions on POAS margin integration, experimentation cadence, and PMax control",
        simplestQuestion: "Ask about how margin data feeds into bidding algorithms, team experimentation cadence, and handling black-box PMax.",
        startWithPrompt: "Start with: “I do, thank you! First, how does the team practically integrate…”",
        glanceSay: "I do, thank you! First, how does the team practically integrate client margin and COGS data into automated bidding algorithms across Google and retail media? Second, what does the typical diagnostic and experimentation cadence look like across accounts—how do associates propose and validate new campaign tests? And third, with the industry shifting toward black-box automation like Advantage+ and Performance Max, how does Crealytics maintain strategic intent control?",
        glanceBullets: [
          "• 1. How does the team integrate client margin and COGS data into bidding algorithms day-to-day?",
          "• 2. What is the team's experimentation cadence for proposing and validating new campaign tests?",
          "• 3. How does Crealytics maintain intent control and transparency in black-box environments like PMax?",
          "• 4. What separates a mechanically competent associate from someone who becomes an exceptional strategist here?"
        ],
        expandedSay: "I'm really interested in how you balance proprietary AI and automation with human strategic oversight. Platforms like Google and Meta push hard toward full automation, but retail clients often have complex margin structures and inventory fluctuations that platform algorithms don't account for.\n\nI'd love to know how associates on the team get involved in developing custom solutions and hypotheses that bridge that gap.",
        supportingContext: "Notes Section 6: Strategic Questions to Ask the Performance Marketing Team.",
        stuckRecovery: {
          breatheMsg: "Ask about POAS margin integration, experimentation cadence, and handling black-box automation (PMax).",
          questionSummary: "Questions for the functional team?",
          points: ["How is client margin data integrated into bidding?", "What is the experimentation cadence for testing?", "How do you maintain intent control against black-box PMax?", "What makes an exceptional strategist here?"],
          easySay: "I'm curious how the team integrates client margin data into automated bidding day-to-day, and how you maintain strategic intent control in black-box platforms like Performance Max.",
          stallSay: "I do have a couple of questions about the team's experimentation workflow and bidding technology."
        }
      }
    ];
  }


  // If this matches Crealytics Technical Interview Master (Case Study Presentation + Technical Playbook)
  if (templateId === "crealytics-technical-master" || (templateId === "custom" && (textLower.includes("technical interview") || textLower.includes("case study presentation script") || textLower.includes("comparing campaigns a, b and c")))) {
    return [
      {
        id: "master-q1",
        category: "expected",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Can you walk us through your case study presentation and how you approached the assignment?",
        topic: "Case Study Presentation Walkthrough",
        babeTag: "babe 👀 structured walkthrough: 4 metric formulas + Campaign B efficiency vs Campaign A volume",
        simplestQuestion: "Give your structured opening, explain the 4 formulas you used to fill missing data, and compare Campaign A vs B vs C.",
        startWithPrompt: "Start with: “Hi! So, I've gone through both parts of the assignment…”",
        glanceSay: "Hi! So, I've gone through both parts of the assignment. I started by filling in the missing metrics using standard formulas: impressions from clicks divided by CTR, orders from cost divided by CPO, and ROAS from revenue divided by ad spend. When comparing the campaigns, Campaign A generated €8,400 in revenue with a ROAS of 33.6, while Campaign B generated €8,190 with a higher ROAS of 39 and the lowest CPC at €0.35. If our priority is advertising efficiency, I lean towards Campaign B because it generates more revenue per euro spent. But if the goal is total revenue volume, Campaign A is slightly ahead.",
        glanceBullets: [
          "• Approach: Filled missing metrics (Impressions = Clicks/CTR, Orders = Cost/CPO, ROAS = Rev/Spend)",
          "• Campaign B (Efficiency Winner): ROAS 39.0, lowest CPC at €0.35, €8,190 revenue",
          "• Campaign A (Revenue Winner): €8,400 total revenue, ROAS 33.6",
          "• Strategic alignment: Recommend B for capital efficiency, A if top-line revenue scale is the primary target"
        ],
        expandedSay: "My background is in Media and Communication, and what drew me to performance marketing is how it connects audience psychology, creativity, and quantitative data—you get to understand why people behave a certain way, test your ideas, and actually measure what works.\n\nOnce I had the baseline figures, I compared the campaigns on both commercial return and channel economics. Campaign B is clearly the most efficient engine in the portfolio, delivering the highest return on ad spend with the lowest cost per click. However, Campaign A drove €210 more in total revenue. That trade-off highlights that campaign evaluation depends entirely on business context—whether the client needs profitable cash flow or top-line market share.",
        supportingContext: "Primary Notes Section 2: Case Study Presentation Script (Opening & Comparing Campaigns A, B and C).",
        stuckRecovery: {
          breatheMsg: "Walkthrough: 1. Formulas used 2. Campaign B efficiency (39 ROAS, €0.35 CPC) 3. Campaign A revenue (€8,400).",
          questionSummary: "Walkthrough of case study assignment?",
          points: ["Filled missing metrics with standard formulas", "Campaign B won on efficiency (39 ROAS, €0.35 CPC)", "Campaign A led on total revenue (€8,400)", "Recommendation depends on client objective"],
          easySay: "I started by calculating the missing metrics, and found that Campaign B was the most efficient with a 39 ROAS and 35 cent CPC, while Campaign A drove slightly more total revenue at 8,400 euros.",
          stallSay: "I'd love to walk you through that—I approached the assignment in two distinct stages."
        }
      },
      {
        id: "master-q2",
        category: "situational",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "What stood out to you about Campaign C, and what would you recommend doing with it?",
        topic: "Campaign C Diagnosis & Recommendations",
        babeTag: "babe 👀 high CTR (30%) but ROAS 0.95: don't scale on CTR, audit LP & note 31.43 order anomaly",
        simplestQuestion: "Campaign C spent €2,200 for €2,100 revenue (ROAS 0.95) despite 30% CTR. Don't switch off blindly; check LP, intent, and the 31.43 order anomaly.",
        startWithPrompt: "Start with: “Campaign C has the highest CTR at 30%, but it's losing money…”",
        glanceSay: "Campaign C has the highest CTR at 30%, so people are clearly clicking on the ads. But it spent €2,200 and only generated €2,100 in revenue, giving it an unprofitable ROAS of around 0.95. The clicks simply aren't translating into enough revenue to cover the ad spend. I wouldn't automatically switch it off without investigating, but I definitely would not increase the budget just because the CTR looks attractive. I'd first audit audience intent, creative promise, landing page friction, and conversion tracking.",
        glanceBullets: [
          "• The Problem: 30% CTR is highest in account, but €2,200 spend vs €2,100 revenue = 0.95 ROAS (unprofitable)",
          "• Core Principle: High CTR does not equal a successful campaign; clicks must translate to paying customers",
          "• Action Plan: Audit search/audience intent, check landing page mobile speed & pricing, verify conversion tracking",
          "• Data Anomaly: Order count works out to approximately 31.43 orders (Cost ÷ CPO)—unusual fractional count to verify with raw data"
        ],
        expandedSay: "A high CTR with an unprofitable ROAS is a classic indicator of curiosity clicks or an ad hook that overpromises what the landing page delivers. The ad might be highlighting a steep promotional discount, broad solution, or eye-catching visual that attracts clicks from users who have zero intent to complete a purchase.\n\nOne detail I also noticed in the raw data is that Campaign C's cost divided by CPO works out to approximately 31.43 orders. Because customer orders in ecommerce are whole numbers, this fractional result suggests either a currency rounding artifact or a reporting discrepancy that should be verified before making irreversible budget reallocations.",
        supportingContext: "Primary Notes Section 2: Case Study Presentation Script (Campaign C & Data Anomaly).",
        stuckRecovery: {
          breatheMsg: "Campaign C: 30% CTR, €2,200 cost vs €2,100 rev = 0.95 ROAS. Don't scale on CTR. Check LP & 31.43 order anomaly.",
          questionSummary: "What to do with Campaign C?",
          points: ["30% CTR is highest, but ROAS is 0.95 (losing money)", "Never scale budget on CTR alone", "Audit LP match, audience intent, and tracking", "Catch the 31.43 fractional order count anomaly"],
          easySay: "Campaign C has a 30% CTR but only a 0.95 ROAS, so clicks aren't converting into revenue. I wouldn't switch it off immediately, but I'd audit the landing page and tracking, and verify the 31.43 fractional order count anomaly.",
          stallSay: "Campaign C was really interesting—the headline numbers look exciting until you calculate the ROAS."
        }
      },
      {
        id: "master-q3",
        category: "commercial",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "Which campaign would you choose if the client's primary objective is brand awareness?",
        topic: "Branding Campaign Selection",
        babeTag: "babe 👀 CTR alone != branding: check reach, frequency, engagement, and brand-lift",
        simplestQuestion: "Campaign C has highest attention (30% CTR), but branding must be judged on reach, frequency, and brand-lift, not CTR alone.",
        startWithPrompt: "Start with: “If the objective is to capture attention, Campaign C is worth investigating…”",
        glanceSay: "If the objective is to capture immediate attention, Campaign C is worth investigating because it has the highest CTR at 30%. However, I would be very careful about declaring it the best branding campaign based on click-through rate alone. For brand awareness, I'd want to evaluate unique reach, ad frequency, video completion, engagement, and brand-lift studies where available. We need to judge campaigns against their actual business objective rather than assuming a high CTR automatically builds enduring brand equity.",
        glanceBullets: [
          "• Attention candidate: Campaign C has the highest CTR (30%), showing ad resonance",
          "• The Caveat: CTR measures click volume, not brand perception, recall, or mental availability",
          "• True branding metrics: Unique reach, frequency, engagement rate, video completion, and brand-lift",
          "• Strategic alignment: Always define what success looks like for the specific objective"
        ],
        expandedSay: "When measuring brand awareness, direct conversions are not the only measure of success, but neither is click-through rate. A click is simply an interaction; it doesn't tell us whether the user remembered the brand name, understood the brand's value proposition, or developed purchase consideration.\n\nIf Campaign C drove broad reach at an efficient cost per thousand impressions (CPM) and high engagement, it could serve as an effective upper-funnel discovery driver. But we'd need to agree on clear upper-funnel KPIs with the client and measure downstream assisted conversions before allocating branding budget to it.",
        supportingContext: "Primary Notes Section 2: Case Study Script (Branding Campaign Selection).",
        stuckRecovery: {
          breatheMsg: "Branding: Campaign C has 30% CTR, but branding requires reach, frequency, and brand-lift, not CTR alone.",
          questionSummary: "Which campaign for branding?",
          points: ["Campaign C has 30% CTR for attention", "Don't judge branding on CTR alone", "Look at reach, frequency, and brand-lift", "Align on upper-funnel success metrics"],
          easySay: "Campaign C has the highest CTR at 30% for attention, but for a true branding campaign I would evaluate reach, frequency, and brand-lift rather than judging on CTR alone.",
          stallSay: "For branding, my perspective is that we have to be very careful with how we define success."
        }
      },
      {
        id: "master-q4",
        category: "expected",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "How would you improve and scale Campaign B given its strong performance?",
        topic: "Improving & Scaling Campaign B",
        babeTag: "babe 👀 don't break what works: isolate order-generating creatives/audiences, test 1 variable, scale gradually",
        simplestQuestion: "Campaign B is performing well (ROAS 39, CPC €0.35). Break down by creative/audience, test landing page alignment, scale budget in controlled steps.",
        startWithPrompt: "Start with: “Campaign B is already performing well, so I wouldn't start changing things…”",
        glanceSay: "Campaign B is already performing well, so I wouldn't start changing things just for the sake of it. First, I'd break down the data to see which specific audiences and ad creatives are driving actual orders rather than just clicks, and verify that the landing page closely matches the top ad copy. Then I'd run isolated tests—for example, testing a fresh creative variation or expanding into a lookalike audience. I'd monitor CTR, conversion rate, CPO, and ROAS together, and if performance holds steady, gradually scale budget in controlled increments.",
        glanceBullets: [
          "• First principle: Do not disrupt a high-performing campaign with aggressive overhauls",
          "• Granular breakdown: Identify the specific ad sets, placements, and creatives generating profitable orders",
          "• Controlled testing: Test one variable at a time (creative refresh, audience expansion, landing page tweak)",
          "• Multi-metric tracking: Monitor CPO, conversion rate, and ROAS alongside CTR",
          "• Gradual scaling: Increase budget in disciplined increments (+15-20%) to avoid auction bid spikes"
        ],
        expandedSay: "When a campaign hits a 39 ROAS at a 35-cent CPC, the objective is to scale volume without degrading unit economics. I’d start by checking search query reports and audience demographics to see where the highest-converting order density lives.\n\nOnce we know what is working, we can test incremental budget increases while watching marginal CPA. If doubling budget causes the ROAS to collapse because the algorithm runs out of high-intent inventory, we catch it early. By scaling in measured 15-20% steps and testing complementary creatives, we protect profitability while growing revenue.",
        supportingContext: "Primary Notes Section 2: Case Study Script (Improving Campaign B).",
        stuckRecovery: {
          breatheMsg: "Campaign B: ROAS 39, CPC €0.35. Don't break it. Segment order-drivers, test 1 variable, scale gradually.",
          questionSummary: "How to improve Campaign B?",
          points: ["Don't make changes for the sake of it", "Isolate creatives and audiences driving orders", "Test one variable at a time", "Scale budget gradually while watching CPO and ROAS"],
          easySay: "Campaign B is already efficient at a 39 ROAS, so I wouldn't disrupt it. I'd identify which specific creatives drive orders, run controlled tests, and scale the budget gradually.",
          stallSay: "With Campaign B, my first rule is: understand what's working before trying to change it."
        }
      },
      {
        id: "master-q5",
        category: "technical",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "Walk us through what you did in Excel and explain your VLOOKUP formula.",
        topic: "Excel Practical & VLOOKUP Formula",
        babeTag: "babe 👀 Excel workflow: sort cost desc, conditional formatting (>€300 red), =VLOOKUP(A2, A19:B23, 2, FALSE)",
        simplestQuestion: "Sorted by cost descending, conditional formatting for >€300 cost and profit scales, exact match VLOOKUP for campaign country labels, and Pivot Table summary.",
        startWithPrompt: "Start with: “For the Excel section, I started by sorting the table by cost in descending order…”",
        glanceSay: "For the Excel section, I started by sorting the table by cost in descending order so the highest-spending entries were immediately visible at the top. I used conditional formatting to highlight costs above €300 in red, and applied a color scale on profit to easily spot which audiences were profitable and which were losing money. To pull in the country labels, I used an exact-match VLOOKUP with the formula =VLOOKUP(A2, A19:B23, 2, FALSE). Then I built a Pivot Table to cleanly summarize clicks and impressions by campaign.",
        glanceBullets: [
          "• Sorting: Cost descending to prioritize high-budget exposure immediately",
          "• Conditional Formatting: Costs >€300 highlighted in red; color scale on profit to spot margin leaks",
          "• VLOOKUP Formula: =VLOOKUP(A2, A19:B23, 2, FALSE) where FALSE specifies exact match",
          "• Pivot Table: Summarized total clicks and impressions across campaigns and audience segments"
        ],
        expandedSay: "The idea behind VLOOKUP is to search for a lookup key—in this case, the campaign name in cell A2—within the leftmost column of the lookup range A19:B23, and return the corresponding value from the second column, which contained the country label.\n\nThe FALSE argument is critical in reporting because it forces an exact match. Without FALSE, Excel defaults to an approximate match, which can return erroneous labels if the reference table is not sorted alphabetically. This structured dataset then fed directly into the Pivot Table for campaign aggregation.",
        supportingContext: "Primary Notes Section 3: Excel Practical & VLOOKUP.",
        stuckRecovery: {
          breatheMsg: "Excel: Sort cost desc, conditional format >€300 red, =VLOOKUP(A2, A19:B23, 2, FALSE) exact match, pivot table.",
          questionSummary: "Explain Excel steps & VLOOKUP?",
          points: ["Sorted cost descending for high-spend visibility", "Conditional formatting for >€300 and profit scale", "=VLOOKUP(A2, A19:B23, 2, FALSE) with FALSE for exact match", "Pivot table for clicks and impressions"],
          easySay: "I sorted by cost descending, added conditional formatting for costs over 300 euros and profit scales, used an exact match VLOOKUP for country labels, and summarized clicks in a pivot table.",
          stallSay: "In Excel, I focused on making the data immediately visual and rigorously structured."
        }
      },
      {
        id: "master-q6",
        category: "commercial",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "What did the campaign data tell you at the audience level, and how would you prioritise them?",
        topic: "Audience Analysis & Prioritisation",
        babeTag: "babe 👀 DE Broad is star (+€2,712 profit); US Lookalike (-€273) and UK Lookalike (-€110) losing money",
        simplestQuestion: "DE Prospecting Broad generated €2,712 profit; US Lookalike lost €273; UK Lookalike lost €110. Prioritize scaling proven winners, audit losing Lookalikes.",
        startWithPrompt: "Start with: “Looking at the audience breakdown, there are stark differences…”",
        glanceSay: "Looking at the audience breakdown, there are stark differences in profitability. For DE Prospecting Sales, the Broad audience was our biggest winner, generating €3,912 in revenue and €2,712 in profit, while Lookalike made a small loss of €6. In US Acquisition Lead Gen, the Interests audience was profitable at €40, but the Lookalike audience lost €273, bringing in only €8 on €281 in cost. In UK Prospecting, Broad made €20 profit while Lookalike lost €110. I would prioritise investigating why DE Broad is working so well and scale it, while pausing or auditing the money-losing Lookalike audiences.",
        glanceBullets: [
          "• DE Prospecting Broad: €3,912 revenue, €2,712 profit — clear top priority for scaling",
          "• US Acquisition Lookalike: €8 revenue vs €281 cost (-€273 loss) with low CTR — urgent audit or pause",
          "• UK Prospecting: Broad generated €20 profit (€40 rev vs €20 cost); Lookalike lost €110",
          "• DE Social ASC Broad: Lost €27 — check if still in learning phase or conversion tracking setup",
          "• DE Retargeting CRM: €17 profit (€29 rev vs €12 cost) on only 60 clicks — promising, but need more data",
          "• Prioritisation rule: Allocate budget towards proven profit engines, avoid decisions based on CTR alone"
        ],
        expandedSay: "When prioritising audiences, I look at contribution profit and conversion volume rather than click-through rate alone. DE Prospecting Broad is the clear commercial anchor of the portfolio, and I would investigate whether we can expand its budget while keeping CPAs stable.\n\nConversely, the Lookalike audiences across both the US and UK campaigns are actively burning budget. In the US, the Lookalike audience's CTR was lower than Interests, suggesting either audience fatigue, poor creative resonance, or lead quality issues. I would immediately cap or pause spend on the US Lookalike until we audit targeting parameters and landing page relevance.",
        supportingContext: "Primary Notes Section 3: Audience Level Analysis & Prioritisation.",
        stuckRecovery: {
          breatheMsg: "Audience: DE Broad +€2,712 profit. US Lookalike -€273 loss. UK Lookalike -€110 loss. Prioritize proven profit.",
          questionSummary: "What did audience data show?",
          points: ["DE Broad generated €2,712 profit (scale priority)", "US Lookalike lost €273 on €281 spend (audit/pause)", "UK Lookalike lost €110; UK Broad +€20", "DE Retargeting +€17 on 60 clicks (promising but small)"],
          easySay: "DE Prospecting Broad was our top performer generating 2,712 euros in profit, while the US and UK Lookalike audiences lost money. I'd prioritize scaling Broad and auditing the losing Lookalikes.",
          stallSay: "The audience breakdown gave us the clearest strategic signal in the whole dataset."
        }
      },
      {
        id: "master-q7",
        category: "technical",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "Why must you calculate weighted CTR in a Pivot Table rather than averaging percentages?",
        topic: "Weighted CTR in Pivot Tables",
        babeTag: "babe 👀 never average percentages: overall CTR = Total Clicks ÷ Total Impressions × 100",
        simplestQuestion: "Averaging percentage CTRs treats high-volume and low-volume campaigns equally, giving false numbers. Must divide total clicks by total impressions.",
        startWithPrompt: "Start with: “One thing I was very careful about in Excel is how CTR is aggregated…”",
        glanceSay: "One thing I was very careful about in Excel is how CTR is aggregated. You should never add individual CTR percentages together or take their average to calculate overall campaign performance. Averaging percentages treats a small 60-click campaign the same as a 7,500-click campaign, which distorts the true weighted average. Instead, you divide total clicks across the dataset by total impressions, and multiply by 100 to get the mathematically correct weighted CTR.",
        glanceBullets: [
          "• The Error: Averaging percentages creates an unweighted mathematical distortion",
          "• Volume Weighting: A campaign with 200,000 impressions has vastly more statistical weight than one with 6,000",
          "• Correct Formula: Overall CTR = (Sum of all Clicks ÷ Sum of all Impressions) × 100",
          "• Pivot Table Best Practice: Use a calculated field or separate summary formula rather than 'Average of CTR'"
        ],
        expandedSay: "In statistical reporting, rates and ratios must always be recalculated from their underlying numerators and denominators. For example, if Campaign 1 has a 10% CTR on 100 impressions (10 clicks) and Campaign 2 has a 2% CTR on 10,000 impressions (200 clicks), a simple average of the percentages would show 6%. But the actual weighted CTR is 210 clicks divided by 10,100 impressions, which is just 2.08%.\n\nIn Google Sheets or Excel, I always configure Pivot Tables with calculated fields or compute the weighted metric across totals so stakeholders never make strategic decisions on skewed averages.",
        supportingContext: "Primary Notes Section 3: A Note on Calculating CTR in a Pivot Table.",
        stuckRecovery: {
          breatheMsg: "Weighted CTR: Never average percentages. Total clicks divided by total impressions × 100.",
          questionSummary: "Why calculate weighted CTR?",
          points: ["Averaging percentages ignores volume weighting", "Small campaigns would distort large campaigns", "Formula: Total clicks ÷ Total impressions × 100", "Critical for accurate executive reporting"],
          easySay: "You shouldn't average individual percentages because it treats small campaigns the same as massive ones. You must divide total clicks by total impressions for an accurate weighted CTR.",
          stallSay: "That's a classic data aggregation trap—for me, mathematical integrity always comes first."
        }
      },
      {
        id: "master-q8",
        category: "technical",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "Can you walk us through the PPC calculation question in Part 3 of your notes?",
        topic: "PPC Math Calculation Scenario",
        babeTag: "babe 👀 100k imp × 3% CTR = 3,000 clicks | €300 spend | 150 conv × €20 = €3k profit - €300 = €2,700 net",
        simplestQuestion: "100k impressions at 3% CTR = 3,000 clicks. At €0.10 CPC = €300 spend. At 5% CVR = 150 conversions. 150 × €20 margin = €3,000 gross - €300 spend = €2,700 net profit.",
        startWithPrompt: "Start with: “Sure! The campaign has 100,000 impressions and a 3% CTR…”",
        glanceSay: "Sure! The campaign has 100,000 impressions and a 3% CTR, which gives us 3,000 clicks. At €0.10 per click, the total advertising cost is €300. With a conversion rate of 5%, we get 150 conversions. At €20 profit per conversion, that's €3,000 in gross profit before advertising costs. After subtracting our €300 ad spend, we have €2,700 in net profit remaining, assuming the €20 profit figure accounts for all non-advertising expenses.",
        glanceBullets: [
          "• Clicks: 100,000 impressions × 3% CTR = 3,000 clicks",
          "• Ad Spend: 3,000 clicks × €0.10 CPC = €300 total ad cost",
          "• Conversions: 3,000 clicks × 5% Conversion Rate = 150 conversions",
          "• Gross Profit: 150 conversions × €20 profit per conversion = €3,000",
          "• Net Profit: €3,000 gross profit - €300 ad spend = €2,700 remaining net profit"
        ],
        expandedSay: "This calculation illustrates how unit economics and marketing metrics interact. Knowing the conversion rate allows us to calculate CPA directly: €300 spend divided by 150 conversions is a €2 CPA. Because each conversion generates €20 in margin, our return per conversion is ten times our acquisition cost.\n\nIt also demonstrates the difference between revenue and profit. If the product selling price were €100 and revenue were €15,000, looking at ROAS alone would show 50x, but what truly matters to the client is the net €2,700 contribution to the bottom line.",
        supportingContext: "Primary Notes Section 4: PPC Calculation Question.",
        stuckRecovery: {
          breatheMsg: "Math: 100k imp × 3% = 3,000 clicks. €0.10 CPC = €300 cost. 5% CVR = 150 conv. 150 × €20 = €3k - €300 = €2,700 profit.",
          questionSummary: "Walk through the PPC calculation?",
          points: ["3,000 clicks from 100k imp at 3% CTR", "€300 ad spend at €0.10 CPC", "150 conversions at 5% conversion rate", "€2,700 net profit after subtracting €300 spend from €3,000 margin"],
          easySay: "100,000 impressions at 3% CTR gives 3,000 clicks. At 10 cents per click, that's 300 euros spend. A 5% conversion rate gives 150 conversions, which at 20 euros profit each is 3,000 euros, leaving 2,700 euros net profit after subtracting ad spend.",
          stallSay: "I'd love to break down those numbers step by step."
        }
      },
      {
        id: "master-q9",
        category: "expected",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Tell me about yourself and your journey into performance marketing.",
        topic: "Personal Introduction & Background",
        babeTag: "babe 👀 Dehradun valley, Media editor, Kraftshala performance marketing, AI & Roblox vibe coder",
        simplestQuestion: "Tell your natural story: Dehradun valley, Media & Communication editor, Kraftshala curiosity, building AI tools and a Roblox game.",
        startWithPrompt: "Start with: “I'm from Dehradun, which is a valley…”",
        glanceSay: "I'm from Dehradun, which is a valley, and I think that explains why I love places that make you stop and look around for a minute. I studied Media and Communication and worked as an editor, so I've always been interested in stories, people, and how we communicate. When I joined Kraftshala, I discovered that I really enjoyed performance marketing because it brings together creativity, psychology, and data. A slightly unexpected discovery was how much I enjoyed working with AI. Then we were introduced to vibe coding, and I loved being able to take an idea and actually build something—I'm currently trying to make a small Roblox game! Overall, I just enjoy figuring things out, trying new things, and seeing if I can make an idea work.",
        glanceBullets: [
          "• Roots: Dehradun valley — thoughtful observation and genuine curiosity",
          "• Foundation: Media & Communication graduate, editor with strict accuracy and communication skills",
          "• Pivot: Kraftshala performance marketing — connecting creative messaging with quantitative data",
          "• Hands-on builder: Exploring AI problem-solving, vibe coding, building functional tools and a Roblox game",
          "• Mindset: Enjoys figuring things out, testing hypotheses, and making ideas work in practice"
        ],
        expandedSay: "Working in publishing gave me an appreciation for clear communication and audience intent under daily deadlines. When I saw how AI was beginning to reshape content, it sparked my interest to understand technical systems from the inside out rather than resisting them.\n\nIn performance marketing, what excites me is that you don't have to guess—you have immediate mathematical feedback. You can formulate a hypothesis about user psychology, structure a campaign, and see the auction and conversion funnel respond in real time. I'm eager to bring that builder curiosity to Crealytics and learn from experienced practitioners.",
        supportingContext: "Primary Notes Section 1: Tell Me About Yourself.",
        stuckRecovery: {
          breatheMsg: "Dehradun valley → Media & Communication editor → Kraftshala performance marketing → AI & Roblox vibe coding.",
          questionSummary: "Tell me about yourself?",
          points: ["From Dehradun valley", "Media & Communication editor background", "Kraftshala performance marketing pivot", "Loves AI, vibe coding, and making ideas work"],
          easySay: "I'm from Dehradun with a background in media and editing. At Kraftshala I fell in love with performance marketing because it connects creativity, psychology, and data, and lately I've been hands-on with AI and vibe coding.",
          stallSay: "I'd love to share my background—it really connects back to my curiosity about people and systems."
        }
      },
      {
        id: "master-q10",
        category: "expected",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        question: "Why Crealytics, and why this Performance Marketing Associate role?",
        topic: "Why Crealytics",
        babeTag: "babe 👀 performance marketing + data + tech: learn how AI works at scale in retail/ecommerce",
        simplestQuestion: "Combines performance marketing, data, and technology; want to see AI and data-driven decisions applied at scale in ecommerce.",
        startWithPrompt: "Start with: “What caught my attention about Crealytics was the combination of…”",
        glanceSay: "What caught my attention about Crealytics was the combination of performance marketing, data, and technology. Through my training at Kraftshala, I learned how bid strategies, keyword intent, and campaign structures influence performance. But I've also discovered how much I enjoy exploring AI and data analysis to solve real problems. I'd love to learn how that works at a larger scale in an agency environment that genuinely cares about profitable growth and incrementality rather than vanity clicks.",
        glanceBullets: [
          "• Core alignment: Intersection of performance marketing, deep data analysis, and technology",
          "• Scale curiosity: Eager to see how AI and algorithmic bidding operate on large-scale ecommerce clients",
          "• Commercial maturity: Respect Crealytics' public focus on incrementality and true profit over vanity ROAS",
          "• Growth mindset: Bring strong analytical discipline and communication skills while learning rapidly"
        ],
        expandedSay: "Many agencies focus strictly on top-line platform metrics like blended ROAS, which often masks wasted spend and diminishing returns. What stands out about Crealytics is your technical depth in retail media, incrementality measurement, and margin-based decision making.\n\nMy background in editing taught me to verify facts and communicate clearly, and my coursework in data analytics and hands-on campaign testing gave me strong quantitative fundamentals. I want to build my career in a team where data integrity and analytical curiosity are celebrated.",
        supportingContext: "Primary Notes Section 1: Why Crealytics?",
        stuckRecovery: {
          breatheMsg: "Why Crealytics: Data + tech + performance marketing. AI at scale. Profitable growth over vanity metrics.",
          questionSummary: "Why Crealytics?",
          points: ["Combination of performance marketing, data, and technology", "Exploring AI problem-solving at scale in ecommerce", "Focus on true incrementality and profitable growth", "Strong analytical culture to learn and contribute"],
          easySay: "What drew me to Crealytics is the combination of performance marketing, data, and technology. I want to understand how AI and data-driven decisions drive profitable growth at scale.",
          stallSay: "Crealytics really stood out to me from the start because of your focus on data and technology."
        }
      },
      {
        id: "master-q11",
        category: "situational",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "If a campaign is underperforming, what is your diagnostic framework?",
        topic: "Campaign Underperformance Diagnostic",
        babeTag: "babe 👀 6-step framework: Goal → Data → Diagnosis → Hypothesis → Action → Evaluation",
        simplestQuestion: "Verify tracking first, segment by audience/creative/LP, isolate the funnel bottleneck, test one targeted change at a time.",
        startWithPrompt: "Start with: “First, I'd check whether tracking is working properly…”",
        glanceSay: "First, I'd check whether the tracking is working properly and whether the data is reliable. Then I'd break performance down across audience, creative, placement, and landing page to see where the drop-off is concentrated. I look at the funnel systematically: are people seeing the ad but not clicking, or clicking but not converting? Those are two completely different problems. Once I form a hypothesis, I test one change at a time, measure the result, and go from there. I never change five things at once and have no idea which one helped.",
        glanceBullets: [
          "• Step 1: Technical validation (verify conversion tags, GA4 events, and pixel firing)",
          "• Step 2: Funnel segmentation (isolate impressions vs clicks vs conversions across devices and placements)",
          "• Step 3: Intent & Creative audit (check search term reports for waste; review ad relevance)",
          "• Step 4: Landing page check (mobile usability, page load speed, pricing, and checkout friction)",
          "• Step 5: Controlled testing (change one variable at a time to isolate causality)"
        ],
        expandedSay: "When a campaign underperforms, the instinct is often to immediately slash bids or pause ad sets. But if the issue is a broken conversion tag or a slow mobile checkout page, altering campaign bids just compounds the error.\n\nBy following the Six-Step Framework—Goal, Data, Diagnosis, Hypothesis, Action, and Evaluation—we treat performance marketing as an empirical science. If high CTR is paired with low CVR, we audit post-click experience; if CTR is low with high CPC, we review keyword match types and auction competition.",
        supportingContext: "Primary Notes Section 4: If a Campaign is Underperforming & Part 9 Framework.",
        stuckRecovery: {
          breatheMsg: "Underperforming: 1. Tracking check 2. Segment audience/creative/LP 3. Funnel drop-off 4. Test 1 variable.",
          questionSummary: "What to do if campaign underperforms?",
          points: ["Check tracking and data reliability first", "Segment by audience, creative, placement, and landing page", "Determine if drop-off is pre-click or post-click", "Test one variable at a time"],
          easySay: "I first check tracking to ensure data is reliable, break down performance by audience and landing page to find the funnel drop-off, and test one change at a time so we know what worked.",
          stallSay: "Whenever a campaign underperforms, I always follow a disciplined diagnostic framework."
        }
      },
      {
        id: "master-q12",
        category: "commercial",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        question: "What if the client wants to increase spend on a campaign just because it has a high CTR?",
        topic: "High CTR Spend Increase Request",
        babeTag: "babe 👀 a click is not a sale: check CVR, CPO, and margins before scaling spend",
        simplestQuestion: "Explain that CTR is encouraging for creative relevance, but verify conversion rate and business profitability before recommending more budget.",
        startWithPrompt: "Start with: “I'd explain that the high CTR is encouraging, but…”",
        glanceSay: "I'd explain that the high CTR is encouraging because it shows the creative is capturing attention, but I'd want to check the conversion rate and business results before recommending more spend. If the campaign is generating conversions at an acceptable cost, scaling could make sense. But if it's generating clicks without meaningful revenue—like Campaign C in our case study—increasing the budget will just burn spend faster. I'd want the client to understand why we're making a recommendation, not just give them a number.",
        glanceBullets: [
          "• Creative validation: High CTR indicates strong ad resonance and attention",
          "• Commercial reality: A click is not a sale; clicks without conversion readiness waste budget",
          "• The Case Study Example: Campaign C had 30% CTR but lost money with a 0.95 ROAS",
          "• Client partnership: Educate the client on unit economics and conversion quality before scaling"
        ],
        expandedSay: "Clients often see a 15% or 30% CTR in their dashboard and assume the campaign is a runaway success. My role as a performance marketer is to guide them toward true commercial outcomes.\n\nI would present the full funnel: CTR, conversion rate, cost per order, and return on ad spend. If the conversion rate is healthy and inventory margins allow for profitable scale, we can test a controlled budget increase. But if the conversion rate is low, I’d propose fixing landing page relevance or tightening audience intent before putting another euro into the auction.",
        supportingContext: "Primary Notes Section 4: What if client wants to increase spend on high CTR?",
        stuckRecovery: {
          breatheMsg: "High CTR spend request: CTR is encouraging, but check conversion rate and profit. Clicks != sales.",
          questionSummary: "Client wants to scale on high CTR?",
          points: ["Acknowledge CTR shows strong attention", "Explain that a click is not a sale", "Check CVR, CPO, and profitability first", "Cite Campaign C (30% CTR, 0.95 ROAS) as the proof point"],
          easySay: "I'd explain that while high CTR is encouraging for ad resonance, we need to check conversion rate and profitability first. High clicks without conversions just burns budget faster.",
          stallSay: "That's a very common client conversation—for me, it's about grounding the discussion in profit."
        }
      },
      {
        id: "master-q13",
        category: "behavioural",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "What if the data doesn't give you a clear answer to a problem?",
        topic: "Handling Data Ambiguity & Intellectual Honesty",
        babeTag: "babe 👀 intellectual honesty: explain what data suggests vs what cannot be concluded, test next",
        simplestQuestion: "Be honest. State what data suggests, what cannot be concluded, and propose a controlled test. Never guess or pretend to know.",
        startWithPrompt: "Start with: “I'd be completely honest about that…”",
        glanceSay: "I'd be completely honest about that. I'd explain what the data suggests, what we can't conclude yet, and what I'd need to investigate further. If we need more data or a larger sample size, I'd say so rather than make a recommendation I'm not confident in. I'd much rather give a clear answer with the right caveats and propose a controlled test than pretend we know something we don't.",
        glanceBullets: [
          "• Intellectual honesty: Acknowledge the limits of the available data openly",
          "• Clear separation: Distinguish between verified observations and unproven hypotheses",
          "• Sample size awareness: Avoid making sweeping conclusions on small datasets (like the 60-click retargeting set)",
          "• Constructive next step: Propose a specific test or additional data point to resolve the ambiguity"
        ],
        expandedSay: "In performance marketing, pretending to have certainty when data is ambiguous leads to expensive mistakes. For instance, in our Excel exercise, the DE Retargeting campaign showed a positive €17 profit, but it was based on only 60 clicks. Declaring that a massive success without caveats would be irresponsible.\n\nMy approach is to communicate transparently: explain the plausible hypotheses, outline what additional tracking or volume is required to establish statistical confidence, and agree on a low-risk monitoring plan with the team.",
        supportingContext: "Primary Notes Section 4: What if data doesn't give a clear answer?",
        stuckRecovery: {
          breatheMsg: "Data ambiguity: Be honest. State what data suggests, state what is unknown, propose controlled test.",
          questionSummary: "What if data isn't clear?",
          points: ["Be honest about data limitations", "State what data suggests vs what is unproven", "Never make unconfident recommendations", "Propose a controlled test to gather evidence"],
          easySay: "I'd be honest about it. I'd explain what the data suggests, what we can't conclude yet, and what we need to test next. I'd rather give a clear answer with caveats than guess.",
          stallSay: "I think intellectual honesty is one of the most important traits in an analyst."
        }
      },
      {
        id: "master-q14",
        category: "technical",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "How would you approach platforms like Microsoft Ads, Performance Max, or LinkedIn since your primary projects are in Google Search and Meta?",
        topic: "Transferable Skills & Learning Unfamiliar Platforms",
        babeTag: "babe 👀 candidate honesty principle: PPC principles are transferable, eager to learn hands-on at Crealytics",
        simplestQuestion: "State honestly that you haven't had hands-on platform experience yet, but underlying PPC principles (intent, bidding, tracking) are transferable, and you're eager to learn.",
        startWithPrompt: "Start with: “My strongest hands-on experience is with Google Search and Meta Ads, but…”",
        glanceSay: "My strongest hands-on experience is with Google Search and Meta Ads, but the underlying performance marketing principles are completely transferable. I understand keyword intent, negative keywords, bidding mechanics, conversion tracking, and campaign optimization. For Microsoft Ads, PMax, or LinkedIn, I haven't had direct hands-on agency account experience yet, but I've studied how they operate—like PMax's multi-channel automation and product feed requirements—and I'm genuinely eager to learn them hands-on at Crealytics.",
        glanceBullets: [
          "• Honesty Safeguard: State clearly that practical experience is in Google Search and Meta, without pretending",
          "• Transferable PPC Mechanics: Keyword intent, auction dynamics, negative keywords, conversion tracking",
          "• Theoretical Grounding: Studied PMax audience signals and feed optimization, Microsoft search networks, and LinkedIn B2B lead generation",
          "• Rapid Learner: Proven ability to dive into new tools (Google Data Analytics, SQL, Python, vibe coding)"
        ],
        expandedSay: "When taking on a new platform, my workflow is always structured: I study the official documentation, understand the campaign objectives, audit conversion tracking and bidding options, and test settings in a controlled environment before rolling out live budget.\n\nWhether it's configuring product feeds in Google Merchant Center for Performance Max or tailoring B2B audience targeting on LinkedIn, the core discipline of performance marketing remains the same: validate the data, monitor unit economics, and test hypotheses systematically.",
        supportingContext: "Secondary Notes Part 1, 2, 4 & Candidate Honesty Directive.",
        stuckRecovery: {
          breatheMsg: "Honesty: Strongest in Google Search & Meta. Underlying PPC is transferable. Eager to master PMax/Microsoft Ads hands-on.",
          questionSummary: "How to handle unfamiliar platforms?",
          points: ["Be honest about hands-on background in Google & Meta", "PPC principles are transferable across platforms", "Studied PMax, Microsoft Ads, and LinkedIn concepts", "Eager to learn hands-on in this role"],
          easySay: "My strongest practical experience is in Google Search and Meta, but PPC fundamentals are transferable. I haven't managed live PMax or Microsoft Ads accounts yet, but I understand the mechanics and I'm eager to learn them hands-on.",
          stallSay: "I believe in being completely transparent about my experience while highlighting transferable skills."
        }
      },
      {
        id: "master-q15",
        category: "commercial",
        speaker: "Technical Interviewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        question: "Can you explain the difference between attribution, incrementality, and Marketing Mix Modeling (MMM)?",
        topic: "Attribution vs Incrementality vs MMM",
        babeTag: "babe 👀 Attribution = credit assignment | Incrementality = causality (test/control) | MMM = macro regression",
        simplestQuestion: "Attribution assigns credit to touchpoints (last-click); Incrementality proves if ads caused new sales that wouldn't happen anyway; MMM uses aggregate data over time.",
        startWithPrompt: "Start with: “These three approaches answer fundamentally different questions…”",
        glanceSay: "These three approaches answer fundamentally different questions. Attribution asks: which marketing touchpoints receive credit under a defined rule, like last-click or data-driven attribution. Incrementality asks: did the advertising actually cause additional sales that would not have happened organically, proven through test-and-control experiments. And Marketing Mix Modeling (MMM) uses top-down statistical regression on aggregate historical data to evaluate how all channels interact over time. They complement each other, but attribution should never be confused with causality.",
        glanceBullets: [
          "• Attribution: Rule-based credit assignment across touchpoints (last-click, multi-touch, data-driven)",
          "• Incrementality: Causal proof via geo-lift or test-and-control experiments (did ads create net-new revenue?)",
          "• Marketing Mix Modeling (MMM): Macro statistical analysis measuring channel contributions without cookies",
          "• Platform ROAS Trap: Ad platforms take credit for existing organic demand; incrementality isolates true business lift"
        ],
        expandedSay: "Crealytics places huge emphasis on incrementality because platform-reported ROAS can be deeply misleading. For example, a branded search ad might report a 15x ROAS, but if those customers were already searching for the brand and would have purchased organically, the ad's incremental ROAS is near zero.\n\nBy combining bottom-up attribution for tactical bidding with top-down incrementality testing and MMM, advertisers can avoid double-counting conversions across Meta and Google and invest in channels that drive true commercial expansion.",
        supportingContext: "Secondary Notes Part 6: Attribution vs Incrementality.",
        stuckRecovery: {
          breatheMsg: "Attribution = credit. Incrementality = true causality (test vs control). MMM = macro regression over time.",
          questionSummary: "Attribution vs Incrementality vs MMM?",
          points: ["Attribution assigns credit to touchpoints", "Incrementality proves causal lift via experiments", "MMM models macro channel interactions over time", "Platform ROAS often claims organic sales"],
          easySay: "Attribution assigns credit under a model, incrementality tests whether the ad caused sales that wouldn't happen anyway, and MMM is top-down historical modeling across all channels.",
          stallSay: "This is one of my favorite topics because it gets right to the heart of marketing measurement."
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
