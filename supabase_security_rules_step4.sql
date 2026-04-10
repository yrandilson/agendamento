-- ============================================
-- HARDENING ETAPA 4: GESTAO DE ADMINS VIA RLS
-- Execute apos:
-- 1) supabase_security_rules.sql
-- 2) supabase_security_rules_step2.sql
-- 3) supabase_security_migration_step2.sql
-- 4) supabase_security_rules_step3.sql
-- ============================================

-- 1) Campo de atualizacao para governanca
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- 2) Funcao helper para checar se ator atual e admin ativo
-- SECURITY DEFINER permite leitura consistente sem bloqueio por RLS na propria tabela.
CREATE OR REPLACE FUNCTION is_admin_actor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admins a
    WHERE a.ativo = true
      AND (
        a.user_id = auth.uid()
        OR lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin_actor() TO authenticated;

-- 3) Recriar policies de admins para permitir gestao pelo proprio grupo admin
DROP POLICY IF EXISTS admins_select_own ON admins;
DROP POLICY IF EXISTS admins_select_admin_or_self ON admins;
DROP POLICY IF EXISTS admins_insert_admin_only ON admins;
DROP POLICY IF EXISTS admins_update_admin_only ON admins;

CREATE POLICY admins_select_admin_or_self ON admins
  FOR SELECT
  USING (
    is_admin_actor()
    OR auth.uid() = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(email)
  );

CREATE POLICY admins_insert_admin_only ON admins
  FOR INSERT
  WITH CHECK (is_admin_actor());

CREATE POLICY admins_update_admin_only ON admins
  FOR UPDATE
  USING (is_admin_actor())
  WITH CHECK (is_admin_actor());
