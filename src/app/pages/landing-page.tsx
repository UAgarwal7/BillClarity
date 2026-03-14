import { Link } from "react-router";
import { FileText, Upload, Search, FileCheck, DollarSign, AlertCircle, Shield, CheckCircle, FileSpreadsheet } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <span className="text-lg font-medium">BillClarity Appeals Engine</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl mb-6 tracking-tight">
            Understand and Challenge Your Medical Bills
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            BillClarity analyzes medical bills and insurance explanations to help you understand charges, detect potential issues, and generate dispute packets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/app" 
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Now
            </Link>
            <a 
              href="#how-it-works" 
              className="inline-flex items-center justify-center px-8 py-3 border border-border rounded-md hover:bg-secondary transition-colors"
            >
              See How It Works
            </a>
          </div>
          
          {/* Simple Illustration */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="border border-border rounded-lg p-12 bg-secondary/30">
              <svg 
                className="w-full h-48 text-muted-foreground" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                viewBox="0 0 300 200"
              >
                {/* Document Stack */}
                <rect x="50" y="60" width="80" height="100" rx="4" />
                <rect x="55" y="55" width="80" height="100" rx="4" />
                <rect x="60" y="50" width="80" height="100" rx="4" fill="none" />
                <line x1="70" y1="70" x2="120" y2="70" />
                <line x1="70" y1="80" x2="120" y2="80" />
                <line x1="70" y1="90" x2="110" y2="90" />
                
                {/* Arrow */}
                <line x1="150" y1="100" x2="180" y2="100" markerEnd="url(#arrowhead)" />
                
                {/* Check Document */}
                <rect x="190" y="50" width="80" height="100" rx="4" fill="none" />
                <circle cx="230" cy="100" r="20" fill="none" />
                <path d="M 220 100 L 227 107 L 240 93" strokeWidth="2" />
                
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-background border border-border flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mb-3">Upload Bill</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upload your medical bill or insurance explanation of benefits document.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-background border border-border flex items-center justify-center">
                <Search className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mb-3">Analyze Charges</h3>
              <p className="text-muted-foreground leading-relaxed">
                Review plain-language explanations, cost benchmarking, and detected issues.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-background border border-border flex items-center justify-center">
                <FileCheck className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mb-3">Generate Appeal Packet</h3>
              <p className="text-muted-foreground leading-relaxed">
                Export a complete dispute packet with appeal letter and supporting documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="w-6 h-6" strokeWidth={1.5} />}
              title="Plain-Language Bill Explanation"
              description="Translate complex medical billing codes into understandable language."
            />
            <FeatureCard 
              icon={<DollarSign className="w-6 h-6" strokeWidth={1.5} />}
              title="Cost Benchmarking"
              description="Compare charges against typical regional and national pricing."
            />
            <FeatureCard 
              icon={<AlertCircle className="w-6 h-6" strokeWidth={1.5} />}
              title="Error Detection"
              description="Identify duplicate charges, incorrect billing codes, and pricing anomalies."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" strokeWidth={1.5} />}
              title="Insurance Rule Matching"
              description="Check for services that should be covered under standard insurance plans."
            />
            <FeatureCard 
              icon={<FileSpreadsheet className="w-6 h-6" strokeWidth={1.5} />}
              title="Appeal Packet Generation"
              description="Create formatted dispute letters with supporting documentation."
            />
            <FeatureCard 
              icon={<CheckCircle className="w-6 h-6" strokeWidth={1.5} />}
              title="Negotiation Script"
              description="Receive guidance on how to discuss charges with billing departments."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl leading-relaxed text-muted-foreground">
            Built to help patients navigate complex medical billing. Our tools provide clarity and support when dealing with healthcare charges and insurance explanations.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium">BillClarity Appeals Engine</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 border border-border rounded-lg bg-card">
      <div className="text-primary mb-4">
        {icon}
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
