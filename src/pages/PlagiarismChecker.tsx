import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { checkPlagiarism, type PlagiarismResult } from "@/lib/api";
import { FileSearch, Upload, Loader2, Brain, Database, Search, BarChart3, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function PlagiarismChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await checkPlagiarism(text);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result as string || "");
    reader.readAsText(file);
  };

  const getSimilarityColor = (v: number) => v > 50 ? "text-destructive" : v > 25 ? "text-warning" : "text-success";
  const getSimilarityBg = (v: number) => v > 50 ? "bg-destructive/10 border-destructive/20" : v > 25 ? "bg-warning/10 border-warning/20" : "bg-success/10 border-success/20";
  const isFlagged = (v: number) => v >= 80;

  return (
    <DashboardLayout>
      <div className="max-w-4xl animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Plagiarism Checker</h1>
            <p className="text-sm text-muted-foreground">Semantic similarity detection powered by Sentence-BERT embeddings.</p>
          </div>
        </div>

        {/* Input */}
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <Textarea
            placeholder="Paste your text here to check for plagiarism..."
            className="min-h-[200px] resize-none mb-4 border-muted"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleCheck} disabled={loading || !text.trim()} className="gradient-hero text-primary-foreground border-0 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              Check Plagiarism
            </Button>
            <input type="file" ref={fileRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFile} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Upload File
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">PDF, DOCX, TXT</span>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Overall Score */}
            <div className={`rounded-xl border p-5 shadow-card ${getSimilarityBg(result.similarity)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {result.similarity >= 50 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                  <h2 className="font-semibold text-foreground">Overall Plagiarism Score</h2>
                </div>
                <span className={`font-display text-3xl font-bold ${getSimilarityColor(result.similarity)}`}>
                  {result.similarity}%
                </span>
              </div>
              <Progress value={result.similarity} className="h-2.5 mb-2" />
              <p className="text-xs text-muted-foreground">
                Computed via cosine similarity of Sentence-BERT (all-MiniLM-L6-v2) embeddings against the Quora Question Pairs knowledge base.
              </p>
            </div>

            {/* Matched Sentences */}
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h2 className="font-semibold text-foreground mb-1">Top Matching Sentences</h2>
              <p className="text-xs text-muted-foreground mb-4">Sentences with similarity ≥ 0.80 are flagged as potential plagiarism.</p>
              <div className="space-y-3">
                {result.matches.map((m, i) => (
                  <div key={i} className={`flex items-start justify-between p-3 rounded-lg border gap-4 ${isFlagged(m.similarity) ? "bg-destructive/5 border-destructive/20" : "bg-muted/50 border-transparent"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isFlagged(m.similarity) && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Flagged</span>
                        )}
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Match #{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground font-medium leading-relaxed">"{m.text}"</p>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Database className="h-3 w-3" /> Source: {m.source}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-lg font-bold font-display ${getSimilarityColor(m.similarity)}`}>{(m.similarity / 100).toFixed(2)}</span>
                      <p className="text-[10px] text-muted-foreground">cosine sim</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h2 className="font-semibold text-foreground mb-4">Breakdown by Source Type</h2>
              <div className="space-y-3">
                {result.breakdown.map((b) => (
                  <div key={b.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{b.category}</span>
                      <span className="font-medium text-foreground">{b.percentage}%</span>
                    </div>
                    <Progress value={b.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground text-lg">How It Works</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            VeriText uses a semantic similarity pipeline to detect plagiarism beyond simple word matching. Here's the full architecture:
          </p>

          {/* Pipeline Steps */}
          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Brain, step: "1", title: "Text Preprocessing", desc: "Lowercasing, stopword removal, and lemmatization normalize input text." },
              { icon: Search, step: "2", title: "Embedding Generation", desc: "Sentence-BERT (all-MiniLM-L6-v2) encodes text into 384-dim vectors." },
              { icon: Database, step: "3", title: "Vector Search", desc: "pgvector computes cosine similarity against 400K+ stored embeddings." },
              { icon: BarChart3, step: "4", title: "Scoring & Flagging", desc: "Top-5 matches returned. Similarity ≥ 0.80 flagged as plagiarism." },
            ].map((s) => (
              <div key={s.step} className="relative p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-6 w-6 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground">{s.step}</span>
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Technical Details Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="dataset">
              <AccordionTrigger className="text-sm font-medium">Knowledge Base: Quora Question Pairs</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                The system uses the Quora Question Pairs dataset (~400K question pairs) as its reference corpus. Each question is preprocessed and embedded using Sentence-BERT, then stored in PostgreSQL with the pgvector extension for efficient approximate nearest neighbor (ANN) search.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="model">
              <AccordionTrigger className="text-sm font-medium">Model: all-MiniLM-L6-v2</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                A lightweight Sentence-BERT model that maps sentences to a 384-dimensional dense vector space. It's optimized for semantic similarity tasks and runs efficiently on CPU. Cosine similarity between vectors captures meaning-level overlap, not just lexical matching.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="scoring">
              <AccordionTrigger className="text-sm font-medium">Scoring & Threshold Logic</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                For each input sentence, cosine similarity is computed against all stored embeddings. The top 5 most similar matches are returned. Any match with similarity ≥ 0.80 is flagged. The overall plagiarism percentage is computed as the weighted average of flagged sentence similarities relative to total input length.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="stack">
              <AccordionTrigger className="text-sm font-medium">Technology Stack</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                <strong>Frontend:</strong> React + Tailwind CSS &nbsp;|&nbsp; <strong>Backend:</strong> FastAPI (Python) &nbsp;|&nbsp; <strong>Database:</strong> PostgreSQL + pgvector &nbsp;|&nbsp; <strong>ML Model:</strong> SentenceTransformers (all-MiniLM-L6-v2) &nbsp;|&nbsp; <strong>Dataset:</strong> Kaggle Quora Question Pairs
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </DashboardLayout>
  );
}
