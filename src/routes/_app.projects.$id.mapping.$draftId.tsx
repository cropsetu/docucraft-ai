import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight,
  ChevronDown,
  Info,
  Search,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/_app/projects/$id/mapping/$draftId")({
  head: () => ({
    meta: [{ title: "Mapping — DocuMind AI" }, { name: "description", content: "Map template sections to source data." }],
  }),
  loader: ({ params }) => {
    const p = useStore.getState().getProject(params.id);
    if (!p) throw notFound();
    return null;
  },
  component: MappingPage,
});

const SECTION_TREE = [
  {
    name: "Section 1: Introduction",
    children: ["1.1 Background", "1.2 Objectives"],
  },
  {
    name: "Section 2: Methods",
    children: ["2.1 Study Design", "2.2 Participants", "2.3 Procedures"],
  },
  { name: "Section 3: Results", children: ["3.1 Primary Endpoints", "3.2 Safety"] },
];

const ACTIONS = [
  { key: "replace", title: "Replace", desc: "Overwrite existing section content" },
  { key: "append", title: "Append", desc: "Add to existing content" },
  { key: "insert", title: "Insert at position", desc: "Place at specific location" },
  { key: "transform", title: "AI Transform", desc: "Let AI modify content" },
] as const;

const TEMPLATE_VARS = ["{employee_name}", "{start_date}", "{position}"];
const SOURCE_FIELDS = ["full_name", "employment_start", "role", "department", "salary"];

