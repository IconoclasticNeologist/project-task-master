import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listDocuments, uploadDocument, deleteDocument } from "./documents";

export function useDocuments() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["documents"] });
  const onError = () => toast("We couldn't do that just now.");
  return {
    query: useQuery({ queryKey: ["documents"], queryFn: listDocuments }),
    upload: useMutation({ mutationFn: uploadDocument, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: deleteDocument, onSuccess: invalidate, onError }),
  };
}
