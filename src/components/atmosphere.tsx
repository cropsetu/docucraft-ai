import { usePageVisible, useReducedMotionFlag } from "@/lib/motion";

/**
 * Ambient background: three blurred radial gradients drifting slowly plus a
 * fine grain overlay so large flat surfaces don't read as flat.
 *
 * Transform-only CSS animations on composited layers — no per-frame repaint.
 * Paused when the tab is hidden or the user prefers reduced motion.
 */
export function Atmosphere() {
  const visible = usePageVisible();
  const reduced = useReducedMotionFlag();
  const animate = visible && !reduced;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="aurora-orb aurora-orb-1"
        style={{ animationPlayState: animate ? "running" : "paused" }}
      />
      <div
        className="aurora-orb aurora-orb-2"
        style={{ animationPlayState: animate ? "running" : "paused" }}
      />
      <div
        className="aurora-orb aurora-orb-3"
        style={{ animationPlayState: animate ? "running" : "paused" }}
      />
      <div className="grain-overlay" />
    </div>
  );
}
