import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useStore, FUNCTION_COLORS } from "@/lib/store";
import { StatusBadge } from "@/components/status-badge";
import { CreateProjectSheet } from "@/components/create-project-sheet";
import { TableSkeleton, PolishedEmpty } from "@/components/skeletons";
import { motion } from "framer-motion";
import { DUR, EASE, staggerDelay } from "@/lib/motion";
import {
  Search,
  Filter,
  RefreshCcw,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  FileText,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DocuMind AI" },
      { name: "description", content: "Manage your AI-assisted document generation projects." },
      { property: "og:title", content: "Dashboard — DocuMind AI" },
      { property: "og:description", content: "Content studio for AI-generated documents." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { projects, currentUser, totalCount } = useStore();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.projectId.includes(q) ||
        p.documentType.toLowerCase().includes(q) ||
        p.function.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const firstName = currentUser.split(" ")[0];

  // Placeholder rows show until the workspace list has painted once.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);


  return (
    <div className="p-8 space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 md:p-10">
        <div className="absolute inset-0 bg-hero-orbs opacity-70 pointer-events-none" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Create and manage AI-assisted document generation projects from a single workspace.
            </p>
          </div>
          <WelcomeIllustration />
        </div>
      </div>

      {/* Content studio */}
      <div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Content studio <span className="text-muted-foreground font-normal">({totalCount})</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Start by creating a project. Everything you create will appear here for easy access and management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-lg bg-surface border border-border pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 w-56"
                placeholder="Search projects…"
              />
            </div>
            <button className="h-9 w-9 rounded-lg border border-border bg-surface hover:bg-accent flex items-center justify-center text-muted-foreground">
              <Filter className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 rounded-lg border border-border bg-surface hover:bg-accent flex items-center justify-center text-muted-foreground">
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="h-9 inline-flex items-center gap-2 rounded-lg bg-gradient-brand text-white px-4 text-sm font-medium hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Create project
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-brand text-white text-left text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Project name</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Project ID</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Document type</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Function</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Created on</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Modified on</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-t border-border hover:bg-accent/40 transition-colors group",
                      idx % 2 === 1 && "bg-surface-elevated/30",
                    )}
                  >
                    <td className="px-4 py-3 max-w-[220px]">
                      <Link
                        to="/projects/$id"
                        params={{ id: p.id }}
                        className="block truncate font-medium hover:text-brand hover:underline"
                        title={p.name}
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground whitespace-nowrap">{p.projectId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{p.documentType}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
                          FUNCTION_COLORS[p.function],
                        )}
                      >
                        {p.function}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <DateCell v={p.createdAt} />
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <DateCell v={p.modifiedAt} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100">
                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      No projects match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div>Showing 1-{filtered.length} of {totalCount}</div>
            <div className="flex items-center gap-1">
              <button className="h-7 w-7 rounded border border-border hover:bg-accent flex items-center justify-center">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2">1</span>
              <button className="h-7 w-7 rounded border border-border hover:bg-accent flex items-center justify-center">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateProjectSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function DateCell({ v }: { v: string }) {
  const [date, time] = v.includes(",") ? [v.split(",").slice(0, 2).join(","), v.split(",")[2]?.trim() ?? ""] : [v, ""];
  return (
    <div className="leading-tight">
      <div>{date}</div>
      {time && <div className="text-xs text-muted-foreground">{time}</div>}
    </div>
  );
}

function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 220 160" className="w-56 md:w-64 h-auto">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.66 0.19 268)" />
          <stop offset="1" stopColor="oklch(0.6 0.22 300)" />
        </linearGradient>
      </defs>
      <rect x="20" y="30" width="80" height="100" rx="6" fill="oklch(0.22 0.02 270)" stroke="oklch(0.34 0.025 270)" />
      <rect x="30" y="45" width="60" height="4" rx="2" fill="url(#g1)" />
      <rect x="30" y="55" width="50" height="3" rx="1.5" fill="oklch(0.35 0.02 270)" />
      <rect x="30" y="62" width="55" height="3" rx="1.5" fill="oklch(0.35 0.02 270)" />
      <rect x="30" y="69" width="45" height="3" rx="1.5" fill="oklch(0.35 0.02 270)" />
      <circle cx="140" cy="60" r="18" fill="url(#g1)" opacity="0.9" />
      <path d="M105 70 L125 65" stroke="url(#g1)" strokeWidth="2" markerEnd="url(#arrow)" />
      <rect x="130" y="90" width="80" height="50" rx="6" fill="oklch(0.28 0.04 275)" stroke="url(#g1)" />
      <rect x="140" y="100" width="60" height="3" rx="1.5" fill="url(#g1)" />
      <rect x="140" y="108" width="55" height="3" rx="1.5" fill="oklch(0.5 0.02 270)" />
      <rect x="140" y="116" width="50" height="3" rx="1.5" fill="oklch(0.5 0.02 270)" />
      <rect x="140" y="124" width="45" height="3" rx="1.5" fill="oklch(0.5 0.02 270)" />
    </svg>
  );
}
