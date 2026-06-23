REVOKE EXECUTE ON FUNCTION public.count_active_admins() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_active_admins() FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_active_admins() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_admins() TO service_role;