import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DUR, EASE, SPRING, staggerDelay, useCountUp, useReducedMotionFlag } from "@/lib/motion";

/* ------------------------------- confidence ---------------------------------- */

function tokens(s: string) {
  return s
    .toLowerCase()
    .replace(/[{}[\]<>]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Deterministic lexical agreement between a template variable and the source
 * column it is bound to. This is a measured overlap of the two names — it is
 * never a fabricated model score, and the label says so.
 */
export function bindingAgreement(variable: string, field: string) {
  if (!field) return 0;
  const a = tokens(variable);
  const b = tokens(field);
  if (!a.length || !b.length) return 0;
  let hits = 0;
  for (const t of a) {
    if (b.some((u) => u === t || u.startsWith(t) || t.startsWith(u))) hits += 1;
  }
  const recall = hits / a.length;
  const precision = hits / b.length;
  if (!hits) return 0.2;
  return Math.min(1, (2 * recall * precision) / (recall + precision));
}

function bandOf(score: number) {
  if (!score) return "idle" as const;
  if (score >= 0.85) return "confident" as const;
  if (score >= 0.5) return "uncertain" as const;
  return "blocked" as const;
}

const BAND_STROKE = {
  idle: "var(--ai-idle)",
  confident: "var(--ai-confident)",
  uncertain: "var(--ai-uncertain)",
  blocked: "var(--ai-blocked)",
} as const;

const BAND_TEXT = {
  idle: "text-muted-foreground",
  confident: "text-ai-confident",
  uncertain: "text-ai-uncertain",
  blocked: "text-ai-blocked",
} as const;

/* ------------------------------ radial gauge --------------------------------- */

function Agreement({ score, band }: { score: number; band: keyof typeof BAND_STROKE }) {
  const pct = useCountUp(Math.round(score * 100), 600, score > 0);
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <span className="inline-flex items-center gap-1.5" title="Lexical agreement between the variable name and the bound column">
      <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
        <circle cx="12" cy="12" r={r} fill="none" strokeWidth="2.5" stroke="var(--color-border)" />
        <motion.circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          stroke={BAND_STROKE[band]}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score) }}
          transition={SPRING.progress}
          transform="rotate(-90 12 12)"
        />
      </svg>
      <span className={cn("w-9 text-right font-mono text-[11px] tabular-nums", BAND_TEXT[band])}>
        {score ? `${Math.round(pct)}%` : "—"}
      </span>
    </span>
  );
}

/* --------------------------------- connector --------------------------------- */

function Connector({ band, live }: { band: keyof typeof BAND_STROKE; live: boolean }) {
  const reduced = useReducedMotionFlag();
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" className="shrink-0 overflow-visible">
      <motion.path
        d="M0 10 C 20 10, 36 10, 56 10"
        fill="none"
        strokeWidth="1.5"
        stroke={BAND_STROKE[band]}
        strokeDasharray={band === "idle" ? "3 4" : undefined}
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: band === "idle" ? 0.5 : 1 }}
        transition={{ duration: reduced ? 0.01 : DUR.reveal, ease: EASE.out }}
      />
      {live && !reduced && band !== "idle" && (
        <motion.circle
          r="2"
          fill={BAND_STROKE[band]}
          animate={{ cx: [0, 56], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          cy="10"
        />
      )}
    </svg>
  );
}

/* ------------------------------- main surface -------------------------------- */

export function MappingBinder({
  variables,
  fields,
  mappings,
  onChange,
  onAutoMap,
}: {
  variables: string[];
  fields: string[];
  mappings: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onAutoMap: () => Record<string, string>;
}) {
  const reduced = useReducedMotionFlag();
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState<number>(0);
  const [overridden, setOverridden] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const rows = useMemo(
    () =>
      variables.map((v) => {
        const field = mappings[v] ?? "";
        const score = bindingAgreement(v, field);
        return { variable: v, field, score, band: bandOf(score) };
      }),
    [variables, mappings],
  );

  const bound = rows.filter((r) => r.field).length;
  const needsReview = rows.filter((r) => r.field && r.score < 0.85).length;
  const unbound = rows.filter((r) => !r.field);

  const autoMap = () => {
    const next = onAutoMap();
    onChange(next);
    setOverridden([]);
    if (reduced) {
      setRevealed(variables.length);
      return;
    }
    // Bindings land one at a time so the pass is legible; capped total.
    setRunning(true);
    setRevealed(0);
    timers.current.forEach(clearTimeout);
    timers.current = variables.map((_, i) =>
      setTimeout(() => {
        setRevealed(i + 1);
        if (i === variables.length - 1) setRunning(false);
      }, staggerDelay(i, 0.22) * 1000 + 180),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {bound}/{rows.length} bound
          </span>
          {needsReview > 0 && (
            <span className="inline-flex items-center gap-1 text-ai-uncertain">
              <AlertTriangle className="h-3.5 w-3.5" />
              {needsReview} to review
            </span>
          )}
          {bound === rows.length && needsReview === 0 && (
            <span className="inline-flex items-center gap-1 text-ai-confident">
              <Check className="h-3.5 w-3.5" /> all bound
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={autoMap} disabled={running}>
          <Sparkles className={cn("mr-1.5 h-3.5 w-3.5", running && "animate-spin")} />
          {running ? "Binding fields…" : "Auto-map with AI"}
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border">
        {running && !reduced && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 scan-sweep bg-gradient-to-b from-transparent via-ai-active/15 to-transparent" />
        )}
        <div className="divide-y divide-border">
          {rows.map((r, i) => {
            const visible = !running || i < revealed;
            const isOverride = overridden.includes(r.variable);
            return (
              <div
                key={r.variable}
                className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 p-3"
              >
                <code className="truncate font-mono text-sm text-brand">{r.variable}</code>
                <Connector band={visible ? r.band : "idle"} live={running && i === revealed} />
                <div className="min-w-0">
                  <motion.div
                    key={`${r.field}-${isOverride}`}
                    initial={isOverride && !reduced ? { scale: 0.98 } : false}
                    animate={{ scale: 1 }}
                    transition={SPRING.ui}
                  >
                    <Select
                      value={r.field}
                      onValueChange={(val) => {
                        onChange({ ...mappings, [r.variable]: val });
                        setOverridden((o) =>
                          o.includes(r.variable) ? o : [...o, r.variable],
                        );
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "transition-shadow",
                          visible && r.band === "uncertain" && "ai-ring",
                          visible && r.band === "blocked" && "border-ai-blocked/60",
                        )}
                      >
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                  <AnimatePresence>
                    {isOverride && (
                      <motion.div
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: DUR.micro }}
                        className="mt-1 text-[11px] text-muted-foreground"
                      >
                        Human override — kept over the suggested binding
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {visible ? (
                    <motion.div
                      key="score"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: DUR.micro }}
                    >
                      <Agreement score={r.score} band={r.band} />
                    </motion.div>
                  ) : (
                    <div key="pending" className="h-6 w-16 ai-skeleton" />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {unbound.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-ai-uncertain/40 bg-ai-uncertain/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ai-uncertain" />
          <span>
            {unbound.length} variable{unbound.length > 1 ? "s" : ""} still unbound:{" "}
            <span className="font-mono text-xs">{unbound.map((u) => u.variable).join(", ")}</span>.
            These stay unbound until you choose a column — nothing is guessed at generation time.
          </span>
        </div>
      )}
    </div>
  );
}
