-- The example-story reset deletes the survivor's own court-plan items with a
-- direct RLS-scoped call (the deleteStatement pattern). court_plan_items was
-- reachable only through security-definer RPCs, so the client role lacked the
-- table-level DELETE privilege that the existing court_plan_items_client_delete
-- policy is written for. Grant exactly that one privilege; RLS still scopes
-- every delete to the survivor's own workspace.
grant delete on table public.court_plan_items to authenticated;
