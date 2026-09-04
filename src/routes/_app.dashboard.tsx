import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useStore, FUNCTION_COLORS } from "@/lib/store";
import type { Project } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { CreateProjectSheet } from "@/components/create-project-sheet";
import { TableSkeleton, PolishedEmpty } from "@/components/skeletons";
import { ErrorBanner } from "@/components/error-banner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { DUR, EASE, SPRING, staggerDelay, useCountUp } from "@/lib/motion";
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
  Sparkles,
  MessageSquare,
  Target,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
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

type SortKey = "modified" | "created" | "name" | "status";

const UPDATED_WINDOWS: { value: string; label: string; hours: number | null }[] = [
  { value: "any", label: "Any time", hours: null },
  { value: "24h", label: "Last 24 hours", hours: 24 },
  { value: "7d", label: "Last 7 days", hours: 24 * 7 },
  { value: "30d", label: "Last 30 days", hours: 24 * 30 },
  { value: "90d", label: "Last 90 days", hours: 24 * 90 },
];

function parseWhen(v: string) {
  const t = Date.parse(v);
  return Number.isNaN(t) ? 0 : t;
}

function Dashboard() {
  const { projects, currentUser, totalCount } = useStore();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [fn, setFn] = useState<string>("all");
  const [updated, setUpdated] = useState<string>("any");
  const [sortKey, setSortKey] = useState<SortKey>("modified");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const statuses = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status))),
    [projects],
  );
  const functions = useMemo(
    () => Array.from(new Set(projects.map((p) => p.function))).sort(),
    [projects],
  );

  const activeFilterCount =
    (status !== "all" ? 1 : 0) + (fn !== "all" ? 1 : 0) + (updated !== "any" ? 1 : 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const window = UPDATED_WINDOWS.find((w) => w.value === updated)?.hours ?? null;
    const cutoff = window === null ? null : Date.now() - window * 3600_000;

    const rows = projects.filter((p) => {
      if (q) {
        const hit =
          p.name.toLowerCase().includes(q) ||
          p.projectId.includes(q) ||
          p.documentType.toLowerCase().includes(q) ||
          p.function.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (status !== "all" && p.status !== status) return false;
      if (fn !== "all" && p.function !== fn) return false;
      if (cutoff !== null && parseWhen(p.modifiedAt) < cutoff) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "created") cmp = parseWhen(a.createdAt) - parseWhen(b.createdAt);
      else cmp = parseWhen(a.modifiedAt) - parseWhen(b.modifiedAt);
      return cmp * dir;
    });
  }, [projects, search, status, fn, updated, sortKey, sortDir]);

  

  // Placeholder rows show until the workspace list has painted once.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const reload = async () => {
    setRetrying(true);
    try {
      // Re-reads the workspace list; surfaces a banner if the read fails.
      const list = useStore.getState().projects;
      if (!Array.isArray(list)) throw new Error("Workspace list unavailable");
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setRetrying(false);
    }
  };

  const resetFilters = () => {
    setStatus("all");
    setFn("all");
    setUpdated("any");
  };



  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome banner */}
      <WelcomeBanner user={currentUser} projects={projects} onCreate={() => setCreateOpen(true)} />

      {/* Content studio */}
      <div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              Content studio
              <span className="rounded-full border border-border/80 bg-surface-elevated/60 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {totalCount}
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground mt-1.5 max-w-2xl">
              Start by creating a project. Everything you create appears here for easy access and management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-lg bg-surface border border-border pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-border-strong transition-colors w-56"
                placeholder="Search projects…"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={cn(
                "h-9 inline-flex items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                showFilters || activeFilterCount > 0
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-brand/20 px-1.5 text-[11px] font-semibold tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={reload}
              aria-label="Reload projects"
              className="h-9 w-9 rounded-lg border border-border bg-surface hover:bg-accent hover:text-foreground flex items-center justify-center text-muted-foreground transition-colors"
            >
              <RefreshCcw className={cn("h-4 w-4", retrying && "animate-spin")} />
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="h-9 inline-flex items-center gap-2 rounded-lg bg-gradient-brand text-white px-4 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Create project
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-surface-elevated/50 p-4">
                <FilterSelect
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={[{ value: "all", label: "All statuses" }, ...statuses.map((s) => ({ value: s, label: s }))]}
                />
                <FilterSelect
                  label="Category"
                  value={fn}
                  onChange={setFn}
                  options={[{ value: "all", label: "All categories" }, ...functions.map((f) => ({ value: f, label: f }))]}
                />
                <FilterSelect
                  label="Updated"
                  value={updated}
                  onChange={setUpdated}
                  options={UPDATED_WINDOWS.map((w) => ({ value: w.value, label: w.label }))}
                />
                <FilterSelect
                  label="Sort by"
                  value={sortKey}
                  onChange={(v) => setSortKey(v as SortKey)}
                  options={[
                    { value: "modified", label: "Updated time" },
                    { value: "created", label: "Created time" },
                    { value: "name", label: "Project name" },
                    { value: "status", label: "Status" },
                  ]}
                />
                <button
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  {sortDir === "asc" ? "Ascending" : "Descending"}
                </button>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="h-9 rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {loadError && (
            <ErrorBanner
              key="dashboard-error"
              title="Couldn't load your projects"
              message="The workspace list didn't come back. Your projects are safe — try again."
              detail={loadError}
              onRetry={reload}
              retrying={retrying}
              onDismiss={() => setLoadError(null)}
              className="mt-4"
            />
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="mt-6 rounded-2xl bg-surface overflow-hidden elev-1">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-surface-elevated/70 text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
                  <SortableTh label="Project name" k="name" sortKey={sortKey} sortDir={sortDir} onSort={(k) => { setSortKey(k); setSortDir(sortKey === k && sortDir === "asc" ? "desc" : "asc"); }} />
                  <th className="px-4 py-3.5 font-semibold whitespace-nowrap">Project ID</th>
                  <th className="px-4 py-3.5 font-semibold whitespace-nowrap">Document type</th>
                  <th className="px-4 py-3.5 font-semibold whitespace-nowrap">Function</th>
                  <SortableTh label="Created on" k="created" sortKey={sortKey} sortDir={sortDir} onSort={(k) => { setSortKey(k); setSortDir(sortKey === k && sortDir === "asc" ? "desc" : "asc"); }} />
                  <SortableTh label="Modified on" k="modified" sortKey={sortKey} sortDir={sortDir} onSort={(k) => { setSortKey(k); setSortDir(sortKey === k && sortDir === "asc" ? "desc" : "asc"); }} />
                  <SortableTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={(k) => { setSortKey(k); setSortDir(sortKey === k && sortDir === "asc" ? "desc" : "asc"); }} />
                  <th className="px-4 py-3.5 font-semibold whitespace-nowrap text-right pr-6">Actions</th>
                </tr>
              </thead>

              {!ready && <TableSkeleton rows={6} cols={8} />}
              {ready && (

              <tbody>
                {filtered.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DUR.base, ease: EASE.out, delay: staggerDelay(idx, 0.03) }}
                    className="border-t border-border/70 hover:bg-accent/40 transition-colors group"
                  >
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <Link
                        to="/projects/$id"
                        params={{ id: p.id }}
                        className="block truncate font-medium text-[13.5px] tracking-tight hover:text-brand transition-colors"
                        title={p.name}
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap tabular-nums">{p.projectId}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{p.documentType}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5",
                          FUNCTION_COLORS[p.function],
                        )}
                      >
                        {p.function}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <DateCell v={p.createdAt} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <DateCell v={p.modifiedAt} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3.5 pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6">
                      <PolishedEmpty
                        icon={<FolderOpen className="h-6 w-6" />}
                        title={
                          search || activeFilterCount > 0 ? "No matching projects" : "No projects yet"
                        }
                        subtitle={
                          search || activeFilterCount > 0
                            ? "Try a different search, or widen the status, category, and updated-time filters."
                            : "Create your first project to start generating documents from your templates and sources."
                        }
                        action={
                          search || activeFilterCount > 0 ? (
                            <button
                              onClick={() => {
                                setSearch("");
                                resetFilters();
                              }}
                              className="h-9 rounded-lg border border-border bg-surface px-4 text-sm hover:bg-accent transition-colors"
                            >
                              Reset search and filters
                            </button>
                          ) : (
                            <button
                              onClick={() => setCreateOpen(true)}
                              className="h-9 inline-flex items-center gap-2 rounded-lg bg-gradient-brand text-white px-4 text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              <Plus className="h-4 w-4" /> Create project
                            </button>
                          )
                        }
                        className="border-0 bg-transparent py-8"
                      />
                    </td>
                  </tr>
                )}

              </tbody>
              )}
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-[9.5rem] rounded-lg border border-border bg-surface px-2.5 text-[13px] text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortableTh({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="px-4 py-3.5 font-semibold whitespace-nowrap">
      <button
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          active ? "text-foreground" : "hover:text-foreground",
        )}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function WelcomeBanner({
  user,
  projects,
  onCreate,
}: {
  user: string;
  projects: Project[];
  onCreate: () => void;
}) {
  const firstName = user.split(" ")[0];
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const generated = projects.reduce((sum, p) => sum + p.generated.length, 0);
  const inProgress = projects.filter((p) => p.status === "In Progress").length;
  const completed = projects.filter((p) => p.status === "Completed").length;

  const projectCount = useCountUp(projects.length, 900);
  const progressCount = useCountUp(inProgress, 900);
  const completedCount = useCountUp(completed, 900);
  const generatedCount = useCountUp(generated, 900);

  const userInitials = user
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DUR.revealSlow, ease: EASE.out }}
      className="relative overflow-hidden rounded-2xl border border-border bg-surface elev-1"
    >
      <div className="absolute inset-0 bg-hero-orbs opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.06] via-transparent to-primary/[0.06] pointer-events-none" />
      <div className="relative p-6 md:p-8 lg:p-10">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...SPRING.pop, delay: 0.05 }}
                className="relative"
              >
                <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-background shadow-xl ring-2 ring-brand/10">
                  <AvatarFallback className="text-lg md:text-xl bg-gradient-brand text-white font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-success border-2 border-background" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand ai-pulse-uncertain" />
                  Workspace
                </div>
                <h1 className="text-[2rem] md:text-[2.75rem] leading-[1.08] font-bold tracking-tight text-gradient">
                  {greeting}, {firstName}
                </h1>
              </div>
            </div>

            <p className="text-[15px] leading-relaxed text-muted-foreground max-w-xl">
              {inProgress > 0 ? (
                <>
                  You have <strong className="text-foreground">{inProgress}</strong> active project
                  {inProgress === 1 ? "" : "s"} and <strong className="text-foreground">{generated}</strong> generated document
                  {generated === 1 ? "" : "s"} in this workspace.
                </>
              ) : (
                "Create and manage AI-assisted document generation projects from a single workspace."
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onCreate}
                className="h-10 inline-flex items-center gap-2 rounded-lg bg-brand text-white px-4 text-sm font-semibold shadow-lg hover:bg-brand/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Plus className="h-4 w-4" /> New project
              </button>
              <Link
                to="/templates"
                className="h-10 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Sparkles className="h-4 w-4" /> Browse templates
              </Link>
              <Link
                to="/chat"
                className="h-10 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <MessageSquare className="h-4 w-4" /> Ask AI
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              <StatCard label="Projects" value={projectCount} icon={FolderOpen} />
              <StatCard label="Active" value={progressCount} icon={Target} />
              <StatCard label="Completed" value={completedCount} icon={FileText} />
            </div>
          </div>

          <div className="hidden md:block">
            <WelcomeIllustration />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.reveal, ease: EASE.out, delay: 0.12 }}
      className="rounded-xl border border-border bg-background/60 backdrop-blur-sm p-3"
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {Math.round(value)}
      </div>
    </motion.div>
  );
}
