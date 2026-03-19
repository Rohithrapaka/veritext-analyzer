// API calls for VeriText services

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://rapakarohith-veritext-backend.hf.space";

const PLAGIARISM_API_URL = ${API_BASE_URL}/api/plagiarism-check;
const AI_DETECT_API_URL = ${API_BASE_URL}/api/ai-detect;

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

// helper delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {

  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {

    try {

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(PLAGIARISM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      // backend waking up (Render cold start)
      if (response.status === 503) {
        console.warn("Backend warming up... retrying");
        await delay(3000);
        continue;
      }

      if (!response.ok) {
        throw new Error(Server error: ${response.status});
      }

      const data = await response.json();

      // backend returns { results: [...] }
      const matches: PlagiarismMatch[] = (data.results || []).map(
        (m: { matched_text: string; similarity_score: number }) => ({
          text: m.matched_text,
          similarity: Math.round(m.similarity_score * 100)
        })
      );

      const wordCount = text.split(/\s+/).filter(Boolean).length;

      const sentenceCount =
        text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).length || 1;

      const similarity =
        matches.length > 0
          ? Math.round(matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length)
          : 0;

      return {
        similarity,
        matches,
        wordCount,
        sentenceCount
      };

    } catch (err) {

      if (attempt === MAX_RETRIES - 1) {
        console.error("Plagiarism API failed:", err);
        throw new Error("Plagiarism server unavailable. Please try again.");
      }

      await delay(2000);
    }
  }

  throw new Error("Backend unavailable");
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



export async function compareDocuments(doc1: string, doc2: string): Promise<ComparisonResult> {

  await delay(2000);

  const doc1Lines = doc1.split('\n').filter(l => l.trim());
  const doc2Lines = doc2.split('\n').filter(l => l.trim());

  return {
    similarity: 67,
    differences: [
      { type: 'change', text: 'Modified introduction paragraph', position: 0 },
      { type: 'addition', text: 'New methodology section added', position: 3 },
      { type: 'deletion', text: 'Removed conclusion remarks', position: 5 }
    ],
    doc1Lines,
    doc2Lines
  };
}



export async function detectAI(text: string): Promise<AIDetectionResult> {

  const sentences = text
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 5)
    .map(s => s.trim() + '.');

  if (sentences.length === 0) {
    return { aiProbability: 0, sentences: [] };
  }

  const response = await fetch(AI_DETECT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(AI detect error ${response.status});
  }

  const data = await response.json();

  return {
    aiProbability: Math.round(data.aiProbability ?? 0),
    sentences: (data.sentences || []).map((s: any) => ({
      text: s.text,
      probability: Math.round(s.probability),
      suspicious: Boolean(s.suspicious)
    }))
  };
}
