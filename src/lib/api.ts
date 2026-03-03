// API calls for VeriText services

export interface PlagiarismMatch {
  text: string;
  source: string;
  similarity: number;
}

export interface PlagiarismResult {
  similarity: number;
  matches: PlagiarismMatch[];
  breakdown: { category: string; percentage: number }[];
  wordCount: number;
  sentenceCount: number;
}

export interface ComparisonResult {
  similarity: number;
  differences: { type: 'addition' | 'deletion' | 'change'; text: string; position: number }[];
  doc1Lines: string[];
  doc2Lines: string[];
}

export interface AIDetectionResult {
  aiProbability: number;
  sentences: { text: string; probability: number; suspicious: boolean }[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Deterministic hash for a string → number between 0 and 1
function hashScore(str: string, seed: number = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h % 1000) / 1000;
}

const SOURCES = [
  "Quora Knowledge Base",
  "Academic Publications Index",
  "Wikipedia Corpus",
  "Open Access Journals",
  "Research Paper Archive",
];

export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
  await delay(1500);

  // Split into sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) {
    return { similarity: 0, matches: [], breakdown: [], wordCount: 0, sentenceCount: 0 };
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Generate a similarity score per sentence based on its content
  const matches: PlagiarismMatch[] = sentences.map((sentence, i) => {
    const raw = hashScore(sentence, i);
    // Map to 0.40–0.95 range
    const similarity = Math.round((0.40 + raw * 0.55) * 100);
    const source = SOURCES[Math.abs(sentence.length + i) % SOURCES.length];
    return { text: sentence, source, similarity };
  });

  // Sort by similarity descending, take top matches
  matches.sort((a, b) => b.similarity - a.similarity);

  const flagged = matches.filter(m => m.similarity >= 80);
  const overall = matches.length > 0
    ? Math.round(matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length)
    : 0;

  // Breakdown by source type
  const sourceGroups: Record<string, number[]> = {};
  for (const m of matches) {
    if (!sourceGroups[m.source]) sourceGroups[m.source] = [];
    sourceGroups[m.source].push(m.similarity);
  }
  const breakdown = Object.entries(sourceGroups).map(([category, scores]) => ({
    category,
    percentage: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  return {
    similarity: overall,
    matches,
    breakdown,
    wordCount,
    sentenceCount: sentences.length,
  };
}

export async function compareDocuments(doc1: string, doc2: string): Promise<ComparisonResult> {
  await delay(2000);
  const doc1Lines = doc1.split('\n').filter(l => l.trim());
  const doc2Lines = doc2.split('\n').filter(l => l.trim());
  return {
    similarity: 67,
    differences: [
      { type: 'change', text: 'Modified introduction paragraph', position: 0 },
      { type: 'addition', text: 'New methodology section added', position: 3 },
      { type: 'deletion', text: 'Removed conclusion remarks', position: 5 },
    ],
    doc1Lines: doc1Lines.length ? doc1Lines : ["The study examines the impact of technology on education.", "Traditional methods are being replaced by digital tools.", "Students show improved engagement with interactive content.", "However, screen time concerns remain significant.", "Further research is needed in this area."],
    doc2Lines: doc2Lines.length ? doc2Lines : ["This study analyzes the effect of technology on modern education.", "Traditional methods are being replaced by digital tools.", "Students show improved engagement with interactive content.", "A new methodology for measuring engagement was introduced.", "Screen time concerns remain but are mitigated by structured usage.", "More longitudinal studies are recommended."],
  };
}

export async function detectAI(text: string): Promise<AIDetectionResult> {
  await delay(2000);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).map((s, i) => ({
    text: s.trim() + '.',
    probability: [12, 87, 34, 91, 8, 72, 45, 95][i % 8],
    suspicious: [12, 87, 34, 91, 8, 72, 45, 95][i % 8] > 60,
  }));
  return {
    aiProbability: 42,
    sentences: sentences.length ? sentences : [
      { text: "This is a sample sentence for analysis.", probability: 12, suspicious: false },
      { text: "The algorithm processes natural language patterns.", probability: 87, suspicious: true },
      { text: "Results indicate significant improvements.", probability: 34, suspicious: false },
    ],
  };
}
