import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — The Advocate" }] }),
  component: SettingsScreen,
});

function SettingsScreen() {
  return (
    <Shell>
      <h1 className="text-2xl font-normal tracking-tight">Settings</h1>
    </Shell>
  );
}
