CREATE OR REPLACE FUNCTION public.guard_profile_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed boolean;
BEGIN
  changed := (NEW.status IS DISTINCT FROM OLD.status)
          OR (NEW.active IS DISTINCT FROM OLD.active);

  IF NOT changed THEN
    RETURN NEW;
  END IF;

  -- Contextos privilegiados (server functions com cliente admin, migrations, auth admin)
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

DROP TRIGGER IF EXISTS zz_guard_profile_status_change ON public.profiles;
CREATE TRIGGER zz_guard_profile_status_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_status_change();

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.role_audit_log FROM anon;