import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 checks per day", "Up to 1,000 words", "Basic plagiarism scan", "AI detection"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    features: ["Unlimited checks", "Up to 25,000 words", "Advanced similarity breakdown", "Document comparison", "Priority processing"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "per month",
    features: ["Everything in Pro", "5 team members", "API access", "Batch processing", "Custom reports"],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">V</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">VeriText</span>
          </Link>
          <Link to="/dashboard">
            <Button size="sm" className="gradient-hero text-primary-foreground border-0">Dashboard</Button>
          </Link>
        </div>
      </nav>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground">Choose the plan that works for you.</p>
        </div>

        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 max-w-4xl">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-xl border p-6 shadow-card flex flex-col ${plan.popular ? 'border-primary shadow-glow bg-card ring-1 ring-primary/20' : 'bg-card'}`}>
              {plan.popular && (
                <span className="inline-flex self-start text-xs font-medium gradient-hero text-primary-foreground px-2.5 py-0.5 rounded-full mb-3">Most Popular</span>
              )}
              <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="font-display text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className={plan.popular ? 'gradient-hero text-primary-foreground border-0' : ''} variant={plan.popular ? 'default' : 'outline'}>
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
