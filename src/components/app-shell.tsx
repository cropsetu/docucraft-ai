import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  FolderKanban,
  MessageSquare,
  FileText,
  BarChart3,
  Users,
  Shield,
  Settings,
  Search,
  Bell,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV = [
  { to: "/dashboard", label: "Projects", icon: FolderKanban },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/team", label: "Team", icon: Users },
  { to: "/audit-log", label: "Audit Log", icon: Shield },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const user = useStore((s) => s.currentUser);
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="flex h-14 items-center gap-2 px-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">DocuMind AI</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-brand text-white text-xs">
                {user.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user}</div>
              <div className="text-xs text-muted-foreground">Enterprise</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-background/70 backdrop-blur-md sticky top-0 z-30 flex items-center gap-3 px-6">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full h-9 rounded-lg bg-surface border border-border pl-9 pr-16 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="Search projects, documents, templates…"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                ⌘K
              </kbd>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-brand text-white text-xs">
              {user.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
        <footer className="border-t border-border py-3 px-6 text-xs text-muted-foreground text-center">
          © 2026 DocuMind AI | All rights reserved.
        </footer>
      </div>
    </div>
  );
}
