import { Link } from "react-router";
import {
  FileText, Upload, Search, FileCheck, DollarSign, AlertCircle,
  Shield, Phone, ChevronRight, TrendingDown, Zap, CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex justify-between items-center h-16 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <span className="font-medium">Bill<span className="text-primary">Clarity</span></span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 text-sm text-muted-foreground">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            </nav>
            <ThemeToggle />
            <Link
              to="/app"
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 px-3 py-1 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Medical Bill Analysis
            </div>
            <h1 className="text-5xl sm:text-6xl mb-6 tracking-tight leading-tight">
              Stop Overpaying<br />
              <span className="text-primary">Medical Bills</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              BillClarity analyzes your medical bills for errors, benchmarks charges against fair prices, and deploys an AI agent to negotiate with billing departments on your behalf.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Analyze My Bill
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-3 border border-border rounded-md hover:bg-secondary transition-colors text-sm"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* App Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <PreviewCard
              icon={<AlertCircle className="w-4 h-4 text-destructive" />}
              label="Errors Detected"
              value="3 issues"
              sub="Duplicate charge on line 4"
              accent="destructive"
            />
            <PreviewCard
              icon={<TrendingDown className="w-4 h-4 text-primary" />}
              label="Potential Savings"
              value="$1,240"
              sub="vs. fair market rate"
              accent="primary"
            />
            <PreviewCard
              icon={<Phone className="w-4 h-4 text-green-600 dark:text-green-400" />}
              label="AI Negotiation"
              value="In Progress"
              sub="Speaking with billing dept."
              accent="green"
            />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border bg-secondary/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-medium text-primary mb-1">80%</div>
            <div className="text-sm text-muted-foreground">of medical bills contain at least one error</div>
          </div>
          <div>
            <div className="text-3xl font-medium text-primary mb-1">$1,000+</div>
            <div className="text-sm text-muted-foreground">average overcharge per hospital stay</div>
          </div>
          <div>
            <div className="text-3xl font-medium text-primary mb-1">72%</div>
            <div className="text-sm text-muted-foreground">of patients who appeal win full or partial relief</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From bill upload to resolution in four steps — BillClarity does the heavy lifting so you don't have to.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-border" />
            <Step
              number="01"
              icon={<Upload className="w-6 h-6" strokeWidth={1.5} />}
              title="Upload Your Bill"
              description="Upload your medical bill or Explanation of Benefits. We support PDF and image formats."
            />
            <Step
              number="02"
              icon={<Search className="w-6 h-6" strokeWidth={1.5} />}
              title="AI Analysis"
              description="Our AI extracts every line item, flags errors, and benchmarks charges against fair market rates."
            />
            <Step
              number="03"
              icon={<FileCheck className="w-6 h-6" strokeWidth={1.5} />}
              title="Review Findings"
              description="Browse plain-language explanations, cost comparisons, and detected billing issues."
            />
            <Step
              number="04"
              icon={<Phone className="w-6 h-6" strokeWidth={1.5} />}
              title="Take Action"
              description="Generate an appeal packet or let our AI voice agent call the billing department for you."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl mb-3">Everything You Need to Fight Back</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete toolkit for understanding, disputing, and resolving medical billing issues.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<FileText className="w-5 h-5" strokeWidth={1.5} />}
              title="Plain-Language Explanation"
              description="Translate dense billing codes and medical jargon into plain English — understand exactly what you were charged for and why."
            />
            <FeatureCard
              icon={<DollarSign className="w-5 h-5" strokeWidth={1.5} />}
              title="Cost Benchmarking"
              description="Every charge is compared against regional and national pricing data to surface anything significantly above fair market rates."
            />
            <FeatureCard
              icon={<AlertCircle className="w-5 h-5" strokeWidth={1.5} />}
              title="Error Detection"
              description="Automatically flag duplicate charges, upcoding, unbundled procedures, and other common medical billing errors."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" strokeWidth={1.5} />}
              title="Insurance Rule Matching"
              description="Cross-reference your charges against standard insurance coverage rules to identify services that should have been covered."
            />
            <FeatureCard
              icon={<FileCheck className="w-5 h-5" strokeWidth={1.5} />}
              title="Appeal Packet Generator"
              description="Generate a ready-to-send dispute packet with a formal appeal letter, supporting evidence, and recommended next steps."
            />
            {/* Featured card — AI Voice Agent */}
            <div className="p-6 border border-primary/40 rounded-lg bg-primary/5 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-xs font-medium text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full">
                Signature Feature
              </div>
              <div className="text-primary mb-4">
                <Phone className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-base font-medium">AI Voice Call Agent</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our AI acts as you — calling billing departments and insurance companies to negotiate disputed charges in real-time using your bill's evidence.
              </p>
              <div className="mt-4 flex flex-col gap-1.5">
                {["Speaks naturally as the patient", "References specific charges and codes", "Adapts to the representative's responses"].map(point => (
                  <div key={point} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl mb-4">Ready to Review Your Bill?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Upload your bill and get a full analysis in minutes. No account required to get started.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 px-10 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Start Free Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">BillClarity</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            BillClarity is an informational tool. It does not provide legal or medical advice.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "destructive" | "green";
}) {
  const borderMap = {
    primary: "border-primary/30 bg-primary/5",
    destructive: "border-destructive/30 bg-destructive/5",
    green: "border-green-500/30 bg-green-500/5",
  };
  return (
    <div className={`p-4 rounded-lg border ${borderMap[accent]}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-medium mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Step({
  number, icon, title, description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center relative">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background border border-border flex items-center justify-center relative z-10 text-primary">
        {icon}
      </div>
      <div className="text-xs text-muted-foreground font-medium mb-1">{number}</div>
      <h3 className="text-base font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 border border-border rounded-lg bg-card hover:border-primary/30 transition-colors">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-base font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
