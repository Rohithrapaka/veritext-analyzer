// API calls for VeriText services

const PLAGIARISM_API_URL = "http://127.0.0.1:8000/api/plagiarism-check";

export interface PlagiarismMatch {
  text: string;
  similarity: number;
}

export interface PlagiarismResult {
  similarity: number;
  matches: PlagiarismMatch[];
  wordCount: number;
  sentenceCount: number;
}

export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
  const response = await fetch(PLAGIARISM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Unable to connect to plagiarism server");
  }

  const data = await response.json();

  const matches: PlagiarismMatch[] = (data.matches || []).map(
    (m: { matched_text: string; similarity_score: number }) => ({
      text: m.matched_text,
      similarity: Math.round(m.similarity_score * 100),
    })
  );

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10).length || 1;
  const similarity = matches.length > 0
    ? Math.round(matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length)
    : 0;

  return { similarity, matches, wordCount, sentenceCount };
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
