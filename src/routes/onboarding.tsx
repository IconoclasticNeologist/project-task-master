import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — The Advocate" }] }),
  component: OnboardingScreen,
});

function OnboardingScreen() {
  return (
    <Shell>
      <h1 className="text-2xl font-normal tracking-tight">Onboarding</h1>
    </Shell>
  );
}
