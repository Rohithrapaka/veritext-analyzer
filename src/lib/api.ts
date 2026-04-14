// API calls for VeriText services

const PLAGIARISM_API_URL = "https://rapakarohith-veritext-backend.hf.space/api/plagiarism-check";
const AI_DETECT_API_URL = "https://rapakarohith-veritext-backend.hf.space/api/ai-detect";

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
        throw new Error(`Server error: ${response.status}`);
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
  const MAX_RETRIES = 5;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(AI_DETECT_API_URL, {
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

      // Rate limit - retry with backoff
      if (response.status === 429) {
        console.warn(`Rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
        await delay(Math.pow(2, attempt) * 1000); // exponential backoff
        continue;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // backend returns { overall: number, sentences: [...] }
      return {
        aiProbability: Math.round(data.overall || 0),
        sentences: (data?.sentences || []).map((s: any) => ({
          text: s.text || "",
          probability: Math.round(s.probability || 0),
          suspicious: (s.probability || 0) > 60
        }))
      };

    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("AI Detection failed:", err);
        throw new Error(`AI detection unavailable: ${msg}`);
      }

      await delay(2000);
    }
  }

  throw new Error("AI detection backend unavailable");
}
