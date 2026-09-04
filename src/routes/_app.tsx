import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RouteTransition } from "@/components/route-transition";

export const Route = createFileRoute("/_app")({
  component: () => (
    <AppShell>
      <RouteTransition>
        <Outlet />
      </RouteTransition>
    </AppShell>
  ),
});
