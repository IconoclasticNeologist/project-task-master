import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listTimeline, upsertTimeline, deleteTimeline } from "./timeline";

export function useTimeline() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["timeline"] });
  const onError = () => toast("We couldn't save that just now.");
  return {
    query: useQuery({ queryKey: ["timeline"], queryFn: listTimeline }),
    upsert: useMutation({ mutationFn: upsertTimeline, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: deleteTimeline, onSuccess: invalidate, onError }),
  };
}
