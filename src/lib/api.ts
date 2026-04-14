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
  classification: string;
  score: number;
  confidence: "high" | "medium" | "low";
  message?: string;
  details?: {
    llm_score?: number;
    gibberish?: number;
    repetition?: number;
    structure?: number;
    length_signal?: number;
    reason?: string;
    humanSignalsDetected?: boolean;
  };
  sentences: Array<{
    text: string;
    probability: number;
    label: "AI" | "Human" | "Uncertain";
    suspicious: boolean;
  }>;
}



// Detect human signals (slang, emojis, informal language)
function detectHumanSignals(text: string): boolean {
  const lower = text.toLowerCase();

  const humanKeywords = [
    "lol", "lmao", "idk", "ngl", "bruh", "bro", "wtf",
    "tbh", "omg", "haha", "uh", "hmm", "yeah", "yep", "nope",
    "gonna", "wanna", "gotta", "ain't", "y'all", "dunno"
  ];

  const emojiRegex = /[\p{Emoji}]/gu;

  const keywordMatch = humanKeywords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
  const emojiMatch = emojiRegex.test(text);

  return keywordMatch || emojiMatch;
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
      console.log("API RESPONSE:", data);

      // Get initial score from backend
      let score = typeof data.overall === "number" ? data.overall : 0;

      // Apply human signal detection
      const hasHumanSignals = detectHumanSignals(text);
      if (hasHumanSignals) {
        score = score - 25;
      }

      // Apply short text penalty
      if (text.length < 120) {
        score = score - 10;
      }

      // Clamp score between 0 and 100
      score = Math.max(0, Math.min(100, score));

      // Determine classification
      let classification: string;
      if (score >= 70) {
        classification = "AI Generated";
      } else if (score >= 40 && score < 70) {
        classification = "Uncertain";
      } else {
        classification = "Human Written";
      }

      // Add bias label for informal human style
      if (hasHumanSignals && score < 70) {
        classification += " (Informal Human Style)";
      }

      // Determine confidence
      let confidence: "high" | "medium" | "low";
      if (score >= 70 || score < 40) {
        confidence = "high";
      } else if (score >= 50 && score < 70) {
        confidence = "medium";
      } else {
        confidence = "low";
      }

      return {
        classification,
        score,
        confidence,
        message: data.message,
        details: {
          ...data.details,
          humanSignalsDetected: hasHumanSignals,
          length_signal: text.length < 120 ? 10 : 0
        },
        sentences: (data?.sentences || []).map((s: any) => {
          const probability = typeof s.probability === "number" ? s.probability : 0;
          const normalizedProbability = Math.max(0, Math.min(probability, 100));
          const label =
            normalizedProbability >= 70 ? "AI" :
            normalizedProbability >= 40 ? "Uncertain" :
            "Human";
          return {
            text: s.text || "",
            probability: normalizedProbability,
            label,
            suspicious: false
          };
        })
      };

    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("AI Detection failed:", err);
        return {
          classification: "Error",
          score: 0,
          confidence: "low",
          message: `AI detection unavailable: ${msg}`,
          details: {
            humanSignalsDetected: detectHumanSignals(text)
          },
          sentences: []
        };
      }

      await delay(2000);
    }
  }

  return {
    classification: "Uncertain",
    score: 0,
    confidence: "low",
    message: "AI detection backend unavailable",
    details: {
      humanSignalsDetected: detectHumanSignals(text)
    },
    sentences: []
  };}
}
