
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Ativo';

UPDATE public.profiles
  SET status = CASE WHEN COALESCE(active, true) THEN 'Ativo' ELSE 'Inativo' END
  WHERE status IS NULL OR status NOT IN ('Ativo','Inativo');

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check CHECK (status IN ('Ativo','Inativo'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_profile_active_with_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL THEN
      NEW.status := CASE WHEN COALESCE(NEW.active, true) THEN 'Ativo' ELSE 'Inativo' END;
    END IF;
    NEW.active := (NEW.status = 'Ativo');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.active := (NEW.status = 'Ativo');
    ELSIF NEW.active IS DISTINCT FROM OLD.active THEN
      NEW.status := CASE WHEN COALESCE(NEW.active, true) THEN 'Ativo' ELSE 'Inativo' END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_active_with_status ON public.profiles;
CREATE TRIGGER sync_profile_active_with_status
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_active_with_status();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user boolean;
  default_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, username, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    'Ativo'
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first_user;
  default_role := CASE WHEN is_first_user THEN 'admin'::public.app_role ELSE 'usuario'::public.app_role END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
