-- ============================================
-- HARDENING: SEGURANCA E REGRAS DE NEGOCIO
-- Execute no Supabase SQL Editor
-- ============================================

-- 1) Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'admins_select_own'
  ) THEN
    CREATE POLICY admins_select_own ON admins
      FOR SELECT
      USING ((auth.uid() = user_id) OR (lower(auth.jwt() ->> 'email') = lower(email)));
  END IF;
END$$;

-- 2) Bloqueio de conflito de horario (nao permite dois ativos no mesmo slot)
CREATE UNIQUE INDEX IF NOT EXISTS ux_agendamento_slot_ativo
  ON agendamentos(data, horario)
  WHERE status IN ('confirmado', 'concluido');

-- 3) Validacao de formato de horario HH:MM
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'agendamentos_horario_formato'
  ) THEN
    ALTER TABLE agendamentos
      ADD CONSTRAINT agendamentos_horario_formato
      CHECK (horario ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$');
  END IF;
END$$;

-- 4) Auditoria de mudanca de status
CREATE TABLE IF NOT EXISTS agendamentos_auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  alterado_por UUID,
  created_at TIMESTAMP DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_auditar_status_agendamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO agendamentos_auditoria (agendamento_id, status_anterior, status_novo, alterado_por)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditar_status_agendamento ON agendamentos;
CREATE TRIGGER trg_auditar_status_agendamento
AFTER UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_status_agendamento();