function MappingPage() {
  const { id, draftId } = Route.useParams();
  const navigate = useNavigate();
  const project = useStore((s) => s.projects.find((p) => p.id === id))!;
  const draft = project.drafts.find((d) => d.id === draftId);

  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState("HCM.AU.CT.036_1G0_EA_AU2ML_20240523");
  const [expanded, setExpanded] = useState<string[]>([SECTION_TREE[0].name]);
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<string>("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [source, setSource] = useState("");
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const toggleSection = (name: string) =>
    setExpanded((e) => (e.includes(name) ? e.filter((n) => n !== name) : [...e, name]));

  const toggleSelect = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  const selectAll = () => {
    const all = SECTION_TREE.flatMap((s) => [s.name, ...s.children]);
    setSelected(selected.length === all.length ? [] : all);
  };

  const save = () => {
    useStore.getState().addGenerated(
      project.id,
      `${project.name}_${project.projectId}_${Math.floor(Math.random() * 90000 + 10000)}_en.docx`,
      draft?.name ?? "draft",
    );
    toast.success("Mapping saved & document generated", {
      description: "You can now view it in the Draft documents step.",
    });
    navigate({ to: "/projects/$id", params: { id: project.id } });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Link to="/dashboard" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/projects/$id" params={{ id: project.id }} className="hover:text-foreground">
          {project.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Mapping</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{draft?.name ?? "Draft"}</span>
      </div>

      <button
        onClick={() => navigate({ to: "/projects/$id", params: { id: project.id } })}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" /> Back to project
      </button>

      <div className="grid lg:grid-cols-[3fr_2fr] gap-6">
        {/* Left panel */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold mb-6">Mapping process</h2>

          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { n: 1, label: "Template" },
              { n: 2, label: "Action" },
              { n: 3, label: "Source" },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-3 flex-1">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                    step === s.n
                      ? "bg-gradient-brand text-white border-transparent"
                      : step > s.n
                        ? "bg-brand/20 text-brand border-brand/40"
                        : "bg-surface text-muted-foreground border-border",
                  )}
                >
                  {s.n}
                </div>
                <div className={cn("text-sm font-medium", step === s.n ? "text-foreground" : "text-muted-foreground")}>
                  {s.n}. {s.label}
                </div>
                {i < arr.length - 1 && <div className={cn("flex-1 h-px", step > s.n ? "bg-brand" : "bg-border")} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Select template file</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HCM.AU.CT.036_1G0_EA_AU2ML_20240523">
                      HCM.AU.CT.036_1G0_EA_AU2ML_20240523
                    </SelectItem>
                    {project.templates.map((t) => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Select template sections and subsections</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search section(s) and subsection(s)" className="pl-9" />
                </div>
              </div>

              <div className="rounded-lg border border-info/30 bg-info/10 p-3 flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                <span>All selected sections will use the same action in the next step</span>
              </div>

              <div className="border border-border rounded-lg divide-y divide-border">
                <div className="flex items-center gap-2 p-3">
                  <Checkbox
                    checked={selected.length > 0 && selected.length === SECTION_TREE.flatMap((s) => [s.name, ...s.children]).length}
                    onCheckedChange={selectAll}
                  />
                  <span className="font-medium text-sm">Select all</span>
                  {selected.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{selected.length} selected</span>
                  )}
                </div>
                {SECTION_TREE.map((s) => {
                  const isOpen = expanded.includes(s.name);
                  return (
                    <div key={s.name}>
                      <div className="flex items-center gap-2 p-3">
                        <button onClick={() => toggleSection(s.name)} className="text-muted-foreground">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <Checkbox checked={selected.includes(s.name)} onCheckedChange={() => toggleSelect(s.name)} />
                        <span className="text-sm">{s.name}</span>
                      </div>
                      {isOpen && (
                        <div className="pl-10 pb-2 space-y-1">
                          {s.children.map((c) => (
                            <div key={c} className="flex items-center gap-2 p-1.5">
                              <Checkbox checked={selected.includes(c)} onCheckedChange={() => toggleSelect(c)} />
                              <span className="text-sm text-muted-foreground">{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-3">
                {ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAction(a.key)}
                    className={cn(
                      "text-left rounded-lg border p-4 transition-colors",
                      action === a.key ? "border-brand bg-brand/5" : "border-border bg-background/40 hover:border-border-strong",
                    )}
                  >
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>AI instructions (optional)</Label>
                <Textarea
                  rows={3}
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g. Keep tone formal, include statistics"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Select source file</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger><SelectValue placeholder="Choose a source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employees_q3.csv">employees_q3.csv (50 rows)</SelectItem>
                    {project.sources.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Map source fields → template variables</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const auto: Record<string, string> = {};
                      TEMPLATE_VARS.forEach((v, i) => (auto[v] = SOURCE_FIELDS[i] ?? ""));
                      setMappings(auto);
                      toast.success("AI auto-mapped fields");
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Auto-map with AI
                  </Button>
                </div>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {TEMPLATE_VARS.map((v) => (
                    <div key={v} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-3">
                      <code className="text-sm font-mono text-brand">{v}</code>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <Select value={mappings[v] ?? ""} onValueChange={(val) => setMappings({ ...mappings, [v]: val })}>
                        <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                        <SelectContent>
                          {SOURCE_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Step {step} of 3</div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  className="bg-gradient-brand text-white hover:opacity-90"
                >
                  Next
                </Button>
              ) : (
                <Button onClick={save} className="bg-gradient-brand text-white hover:opacity-90">Save</Button>
              )}
            </div>
          </div>
        </div>

        {/* Right preview */}
        <div className="rounded-xl border border-border bg-surface p-6 h-fit sticky top-20">
          <h3 className="text-lg font-semibold mb-4">Mapping Preview</h3>
          <div className="space-y-5 text-sm">
            <div>
              <div className="font-semibold mb-1">1. Template</div>
              <div className="text-muted-foreground">Selected template file</div>
              <div className="font-mono text-xs mt-1">{template}</div>
              <div className="text-muted-foreground mt-3">Selected template sections and subsections</div>
              <ul className="mt-1 space-y-0.5">
                {selected.length === 0 && <li className="text-muted-foreground">—</li>}
                {selected.map((s) => (
                  <li key={s} className="text-xs">• {s}</li>
                ))}
              </ul>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="font-semibold mb-1">2. Action</div>
              <div className="text-muted-foreground text-xs">
                {action ? ACTIONS.find((a) => a.key === action)?.title : "—"}
              </div>
              {aiInstructions && <div className="text-xs mt-1 italic">"{aiInstructions}"</div>}
            </div>
            <div className="pt-4 border-t border-border">
              <div className="font-semibold mb-1">3. Source</div>
              <div className="text-muted-foreground text-xs">{source || "—"}</div>
              {Object.keys(mappings).length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs">
                  {Object.entries(mappings).map(([k, v]) => (
                    <li key={k}><code className="text-brand">{k}</code> → {v || "—"}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
