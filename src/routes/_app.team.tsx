import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, MoreHorizontal, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/team")({
  head: () => ({ meta: [{ title: "Team — DocuMind AI" }, { name: "description", content: "Team and permission management." }] }),
  component: TeamPage,
});

type Member = { name: string; email: string; role: "Owner" | "Admin" | "Editor" | "Viewer"; function: string; status: "Active" | "Invited" | "Inactive"; lastActive: string; docs: number };

const MEMBERS: Member[] = [
  { name: "Shubham Yeljale", email: "shubham.y@company.com", role: "Owner", function: "Platform", status: "Active", lastActive: "Just now", docs: 284 },
  { name: "Elena Vasquez", email: "elena.v@company.com", role: "Admin", function: "Clinical", status: "Active", lastActive: "12m ago", docs: 176 },
  { name: "Priya Sharma", email: "priya.s@company.com", role: "Admin", function: "Quality-CMC", status: "Active", lastActive: "1h ago", docs: 142 },
  { name: "Marcus Lindqvist", email: "marcus.l@company.com", role: "Editor", function: "Marketing", status: "Active", lastActive: "3h ago", docs: 98 },
  { name: "Dina Karlsson", email: "dina.k@company.com", role: "Editor", function: "Medical Affairs", status: "Active", lastActive: "Yesterday", docs: 76 },
  { name: "Ahmed Nasser", email: "ahmed.n@company.com", role: "Editor", function: "Human Resources", status: "Active", lastActive: "2d ago", docs: 54 },
  { name: "Sofia Rossi", email: "sofia.r@company.com", role: "Viewer", function: "Legal", status: "Active", lastActive: "3d ago", docs: 12 },
  { name: "Kenji Watanabe", email: "kenji.w@company.com", role: "Editor", function: "Clinical", status: "Invited", lastActive: "—", docs: 0 },
  { name: "Amara Okafor", email: "amara.o@company.com", role: "Viewer", function: "Human Resources", status: "Invited", lastActive: "—", docs: 0 },
  { name: "Lars Bergman", email: "lars.b@company.com", role: "Editor", function: "Quality-CMC", status: "Inactive", lastActive: "3w ago", docs: 32 },
];

const ROLES = [
  { role: "Owner", desc: "Full workspace control, billing, and destructive actions.", count: 1 },
  { role: "Admin", desc: "Manage members, templates, and settings within their function.", count: 2 },
  { role: "Editor", desc: "Create and edit projects, drafts, and templates.", count: 5 },
  { role: "Viewer", desc: "Read-only access to approved documents.", count: 2 },
];

const roleTone: Record<Member["role"], string> = {
  Owner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Editor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Viewer: "bg-muted text-muted-foreground border-border",
};

const statusTone: Record<Member["status"], string> = {
  Active: "bg-emerald-500/10 text-emerald-500",
  Invited: "bg-amber-500/10 text-amber-500",
  Inactive: "bg-muted text-muted-foreground",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function TeamPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">10 members across 6 functions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Mail className="h-4 w-4" /> Bulk invite</Button>
          <Button size="sm" className="gap-2"><UserPlus className="h-4 w-4" /> Invite member</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map((r) => (
          <div key={r.role} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{r.role}</span>
            </div>
            <div className="text-2xl font-semibold mt-2 tabular-nums">{r.count}</div>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Input placeholder="Search members by name, email, function…" className="max-w-sm" />
          <div className="ml-auto text-xs text-muted-foreground">{MEMBERS.length} members</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Role</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Function</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Docs</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Last active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MEMBERS.map((m) => (
                <tr key={m.email} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-purple-500 text-white">
                          {initials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${roleTone[m.role]}`}>{m.role}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge variant="secondary">{m.function}</Badge></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md ${statusTone[m.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{m.docs}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{m.lastActive}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 rounded-md hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
