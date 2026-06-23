import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabase/client";

// Shared chrome for every professional-surface screen: a home link back to the
// workspace root, and a way to sign out. Kept deliberately separate from the
// survivor `Shell` (different identity, and none of the survivor safety
// affordances like "Leave now" belong on a professional account).
export function ProfessionalShell({ children }: { children: ReactNode }) {
  const signOut = async () => {
    await getSupabase().auth.signOut();
    window.location.assign("/professional");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-background px-6 py-10 text-foreground">
      <header className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <Link to="/professional" className="text-sm text-muted-foreground hover:text-foreground">
          ← The Advocate · Professional
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </header>
      {children}
    </main>
  );
}
