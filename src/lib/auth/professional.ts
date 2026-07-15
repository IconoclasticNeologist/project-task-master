import { getSupabase } from "@/lib/supabase/client";

export type ProfessionalSession =
  | { kind: "signed_out" }
  | { kind: "anonymous" }
  | { kind: "professional"; email: string | null };

export async function getProfessionalSession(): Promise<ProfessionalSession> {
  if (typeof window === "undefined") return { kind: "signed_out" };
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) return { kind: "signed_out" };

  // Live anonymous sessions carry app_metadata: {} — the provider tag is not
  // reliable. is_anonymous is. Misclassifying a survivor as a professional
  // would show them a Sign out that permanently orphans their anonymous space.
  if (data.user.is_anonymous || data.user.app_metadata?.provider === "anonymous") {
    return { kind: "anonymous" };
  }
  return { kind: "professional", email: data.user.email ?? null };
}

export async function requestProfessionalSignIn(email: string): Promise<void> {
  const redirectTo = new URL("/professional", window.location.origin).toString();
  const { error } = await getSupabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
}
