
-- 1) profile_self_reactivate: block users from updating their own status/active columns
REVOKE UPDATE (status, active) ON public.profiles FROM authenticated, anon, PUBLIC;
-- service_role retains full privileges via GRANT ALL previously granted; ensure it:
GRANT UPDATE (status, active) ON public.profiles TO service_role;

-- 2) SECURITY DEFINER functions: revoke broad EXECUTE, keep only what's needed
-- Trigger-only functions: no direct execution needed by any client role
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_active_with_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Admin helper: only called from server-side admin context (service_role)
REVOKE EXECUTE ON FUNCTION public.count_active_admins() FROM PUBLIC, anon, authenticated;

-- has_role is required by RLS policies executed as authenticated; keep authenticated,
-- but revoke from anon/PUBLIC so unauthenticated callers can't probe it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
