import { useMemo, useState } from "react";
import mammoth from "mammoth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, Sparkles, Braces, GitBranch, Repeat, Check, ChevronRight,
  ArrowLeft, ArrowRight, Wand2, Loader2, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CompileReveal } from "@/components/compile-reveal";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onFinish: (result: { name: string; category: string; html: string }) => void;
};

const CATEGORIES = ["HR", "Clinical", "Quality-CMC", "Medical Affairs", "Marketing", "Legal", "Finance", "Other"];

const PRESETS: Record<string, { label: string; fields: string[]; hint: string }> = {
  auto: { label: "Auto-detect", fields: [], hint: "Scan the document and suggest fields based on content." },
  offer: { label: "Offer letter / HR", fields: ["full_name", "first_name", "last_name", "role", "department", "start_date", "salary", "manager_name", "region", "country"], hint: "Standard employment offer with employee, role, comp, and start date." },
  contract: { label: "Legal contract / MSA", fields: ["party_a", "party_b", "effective_date", "term_years", "governing_law", "notice_period", "jurisdiction"], hint: "Two-party agreement with parties, dates, and jurisdiction." },
  clinical: { label: "Clinical report", fields: ["study_id", "sponsor", "investigator", "site_name", "protocol_version", "primary_endpoint", "enrollment_target"], hint: "CSR / protocol document with study identifiers." },
  medaff: { label: "Medical affairs", fields: ["compound_name", "indication", "congress_name", "presentation_date", "author_list"], hint: "Poster / abstract for scientific communications." },
};

/* ---------------- Detection engine ---------------- */

type Candidate = {
  id: string;
  raw: string;                   // exact substring in source
  suggestedType: "source" | "prompt" | "conditional" | "repeat" | "skip";
  suggestedField: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  enabled: boolean;
};

/** Escape for regex literal use. */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "field";

