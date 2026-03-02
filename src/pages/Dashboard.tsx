import { DashboardLayout } from "@/components/DashboardLayout";
import { Link } from "react-router-dom";
import { FileSearch, GitCompare, Bot, ArrowRight } from "lucide-react";

const tools = [
  { icon: FileSearch, title: "Plagiarism Checker", desc: "Check text or documents for plagiarism", link: "/plagiarism", color: "bg-primary/10 text-primary" },
  { icon: GitCompare, title: "Document Comparison", desc: "Compare two documents side by side", link: "/compare", color: "bg-accent/10 text-accent" },
  { icon: Bot, title: "AI Detector", desc: "Detect AI-generated content", link: "/ai-detect", color: "bg-success/10 text-success" },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Welcome to VeriText</h1>
        <p className="text-muted-foreground mb-8">Select a tool to get started.</p>

        <div className="grid sm:grid-cols-3 gap-4">
          {tools.map((t) => (
            <Link to={t.link} key={t.title} className="group">
              <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-all duration-200 h-full flex flex-col">
                <div className={`h-10 w-10 rounded-lg ${t.color} flex items-center justify-center mb-4`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">{t.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1">{t.desc}</p>
                <div className="flex items-center text-xs text-primary font-medium gap-1 group-hover:gap-2 transition-all">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-xl border bg-card p-5 shadow-card">
          <h2 className="font-semibold text-foreground text-sm mb-3">Recent Activity</h2>
          <div className="text-sm text-muted-foreground py-8 text-center">No recent scans. Run your first check to see results here.</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
