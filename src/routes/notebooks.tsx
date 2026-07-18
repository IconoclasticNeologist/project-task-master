import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// The short guides moved onto THE Study guides shelf (one shelf, one name —
// owner call). /notebooks itself now lands on /study; the notebook interiors
// (/notebooks/$slug) still open normally as children of this layout route.
export const Route = createFileRoute("/notebooks")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/notebooks" || location.pathname === "/notebooks/") {
      throw redirect({ to: "/study" });
    }
  },
  component: Outlet,
});
