import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { detectAI, type AIDetectionResult } from "@/lib/api";
import { Bot, Loader2, KeyRound, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIDetector() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [cooldown, setCooldown] = useState(0); // seconds remaining before next request
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  // Clear result when text is cleared
  useEffect(() => {
    if (text.trim() === '') setResult(null);
  }, [text]);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnalyze = async () => {
    if (!text.trim() || cooldown > 0) return;
    setLoading(true);
    try {
      const res = await detectAI(text);
      setResult(res);
      startCooldown(10); // 10s cooldown after every successful request
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      toast({
        title: "Analysis Failed",
        description: raw || "Unable to analyze text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Normalize score and convert to percentage for display
  const normalizedScore = result
    ? Math.max(0, Math.min(result.score > 1 ? result.score / 100 : result.score, 1))
    : 0;
  const scorePercent = Math.round(normalizedScore * 100);

  const normalizeProbability = (value: number) =>
    Math.round(Math.max(0, Math.min(value > 1 ? value / 100 : value, 1)) * 100);

  // Color helpers based on label
  const getLabelColor = (classification: string) => {
    switch(classification) {
      case "AI Generated": return "text-destructive";
      case "Human Written": return "text-success";
      case "Uncertain": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  const getLabelBg = (classification: string) => {
    switch(classification) {
      case "AI Generated": return "bg-destructive/10 border-destructive/20";
      case "Human Written": return "bg-success/10 border-success/20";
      case "Uncertain": return "bg-warning/10 border-warning/20";
      default: return "bg-muted/10 border-muted/20";
    }
  };

  const getSentenceLabelColor = (label: string) => {
    return label === "AI" ? "text-destructive" : label === "Human" ? "text-success" : "text-warning";
  };

  const getSentenceLabelBg = (label: string) => {
    return label === "AI" ? "bg-destructive/5 border-destructive/20" : label === "Human" ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20";
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-success" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">AI Content Detector</h1>
            <p className="text-sm text-muted-foreground">Analyze text to detect AI-generated content with hybrid detection (ML + heuristics).</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card mb-6">
          <Textarea
            placeholder="Paste your text here and click Analyze..."
            className="min-h-[200px] resize-none mb-4 border-muted"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              {loading && <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing...</>}
              {!loading && result && <span className="text-success">✓ Analysis complete</span>}
              {!loading && cooldown > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <Clock className="h-3 w-3" /> Next analysis in {cooldown}s
                </span>
              )}
              {!loading && !result && wordCount > 0 && (
                <span className="text-muted-foreground">{wordCount} words</span>
              )}
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !text.trim() || cooldown > 0}
              className="gradient-hero text-primary-foreground border-0 gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              {loading ? "Analyzing..." : cooldown > 0 ? `Wait ${cooldown}s` : "Analyze Now"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Overall Result Card */}
            <div className={`rounded-xl border ${getLabelBg(result.classification)} p-5 shadow-card`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground">Classification</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.classification === "AI Generated" && "This text appears to be AI-generated"}
                    {result.classification === "Human Written" && "This text appears to be human-written"}
                    {result.classification === "Uncertain" && "This text has mixed characteristics or could not be determined with high confidence"}
                    {result.classification === "Error" && "This text could not be reliably classified"}
                  </p>
                </div>
                <div>
                  <span className={`font-display text-3xl font-bold ${getLabelColor(result.classification)}`}>
                    {result.classification}
                  </span>
                  <div className={`text-sm font-medium ${getLabelColor(result.classification)} text-center mt-1`}>
                    {scorePercent}% • {result.confidence} confidence
                  </div>
                </div>
              </div>
              <Progress value={scorePercent} className="h-2" />
            </div>

            {/* Details Card */}
            {result.details && Object.keys(result.details).length > 0 && (
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h2 className="font-semibold text-foreground mb-4">Analysis Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {result.details.gibberish !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-xs">Gibberish Score</p>
                      <p className="font-medium text-foreground">{Math.round(result.details.gibberish * 100)}%</p>
                    </div>
                  )}
                  {result.details.repetition !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-xs">Repetition</p>
                      <p className="font-medium text-foreground">{Math.round(result.details.repetition * 100)}%</p>
                    </div>
                  )}
                  {result.details.structure !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-xs">Structure</p>
                      <p className="font-medium text-foreground">{Math.round(result.details.structure * 100)}%</p>
                    </div>
                  )}
                  {result.details.llm_score !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-xs">LLM Score</p>
                      <p className="font-medium text-foreground">{Math.round(result.details.llm_score * 100)}%</p>
                    </div>
                  )}
                </div>
                {result.details.reason && (
                  <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded border border-border">
                    {result.details.reason}
                  </p>
                )}
                {result.message && (
                  <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded border border-border">
                    {result.message}
                  </p>
                )}
              </div>
            )}

            {/* Sentence Analysis Card */}
            {result.sentences.length > 0 && (
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h2 className="font-semibold text-foreground mb-4">Sentence Analysis</h2>
                <div className="space-y-2">
                  {result.sentences.map((s, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getSentenceLabelBg(s.label)} flex items-start justify-between gap-4`}>
                      <p className="text-sm text-foreground flex-1">{s.text}</p>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold ${getSentenceLabelColor(s.label)}`}>
                          {s.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {normalizeProbability(s.probability)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
