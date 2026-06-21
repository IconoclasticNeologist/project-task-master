// Server functions for timeline events. SCAFFOLD — see statements.functions.ts.

import { createServerFn } from "@tanstack/react-start";

export interface TimelineInput {
  id?: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
}

export const listTimelineFn = createServerFn({ method: "GET" }).handler(async () => {
  return [] as TimelineInput[];
});

export const upsertTimelineFn = createServerFn({ method: "POST" })
  .inputValidator((d: TimelineInput) => d)
  .handler(async ({ data }) => data);

export const deleteTimelineFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => ({ ok: true, id: data.id }));
