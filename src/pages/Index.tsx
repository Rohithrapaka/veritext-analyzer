import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSearch, GitCompare, Bot, ArrowRight, Shield, Zap, GraduationCap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">V</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">VeriText</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" className="gradient-hero text-primary-foreground border-0">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground mb-6">
            <Shield className="h-3.5 w-3.5" />
            Academic Integrity Platform
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Plagiarism & AI
            <span className="text-gradient block">Content Detector</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Verify originality, compare documents, and detect AI-generated content with a clean, modern toolkit built for academics.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="gradient-hero text-primary-foreground border-0 gap-2 px-8">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">View Pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center text-foreground mb-12">Three Powerful Tools</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: FileSearch, title: "Plagiarism Checker", desc: "Scan text or upload documents to detect similarity across millions of sources.", link: "/plagiarism" },
              { icon: GitCompare, title: "Document Comparison", desc: "Upload two documents and see side-by-side differences highlighted instantly.", link: "/compare" },
              { icon: Bot, title: "AI Content Detector", desc: "Analyze text to determine the probability of AI-generated content.", link: "/ai-detect" },
            ].map((f) => (
              <Link to={f.link} key={f.title} className="group">
                <div className="rounded-xl border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300 h-full">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:gradient-hero transition-colors duration-300">
                    <f.icon className="h-5 w-5 text-secondary-foreground group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
            {[
              { icon: Zap, value: "< 3s", label: "Scan Time" },
              { icon: Shield, value: "99.2%", label: "Accuracy" },
              { icon: GraduationCap, value: "10K+", label: "Users" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl md:text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 VeriText. Academic micro project.
        </div>
      </footer>
    </div>
  );
};

export default Index;
