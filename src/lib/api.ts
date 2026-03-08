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

const GEMINI_API_KEY = "AIzaSyDED9J1FMqhP1kHsXyxx0iytAm-rDn_aO4";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function detectAI(text: string): Promise<AIDetectionResult> {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5).map(s => s.trim() + '.');

  if (sentences.length === 0) {
    return { aiProbability: 0, sentences: [] };
  }

  const prompt = `You are an AI content detector. Analyze each sentence below and estimate the probability (0-100) that it was written by an AI language model.

Return ONLY a valid JSON object in this exact format, no markdown, no code fences:
{"overall":50,"sentences":[{"text":"...","probability":50}]}

"overall" is the weighted average AI probability for the full text.
Each sentence object has the original "text" and a "probability" (0-100).

Sentences to analyze:
${sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });

    if (!response.ok) {
      throw new Error("Gemini API request failed");
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Strip markdown code fences if present
    const cleanText = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      aiProbability: Math.round(parsed.overall ?? 0),
      sentences: (parsed.sentences || []).map((s: { text: string; probability: number }) => ({
        text: s.text,
        probability: Math.round(s.probability),
        suspicious: s.probability > 60,
      })),
    };
  } catch (error) {
    console.error("AI detection error:", error);
    throw new Error("Unable to analyze text. Please try again.");
  }
}
