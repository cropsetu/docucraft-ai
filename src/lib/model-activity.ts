/**
 * Tiny in-memory signal for "is a model call in flight right now".
 *
 * This is presentation plumbing only: it is set by the code paths that actually
 * issue a model request, and read by the model-boundary trust chip. Nothing is
 * persisted and no store shape changes.
 */
import { useEffect, useState } from "react";

type Listener = () => void;

let inFlight = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

/** Mark the start of a real model call. Returns the matching end function. */
export function beginModelCall() {
  inFlight += 1;
  emit();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    inFlight = Math.max(0, inFlight - 1);
    emit();
  };
}

export function useModelCallActive() {
  const [active, setActive] = useState(inFlight > 0);
  useEffect(() => {
    const l = () => setActive(inFlight > 0);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return active;
}
