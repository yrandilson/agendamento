-- ============================================
-- HARDENING ETAPA 2: OWNERSHIP REAL DE CLIENTE
-- Execute apos o arquivo supabase_security_rules.sql
-- ============================================

-- 1) Tabela de clientes vinculada ao auth user
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  email TEXT,
  nome TEXT,
  telefone TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'clientes_select_own'
  ) THEN
    CREATE POLICY clientes_select_own ON clientes
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'clientes_insert_own'
  ) THEN
    CREATE POLICY clientes_insert_own ON clientes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'clientes_update_own'
  ) THEN
    CREATE POLICY clientes_update_own ON clientes
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 2) Vincular agendamento ao cliente autenticado
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS cliente_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_user_id ON agendamentos(cliente_user_id);

-- 3) Limpar políticas permissivas antigas e aplicar políticas seguras
DROP POLICY IF EXISTS agendamentos_insert ON agendamentos;
DROP POLICY IF EXISTS agendamentos_select ON agendamentos;
DROP POLICY IF EXISTS agendamentos_update ON agendamentos;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agendamentos' AND policyname = 'agendamentos_insert_own'
  ) THEN
    CREATE POLICY agendamentos_insert_own ON agendamentos
      FOR INSERT
      WITH CHECK (auth.uid() = cliente_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agendamentos' AND policyname = 'agendamentos_select_owner_or_admin'
  ) THEN
    CREATE POLICY agendamentos_select_owner_or_admin ON agendamentos
      FOR SELECT
      USING (
        auth.uid() = cliente_user_id
        OR (
          cliente_user_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM clientes c
            WHERE c.user_id = auth.uid()
              AND c.telefone = agendamentos.telefone_cliente
          )
        )
        OR EXISTS (
          SELECT 1
          FROM admins a
          WHERE a.ativo = true
            AND (a.user_id = auth.uid() OR lower(a.email) = lower(auth.jwt() ->> 'email'))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agendamentos' AND policyname = 'agendamentos_update_owner_or_admin'
  ) THEN
    CREATE POLICY agendamentos_update_owner_or_admin ON agendamentos
      FOR UPDATE
      USING (
        auth.uid() = cliente_user_id
        OR (
          cliente_user_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM clientes c
            WHERE c.user_id = auth.uid()
              AND c.telefone = agendamentos.telefone_cliente
          )
        )
        OR EXISTS (
          SELECT 1
          FROM admins a
          WHERE a.ativo = true
            AND (a.user_id = auth.uid() OR lower(a.email) = lower(auth.jwt() ->> 'email'))
        )
      )
      WITH CHECK (
        auth.uid() = cliente_user_id
        OR (
          cliente_user_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM clientes c
            WHERE c.user_id = auth.uid()
              AND c.telefone = agendamentos.telefone_cliente
          )
        )
        OR EXISTS (
          SELECT 1
          FROM admins a
          WHERE a.ativo = true
            AND (a.user_id = auth.uid() OR lower(a.email) = lower(auth.jwt() ->> 'email'))
        )
      );
  END IF;
END$$;
