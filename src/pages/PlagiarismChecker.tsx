import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { checkPlagiarism, type PlagiarismResult } from "@/lib/api";
import { extractTextFromFile } from "@/lib/file-parser";
import {
  FileSearch, Upload, Loader2, Brain, Database, Search,
  BarChart3, AlertTriangle, CheckCircle, Info, FileText, XCircle, X, File,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function Stats({ wordCount, sentenceCount, similarity }: { wordCount: number; sentenceCount: number; similarity: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Words", value: wordCount },
        { label: "Sentences", value: sentenceCount },
        { label: "Avg Similarity", value: `${similarity}%` },
      ].map((s) => (
        <div key={s.label} className="rounded-lg border bg-card p-3 text-center shadow-card">
          <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

const getSimilarityColor = (v: number) => v > 50 ? "text-destructive" : v > 25 ? "text-warning" : "text-success";
const getSimilarityBg = (v: number) => v > 50 ? "bg-destructive/10 border-destructive/20" : v > 25 ? "bg-warning/10 border-warning/20" : "bg-success/10 border-success/20";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "docx") return "DOCX";
  return "TXT";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadedFile {
  name: string;
  size: number;
  wordCount: number;
}

export default function PlagiarismChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setParseError(null);
    try {
      const res = await checkPlagiarism(text);
      setResult(res);
    } catch (err: any) {
      setParseError(err?.message || "Unable to connect to plagiarism server");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setParseError(null);
    setResult(null);
    try {
      const extracted = await extractTextFromFile(file);
      if (!extracted.trim()) {
        setParseError("The file appears to be empty or contains no readable text.");
        return;
      }
      setText(extracted);
      setUploadedFile({
        name: file.name,
        size: file.size,
        wordCount: extracted.trim().split(/\s+/).length,
      });
    } catch (err: any) {
      setParseError(err?.message || "Failed to parse the file.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setText("");
    setResult(null);
    setParseError(null);
  };

  const showTextarea = !uploadedFile;

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
          {showTextarea ? (
            <Textarea
              placeholder="Paste your text here or upload a file to check for plagiarism..."
              className="min-h-[200px] resize-none mb-4 border-muted"
              value={text}
              onChange={(e) => { setText(e.target.value); setParseError(null); }}
            />
          ) : (
            /* Uploaded file card */
            <div className="mb-4 rounded-lg border bg-secondary/30 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <File className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{uploadedFile.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                    {getFileIcon(uploadedFile.name)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{uploadedFile.wordCount} words</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClearFile} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {parseError && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <XCircle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleCheck} disabled={loading || parsing || !text.trim()} className="gradient-hero text-primary-foreground border-0 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              {loading ? "Analyzing…" : "Check Plagiarism"}
            </Button>
            <input type="file" ref={fileRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFile} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={parsing} className="gap-2">
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {parsing ? "Extracting…" : "Upload File"}
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">PDF, DOCX, TXT</span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="rounded-xl border bg-card p-8 shadow-card flex flex-col items-center gap-3 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium text-foreground">Analyzing document…</p>
            <p className="text-xs text-muted-foreground">Computing cosine similarity against knowledge base embeddings.</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !text.trim() && (
          <div className="rounded-xl border border-dashed bg-card/50 p-10 shadow-card flex flex-col items-center gap-3 text-center animate-fade-in">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No content to analyze</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Paste text into the box above or upload a PDF, DOCX, or TXT file to begin plagiarism analysis.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            <Stats wordCount={result.wordCount} sentenceCount={result.sentenceCount} similarity={result.similarity} />

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
                Average cosine similarity of Sentence-BERT (all-MiniLM-L6-v2) embeddings against the knowledge base.
              </p>
            </div>

            {/* Matched Sentences */}
            {result.matches.length > 0 && (
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h2 className="font-semibold text-foreground mb-1">Sentence-Level Analysis</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {result.matches.filter(m => m.similarity >= 80).length} of {result.matches.length} matches flagged (similarity ≥ 80%).
                </p>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {result.matches.map((m, i) => {
                    const flagged = m.similarity >= 80;
                    return (
                      <div
                        key={i}
                        className={`flex items-start justify-between p-3 rounded-lg border gap-4 transition-colors ${
                          flagged ? "bg-destructive/5 border-destructive/20" : "bg-muted/50 border-transparent"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {flagged && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                Flagged
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Match #{i + 1}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium leading-relaxed">"{m.text}"</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-lg font-bold font-display ${getSimilarityColor(m.similarity)}`}>
                            {m.similarity}%
                          </span>
                          <p className="text-[10px] text-muted-foreground">similarity</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
