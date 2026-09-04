import { motion } from "framer-motion";
import { ShieldCheck, Cpu } from "lucide-react";
import { useModelCallActive } from "@/lib/model-activity";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DUR } from "@/lib/motion";

/** Workspace region → data-residency label. */
function residency(region: string) {
  const r = region.toLowerCase();
  if (r.includes("europe") || r.includes("eu")) return "EU";
  if (r.includes("united kingdom") || r === "uk") return "UK";
  if (r.includes("india") || r === "in") return "IN";
  return "GLOBAL";
}

/**
 * Always-visible trust surface: where model calls run, under which residency,
 * and whether anything is in flight. Treated like a build indicator.
 */
export function ModelBoundaryChip({ className }: { className?: string }) {
  const active = useModelCallActive();
  const region = useStore((s) => s.projects[0]?.region ?? "Europe");
  const zone = residency(region);

  return (
    <div
      className={cn(
        "hidden items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-2.5 py-1 text-[11px] font-medium lg:inline-flex",
        className,
      )}
      title={
        active
          ? `Model call in flight · residency ${zone} · zero retention`
          : `No model call in flight · residency ${zone} · zero retention`
      }
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            active ? "bg-ai-active" : "bg-ai-confident",
          )}
        />
        {active && (
          <motion.span
            className="absolute h-2 w-2 rounded-full bg-ai-active"
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </span>
      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">
        {active ? "Model active" : "Idle"}
      </span>
      <span className="text-border">|</span>
      <span className="tabular-nums">{zone}</span>
      <ShieldCheck className="h-3.5 w-3.5 text-ai-confident" />
      <motion.span
        className="text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.base }}
      >
        0-retention
      </motion.span>
    </div>
  );
}
