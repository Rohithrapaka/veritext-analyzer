import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { checkPlagiarism, type PlagiarismResult } from "@/lib/api";
import { FileSearch, Upload, Loader2 } from "lucide-react";

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

  return (
    <DashboardLayout>
      <div className="max-w-4xl animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Plagiarism Checker</h1>
            <p className="text-sm text-muted-foreground">Paste text or upload a document to check for plagiarism.</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card mb-6">
          <Textarea
            placeholder="Paste your text here..."
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

        {result && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Similarity Score</h2>
                <span className={`font-display text-3xl font-bold ${getSimilarityColor(result.similarity)}`}>
                  {result.similarity}%
                </span>
              </div>
              <Progress value={result.similarity} className="h-2" />
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h2 className="font-semibold text-foreground mb-4">Matching Sources</h2>
              <div className="space-y-3">
                {result.matches.map((m, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">"{m.text}"</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.source}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${getSimilarityColor(m.similarity)}`}>{m.similarity}%</span>
                  </div>
                ))}
              </div>
            </div>

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
      </div>
    </DashboardLayout>
  );
}
