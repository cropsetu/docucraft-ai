import { motion } from "framer-motion";
import { DUR, EASE, staggerDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A single shimmering placeholder bar. */
export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("ai-skeleton h-3.5 w-full", className)} />;
}

/** Placeholder rows for the projects table while the workspace settles. */
export function TableSkeleton({ rows = 6, cols = 8 }: { rows?: number; cols?: number }) {
  const widths = ["w-40", "w-20", "w-28", "w-24", "w-24", "w-24", "w-20", "w-16"];
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-border/70">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DUR.base, ease: EASE.out, delay: staggerDelay(r, 0.04) }}
              >
                <SkeletonBar className={widths[c] ?? "w-24"} />
              </motion.div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/** Placeholder block for a stage panel body. */
export function StageSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBar className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBar className="h-3 w-40" />
          <SkeletonBar className="h-3 w-64" />
        </div>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBar key={i} className={cn("h-12 rounded-xl", i % 2 ? "w-full" : "w-[92%]")} />
        ))}
      </div>
    </div>
  );
}

/** Polished, centered empty state with soft halo and optional action. */
export function PolishedEmpty({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.reveal, ease: EASE.out }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface-elevated/30 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-surface text-brand elev-1">
        <div className="absolute inset-0 rounded-2xl bg-brand/10 blur-md" />
        <div className="relative">{icon}</div>
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
