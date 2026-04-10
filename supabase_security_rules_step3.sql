-- ============================================
-- HARDENING ETAPA 3: RLS ESTRITA (SEM LEGADO)
-- Execute apos:
-- 1) supabase_security_rules.sql
-- 2) supabase_security_rules_step2.sql
-- 3) supabase_security_migration_step2.sql
-- ============================================

-- 1) Conferencia de pendencias antes de endurecer
-- Se houver linhas aqui, resolva antes de rodar o ALTER NOT NULL.
-- SELECT id, data, horario, nome_cliente, telefone_cliente
-- FROM agendamentos
-- WHERE cliente_user_id IS NULL;

-- Tenta preencher os registros restantes com base no telefone do cliente.
WITH clientes_unicos AS (
  SELECT telefone, min(user_id::text)::uuid AS user_id
  FROM clientes
  WHERE telefone IS NOT NULL
  GROUP BY telefone
  HAVING count(*) = 1
)
UPDATE agendamentos a
SET cliente_user_id = cu.user_id
FROM clientes_unicos cu
WHERE a.cliente_user_id IS NULL
  AND a.telefone_cliente = cu.telefone;

-- Se ainda houver nulos, interrompa aqui e trate manualmente antes de seguir.
-- SELECT id, data, horario, nome_cliente, telefone_cliente
-- FROM agendamentos
-- WHERE cliente_user_id IS NULL;

-- 2) Tornar ownership obrigatorio
ALTER TABLE agendamentos
  ALTER COLUMN cliente_user_id SET NOT NULL;

-- 3) Recriar politicas de agendamentos sem excecoes de legado
DROP POLICY IF EXISTS agendamentos_select_owner_or_admin ON agendamentos;
DROP POLICY IF EXISTS agendamentos_update_owner_or_admin ON agendamentos;

CREATE POLICY agendamentos_select_owner_or_admin ON agendamentos
  FOR SELECT
  USING (
    auth.uid() = cliente_user_id
    OR EXISTS (
      SELECT 1
      FROM admins a
      WHERE a.ativo = true
        AND (a.user_id = auth.uid() OR lower(a.email) = lower(auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY agendamentos_update_owner_or_admin ON agendamentos
  FOR UPDATE
  USING (
    auth.uid() = cliente_user_id
    OR EXISTS (
      SELECT 1
      FROM admins a
      WHERE a.ativo = true
        AND (a.user_id = auth.uid() OR lower(a.email) = lower(auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    auth.uid() = cliente_user_id
    OR EXISTS (
      SELECT 1
      FROM admins a
      WHERE a.ativo = true
        AND (a.user_id = auth.uid() OR lower(a.email) = lower(auth.jwt() ->> 'email'))
    )
  );
