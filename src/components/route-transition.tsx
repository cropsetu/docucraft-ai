import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { DUR, EASE, useReducedMotionFlag } from "@/lib/motion";

/**
 * Page-level fade + 4px rise, keyed on pathname. Content only — the shell
 * (sidebar, header, atmosphere) never re-animates.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduced = useReducedMotionFlag();

  return (
    <motion.div
      key={pathname}
      className="min-w-0"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? DUR.micro : DUR.route, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}
