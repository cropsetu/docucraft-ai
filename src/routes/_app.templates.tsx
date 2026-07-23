import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Templates — DocuMind AI" }, { name: "description", content: "Reusable templates library." }] }),
  component: () => <ComingSoon title="Template Library" description="Browse and reuse organization-wide templates across all projects." />,
});
