import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  FolderKanban,
  MessageSquare,
  FileText,
  BarChart3,
  Users,
  Shield,
  Settings,
  CornerDownLeft,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { DUR, EASE, SPRING, staggerDelay, useReducedMotionFlag } from "@/lib/motion";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";

type Item = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

/**
 * ⌘K palette over routes and actions that already exist. No new behaviour —
 * it just makes the existing surface addressable from the keyboard.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const { theme, toggle } = useTheme();
  const reduced = useReducedMotionFlag();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      setOpen(false);
      navigate({ to });
    };
    const nav: Item[] = [
      { id: "n-dash", label: "Projects", group: "Navigate", icon: FolderKanban, run: go("/dashboard") },
      { id: "n-chat", label: "Chat", group: "Navigate", icon: MessageSquare, run: go("/chat") },
      { id: "n-tpl", label: "Templates", group: "Navigate", icon: FileText, run: go("/templates") },
      { id: "n-an", label: "Analytics", group: "Navigate", icon: BarChart3, run: go("/analytics") },
      { id: "n-team", label: "Team", group: "Navigate", icon: Users, run: go("/team") },
      { id: "n-audit", label: "Audit Log", group: "Navigate", icon: Shield, run: go("/audit-log") },
      { id: "n-set", label: "Settings", group: "Navigate", icon: Settings, run: go("/settings") },
    ];
    const actions: Item[] = [
      {
        id: "a-theme",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        group: "Actions",
        icon: theme === "dark" ? Sun : Moon,
        run: () => {
          toggle();
          setOpen(false);
        },
      },
    ];
    const proj: Item[] = projects.slice(0, 12).map((p) => ({
      id: `p-${p.id}`,
      label: p.name,
      hint: `${p.documentType} · ${p.status}`,
      group: "Projects",
      icon: Sparkles,
      run: () => {
        setOpen(false);
        navigate({ to: "/projects/$id", params: { id: p.id } });
      },
    }));
    return [...nav, ...actions, ...proj];
  }, [navigate, projects, theme, toggle]);

  const groups = ["Navigate", "Actions", "Projects"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.micro }}
        >
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.micro }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="relative w-full max-w-xl overflow-hidden rounded-xl glass-overlay"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={SPRING.pop}
          >
            <Command label="Command palette" className="bg-transparent" shouldFilter>
              <div className="flex items-center gap-2 border-b border-border/70 px-4">
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search projects, pages and actions…"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  esc
                </kbd>
              </div>
              <Command.List className="max-h-[52vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nothing matches “{query}”.
                </Command.Empty>
                {groups.map((g) => {
                  const inGroup = items.filter((i) => i.group === g);
                  if (!inGroup.length) return null;
                  return (
                    <Command.Group
                      key={g}
                      heading={g}
                      className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                    >
                      {inGroup.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <Command.Item
                            key={item.id}
                            value={`${item.label} ${item.hint ?? ""}`}
                            onSelect={item.run}
                            className="group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm normal-case tracking-normal text-foreground data-[selected=true]:bg-accent"
                          >
                            <motion.span
                              className="flex items-center gap-3"
                              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: DUR.micro,
                                ease: EASE.out,
                                delay: staggerDelay(idx, 0.02),
                              }}
                            >
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-data-[selected=true]:text-ai-active" />
                              <span className="truncate">{item.label}</span>
                              {item.hint && (
                                <span className="truncate text-xs text-muted-foreground">
                                  {item.hint}
                                </span>
                              )}
                            </motion.span>
                            <CornerDownLeft className="ml-auto h-3.5 w-3.5 shrink-0 opacity-0 group-data-[selected=true]:opacity-60" />
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
