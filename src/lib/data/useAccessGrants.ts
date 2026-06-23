import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listMyClientAccessGrants,
  respondToClientAccessGrant,
  type ClientAccessGrant,
} from "./access";

export function useAccessGrants() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["client-access-grants"] });
  const onError = () => toast("We couldn't change access just now. Nothing has changed.");

  return {
    query: useQuery<ClientAccessGrant[]>({
      queryKey: ["client-access-grants"],
      queryFn: listMyClientAccessGrants,
    }),
    respond: useMutation({
      mutationFn: ({ id, decision }: { id: string; decision: "accept" | "decline" | "revoke" }) =>
        respondToClientAccessGrant(id, decision),
      onSuccess: invalidate,
      onError,
    }),
  };
}
