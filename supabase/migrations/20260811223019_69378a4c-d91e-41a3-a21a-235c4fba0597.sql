CREATE OR REPLACE FUNCTION public.guard_profile_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS NOT DISTINCT FROM OLD.status)
     AND (NEW.active IS NOT DISTINCT FROM OLD.active) THEN
    RETURN NEW;
  END IF;

  IF current_user IN ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin') THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Somente administradores podem alterar a situação de um usuário.'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_profile_status_change() FROM anon;
REVOKE ALL ON FUNCTION public.guard_profile_status_change() FROM authenticated;