function detectCandidates(text: string, presetKey: string): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const push = (c: Omit<Candidate, "id" | "enabled">) => {
    const key = c.raw;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: `c${out.length}`, enabled: true, ...c });
  };

  // 1. Explicit AI blocks: [AI: ...] or {{AI ...}}
  for (const m of text.matchAll(/\[AI:\s*([^\]]+)\]/gi)) {
    push({ raw: m[0], suggestedType: "prompt", suggestedField: m[1].trim(), confidence: "high", reason: "Explicit AI marker" });
  }

  // 2. Curly placeholders: {field} or {{field}}
  for (const m of text.matchAll(/\{\{?\s*([a-zA-Z_][a-zA-Z0-9_ ]{1,40})\s*\}?\}/g)) {
    const f = slug(m[1]);
    push({ raw: m[0], suggestedType: "source", suggestedField: f, confidence: "high", reason: "Curly-brace placeholder" });
  }

  // 3. Angle merge: <<field>>
  for (const m of text.matchAll(/<<\s*([a-zA-Z_][a-zA-Z0-9_ ]{1,40})\s*>>/g)) {
    push({ raw: m[0], suggestedType: "source", suggestedField: slug(m[1]), confidence: "high", reason: "Merge-field syntax" });
  }

  // 4. Bracketed all-caps placeholders: [FIELD NAME]
  for (const m of text.matchAll(/\[([A-Z][A-Z0-9_ /-]{2,40})\]/g)) {
    push({ raw: m[0], suggestedType: "source", suggestedField: slug(m[1]), confidence: "high", reason: "All-caps bracket placeholder" });
  }

  // 5. Underline runs: ______ (typical legacy fill-in)
  for (const m of text.matchAll(/_{4,}/g)) {
    push({ raw: m[0], suggestedType: "source", suggestedField: "fill_in", confidence: "low", reason: "Underline fill-in line" });
  }

  // 6. Dear <name>, / To: <name>
  for (const m of text.matchAll(/\b(Dear|To|Attn)[:\s]+([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3})\b/g)) {
    push({ raw: m[2], suggestedType: "source", suggestedField: "full_name", confidence: "medium", reason: `Salutation "${m[1]}"` });
  }

  // 7. Dates like "January 1, 2025" / "1/1/2025" / "2025-01-01"
  for (const m of text.matchAll(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\b/g)) {
    push({ raw: m[0], suggestedType: "source", suggestedField: "date", confidence: "medium", reason: "Full date phrase" });
  }
  for (const m of text.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)) {
    push({ raw: m[0], suggestedType: "source", suggestedField: "date", confidence: "medium", reason: "ISO date" });
  }

  // 8. Money: $12,000 / USD 50000 / €40,000
  for (const m of text.matchAll(/(?:USD|EUR|GBP|\$|€|£)\s?\d[\d,]*(?:\.\d+)?/g)) {
    push({ raw: m[0], suggestedType: "source", suggestedField: "salary", confidence: "medium", reason: "Currency amount" });
  }

  // 9. Conditional cues
  for (const m of text.matchAll(/\bIf\s+(applicable|eligible|resident of [A-Z]{2,}|the (?:employee|party)[^.\n]{0,60})/gi)) {
    push({ raw: m[0], suggestedType: "conditional", suggestedField: slug(m[1]), confidence: "low", reason: "Conditional phrasing" });
  }

  // 10. Repeat cues: numbered lists of "•" bullet references, or "for each"
  for (const m of text.matchAll(/\bfor each\s+([a-zA-Z_]+)/gi)) {
    push({ raw: m[0], suggestedType: "repeat", suggestedField: slug(m[1]), confidence: "medium", reason: "Loop phrasing" });
  }

  // 11. Preset-specific keyword targeting
  const preset = PRESETS[presetKey];
  if (preset && preset.fields.length) {
    for (const f of preset.fields) {
      const words = f.split("_").map((w) => w.replace(/^./, (c) => c.toUpperCase())).join("[\\s-]+");
      const rx = new RegExp(`\\[\\s*(${words}|${f})\\s*\\]`, "gi");
      for (const m of text.matchAll(rx)) {
        push({ raw: m[0], suggestedType: "source", suggestedField: f, confidence: "high", reason: `Matches ${preset.label} field "${f}"` });
      }
    }
  }

  // 12. TODO / TBD / XXX markers → prompts
  for (const m of text.matchAll(/\b(TBD|TODO|XXX|<add [^>]+>)\b/gi)) {
    push({ raw: m[0], suggestedType: "prompt", suggestedField: "Fill this section based on context.", confidence: "medium", reason: "Placeholder marker" });
  }

  return out;
}

