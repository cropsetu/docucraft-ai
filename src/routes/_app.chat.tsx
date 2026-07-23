import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles, Paperclip, Plus, MessageSquare, Bot, User as UserIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — DocuMind AI" }, { name: "description", content: "Chat with AI about your documents." }] }),
  component: ChatPage,
});

type Msg = { id: string; role: "user" | "assistant"; text: string; time: string; sources?: string[] };

const CONVERSATIONS = [
  { id: "c1", title: "Draft HR offer letter — EU Q3", updated: "2m ago", active: true },
  { id: "c2", title: "Summarize CMC Section 3.2", updated: "1h ago" },
  { id: "c3", title: "Compare Clinical Study drafts", updated: "Yesterday" },
  { id: "c4", title: "Marketing launch brief tone check", updated: "2d ago" },
  { id: "c5", title: "Extract KPIs from Q2 report", updated: "3d ago" },
  { id: "c6", title: "Translate policy to German", updated: "Last week" },
];

const SEED: Msg[] = [
  {
    id: "m1",
    role: "user",
    text: "Draft an offer letter for a Senior Data Scientist, EU region, base €95k + 10% bonus, start date Aug 12.",
    time: "10:42 AM",
  },
  {
    id: "m2",
    role: "assistant",
    time: "10:42 AM",
    sources: ["HR_Offer_Template_v4.docx", "EU_Comp_Policy_2026.pdf"],
    text:
      "Here's a draft offer letter using your EU HR template. I've filled in compensation, start date, and standard EU probation clauses. Let me know if you'd like to adjust the bonus structure or add relocation terms.",
  },
  {
    id: "m3",
    role: "user",
    text: "Add a 3-month probation period and remove the relocation section.",
    time: "10:44 AM",
  },
  {
    id: "m4",
    role: "assistant",
    time: "10:44 AM",
    text: "Done — probation clause added under §4, relocation section removed. Preview updated in the right panel. Want me to generate a signable PDF?",
  },
];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [input, setInput] = useState("");

  const send = () => {
    const t = input.trim();
    if (!t) return;
    const id = Math.random().toString(36).slice(2);
    setMessages((m) => [
      ...m,
      { id, role: "user", text: t, time: "now" },
      {
        id: id + "r",
        role: "assistant",
        time: "now",
        text: "Got it — I'll process that and update the draft. (Demo response)",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation list */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card/40">
        <div className="p-4 border-b border-border">
          <Button className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {CONVERSATIONS.map((c) => (
            <button
              key={c.id}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                c.active ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.updated}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Draft HR offer letter — EU Q3</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Context: HR Letters · 2 attached documents</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            DocuMind · GPT-4 Turbo
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3 max-w-3xl", m.role === "user" ? "ml-auto flex-row-reverse" : "")}>
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  m.role === "assistant"
                    ? "bg-gradient-to-br from-primary to-purple-500 text-white"
                    : "bg-muted text-foreground",
                )}
              >
                {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
              </div>
              <div className={cn("flex-1 min-w-0", m.role === "user" ? "text-right" : "")}>
                <div
                  className={cn(
                    "inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-card border border-border text-left"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {m.text}
                </div>
                {m.sources && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.sources.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border"
                      >
                        <FileText className="h-3 w-3" /> {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{m.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about a document, draft a letter, summarize sources…"
              className="border-0 focus-visible:ring-0 shadow-none bg-transparent"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={send}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            DocuMind can make mistakes. Verify important information before approving drafts.
          </p>
        </div>
      </div>
    </div>
  );
}
