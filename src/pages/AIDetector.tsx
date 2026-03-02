import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { detectAI, type AIDetectionResult } from "@/lib/api";
import { Bot, Loader2 } from "lucide-react";

export default function AIDetector() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await detectAI(text);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const probColor = (v: number) => v > 60 ? "text-destructive" : v > 30 ? "text-warning" : "text-success";
  const probBg = (v: number) => v > 60 ? "bg-destructive/10" : v > 30 ? "bg-warning/10" : "bg-success/10";

  return (
    <DashboardLayout>
      <div className="max-w-4xl animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-success" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">AI Content Detector</h1>
            <p className="text-sm text-muted-foreground">Analyze text to detect AI-generated content.</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card mb-6">
          <Textarea
            placeholder="Paste your text here to analyze..."
            className="min-h-[200px] resize-none mb-4 border-muted"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button onClick={handleAnalyze} disabled={loading || !text.trim()} className="gradient-hero text-primary-foreground border-0 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            Analyze AI Probability
          </Button>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground">AI Probability</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.aiProbability > 60 ? "Likely AI-generated" : result.aiProbability > 30 ? "Possibly AI-generated" : "Likely human-written"}
                  </p>
                </div>
                <span className={`font-display text-3xl font-bold ${probColor(result.aiProbability)}`}>
                  {result.aiProbability}%
                </span>
              </div>
              <Progress value={result.aiProbability} className="h-2" />
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h2 className="font-semibold text-foreground mb-4">Sentence Analysis</h2>
              <div className="space-y-2">
                {result.sentences.map((s, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${s.suspicious ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-muted/30'} flex items-start justify-between gap-4`}>
                    <p className="text-sm text-foreground flex-1">{s.text}</p>
                    <span className={`text-xs font-semibold shrink-0 px-2 py-1 rounded-full ${probBg(s.probability)} ${probColor(s.probability)}`}>
                      {s.probability}%
                    </span>
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
