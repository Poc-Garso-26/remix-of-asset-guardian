-- Tabela de auditoria de alterações de role
CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  previous_role public.app_role,
  new_role public.app_role NOT NULL,
  changed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role audit log"
  ON public.role_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_role_audit_log_target ON public.role_audit_log(target_user_id, created_at DESC);

-- Função para contar admins ativos
CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = 'admin'
    AND COALESCE(p.active, true) = true;
$$;