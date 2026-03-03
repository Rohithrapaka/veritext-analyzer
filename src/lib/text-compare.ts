// Pure client-side document comparison utilities

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

function tokenize(sentence: string): string[] {
  return normalize(sentence).split(/\s+/).filter(Boolean);
}

/** Jaccard similarity: |A ∩ B| / |A ∪ B| */
function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export type MatchType = "exact" | "modified" | "unique";

export interface SentenceComparison {
  text: string;
  bestMatch: string;
  similarity: number;
  type: MatchType;
}

export interface ComparisonReport {
  overallSimilarity: number;
  doc1Sentences: SentenceComparison[];
  doc2Sentences: SentenceComparison[];
  stats: {
    doc1Total: number;
    doc2Total: number;
    matching: number;
    modified: number;
    unique: number;
  };
  breakdown: {
    similarPercent: number;
    modifiedPercent: number;
    uniquePercent: number;
  };
}

function classify(sim: number): MatchType {
  if (sim >= 0.85) return "exact";
  if (sim >= 0.60) return "modified";
  return "unique";
}

function compareSentencesAgainst(
  source: string[],
  target: string[]
): SentenceComparison[] {
  return source.map((s) => {
    const tokensA = tokenize(s);
    let bestSim = 0;
    let bestMatch = "";
    for (const t of target) {
      const sim = jaccard(tokensA, tokenize(t));
      if (sim > bestSim) {
        bestSim = sim;
        bestMatch = t;
      }
    }
    return {
      text: s,
      bestMatch,
      similarity: Math.round(bestSim * 100) / 100,
      type: classify(bestSim),
    };
  });
}

export function compareTexts(text1: string, text2: string): ComparisonReport {
  const sentences1 = splitSentences(text1);
  const sentences2 = splitSentences(text2);

  const doc1Sentences = compareSentencesAgainst(sentences1, sentences2);
  const doc2Sentences = compareSentencesAgainst(sentences2, sentences1);

  // Aggregate stats from doc1's perspective
  const all = [...doc1Sentences, ...doc2Sentences];
  const matching = all.filter((s) => s.type === "exact").length;
  const modified = all.filter((s) => s.type === "modified").length;
  const unique = all.filter((s) => s.type === "unique").length;
  const total = all.length || 1;

  const overallSimilarity = Math.round(
    (all.reduce((sum, s) => sum + s.similarity, 0) / total) * 100
  );

  return {
    overallSimilarity,
    doc1Sentences,
    doc2Sentences,
    stats: {
      doc1Total: sentences1.length,
      doc2Total: sentences2.length,
      matching,
      modified,
      unique,
    },
    breakdown: {
      similarPercent: Math.round((matching / total) * 100),
      modifiedPercent: Math.round((modified / total) * 100),
      uniquePercent: Math.round((unique / total) * 100),
    },
  };
}
