import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — The Advocate" }] }),
  component: AccountScreen,
});

function AccountScreen() {
  return (
    <Shell>
      <h1 className="text-2xl font-normal tracking-tight">Account</h1>
    </Shell>
  );
}
