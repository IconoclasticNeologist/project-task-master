// Server functions for document metadata + private-bucket upload.
// SCAFFOLD — see statements.functions.ts.

import { createServerFn } from "@tanstack/react-start";

export interface DocumentInput {
  id?: string;
  fileName: string;
  note: string;
  visibility: "private" | "shareable";
}

export const listDocumentsFn = createServerFn({ method: "GET" }).handler(async () => {
  return [] as DocumentInput[];
});

export const createSignedUploadFn = createServerFn({ method: "POST" })
  .inputValidator((d: { fileName: string }) => d)
  .handler(async ({ data }) => {
    // TODO(cloud-on): ctx.supabase.storage.from('documents').createSignedUploadUrl(path)
    return { uploadUrl: null as string | null, path: `pending/${data.fileName}` };
  });

export const insertDocumentFn = createServerFn({ method: "POST" })
  .inputValidator((d: DocumentInput) => d)
  .handler(async ({ data }) => data);
