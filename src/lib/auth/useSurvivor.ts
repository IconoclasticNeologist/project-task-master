import { useQuery } from "@tanstack/react-query";
import { getSurvivor, type Survivor } from "./session";

export function useSurvivor() {
  return useQuery<Survivor | null>({
    queryKey: ["survivor"],
    queryFn: getSurvivor,
    staleTime: 5 * 60 * 1000,
  });
}
