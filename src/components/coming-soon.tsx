import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-brand flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-gradient">{title}</h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider rounded-full border border-border bg-background px-3 py-1">
          Coming in the next phase
        </div>
      </div>
    </div>
  );
}

export const chatRoute = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — DocuMind AI" }, { name: "description", content: "Conversational AI for documents." }] }),
  component: () => <ComingSoon title="Chat with DocuMind AI" description="ChatGPT-style conversational interface for generating and refining documents. Coming in Phase 3 with real AI." />,
});
