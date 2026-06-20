import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/session")({
  head: () => ({ meta: [{ title: "Session — The Advocate" }] }),
  component: SessionScreen,
});

function SessionScreen() {
  return (
    <Shell>
      <h1 className="text-2xl font-normal tracking-tight">Session</h1>
    </Shell>
  );
}
