import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Resources — The Advocate" }] }),
  component: ResourcesScreen,
});

function ResourcesScreen() {
  return (
    <Shell>
      <h1 className="text-2xl font-normal tracking-tight">Resources</h1>
    </Shell>
  );
}
