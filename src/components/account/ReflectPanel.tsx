import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholderTag } from "@/components/PlaceholderTag";
import { copy } from "@/lib/copy";
import { useAgent } from "@/lib/agents/useAgent";
import { useStatements } from "@/lib/data/useStatements";

export function ReflectPanel() {
  const agent = useAgent();
  const { query } = useStatements();
  const entries = (query.data ?? []).map((s) => s.text);
  const [out, setOut] = useState("");

  const run = (which: "reframer" | "recognition" | "interviewer") => {
    setOut("");
    if ((which === "reframer" || which === "recognition") && entries.length === 0) {
      setOut(copy.account.reflect.empty);
      return;
    }
    const input =
      which === "reframer"
        ? { entries }
        : which === "recognition"
          ? { narrative: entries.join("\n\n") }
          : { context: "" };
    agent.mutate({ agent: which, input }, { onSuccess: setOut });
  };

  return (
    <Card className="paper-shadow">
      <CardContent className="space-y-3 py-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-normal text-foreground">{copy.account.reflect.title}</h2>
          <PlaceholderTag />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.account.reflect.intro}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={agent.isPending} onClick={() => run("reframer")} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40">
            {copy.account.reflect.reframe}
          </button>
          <button type="button" disabled={agent.isPending} onClick={() => run("recognition")} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40">
            {copy.account.reflect.recognize}
          </button>
          <button type="button" disabled={agent.isPending} onClick={() => run("interviewer")} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40">
            {copy.account.reflect.prompt}
          </button>
        </div>
        {agent.isPending && <p className="text-sm text-muted-foreground">{copy.account.reflect.working}</p>}
        {out && !agent.isPending && (
          <p className="whitespace-pre-wrap rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground">{out}</p>
        )}
      </CardContent>
    </Card>
  );
}
