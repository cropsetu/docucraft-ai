import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — DocuMind AI" }, { name: "description", content: "Chat with AI about your documents." }] }),
  component: () => (
    <ComingSoon
      title="Chat with DocuMind AI"
      description="ChatGPT-style conversational interface for generating and refining documents. Coming in Phase 3 with real AI."
    />
  ),
});
