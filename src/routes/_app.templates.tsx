import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search, Plus, Star, MoreHorizontal, Download, Copy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Templates — DocuMind AI" }, { name: "description", content: "Reusable templates library." }] }),
  component: TemplatesPage,
});

const CATEGORIES = ["All", "HR", "Clinical", "Quality-CMC", "Medical Affairs", "Marketing", "Legal"];

type Template = {
  id: string; name: string; category: string; description: string;
  updated: string; author: string; uses: number; starred: boolean; version: string;
};

const TEMPLATES: Template[] = [
  { id: "t1", name: "Offer Letter — EU Standard", category: "HR", description: "Compliant offer letter for EU-based hires with probation, benefits, and bonus clauses.", updated: "Jul 20, 2026", author: "Shubham Y.", uses: 142, starred: true, version: "v4.2" },
  { id: "t2", name: "Clinical Study Report (CSR)", category: "Clinical", description: "ICH E3-compliant CSR skeleton with efficacy, safety, and PK sections.", updated: "Jul 18, 2026", author: "Elena V.", uses: 87, starred: true, version: "v2.1" },
  { id: "t3", name: "CMC Section 3.2.P", category: "Quality-CMC", description: "Drug product CMC section following ICH M4Q Common Technical Document format.", updated: "Jul 15, 2026", author: "Priya S.", uses: 63, starred: false, version: "v3.0" },
  { id: "t4", name: "Medical Affairs Poster", category: "Medical Affairs", description: "Congress poster layout with abstract, methods, results, and references blocks.", updated: "Jul 12, 2026", author: "Dina K.", uses: 41, starred: false, version: "v1.5" },
  { id: "t5", name: "Product Launch Brief", category: "Marketing", description: "Cross-functional launch brief covering positioning, channels, KPIs, and timeline.", updated: "Jul 10, 2026", author: "Marcus L.", uses: 55, starred: true, version: "v2.0" },
  { id: "t6", name: "Termination Letter — EU", category: "HR", description: "Compliant termination letter with notice periods per country.", updated: "Jul 08, 2026", author: "Shubham Y.", uses: 28, starred: false, version: "v1.3" },
  { id: "t7", name: "MSA — Vendor Agreement", category: "Legal", description: "Master services agreement template with data processing addendum.", updated: "Jul 05, 2026", author: "Legal Team", uses: 34, starred: false, version: "v5.1" },
  { id: "t8", name: "Investigator Brochure", category: "Clinical", description: "IB template aligned with ICH E6(R2) GCP guidelines.", updated: "Jun 30, 2026", author: "Elena V.", uses: 19, starred: false, version: "v1.2" },
  { id: "t9", name: "Promotional Material Review", category: "Marketing", description: "MLR review-ready promotional piece structure with claims and references.", updated: "Jun 28, 2026", author: "Marcus L.", uses: 22, starred: false, version: "v1.0" },
];

function TemplatesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const list = TEMPLATES.filter(
    (t) => (cat === "All" || t.category === cat) && t.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Reusable templates power every generated document.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New template</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total templates", value: TEMPLATES.length, hint: "across 6 categories" },
          { label: "Most used", value: "Offer Letter", hint: "142 generations" },
          { label: "Updated this month", value: 7, hint: "5 authors contributed" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-semibold mt-1.5">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((t) => (
          <div key={t.id} className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-1">
                <button className={cn("p-1.5 rounded-md hover:bg-muted", t.starred && "text-yellow-500")}>
                  <Star className={cn("h-4 w-4", t.starred && "fill-current")} />
                </button>
                <button className="p-1.5 rounded-md hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
            </div>
            <h3 className="font-semibold mt-4 leading-tight">{t.name}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.description}</p>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
              <Badge variant="outline" className="text-[10px]">{t.version}</Badge>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <span>{t.uses} uses · {t.author}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-md hover:bg-muted" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                <button className="p-1.5 rounded-md hover:bg-muted" title="Download"><Download className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
