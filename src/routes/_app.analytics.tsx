import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — DocuMind AI" }, { name: "description", content: "Usage analytics and KPIs." }] }),
  component: () => <ComingSoon title="Analytics Dashboard" description="Time saved, documents generated, AI accuracy, and team performance." />,
});
