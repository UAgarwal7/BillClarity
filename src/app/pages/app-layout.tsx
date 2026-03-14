import { Outlet, Link, useLocation } from "react-router";
import { Upload, FileText, Search, BarChart3, Shield, FileCheck, Phone, Menu, X } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { useState } from "react";

const navigationItems = [
  { path: "/app", label: "Upload Bill", icon: Upload },
  { path: "/app/bill-overview", label: "Bill Overview", icon: FileText },
  { path: "/app/analysis", label: "Analysis", icon: Search },
  { path: "/app/benchmarking", label: "Benchmarking", icon: BarChart3 },
  { path: "/app/insurance-insights", label: "Insurance Insights", icon: Shield },
  { path: "/app/appeal-packet", label: "Appeal Packet", icon: FileCheck },
  { path: "/app/call-assistant", label: "Call Assistant", icon: Phone },
];

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="border-b border-border bg-background z-10">
        <div className="flex justify-between items-center h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary rounded-md"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-medium">BillClarity Appeals Engine</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:static
            w-64 h-full
            bg-sidebar border-r border-sidebar-border
            transition-transform duration-200
            z-20
          `}
        >
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md transition-colors
                    ${isActive 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}