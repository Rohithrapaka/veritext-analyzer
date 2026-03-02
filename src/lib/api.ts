// Placeholder API calls for VeriText services

export interface PlagiarismResult {
  similarity: number;
  matches: { text: string; source: string; similarity: number }[];
  breakdown: { category: string; percentage: number }[];
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

export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
  await delay(2000);
  return {
    similarity: 23,
    matches: [
      { text: "The fundamental principles of machine learning involve", source: "Wikipedia - Machine Learning", similarity: 89 },
      { text: "neural networks are computational systems inspired by", source: "Stanford CS229 Notes", similarity: 76 },
      { text: "data preprocessing is a crucial step in", source: "Towards Data Science", similarity: 64 },
    ],
    breakdown: [
      { category: "Internet Sources", percentage: 15 },
      { category: "Academic Papers", percentage: 5 },
      { category: "Books & Publications", percentage: 3 },
    ],
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
