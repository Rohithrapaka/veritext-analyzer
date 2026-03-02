import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { compareDocuments, type ComparisonResult } from "@/lib/api";
import { GitCompare, Upload, Loader2 } from "lucide-react";

export default function DocumentComparison() {
  const [doc1, setDoc1] = useState("");
  const [doc2, setDoc2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await compareDocuments(doc1, doc2);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target?.result as string || "");
    reader.readAsText(file);
  };

  const diffColor = (type: string) =>
    type === 'addition' ? 'bg-success/10 text-success border-success/20' :
    type === 'deletion' ? 'bg-destructive/10 text-destructive border-destructive/20' :
    'bg-warning/10 text-warning border-warning/20';

  return (
    <DashboardLayout>
      <div className="max-w-5xl animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <GitCompare className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Document Comparison</h1>
            <p className="text-sm text-muted-foreground">Upload or paste two documents to compare.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {[{ label: "Document 1", val: doc1, set: setDoc1, ref: file1Ref }, { label: "Document 2", val: doc2, set: setDoc2, ref: file2Ref }].map((d) => (
            <div key={d.label} className="rounded-xl border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">{d.label}</span>
                <input type="file" ref={d.ref} className="hidden" accept=".pdf,.docx,.txt" onChange={loadFile(d.set)} />
                <Button variant="ghost" size="sm" onClick={() => d.ref.current?.click()} className="gap-1 text-xs">
                  <Upload className="h-3 w-3" /> Upload
                </Button>
              </div>
              <Textarea placeholder="Paste text here..." className="min-h-[160px] resize-none border-muted" value={d.val} onChange={(e) => d.set(e.target.value)} />
            </div>
          ))}
        </div>

        <Button onClick={handleCompare} disabled={loading} className="gradient-hero text-primary-foreground border-0 gap-2 mb-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
          Compare Documents
        </Button>

        {result && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground">Overall Similarity</h2>
                <span className="font-display text-3xl font-bold text-primary">{result.similarity}%</span>
              </div>
              <Progress value={result.similarity} className="h-2" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[{ title: "Document 1", lines: result.doc1Lines }, { title: "Document 2", lines: result.doc2Lines }].map((d) => (
                <div key={d.title} className="rounded-xl border bg-card p-4 shadow-card">
                  <h3 className="text-sm font-semibold text-foreground mb-3">{d.title}</h3>
                  <div className="space-y-2">
                    {d.lines.map((line, i) => (
                      <p key={i} className="text-sm p-2 rounded bg-muted/30 text-foreground">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h2 className="font-semibold text-foreground mb-4">Differences Found</h2>
              <div className="space-y-2">
                {result.differences.map((d, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-sm ${diffColor(d.type)}`}>
                    <span className="font-medium capitalize">{d.type}:</span> {d.text}
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
