import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, FileText, Zap, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — DocuMind AI" }, { name: "description", content: "Usage analytics and KPIs." }] }),
  component: AnalyticsPage,
});

const KPIS = [
  { label: "Documents generated", value: "2,847", delta: "+18.2%", up: true, icon: FileText, hint: "vs last 30 days" },
  { label: "AI tokens consumed", value: "14.2M", delta: "+9.4%", up: true, icon: Zap, hint: "$284 estimated cost" },
  { label: "Avg. time to draft", value: "42s", delta: "-12.1%", up: false, icon: Clock, hint: "22% faster" },
  { label: "Approval rate", value: "94.7%", delta: "+2.3%", up: true, icon: CheckCircle2, hint: "first-pass approvals" },
];

// 14-day generation trend
const TREND = [22, 34, 28, 41, 55, 48, 62, 71, 58, 76, 89, 94, 82, 108];

const BY_FUNCTION = [
  { name: "Human Resources", value: 842, pct: 30, color: "bg-blue-500" },
  { name: "Clinical", value: 612, pct: 22, color: "bg-purple-500" },
  { name: "Quality-CMC", value: 498, pct: 18, color: "bg-emerald-500" },
  { name: "Marketing", value: 384, pct: 14, color: "bg-amber-500" },
  { name: "Medical Affairs", value: 298, pct: 10, color: "bg-pink-500" },
  { name: "Legal", value: 213, pct: 6, color: "bg-cyan-500" },
];

const TOP_TEMPLATES = [
  { name: "Offer Letter — EU Standard", uses: 142, growth: "+24%" },
  { name: "Clinical Study Report", uses: 87, growth: "+11%" },
  { name: "CMC Section 3.2.P", uses: 63, growth: "+18%" },
  { name: "Product Launch Brief", uses: 55, growth: "+7%" },
  { name: "Medical Affairs Poster", uses: 41, growth: "+3%" },
];

function AnalyticsPage() {
  const max = Math.max(...TREND);
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Workspace usage, throughput, and quality signals.</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y"].map((r, i) => (
            <button
              key={r}
              className={
                "px-3 py-1.5 rounded-md text-xs font-medium border " +
                (i === 1 ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <k.icon className="h-4 w-4" />
              </div>
              <span
                className={
                  "inline-flex items-center gap-1 text-xs font-medium " +
                  (k.up ? "text-emerald-500" : "text-emerald-500")
                }
              >
                {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {k.delta}
              </span>
            </div>
            <div className="text-2xl font-semibold mt-4 tabular-nums">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            <div className="text-[11px] text-muted-foreground/70 mt-0.5">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Documents generated</h2>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">908</div>
              <div className="text-xs text-emerald-500 font-medium">+18.2% vs prior</div>
            </div>
          </div>
          <div className="h-56 mt-6 flex items-end gap-2">
            {TREND.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <motion.div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-purple-500 hover:opacity-80 transition-opacity origin-bottom"
                  style={{ height: `${(v / max) * 100}%` }}
                  initial={{ scaleY: 0, opacity: 0.4 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: DUR.reveal,
                    ease: EASE.out,
                    delay: staggerDelay(i, 0.035),
                  }}
                  title={`${v} docs`}
                />
                <div className="text-[10px] text-muted-foreground">{i + 10}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">By function</h2>
          <p className="text-xs text-muted-foreground">Distribution this month</p>
          <div className="space-y-4 mt-5">
            {BY_FUNCTION.map((f, i) => (
              <div key={f.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{f.name}</span>
                  <span className="text-muted-foreground tabular-nums">{f.value}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full ${f.color} origin-left`}
                    style={{ width: `${f.pct * 3}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: DUR.revealSlow,
                      ease: EASE.out,
                      delay: staggerDelay(i, 0.05),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Top templates</h2>
          <p className="text-xs text-muted-foreground">Ranked by usage this month</p>
        </div>
        <div className="divide-y divide-border">
          {TOP_TEMPLATES.map((t, i) => (
            <div key={t.name} className="p-4 flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.uses} generations</div>
              </div>
              <span className="text-xs font-medium text-emerald-500">{t.growth}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
