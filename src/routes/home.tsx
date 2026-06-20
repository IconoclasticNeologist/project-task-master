import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — The Advocate" }] }),
  component: HomeScreen,
});

function HomeScreen() {
  return (
    <Shell>
      <h1 className="text-2xl font-normal tracking-tight">Home</h1>
    </Shell>
  );
}
