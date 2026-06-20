import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Welcome — The Advocate" }, { name: "description", content: "The Advocate" }],
  }),
  component: WelcomeScreen,
});

function WelcomeScreen() {
  return (
    <Shell>
      <h1 className="text-2xl font-normal tracking-tight">Welcome</h1>
    </Shell>
  );
}
