import { createFileRoute } from "@tanstack/react-router";
import { Download, Filter, Search, FileText, UserCog, ShieldCheck, Trash2, Upload, CheckCircle2, LogIn, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log — DocuMind AI" }, { name: "description", content: "Compliance-grade audit trail." }] }),
  component: AuditLogPage,
});

type Sev = "info" | "success" | "warning" | "danger";
type Entry = { time: string; actor: string; action: string; target: string; ip: string; severity: Sev; icon: React.ComponentType<{ className?: string }> };

const ENTRIES: Entry[] = [
  { time: "2026-07-23 22:41:12", actor: "Shubham Yeljale", action: "Approved draft", target: "test222 · HR Letter EN.docx", ip: "10.14.2.88", severity: "success", icon: CheckCircle2 },
  { time: "2026-07-23 22:39:04", actor: "Shubham Yeljale", action: "Generated document", target: "HR_Offer_EU_Q3.docx via GPT-4 Turbo", ip: "10.14.2.88", severity: "info", icon: Sparkles },
  { time: "2026-07-23 22:35:47", actor: "Elena Vasquez", action: "Uploaded source", target: "Clinical_Study_ONCO_003 · protocol_v2.pdf", ip: "10.14.5.22", severity: "info", icon: Upload },
  { time: "2026-07-23 21:58:20", actor: "Priya Sharma", action: "Updated template", target: "CMC Section 3.2.P → v3.0", ip: "10.14.6.19", severity: "info", icon: FileText },
  { time: "2026-07-23 21:12:03", actor: "Shubham Yeljale", action: "Changed role", target: "Ahmed Nasser: Viewer → Editor", ip: "10.14.2.88", severity: "warning", icon: UserCog },
  { time: "2026-07-23 20:44:55", actor: "System", action: "MFA enforced", target: "Workspace policy updated", ip: "—", severity: "success", icon: ShieldCheck },
  { time: "2026-07-23 20:02:11", actor: "Marcus Lindqvist", action: "Deleted draft", target: "Marketing_Launch_Q4 · draft_v1", ip: "10.14.9.71", severity: "danger", icon: Trash2 },
  { time: "2026-07-23 19:22:38", actor: "Dina Karlsson", action: "Signed in", target: "Session started (SSO — Okta)", ip: "10.14.4.03", severity: "info", icon: LogIn },
  { time: "2026-07-23 18:47:19", actor: "Elena Vasquez", action: "Generated document", target: "CSR_ONCO_003_draft.docx via Claude 3.5", ip: "10.14.5.22", severity: "info", icon: Sparkles },
  { time: "2026-07-23 17:33:02", actor: "Shubham Yeljale", action: "Invited member", target: "kenji.w@company.com as Editor", ip: "10.14.2.88", severity: "info", icon: UserCog },
  { time: "2026-07-23 16:15:44", actor: "Priya Sharma", action: "Approved draft", target: "cmc_888 · CMC_3.2.P.docx", ip: "10.14.6.19", severity: "success", icon: CheckCircle2 },
  { time: "2026-07-23 15:02:29", actor: "System", action: "Retention policy applied", target: "12 drafts archived (>90d)", ip: "—", severity: "warning", icon: ShieldCheck },
];

const sevTone: Record<Sev, string> = {
  info: "bg-blue-500/10 text-blue-500",
  success: "bg-emerald-500/10 text-emerald-500",
  warning: "bg-amber-500/10 text-amber-500",
  danger: "bg-red-500/10 text-red-500",
};

function AuditLogPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable, compliance-grade trail of every workspace action. Retained 7 years.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" /> Filter</Button>
          <Button size="sm" className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Events today", value: "412" },
          { label: "Approvals", value: "38" },
          { label: "Deletions", value: "4" },
          { label: "Sign-ins", value: "27" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search actor, action, target…" className="pl-9" />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">Showing {ENTRIES.length} of 412 events</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium whitespace-nowrap">Timestamp (UTC)</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ENTRIES.map((e, i) => (
                <motion.tr
                  key={i}
                  className="hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.reveal, ease: EASE.out, delay: staggerDelay(i, 0.025) }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    <span className="relative flex items-center gap-2">
                      <span
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sevDot[e.severity])}
                        aria-hidden
                      />
                      {e.time}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{e.actor}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium", sevTone[e.severity])}>
                      <e.icon className="h-3 w-3" /> {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.target}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{e.ip}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Page 1 of 34</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