/** Apply enabled candidates to text, producing tokenised HTML. */
function applyCandidates(text: string, cands: Candidate[]): string {
  // Sort by length desc so longer matches replace first — avoids partial-inside-larger conflicts.
  const active = cands.filter((c) => c.enabled && c.suggestedType !== "skip").sort((a, b) => b.raw.length - a.raw.length);
  let s = text;
  for (const c of active) {
    const rx = new RegExp(esc(c.raw), "g");
    let replacement = "";
    if (c.suggestedType === "source") {
      replacement = `<span data-token="source" field="${escAttr(c.suggestedField)}"></span>`;
    } else if (c.suggestedType === "prompt") {
      replacement = `<span data-token="prompt" prompt="${escAttr(c.suggestedField)}"></span>`;
    } else if (c.suggestedType === "conditional") {
      replacement = `<span data-token="conditional" condition="${escAttr(c.suggestedField)}" body=""></span>`;
    } else if (c.suggestedType === "repeat") {
      replacement = `<span data-token="repeat" variable="item" collection="${escAttr(c.suggestedField)}" body="• {item}"></span>`;
    }
    s = s.replace(rx, replacement);
  }
  // Wrap paragraphs if no tags
  if (!/<[a-z][^>]*>/i.test(s.replace(/<span[^>]*><\/span>/g, ""))) {
    s = s.split(/\n\s*\n/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
  }
  return s;
}

/* ---------------- Wizard component ---------------- */

const STEPS = [
  { n: 1, label: "Upload" },
  { n: 2, label: "Detect" },
  { n: 3, label: "Review" },
  { n: 4, label: "Save" },
];

export function TemplateConversionWizard({ open, onOpenChange, onFinish }: Props) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Step 1 state
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");

  // Step 2 state
  const [preset, setPreset] = useState<string>("auto");
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Step 4 state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("HR");

  const reset = () => {
    setStep(1); setUploading(false); setWarnings([]);
    setFileName(null); setRawText(""); setPastedText(""); setInputMode("upload");
    setPreset("auto"); setCandidates([]);
    setName(""); setCategory("HR");
  };

  const handleFile = async (f: File) => {
    setUploading(true);
    setFileName(f.name);
    setWarnings([]);
    if (!name) setName(f.name.replace(/\.(docx?|txt|md|rtf)$/i, ""));
    try {
      if (/\.docx$/i.test(f.name)) {
        const buf = await f.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        setRawText(result.value || "");
        if (result.messages?.length) {
          setWarnings(result.messages.slice(0, 3).map((m: any) => m.message ?? String(m)));
        }
      } else if (/\.docx?$/i.test(f.name)) {
        // legacy .doc — not supported by mammoth
        setRawText("");
        setWarnings(["Legacy .doc format isn't supported in the browser. Please save as .docx or paste the text."]);
      } else {
        setRawText(await f.text());
      }
    } catch (e: any) {
      setWarnings([e?.message ?? "Failed to read file"]);
      setRawText("");
    } finally {
      setUploading(false);
    }
  };

  const goToDetect = () => {
    const text = (inputMode === "upload" ? rawText : pastedText).trim();
    if (!text) {
      toast.error("Add a file or paste template text first.");
      return;
    }
    setCandidates(detectCandidates(text, preset));
    setStep(2);
  };

  const rerunDetection = (nextPreset: string) => {
    setPreset(nextPreset);
    const text = (inputMode === "upload" ? rawText : pastedText).trim();
    setCandidates(detectCandidates(text, nextPreset));
  };

  const previewHtml = useMemo(() => {
    const text = inputMode === "upload" ? rawText : pastedText;
    return applyCandidates(text, candidates);
  }, [candidates, rawText, pastedText, inputMode]);

  const stats = useMemo(() => {
    const on = candidates.filter((c) => c.enabled);
    return {
      total: candidates.length,
      enabled: on.length,
      source: on.filter((c) => c.suggestedType === "source").length,
      prompt: on.filter((c) => c.suggestedType === "prompt").length,
      conditional: on.filter((c) => c.suggestedType === "conditional").length,
      repeat: on.filter((c) => c.suggestedType === "repeat").length,
    };
  }, [candidates]);

  const finalize = () => {
    onFinish({
      name: name.trim() || fileName?.replace(/\.[^.]+$/, "") || "Converted template",
      category,
      html: previewHtml,
    });
    toast.success("Template converted", { description: `${stats.enabled} tokens applied — refine anytime in the editor.` });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-brand" /> Legacy template conversion
          </DialogTitle>
          <DialogDescription>
            Convert a Word document or pasted text into a tokenized DocuMind template — automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-border bg-surface/40 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={cn(
                  "h-6 w-6 rounded-full text-[11px] font-semibold flex items-center justify-center border",
                  step === s.n
                    ? "bg-gradient-brand text-white border-transparent"
                    : step > s.n
                      ? "bg-brand/20 text-brand border-brand/40"
                      : "bg-surface text-muted-foreground border-border",
                )}
              >
                {step > s.n ? <Check className="h-3 w-3" /> : s.n}
              </div>
              <span className={cn("text-xs", step === s.n ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className={cn("flex-1 h-px", step > s.n ? "bg-brand" : "bg-border")} />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 max-h-[65vh] overflow-auto">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setInputMode("upload")}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    inputMode === "upload" ? "border-brand bg-brand/5" : "border-border hover:border-border-strong",
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium"><Upload className="h-4 w-4" /> Upload .docx</div>
                  <div className="text-xs text-muted-foreground mt-1">Mammoth extracts clean text from Word.</div>
                </button>
                <button
                  onClick={() => setInputMode("paste")}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    inputMode === "paste" ? "border-brand bg-brand/5" : "border-border hover:border-border-strong",
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" /> Paste text</div>
                  <div className="text-xs text-muted-foreground mt-1">Great for snippets or PDF-extracted content.</div>
                </button>
              </div>

              {inputMode === "upload" ? (
                <>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg py-10 cursor-pointer hover:border-brand/50 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-brand animate-spin mb-2" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    )}
                    <span className="text-sm font-medium">
                      {uploading ? "Extracting…" : (fileName ?? "Drop or select a .docx / .txt file")}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Supports .docx, .txt, .md — we'll extract clean text next.
                    </span>
                    <input
                      type="file"
                      accept=".docx,.doc,.txt,.md"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                  </label>
                  {rawText && (
                    <div className="rounded-lg border border-border bg-surface p-3 max-h-40 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap">
                      {rawText.slice(0, 800)}{rawText.length > 800 && "…"}
                    </div>
                  )}
                  {warnings.map((w, i) => (
                    <div key={i} className="rounded-lg border border-warning/30 bg-warning/10 p-2 text-xs flex items-start gap-2">
                      <FileWarning className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" /> {w}
                    </div>
                  ))}
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Paste raw template text</Label>
                  <Textarea
                    rows={12}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Dear [FULL NAME],\n\nWe are pleased to offer you the position of [ROLE] at our [DEPARTMENT] team, starting January 1, 2026…\n\n[AI: warm 2-sentence welcome]`}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    We recognise curly {"{fields}"}, {"<<merge>>"} syntax, [ALL CAPS], underlines, dates, salutations and [AI: …] blocks.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Detect (preset) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Choose a document family (tunes detection)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {Object.entries(PRESETS).map(([k, p]) => (
                    <button
                      key={k}
                      onClick={() => rerunDetection(k)}
                      className={cn(
                        "text-left p-3 rounded-lg border transition-colors",
                        preset === k ? "border-brand bg-brand/5" : "border-border hover:border-border-strong",
                      )}
                    >
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <CompileReveal
                key={preset}
                done
                stages={[
                  "Reading document text",
                  "Classifying runs (static, placeholder, instruction)",
                  "Extracting field candidates",
                  "Compiling into token rules",
                ]}
                counts={[
                  { label: "candidates", value: stats.total, tone: "text-foreground" },
                  { label: "source fields", value: stats.source, tone: "text-token-source" },
                  { label: "prompts", value: stats.prompt, tone: "text-token-prompt" },
                  {
                    label: "logic blocks",
                    value: stats.conditional + stats.repeat,
                    tone: "text-token-conditional",
                  },
                ]}
              />

              <div className="rounded-lg border border-info/30 bg-info/10 p-3 text-sm flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-info mt-0.5 shrink-0" />
                <div>
                  Found <span className="font-semibold">{candidates.length}</span> conversion candidates.
                  Refine them next — you can toggle any off and change the type.
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 min-h-[420px]">
              {/* Candidate list */}
              <div className="rounded-lg border border-border overflow-hidden flex flex-col min-h-0">
                <div className="px-3 py-2 border-b border-border bg-surface/60 flex items-center justify-between text-xs">
                  <span className="font-semibold">Detected tokens ({stats.enabled}/{stats.total})</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCandidates((cs) => cs.map((c) => ({ ...c, enabled: true })))}
                      className="text-brand hover:underline"
                    >Enable all</button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      onClick={() => setCandidates((cs) => cs.map((c) => ({ ...c, enabled: false })))}
                      className="text-muted-foreground hover:underline"
                    >None</button>
                  </div>
                </div>
                <div className="overflow-auto divide-y divide-border max-h-[420px]">
                  {candidates.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No candidates detected. Try a different preset, or add tokens manually in the editor after saving.
                    </div>
                  )}
                  {candidates.map((c, i) => (
                    <div key={c.id} className={cn("p-3 flex items-start gap-2 text-sm", !c.enabled && "opacity-50")}>
                      <Checkbox
                        checked={c.enabled}
                        onCheckedChange={(v) =>
                          setCandidates((cs) => cs.map((x, j) => (j === i ? { ...x, enabled: !!v } : x)))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded truncate max-w-[220px]">
                            {c.raw}
                          </code>
                          <ConfidenceBadge conf={c.confidence} />
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <Select
                            value={c.suggestedType}
                            onValueChange={(v) =>
                              setCandidates((cs) => cs.map((x, j) => (j === i ? { ...x, suggestedType: v as any } : x)))
                            }
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="source"><span className="inline-flex items-center gap-1.5"><Braces className="h-3 w-3" /> Source</span></SelectItem>
                              <SelectItem value="prompt"><span className="inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Prompt</span></SelectItem>
                              <SelectItem value="conditional"><span className="inline-flex items-center gap-1.5"><GitBranch className="h-3 w-3" /> Conditional</span></SelectItem>
                              <SelectItem value="repeat"><span className="inline-flex items-center gap-1.5"><Repeat className="h-3 w-3" /> Repeat</span></SelectItem>
                              <SelectItem value="skip">Skip</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={c.suggestedField}
                            onChange={(e) =>
                              setCandidates((cs) => cs.map((x, j) => (j === i ? { ...x, suggestedField: e.target.value } : x)))
                            }
                            className="h-7 text-xs flex-1 min-w-0 font-mono"
                          />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">{c.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-lg border border-border overflow-hidden flex flex-col">
                <div className="px-3 py-2 border-b border-border bg-surface/60 flex flex-wrap gap-2 text-[11px]">
                  <span className="font-semibold">Preview</span>
                  <span className="text-muted-foreground">·</span>
                  <SummaryChip color="--color-token-source" label={`${stats.source} source`} />
                  <SummaryChip color="--color-token-prompt" label={`${stats.prompt} prompt`} />
                  <SummaryChip color="--color-token-conditional" label={`${stats.conditional} if`} />
                  <SummaryChip color="--color-token-repeat" label={`${stats.repeat} loop`} />
                </div>
                <div
                  className="tpl-editor overflow-auto p-4 text-sm leading-relaxed max-h-[420px]"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Save */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5" />
                <div>
                  Ready to convert. <span className="font-semibold">{stats.enabled} tokens</span> will be applied
                  ({stats.source} source, {stats.prompt} prompt, {stats.conditional} conditional, {stats.repeat} loop).
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label>Template name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Offer Letter — EU Standard" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Final preview</Label>
                <div
                  className="tpl-editor rounded-lg border border-border bg-surface p-4 max-h-64 overflow-auto text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex items-center justify-between bg-surface/30">
          <div className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {step === 1 && (
              <Button onClick={goToDetect} disabled={uploading} className="bg-gradient-brand text-white">
                Detect tokens <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button onClick={() => setStep(3)} className="bg-gradient-brand text-white">
                Review {candidates.length} candidates <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={() => setStep(4)} className="bg-gradient-brand text-white">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 4 && (
              <Button onClick={finalize} className="bg-gradient-brand text-white">
                <Check className="h-4 w-4 mr-1" /> Convert & open in editor
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfidenceBadge({ conf }: { conf: "high" | "medium" | "low" }) {
  const map = {
    high: { label: "high", color: "text-success border-success/40 bg-success/10" },
    medium: { label: "med", color: "text-warning border-warning/40 bg-warning/10" },
    low: { label: "low", color: "text-muted-foreground border-border bg-muted" },
  } as const;
  const c = map[conf];
  return <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", c.color)}>{c.label}</Badge>;
}

function SummaryChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{
        color: `var(${color})`,
        background: `color-mix(in oklab, var(${color}) 14%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
