import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listStatements, upsertStatement, deleteStatement } from "./statements";

export function useStatements() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["statements"] });
  const onError = () => toast("We couldn't save that just now.");
  return {
    query: useQuery({ queryKey: ["statements"], queryFn: listStatements }),
    upsert: useMutation({ mutationFn: upsertStatement, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: deleteStatement, onSuccess: invalidate, onError }),
  };
}
