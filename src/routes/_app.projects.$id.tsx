import { createFileRoute, Link, useNavigate, notFound, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Upload,
  UploadCloud,
  Sparkles,
  FolderTree,
  Network,
  FileText,
  Plus,
  MoreVertical,
  Download,
  Pencil,
  Eye,
  RefreshCcw,
  Trash2,
  Share2,
  Layout,
  LayoutGrid,
  Check,
  Wand2,
  MessageSquare,
  Target,
  GitBranch,
  Lock,
  Unlock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listContainer, listItem, useCountUp, DUR, EASE, SPRING, staggerDelay } from "@/lib/motion";
import { StageSkeleton } from "@/components/skeletons";
import { ErrorBanner } from "@/components/error-banner";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/_app/projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Project ${params.id} — DocuMind AI` },
      { name: "description", content: "Configure templates, sources, mappings, and generate documents." },
    ],
  }),
  loader: ({ params }) => {
    const proj = useStore.getState().getProject(params.id);
    if (!proj) throw notFound();
    return null;
  },
  errorComponent: ({ error, reset }) => (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ErrorBanner
        title="Couldn't load this project"
        message="The project details didn't come back. Nothing was lost — try loading it again."
        detail={error instanceof Error ? error.message : String(error)}
        onRetry={reset}
      />
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ErrorBanner
        title="Project not found"
        message="This project no longer exists in your workspace."
      />
    </div>
  ),
  component: ProjectDetail,
});


const STAGES = [
  { key: "template", n: 1, title: "Template", short: "Blueprint", icon: UploadCloud, hint: "Define the document structure" },
  { key: "source", n: 2, title: "Sources", short: "Inputs", icon: FolderTree, hint: "Bring in the raw content" },
  { key: "method", n: 3, title: "Method", short: "Engine", icon: Sparkles, hint: "Choose how to generate" },
  { key: "mapping", n: 4, title: "Mapping", short: "Link", icon: Network, hint: "Connect sources to sections" },
  { key: "drafts", n: 5, title: "Drafts", short: "Output", icon: FileText, hint: "Review generated documents" },
] as const;

type StageKey = typeof STAGES[number]["key"];

function ProjectDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const maybeProject = useStore((s) => s.projects.find((p) => p.id === id));
  const [retrying, setRetrying] = useState(false);

  const retryLoad = async () => {
    setRetrying(true);
    try {
      await router.invalidate();
    } finally {
      setRetrying(false);
    }
  };

  if (!maybeProject) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ErrorBanner
          title="Couldn't load this project"
          message="The project record wasn't available for this workspace. Try loading it again."
          detail={`Project ${id}`}
          onRetry={retryLoad}
          retrying={retrying}
        />
      </div>
    );
  }

  return <ProjectStages project={maybeProject} onRetry={retryLoad} retrying={retrying} />;
}

function ProjectStages({
  project,
  onRetry,
  retrying,
}: {
  project: Project;
  onRetry: () => void;
  retrying: boolean;
}) {


  const done: Record<StageKey, boolean> = {
    template: project.templates.length > 0,
    source: project.sources.length > 0,
    method: !!project.generationMethod,
    mapping: project.drafts.length > 0,
    drafts: project.generated.length > 0,
  };

  const firstIncomplete = (STAGES.find((s) => !done[s.key])?.key ?? "drafts") as StageKey;
  const [active, setActive] = useState<StageKey>(firstIncomplete);

  const activeIdx = STAGES.findIndex((s) => s.key === active);
  const activeStage = STAGES[activeIdx];
  const completedCount = Object.values(done).filter(Boolean).length;
  const progressPct = (completedCount / STAGES.length) * 100;
  const stageCountUp = useCountUp(completedCount, 600);

  // Stage body shows placeholders until the panel has painted once.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Link to="/dashboard" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{project.name}</span>
      </div>

      {/* Title + meta strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.reveal, ease: EASE.out }}
        className="rounded-2xl border border-border bg-surface overflow-hidden elev-1"
      >
        <div className="p-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand ai-pulse-uncertain" />
              {project.projectId} · {project.region} · {project.function}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1.5">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right pr-3 border-r border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</div>
              <div className="text-sm font-semibold tabular-nums">
                {Math.round(stageCountUp)}/{STAGES.length} stages
              </div>
            </div>
            <button className="h-9 px-3 rounded-lg border border-border bg-surface hover:bg-accent text-sm inline-flex items-center gap-1.5 transition-colors">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button className="h-9 w-9 rounded-lg border border-border bg-surface hover:bg-accent flex items-center justify-center transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-brand"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={SPRING.progress}
          />
        </div>
      </motion.div>

      {/* Pipeline rail */}
      <PipelineRail stages={STAGES} done={done} active={active} onSelect={setActive} />

      {/* Active stage panel */}
      <div className="rounded-2xl border border-border bg-surface elev-1">
        <div className="flex items-center gap-4 p-6 border-b border-border">
          <motion.div
            key={active}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING.ui}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center border",
              done[active] ? "bg-success/10 text-success border-success/30" : "bg-brand/10 text-brand border-brand/30",
            )}
          >
            <activeStage.icon className="h-5 w-5" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Stage {activeStage.n} of {STAGES.length}</div>
            <div className="text-lg font-semibold">{activeStage.title}</div>
            <div className="text-sm text-muted-foreground">{activeStage.hint}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={activeIdx === 0}
              onClick={() => setActive(STAGES[activeIdx - 1].key)}
              className="h-9 px-3 rounded-lg border border-border hover:bg-accent text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              disabled={activeIdx === STAGES.length - 1}
              onClick={() => setActive(STAGES[activeIdx + 1].key)}
              className="h-9 px-3 rounded-lg bg-gradient-brand text-white text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next stage <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {!ready ? (
            <StageSkeleton lines={3} />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DUR.base, ease: EASE.out }}
              >
                {active === "template" && <Step1Template project={project} />}
                {active === "source" && <Step2Source project={project} />}
                {active === "method" && <Step3Method project={project} />}
                {active === "mapping" && <Step4Drafts project={project} />}
                {active === "drafts" && <Step5Generated project={project} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
}

function PipelineRail({
  stages,
  done,
  active,
  onSelect,
}: {
  stages: typeof STAGES;
  done: Record<StageKey, boolean>;
  active: StageKey;
  onSelect: (k: StageKey) => void;
}) {
  return (
    <div className="rounded-2xl bg-surface p-5 elev-1">
      <div className="grid grid-cols-5 gap-3 relative">
        {stages.map((s, i) => {
          const isActive = active === s.key;
          const isDone = done[s.key];
          const linkLit = done[stages[i + 1]?.key as StageKey] || isDone;
          return (
            <motion.div
              key={s.key}
              className="relative"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.reveal, ease: EASE.out, delay: staggerDelay(i, 0.05) }}
            >
              {/* Connector line */}
              {i < stages.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+26px)] right-[-12px] h-[2px] rounded-full bg-border/70 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-brand origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: linkLit ? 1 : 0 }}
                    transition={{ duration: DUR.revealSlow, ease: EASE.out, delay: staggerDelay(i, 0.06) }}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
              <button
                onClick={() => onSelect(s.key)}
                aria-current={isActive ? "step" : undefined}
                className="w-full flex flex-col items-center text-center gap-2.5 group rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <span className="relative flex items-center justify-center">
                  {isActive && (
                    <>
                      <motion.span
                        layoutId="stage-halo"
                        className="absolute inset-[-9px] rounded-full bg-brand/14 ring-1 ring-brand/35"
                        transition={SPRING.ui}
                      />
                      <span className="absolute inset-[-9px] rounded-full ai-pulse-uncertain" />
                    </>
                  )}
                  <motion.span
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING.ui}
                    className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center border-2 font-mono text-sm font-semibold relative z-10 transition-colors",
                      isActive
                        ? "bg-gradient-brand text-white border-transparent shadow-lg shadow-brand/30"
                        : isDone
                        ? "bg-success/12 text-success border-success/45 group-hover:border-success/70"
                        : "bg-background text-muted-foreground border-border group-hover:border-border-strong group-hover:text-foreground",
                    )}
                  >
                    {isDone && !isActive ? <Check className="h-4 w-4" /> : s.n}
                  </motion.span>
                </span>
                <div className="min-w-0 w-full">
                  <div className={cn(
                    "text-[13px] font-semibold tracking-tight truncate",
                    isActive || isDone ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  )}>{s.title}</div>
                  <div className={cn(
                    "text-[10px] uppercase tracking-[0.12em] font-mono truncate mt-0.5",
                    isActive ? "text-brand" : isDone ? "text-success" : "text-muted-foreground",
                  )}>
                    {isDone ? "Complete" : isActive ? "Current" : s.short}
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>

  );
}


/* Compatibility shim: renders children only (header lives in the stage panel now). */
function StepCard({ children }: { n?: number; title?: string; count?: number; description?: string; icon?: any; iconColor?: string; status?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

/* ------------------ Step 1 ------------------ */
function Step1Template({ project }: { project: any }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const add = useStore((s) => s.addTemplate);
  const count = project.templates.length;
  return (
    <StepCard
      n={1}
      title="Import template file"
      count={count}
      description="Template file defines the structure for generated documents"
      icon={UploadCloud}
      iconColor="bg-info/15 text-info"
      status={count > 0 ? "Completed" : "Pending"}
      defaultOpen
    >
      {count === 0 ? (
        <EmptyState
          illustration={<TemplateBox />}
          title="You don't have any template file yet!"
          subtitle="Import a template file to get started and define your document structure."
          action={
            <Button onClick={() => setUploadOpen(true)} className="bg-gradient-brand text-white hover:opacity-90">
              <Upload className="h-4 w-4 mr-1.5" /> Import template file
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {project.templates.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
              <FileText className="h-5 w-5 text-info" />
              <div className="flex-1">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.size} · uploaded {t.uploadedAt} by {t.uploadedBy}
                </div>
              </div>
              <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Eye className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Download className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add another template
          </Button>
        </div>
      )}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload template"
        accept=".docx, .dotx, .html, .txt"
        onUpload={(name) => {
          add(project.id, name);
          toast.success("Template uploaded", { description: name });
        }}
      />
    </StepCard>
  );
}

/* ------------------ Step 2 ------------------ */
function Step2Source({ project }: { project: any }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const add = useStore((s) => s.addSource);
  const count = project.sources.length;
  return (
    <StepCard
      n={2}
      title="Import source files"
      count={count}
      description="Source files provide the content used to fill template sections"
      icon={UploadCloud}
      iconColor="bg-purple/15 text-purple"
      status={count > 0 ? "Completed" : "Pending"}
    >
      {count === 0 ? (
        <EmptyState
          illustration={<SourceBox />}
          title="You don't have any source files yet!"
          subtitle="Import one or more source files to provide the content used to generate the document."
          action={
            <Button onClick={() => setUploadOpen(true)} className="bg-gradient-brand text-white hover:opacity-90">
              <Upload className="h-4 w-4 mr-1.5" /> Import source files
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {project.sources.map((s: any) => (
            <div key={s.id} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple" />
                <div className="font-medium text-sm truncate">{s.name}</div>
              </div>
              <div className="text-xs text-muted-foreground">{s.type.toUpperCase()} · {s.rows ?? "—"} rows · {s.size}</div>
            </div>
          ))}
          <button
            onClick={() => setUploadOpen(true)}
            className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground hover:text-foreground hover:border-border-strong"
          >
            <Plus className="h-4 w-4 inline mr-1.5" /> Add another source
          </button>
        </div>
      )}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload source file"
        accept=".csv, .xlsx, .json, .pdf, .docx, .txt"
        onUpload={(name) => {
          const ext = name.split(".").pop() ?? "csv";
          add(project.id, name, ext);
          toast.success("Source uploaded", { description: name });
        }}
      />
    </StepCard>
  );
}

/* ------------------ Step 3 ------------------ */
const METHODS: Array<{ key: string; icon: any; title: string; desc: string; badge?: string }> = [
  { key: "ai", icon: Sparkles, title: "AI Auto-Generate", desc: "Full AI-powered generation. Fastest option.", badge: "Recommended" },
  { key: "chat", icon: MessageSquare, title: "Chat-Assisted", desc: "Interactive chat to guide AI through the generation." },
  { key: "manual", icon: Target, title: "Manual Mapping", desc: "Precise control over each section mapping." },
  { key: "hybrid", icon: GitBranch, title: "Hybrid", desc: "AI suggestions with manual review at each section." },
];

function Step3Method({ project }: { project: any }) {
  const set = useStore((s) => s.setGenerationMethod);
  const [choice, setChoice] = useState<string>(project.generationMethod ?? "");
  const [temp, setTemp] = useState([0.5]);
  const [model, setModel] = useState("claude-sonnet-4.6");
  return (
    <StepCard
      n={3}
      title="Generation method"
      count={choice ? 1 : 0}
      description="Select your preferred method to create content"
      icon={Sparkles}
      iconColor="bg-brand/15 text-brand"
      status={project.generationMethod ? "Completed" : "Pending"}
    >
      <div className="grid md:grid-cols-2 gap-3">
        {METHODS.map((m) => {
          const active = choice === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setChoice(m.key)}
              className={cn(
                "text-left rounded-lg border p-4 transition-colors relative",
                active ? "border-brand bg-brand/5" : "border-border bg-background/40 hover:border-border-strong",
              )}
            >
              {m.badge && (
                <span className="absolute top-3 right-3 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-gradient-brand text-white">
                  {m.badge}
                </span>
              )}
              <m.icon className={cn("h-5 w-5 mb-2", active ? "text-brand" : "text-muted-foreground")} />
              <div className="font-semibold">{m.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{m.desc}</div>
              {active && (
                <div className="absolute bottom-3 right-3 h-5 w-5 rounded-full bg-brand text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div>
          <Label className="mb-2 block">AI Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4.6">Claude Sonnet 4.6</SelectItem>
              <SelectItem value="gpt-5.5">GPT-5.5</SelectItem>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Creativity ({temp[0].toFixed(2)})</Label>
          <Slider value={temp} onValueChange={setTemp} min={0} max={1} step={0.05} />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Precise</span><span>Creative</span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          disabled={!choice}
          onClick={() => {
            set(project.id, choice as any);
            toast.success("Generation method saved");
          }}
          className="bg-gradient-brand text-white hover:opacity-90"
        >
          Save method
        </Button>
      </div>
    </StepCard>
  );
}

/* ------------------ Step 4 ------------------ */
function Step4Drafts({ project }: { project: any }) {
  const [dlgOpen, setDlgOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const addDraft = useStore((s) => s.addDraft);
  const navigate = useNavigate();

  const count = project.drafts.length;

  const createDraft = () => {
    if (!draftName.trim()) return;
    const draftId = addDraft(project.id, draftName.trim(), draftDesc.trim() || undefined);
    toast.success(`${draftName} draft created successfully!`, {
      description: "You can now map content inside the draft document.",
    });
    setDraftName("");
    setDraftDesc("");
    setDlgOpen(false);
    setTimeout(() => {
      // stay on project page; user clicks Map content
      void draftId;
    }, 0);
  };

  return (
    <StepCard
      n={4}
      title="Map data sources to template sections"
      count={count}
      description="Create a draft document to define and manage content mapping within it"
      icon={FolderTree}
      iconColor="bg-purple/15 text-purple"
      status={count > 0 ? "Completed" : "Pending"}
    >
      {count === 0 ? (
        <EmptyState
          illustration={<DraftBox />}
          title="You don't have any draft document(s) yet!"
          subtitle="Create one or more draft documents to map content inside it."
          action={
            <Button onClick={() => setDlgOpen(true)} className="bg-gradient-brand text-white hover:opacity-90">
              <FileText className="h-4 w-4 mr-1.5" /> Create draft document
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {project.drafts.map((d: any) => (
            <div key={d.id} className="rounded-lg border border-border bg-background/40 p-4 hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between">
                <div className="text-xs text-muted-foreground">{d.createdAt}</div>
                <button className="p-1 rounded hover:bg-accent text-muted-foreground">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="font-semibold mt-2">{d.name}</div>
              <div className="text-xs text-muted-foreground">Created by {d.createdBy}</div>
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
                  {d.mappingsCount} Mappings
                </span>
              </div>
              {d.description && <div className="text-sm text-muted-foreground mt-3">{d.description}</div>}
              <button
                onClick={() => navigate({ to: "/projects/$id/mapping/$draftId", params: { id: project.id, draftId: d.id } })}
                className="mt-4 text-sm text-brand hover:underline inline-flex items-center gap-1"
              >
                Map content <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setDlgOpen(true)}
            className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground hover:text-foreground hover:border-border-strong flex items-center justify-center min-h-32"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create new draft
          </button>
        </div>
      )}
      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader><DialogTitle>Create draft document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Draft name *</Label>
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Batch A" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDlgOpen(false)}>Cancel</Button>
            <Button onClick={createDraft} disabled={!draftName.trim()} className="bg-gradient-brand text-white hover:opacity-90">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StepCard>
  );
}

/* ------------------ Step 5 ------------------ */
function Step5Generated({ project }: { project: any }) {
  const count = project.generated.length;
  const approvals = useStore((s) => s.docApproved);
  const approvedCount = project.generated.filter((g: any) => approvals[g.id]).length;
  const shown = useCountUp(count, 600, count > 0);
  return (
    <StepCard
      n={5}
      title="View draft documents"
      count={count}
      description="View draft documents created using your content mappings"
      icon={Network}
      iconColor="bg-brand/15 text-brand"
      status={count > 0 ? "Completed" : "Pending"}
    >
      {count === 0 ? (
        <EmptyState
          illustration={<NetworkNodes />}
          title="No generated documents yet."
          subtitle="Complete a mapping to generate documents."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="tabular-nums">{Math.round(shown)} rendered</span>
            <span className="text-border">|</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 tabular-nums",
                approvedCount === count ? "text-ai-confident" : "text-ai-uncertain",
              )}
            >
              {approvedCount === count ? (
                <Unlock className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {approvedCount}/{count} approved
            </span>
            {approvedCount < count && <span>Batch stays locked until every document is approved.</span>}
          </div>
          <motion.div
            className="relative space-y-2 pl-4"
            variants={listContainer(0.05)}
            initial="hidden"
            animate="show"
          >
            {/* lineage rail: mapping → render → approval */}
            <span className="absolute bottom-2 left-0 top-2 w-px bg-border" aria-hidden />
            {project.generated.map((g: any, i: number) => {
              const approved = !!approvals[g.id];
              return (
                <motion.div
                  key={g.id}
                  variants={listItem}
                  className="relative flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3"
                >
                  <span
                    className={cn(
                      "absolute -left-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
                      approved ? "bg-ai-confident" : "bg-ai-uncertain",
                    )}
                    aria-hidden
                  />
                  <FileText className="h-5 w-5 text-brand" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium">{g.filename}</div>
                      {i === 0 && (
                        <span className="shrink-0 rounded-full border border-ai-active/40 bg-ai-active/10 px-1.5 py-0.5 text-[10px] font-medium text-ai-active">
                          first of batch
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                          approved
                            ? "border-ai-confident/40 bg-ai-confident/10 text-ai-confident"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {approved ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {approved ? "Approved" : "Awaiting approval"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mapped from {g.fromDraft} → rendered {g.generatedAt} · {g.size} · by{" "}
                      {g.generatedBy}
                    </div>
                  </div>
                  <button className="rounded p-1.5 text-muted-foreground hover:bg-accent" title="Preview"><Eye className="h-4 w-4" /></button>
                  <button className="rounded p-1.5 text-muted-foreground hover:bg-accent" title="Download"><Download className="h-4 w-4" /></button>
                  <Link
                    to="/projects/$id/edit/$docId"
                    params={{ id: project.id, docId: g.id }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button className="rounded p-1.5 text-muted-foreground hover:bg-accent" title="Regenerate"><RefreshCcw className="h-4 w-4" /></button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </StepCard>
  );
}


/* ------------------ Shared ------------------ */
function EmptyState({
  illustration,
  title,
  subtitle,
  action,
}: {
  illustration: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.reveal, ease: EASE.out }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface-elevated/30 px-6 py-10 text-center"
    >
      <div className="mb-5">{illustration}</div>
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <div className="text-sm leading-relaxed text-muted-foreground max-w-sm mt-1.5">{subtitle}</div>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );

}

function UploadDialog({
  open,
  onOpenChange,
  title,
  accept,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  accept: string;
  onUpload: (name: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const handle = (files: FileList | null) => {
    if (!files || !files[0]) return;
    onUpload(files[0].name);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors",
            dragging ? "border-brand bg-brand/5" : "border-border hover:border-border-strong",
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
          <div className="text-sm font-medium">Drag and drop your file here</div>
          <div className="text-xs text-muted-foreground mt-1">or click to browse ({accept})</div>
          <input type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files)} />
        </label>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------ Illustrations ------------------ */
function TemplateBox() {
  return (
    <svg viewBox="0 0 160 130" className="w-40 h-32">
      <defs>
        <linearGradient id="tb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.66 0.19 268)" /><stop offset="1" stopColor="oklch(0.6 0.22 300)" />
        </linearGradient>
      </defs>
      <rect x="15" y="70" width="130" height="10" fill="oklch(0.28 0.04 275)" opacity="0.6" />
      <rect x="20" y="82" width="120" height="8" fill="oklch(0.28 0.04 275)" opacity="0.5" />
      <rect x="25" y="93" width="110" height="6" fill="oklch(0.28 0.04 275)" opacity="0.4" />
      <rect x="45" y="20" width="60" height="50" rx="4" fill="url(#tb)" opacity="0.9" />
      <path d="M110 30 L130 20 L130 55 L110 65 Z" fill="oklch(0.65 0.22 300)" opacity="0.8" />
      <path d="M75 5 L75 20 M65 12 L75 20 L85 12" stroke="url(#tb)" strokeWidth="2" fill="none" />
    </svg>
  );
}
function SourceBox() {
  return (
    <svg viewBox="0 0 160 130" className="w-40 h-32">
      <defs>
        <linearGradient id="sb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.65 0.22 300)" /><stop offset="1" stopColor="oklch(0.66 0.19 268)" />
        </linearGradient>
      </defs>
      <path d="M45 40 L80 25 L115 40 L80 55 Z" fill="url(#sb)" opacity="0.8" />
      <path d="M45 40 L45 85 L80 100 L80 55 Z" fill="oklch(0.4 0.05 275)" />
      <path d="M115 40 L115 85 L80 100 L80 55 Z" fill="oklch(0.5 0.08 280)" />
      <path d="M25 70 L45 65 M25 80 L45 75" stroke="oklch(0.66 0.19 268)" strokeWidth="2" markerEnd="url(#arr)" />
    </svg>
  );
}
function DraftBox() {
  return (
    <svg viewBox="0 0 160 130" className="w-40 h-32">
      <defs>
        <linearGradient id="db" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.66 0.19 268)" /><stop offset="1" stopColor="oklch(0.6 0.22 300)" />
        </linearGradient>
      </defs>
      <rect x="30" y="30" width="90" height="80" rx="4" fill="url(#db)" opacity="0.7" transform="skewY(-5)" />
      <rect x="40" y="40" width="90" height="80" rx="4" fill="oklch(0.4 0.05 275)" transform="skewY(-5)" />
      <rect x="50" y="50" width="90" height="80" rx="4" fill="oklch(0.55 0.08 285)" transform="skewY(-5)" />
    </svg>
  );
}
function NetworkNodes() {
  return (
    <svg viewBox="0 0 160 130" className="w-40 h-32">
      <defs>
        <linearGradient id="nn" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.66 0.19 268)" /><stop offset="1" stopColor="oklch(0.6 0.22 300)" />
        </linearGradient>
      </defs>
      <path d="M80 30 L40 80 M80 30 L80 80 M80 30 L120 80" stroke="url(#nn)" strokeWidth="2" />
      <rect x="70" y="20" width="20" height="20" fill="url(#nn)" />
      <rect x="30" y="70" width="20" height="20" fill="oklch(0.5 0.05 275)" />
      <rect x="70" y="70" width="20" height="20" fill="oklch(0.5 0.05 275)" />
      <rect x="110" y="70" width="20" height="20" fill="oklch(0.5 0.05 275)" />
    </svg>
  );
}
