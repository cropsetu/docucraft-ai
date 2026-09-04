import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DUR, EASE, SPRING, useCountUp, useReducedMotionFlag, useStagedReveal } from "@/lib/motion";

export type CompileCount = { label: string; value: number; tone: string };

/**
 * Shows what the compile pass actually did, stage by stage, then settles into
 * the real counts. `done` reflects the real work: stages never claim to finish
 * ahead of it, and every number below comes from the detection result.
 */
export function CompileReveal({
  stages,
  counts,
  done,
  className,
}: {
  stages: string[];
  counts: CompileCount[];
  done: boolean;
  className?: string;
}) {
  const reduced = useReducedMotionFlag();
  const { completed, activeIndex, finished } = useStagedReveal(stages.length, done);

  return (
    <div className={cn("rounded-lg border border-border bg-background/40 p-4", className)}>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Compile pass</span>
        <span className="tabular-nums">
          {Math.min(completed, stages.length)}/{stages.length}
        </span>
      </div>

      <ol className="space-y-2">
        {stages.map((s, i) => {
          const isDone = i < completed;
          const isActive = i === activeIndex;
          return (
            <li key={s} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  isDone
                    ? "border-ai-confident/50 bg-ai-confident/15 text-ai-confident"
                    : isActive
                      ? "border-ai-active/50 bg-ai-active/15 text-ai-active"
                      : "border-border text-muted-foreground",
                )}
              >
                {isDone ? (
                  <motion.span
                    initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={SPRING.ui}
                  >
                    <Check className="h-3 w-3" />
                  </motion.span>
                ) : isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                )}
              </span>
              <span className={cn(isDone || isActive ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </span>
              {isActive && (
                <span className="ml-auto h-1 w-16 overflow-hidden rounded-full">
                  <span className="block h-full w-full ai-skeleton" />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <AnimatePresence>
        {finished && (
          <motion.div
            className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.reveal, ease: EASE.out }}
          >
            {counts.map((c) => (
              <CountCell key={c.label} {...c} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountCell({ label, value, tone }: CompileCount) {
  const n = useCountUp(value, 600, value > 0);
  return (
    <div>
      <div className={cn("text-lg font-semibold tabular-nums", tone)}>{Math.round(n)}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
