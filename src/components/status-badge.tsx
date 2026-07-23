import { CheckCircle2, Loader2, Clock, XCircle } from "lucide-react";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const map = {
    Completed: { icon: CheckCircle2, cls: "text-success bg-success/10 border-success/30" },
    "In Progress": { icon: Loader2, cls: "text-warning bg-warning/10 border-warning/30", spin: true },
    Pending: { icon: Clock, cls: "text-muted-foreground bg-muted border-border" },
    Failed: { icon: XCircle, cls: "text-destructive bg-destructive/10 border-destructive/30" },
  } as const;
  const item = map[status];
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5", item.cls)}>
      <Icon className={cn("h-3.5 w-3.5 shrink-0", (item as any).spin && "animate-spin")} />
      {status}
    </span>
  );
}
