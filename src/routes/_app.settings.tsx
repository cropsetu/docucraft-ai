import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — DocuMind AI" }, { name: "description", content: "Workspace and account settings." }] }),
  component: () => <ComingSoon title="Settings" description="Profile, organization, billing, integrations, compliance, and appearance settings." />,
});
