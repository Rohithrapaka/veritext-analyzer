import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { extractTextFromFile } from "@/lib/file-parser";
import { compareTexts, type ComparisonReport, type SentenceComparison } from "@/lib/text-compare";
import {
  GitCompare, Upload, Loader2, FileText, XCircle, RotateCcw,
  CheckCircle, AlertTriangle, Minus, File, X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ───── helpers ───── */

const typeColor = (t: string) =>
  t === "exact"
    ? "bg-success/10 border-success/30 text-success"
    : t === "modified"
    ? "bg-warning/10 border-warning/30 text-warning"
    : "bg-destructive/10 border-destructive/30 text-destructive";

const typeBg = (t: string) =>
  t === "exact" ? "bg-success/15" : t === "modified" ? "bg-warning/15" : "bg-destructive/15";

const typeLabel = (t: string) =>
  t === "exact" ? "Match" : t === "modified" ? "Modified" : "Unique";

const simColor = (v: number) =>
  v >= 70 ? "text-success" : v >= 40 ? "text-warning" : "text-destructive";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "docx") return "DOCX";
  return "TXT";
}

/* ───── upload card (file-only, no textarea) ───── */

interface UploadedFileInfo {
  name: string;
  size: number;
  wordCount: number;
}

interface DocUploadCardProps {
  label: string;
  file: UploadedFileInfo | null;
  parsing: boolean;
  error: string | null;
  onUpload: () => void;
  onClear: () => void;
  fileRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function DocUploadCard({ label, file, parsing, error, onUpload, onClear, fileRef, onFileChange }: DocUploadCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <XCircle className="h-3 w-3 shrink-0" /> {error}
        </div>
      )}

      <input type="file" ref={fileRef} className="hidden" accept=".pdf,.docx,.txt" onChange={onFileChange} />

      {!file ? (
        /* Drop zone / upload prompt */
        <button
          onClick={onUpload}
          disabled={parsing}
          className="flex-1 min-h-[140px] rounded-lg border-2 border-dashed border-muted hover:border-primary/40 bg-secondary/20 hover:bg-secondary/40 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {parsing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Extracting text…</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Click to upload</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">PDF, DOCX, or TXT</p>
              </div>
            </>
          )}
        </button>
      ) : (
        /* File info card */
        <div className="flex-1 rounded-lg border bg-secondary/30 p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <File className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                {getFileType(file.name)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{file.wordCount} words</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ───── sentence row ───── */

function SentenceRow({ s, index }: { s: SentenceComparison; index: number }) {
  return (
    <div className={`p-3 rounded-lg border ${typeColor(s.type)} transition-colors`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          #{index + 1}
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeBg(s.type)}`}>
          {typeLabel(s.type)}
        </span>
        <span className="ml-auto text-xs font-bold">{(s.similarity * 100).toFixed(0)}%</span>
      </div>
      <p className="text-sm leading-relaxed">{s.text}</p>
      {s.type !== "unique" && s.bestMatch && (
        <p className="text-xs mt-1.5 opacity-70 italic">Best match: "{s.bestMatch.slice(0, 120)}{s.bestMatch.length > 120 ? "…" : ""}"</p>
      )}
    </div>
  );
}

/* ───── main page ───── */

export default function DocumentComparison() {
  const [doc1Text, setDoc1Text] = useState("");
  const [doc2Text, setDoc2Text] = useState("");
  const [file1, setFile1] = useState<UploadedFileInfo | null>(null);
  const [file2, setFile2] = useState<UploadedFileInfo | null>(null);
  const [parsing1, setParsing1] = useState(false);
  const [parsing2, setParsing2] = useState(false);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonReport | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const file1Ref = useRef<HTMLInputElement>(null!);
  const file2Ref = useRef<HTMLInputElement>(null!);

  const makeFileHandler = (
    setTextFn: (v: string) => void,
    setFileFn: (v: UploadedFileInfo | null) => void,
    setParsingFn: (v: boolean) => void,
    setErrFn: (v: string | null) => void,
    ref: React.RefObject<HTMLInputElement>,
  ) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setParsingFn(true);
      setErrFn(null);
      setResult(null);
      try {
        const text = await extractTextFromFile(f);
        if (!text.trim()) { setErrFn("File appears empty."); return; }
        setTextFn(text);
        setFileFn({ name: f.name, size: f.size, wordCount: text.trim().split(/\s+/).length });
      } catch (err: any) {
        setErrFn(err?.message || "Failed to parse file.");
      } finally {
        setParsingFn(false);
        if (ref.current) ref.current.value = "";
      }
    };

  const handleCompare = async () => {
    setCompareError(null);
    if (!doc1Text.trim() || !doc2Text.trim()) {
      setCompareError("Please upload both documents before comparing.");
      return;
    }
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const res = compareTexts(doc1Text, doc2Text);
      setResult(res);
    } catch {
      setCompareError("Comparison failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDoc1Text(""); setDoc2Text("");
    setFile1(null); setFile2(null);
    setError1(null); setError2(null);
    setResult(null); setCompareError(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <GitCompare className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Document Comparison</h1>
            <p className="text-sm text-muted-foreground">Upload two documents to compare — runs entirely in your browser.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="grid md:grid-cols-2 gap-4">
          <DocUploadCard
            label="Document 1"
            file={file1}
            parsing={parsing1}
            error={error1}
            onUpload={() => file1Ref.current?.click()}
            onClear={() => { setDoc1Text(""); setFile1(null); setError1(null); setResult(null); }}
            fileRef={file1Ref}
            onFileChange={makeFileHandler(setDoc1Text, setFile1, setParsing1, setError1, file1Ref)}
          />
          <DocUploadCard
            label="Document 2"
            file={file2}
            parsing={parsing2}
            error={error2}
            onUpload={() => file2Ref.current?.click()}
            onClear={() => { setDoc2Text(""); setFile2(null); setError2(null); setResult(null); }}
            fileRef={file2Ref}
            onFileChange={makeFileHandler(setDoc2Text, setFile2, setParsing2, setError2, file2Ref)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button onClick={handleCompare} disabled={loading || parsing1 || parsing2 || !doc1Text.trim() || !doc2Text.trim()} className="gradient-hero text-primary-foreground border-0 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
            {loading ? "Comparing…" : "Compare Documents"}
          </Button>
          {(file1 || file2 || result) && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          )}
        </div>

        {compareError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <XCircle className="h-4 w-4 shrink-0" /> {compareError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border bg-card p-8 shadow-card flex flex-col items-center gap-3 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium text-foreground">Comparing documents…</p>
            <p className="text-xs text-muted-foreground">Computing Jaccard similarity across all sentence pairs.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && !file1 && !file2 && (
          <div className="rounded-xl border border-dashed bg-card/50 p-10 shadow-card flex flex-col items-center gap-3 text-center animate-fade-in">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No documents loaded</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload PDF, DOCX, or TXT files into both panels above, then click Compare.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Overall Score */}
            <div className={`rounded-xl border p-5 shadow-card ${result.overallSimilarity >= 70 ? "bg-success/5 border-success/20" : result.overallSimilarity >= 40 ? "bg-warning/5 border-warning/20" : "bg-destructive/5 border-destructive/20"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {result.overallSimilarity >= 70 ? <CheckCircle className="h-5 w-5 text-success" /> : result.overallSimilarity >= 40 ? <AlertTriangle className="h-5 w-5 text-warning" /> : <Minus className="h-5 w-5 text-destructive" />}
                  <h2 className="font-semibold text-foreground">Document Similarity Score</h2>
                </div>
                <span className={`font-display text-3xl font-bold ${simColor(result.overallSimilarity)}`}>
                  {result.overallSimilarity}%
                </span>
              </div>
              <Progress value={result.overallSimilarity} className="h-2.5" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Doc 1 Sentences", value: result.stats.doc1Total },
                { label: "Doc 2 Sentences", value: result.stats.doc2Total },
                { label: "Matching", value: result.stats.matching, color: "text-success" },
                { label: "Modified", value: result.stats.modified, color: "text-warning" },
                { label: "Unique", value: result.stats.unique, color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border bg-card p-3 text-center shadow-card">
                  <p className={`text-lg font-bold font-display ${s.color || "text-foreground"}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Similar", pct: result.breakdown.similarPercent, cls: "text-success" },
                { label: "Modified", pct: result.breakdown.modifiedPercent, cls: "text-warning" },
                { label: "Unique", pct: result.breakdown.uniquePercent, cls: "text-destructive" },
              ].map((b) => (
                <div key={b.label} className="rounded-lg border bg-card p-4 shadow-card">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{b.label}</span>
                    <span className={`text-sm font-bold ${b.cls}`}>{b.pct}%</span>
                  </div>
                  <Progress value={b.pct} className="h-1.5" />
                </div>
              ))}
            </div>

            {/* Side-by-Side Diff */}
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: file1?.name || "Document 1", sentences: result.doc1Sentences },
                { title: file2?.name || "Document 2", sentences: result.doc2Sentences },
              ].map((panel) => (
                <div key={panel.title} className="rounded-xl border bg-card shadow-card overflow-hidden">
                  <div className="px-4 py-3 border-b bg-secondary/30">
                    <h3 className="text-sm font-semibold text-foreground truncate">{panel.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{panel.sentences.length} sentences analyzed</p>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="p-3 space-y-2">
                      {panel.sentences.map((s, i) => (
                        <SentenceRow key={i} s={s} index={i} />
                      ))}
                      {panel.sentences.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">No sentences detected.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
