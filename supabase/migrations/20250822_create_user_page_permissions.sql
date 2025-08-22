-- Create enum for permission levels
DO $$ BEGIN
  CREATE TYPE public.permission_level AS ENUM ('none', 'view', 'edit');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table to store per-page permissions per user within a company
CREATE TABLE IF NOT EXISTS public.user_page_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_info(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  permission public.permission_level NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_page_permissions_unique UNIQUE (company_id, user_id, page_key)
);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_page_permissions_updated_at ON public.user_page_permissions;
CREATE TRIGGER trg_user_page_permissions_updated_at
BEFORE UPDATE ON public.user_page_permissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_user_page_permissions_company_user
  ON public.user_page_permissions (company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_page_permissions_page_key
  ON public.user_page_permissions (page_key);

-- Enable RLS
ALTER TABLE public.user_page_permissions ENABLE ROW LEVEL SECURITY;

-- Helper: check if auth user is admin of a company via user_companies or profiles
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies uc
    WHERE uc.company_id = p_company_id
      AND uc.user_id = auth.uid()
      AND (uc.role IN ('administrador','admin'))
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (p.role = 'admin' OR p.user_type = 'admin')
  );
$$;

-- Policies
-- 1) Admins of the company can manage (select/insert/update/delete) permissions for that company
DROP POLICY IF EXISTS "admins_manage_permissions" ON public.user_page_permissions;
CREATE POLICY "admins_manage_permissions" ON public.user_page_permissions
  FOR ALL
  USING (public.is_company_admin(company_id))
  WITH CHECK (public.is_company_admin(company_id));

-- 2) Users can read their own permissions for companies they belong to
DROP POLICY IF EXISTS "users_read_own_permissions" ON public.user_page_permissions;
CREATE POLICY "users_read_own_permissions" ON public.user_page_permissions
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = user_page_permissions.company_id
        AND uc.user_id = auth.uid()
        AND uc.is_active = true
    )
  );

