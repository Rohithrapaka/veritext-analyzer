import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">V</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">VeriText</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your VeriText account</p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full gradient-hero text-primary-foreground border-0">Sign In</Button>
            <p className="text-center text-xs text-muted-foreground">
              Don't have an account? <Link to="/dashboard" className="text-primary font-medium hover:underline">Get started free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
