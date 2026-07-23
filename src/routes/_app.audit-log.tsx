import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log — DocuMind AI" }, { name: "description", content: "Compliance-grade audit trail." }] }),
  component: () => <ComingSoon title="Audit Log" description="Immutable audit trail for every action — regulatory-ready exports." />,
});
