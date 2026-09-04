import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, X } from "lucide-react";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  title: string;
  message?: string;
  detail?: string;
  onRetry?: () => void;
  retrying?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({
  title,
  message,
  detail,
  onRetry,
  retrying = false,
  onDismiss,
  className,
}: ErrorBannerProps) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: DUR.base, ease: EASE.out }}
      className={cn(
        "rounded-xl border border-destructive/35 bg-destructive/8 px-4 py-3.5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug tracking-tight text-foreground">{title}</p>
          {message && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{message}</p>
          )}
          {detail && (
            <p className="mt-1.5 truncate font-mono text-[11px] leading-relaxed text-muted-foreground/80" title={detail}>
              {detail}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={retrying}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent disabled:opacity-60"
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
              {retrying ? "Retrying…" : "Retry"}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
