import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/team")({
  head: () => ({ meta: [{ title: "Team — DocuMind AI" }, { name: "description", content: "Team and permission management." }] }),
  component: () => <ComingSoon title="Team Management" description="Invite members, assign roles, and configure permissions across your organization." />,
});
