import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { runAgent, type AgentName, type AgentInput } from "./runAgent";

export function useAgent() {
  return useMutation({
    mutationFn: ({ agent, input }: { agent: AgentName; input: AgentInput }) => runAgent(agent, input),
    onError: () => toast("We couldn't do that just now."),
  });
}
