import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadSurvivorSettings, saveSurvivorSettings, type SurvivorSettings } from "./settings";

export function useSurvivorSettings() {
  const qc = useQueryClient();
  return {
    query: useQuery({ queryKey: ["survivorSettings"], queryFn: loadSurvivorSettings }),
    save: useMutation({
      mutationFn: (s: SurvivorSettings) => saveSurvivorSettings(s),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["survivorSettings"] });
        qc.invalidateQueries({ queryKey: ["survivor"] });
      },
    }),
  };
}
