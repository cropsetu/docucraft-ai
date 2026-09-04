/**
 * Central motion system. Every animated surface pulls its timing from here so
 * the whole product moves like one machine.
 *
 * Rules encoded here:
 *  - micro-interactions 150-250ms
 *  - reveals 300-500ms
 *  - staged sequences capped at 2.5s
 *  - transform/opacity only
 */
import { useEffect, useState } from "react";
import type { Transition, Variants } from "framer-motion";

/* ---------------------------------- durations --------------------------------- */

export const DUR = {
  instant: 0.08,
  micro: 0.15,
  press: 0.18,
  base: 0.22,
  reveal: 0.32,
  revealSlow: 0.45,
  route: 0.2,
} as const;

/** Hard caps for staged reveal sequences (ms). */
export const CAP = {
  /** total budget for a staged reveal */
  sequenceMs: 2500,
  /** minimum visible time per stage when the request is still in flight */
  stageMs: 320,
  /** flush speed once the real request has resolved */
  flushMs: 120,
} as const;

/* ---------------------------------- springs ----------------------------------- */

export const SPRING = {
  /** default UI spring: quick, no visible overshoot */
  ui: { type: "spring", stiffness: 420, damping: 34, mass: 0.7 },
  /** softer, for panels and reveals */
  panel: { type: "spring", stiffness: 260, damping: 28, mass: 0.9 },
  /** progress bars / counters — settles without bounce */
  progress: { type: "spring", stiffness: 180, damping: 30, mass: 1 },
  /** command palette / dialog entrance */
  pop: { type: "spring", stiffness: 480, damping: 32, mass: 0.6 },
} satisfies Record<string, Transition>;

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

/* ---------------------------------- staggers ---------------------------------- */

/** Stagger children, capped so long batches never crawl. */
export const STAGGER_CAP = 12;

export function staggerDelay(index: number, step = 0.03) {
  return index < STAGGER_CAP ? index * step : 0;
}

export function listContainer(step = 0.03): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren: 0.02 } },
  };
}

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.reveal, ease: EASE.out } },
};

/* ------------------------------- common variants ------------------------------ */

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.route, ease: EASE.out } },
  exit: { opacity: 0, y: -4, transition: { duration: DUR.micro, ease: EASE.out } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE.out } },
};

export const bubble: Variants = {
  hidden: { opacity: 0, y: 4, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.micro, ease: EASE.out } },
  exit: { opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.12 } },
};

export const pressable = {
  whileTap: { scale: 0.98 },
} as const;

/* ---------------------------- reduced motion support -------------------------- */

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Live reduced-motion flag. Components collapse to opacity-only when true. */
export function useReducedMotionFlag() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** True while the tab is visible — used to pause ambient loops. */
export function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

/* ------------------------------- number counters ------------------------------ */

/**
 * Spring-count a number up from 0. Purely presentational — the target value
 * always comes from real data.
 */
export function useCountUp(target: number, durationMs = 700, enabled = true) {
  const reduced = useReducedMotionFlag();
  const [value, setValue] = useState(reduced || !enabled ? target : 0);

  useEffect(() => {
    if (reduced || !enabled) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      // ease-out cubic — settles, never overshoots past the real value
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced, enabled]);

  return reduced || !enabled ? target : value;
}

/* --------------------------- staged reveal sequencing ------------------------- */

/**
 * Drives a staged reveal off a real request lifecycle.
 *
 * - while `done` is false, stages advance at `CAP.stageMs` but stop at the last
 *   stage (never completes ahead of the request)
 * - once `done` flips true, remaining stages flush at `CAP.flushMs`
 * - the whole sequence is hard-capped at `CAP.sequenceMs`
 */
export function useStagedReveal(stageCount: number, done: boolean) {
  const reduced = useReducedMotionFlag();
  const [index, setIndex] = useState(reduced ? stageCount : 0);

  useEffect(() => {
    if (reduced) {
      setIndex(done ? stageCount : Math.max(1, stageCount - 1));
      return;
    }
    const startedAt = performance.now();
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      setIndex((i) => {
        const overBudget = performance.now() - startedAt >= CAP.sequenceMs;
        if (done || overBudget) {
          if (i >= stageCount) return stageCount;
          timer = setTimeout(step, CAP.flushMs);
          return i + 1;
        }
        // hold one stage short of complete until the request resolves
        if (i >= stageCount - 1) {
          timer = setTimeout(step, CAP.stageMs);
          return i;
        }
        timer = setTimeout(step, CAP.stageMs);
        return i + 1;
      });
    };
    timer = setTimeout(step, CAP.stageMs);
    return () => clearTimeout(timer);
  }, [stageCount, done, reduced]);

  return {
    /** number of stages marked complete */
    completed: Math.min(index, stageCount),
    /** index of the stage currently running, or -1 when finished */
    activeIndex: index >= stageCount ? -1 : index,
    finished: index >= stageCount,
  };
}
