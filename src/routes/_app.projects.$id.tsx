import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const project = useStore((s) => s.projects.find((p) => p.id === id))!;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Link to="/dashboard" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{project.name}</span>
      </div>

      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-lg border border-border bg-surface hover:bg-accent text-sm inline-flex items-center gap-1.5">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="h-9 w-9 rounded-lg border border-border bg-surface hover:bg-accent flex items-center justify-center">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metadata card */}
      <div className="rounded-xl border border-border bg-surface p-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <Meta label="Project ID" value={project.projectId} mono />
        <Meta label="Region" value={project.region} />
        <Meta label="Function" value={project.function} />
        <Meta label="Document Type" value={project.documentType} />
        <Meta label="Created on" value={project.createdAt} />
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-xl font-semibold">Document generation process</h2>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <button className="p-1.5 rounded bg-accent text-foreground">
            <Layout className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground">
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Steps */}
      <Step1Template project={project} />
      <Step2Source project={project} />
      <Step3Method project={project} />
      <Step4Drafts project={project} />
      <Step5Generated project={project} />
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={cn("mt-1 font-medium", mono && "font-mono text-sm")}>{value}</div>
    </div>
  );
}

/* ------------------ Step wrapper ------------------ */
function StepCard({
  n,
  title,
  count,
  description,
  icon: Icon,
  iconColor,
  status,
  defaultOpen,
  children,
}: {
  n: number;
  title: string;
  count: number;
  description: string;
  icon: any;
  iconColor: string;
  status: "Pending" | "Completed" | "In Progress";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const statusStyles = {
    Pending: "bg-warning/15 text-warning border-warning/30",
    Completed: "bg-success/15 text-success border-success/30",
    "In Progress": "bg-info/15 text-info border-info/30",
  };
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-5 hover:bg-accent/30 transition-colors text-left"
      >
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">
              {n}. {title}
            </span>
            <span className="text-sm text-muted-foreground">({count})</span>
            <span className="text-muted-foreground">|</span>
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", statusStyles[status])}>
              {status}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{description}</div>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border p-6">{children}</div>}
    </div>
  );
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
const METHODS = [
  { key: "ai", icon: Sparkles, title: "AI Auto-Generate", desc: "Full AI-powered generation. Fastest option.", badge: "Recommended" },
  { key: "chat", icon: MessageSquare, title: "Chat-Assisted", desc: "Interactive chat to guide AI through the generation." },
  { key: "manual", icon: Target, title: "Manual Mapping", desc: "Precise control over each section mapping." },
  { key: "hybrid", icon: GitBranch, title: "Hybrid", desc: "AI suggestions with manual review at each section." },
] as const;

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
        <div className="space-y-2">
          {project.generated.map((g: any) => (
            <div key={g.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
              <FileText className="h-5 w-5 text-brand" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{g.filename}</div>
                <div className="text-xs text-muted-foreground">
                  Generated from {g.fromDraft} · {g.generatedAt} · {g.size} · by {g.generatedBy}
                </div>
              </div>
              <button className="p-1.5 rounded hover:bg-accent text-muted-foreground" title="Preview"><Eye className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-accent text-muted-foreground" title="Download"><Download className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-accent text-muted-foreground" title="Edit"><Pencil className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-accent text-muted-foreground" title="Regenerate"><RefreshCcw className="h-4 w-4" /></button>
            </div>
          ))}
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
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="mb-4">{illustration}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground max-w-sm mt-1">{subtitle}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
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
