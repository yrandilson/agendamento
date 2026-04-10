-- ============================================
-- HARDENING ETAPA 2B: MIGRACAO E FUNCOES SEGURAS
-- Execute apos supabase_security_rules_step2.sql
-- ============================================

-- 1) Backfill de ownership em agendamentos legados por telefone.
-- Regra: vincula quando telefone bate com perfil unico em clientes.
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

-- 2) Funcao publica segura para listar horarios ocupados do dia.
-- SECURITY DEFINER ignora RLS apenas para este recorte controlado.
CREATE OR REPLACE FUNCTION horarios_ocupados_publico(p_data date)
RETURNS TABLE (horario text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.horario
  FROM agendamentos a
  WHERE a.data = p_data
    AND a.status IN ('confirmado', 'concluido')
  ORDER BY a.horario;
$$;

REVOKE ALL ON FUNCTION horarios_ocupados_publico(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION horarios_ocupados_publico(date) TO anon, authenticated;
