-- ============================================================
-- SPRINT 1: BASE DE REGRAS E DISPONIBILIDADE
-- ============================================================

-- Tabela de políticas de negócio (cancelamento, buffer)
CREATE TABLE IF NOT EXISTS config_politicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de profissionais
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  servicos_ids UUID[],
  jornada_inicio TIME DEFAULT '08:00',
  jornada_fim TIME DEFAULT '18:00',
  dias_trabalho INT[] DEFAULT ARRAY[1,2,3,4,5],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de bloqueio de horários
CREATE TABLE IF NOT EXISTS bloqueios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  horario_inicio TIME,
  horario_fim TIME,
  tipo TEXT DEFAULT 'bloqueio' CHECK (tipo IN ('bloqueio', 'pausa', 'feriado')),
  motivo TEXT,
  profissional_id UUID REFERENCES profissionais(id),
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(data, horario_inicio, profissional_id)
);

-- Índice para consulta rápida de bloqueios
CREATE INDEX IF NOT EXISTS idx_bloqueios_data ON bloqueios(data);

-- ============================================================
-- POLÍTICAS DEFAULT
-- ============================================================

INSERT INTO config_politicas (chave, valor, descricao) VALUES
  ('antecedencia_cancelamento_horas', '24', 'Horas de antecedência mínima para cancelamento gratuito'),
  ('antecedencia_reagendamento_horas', '2', 'Horas de antecedência mínima para reagendamento'),
  ('buffer_minutos', '15', 'Minutos de intervalo entre atendimentos'),
  ('max_agendamentos_por_dia', '50', 'Limite máximo de agendamentos por dia'),
  ('permitir_cancelamento_apos_confirmacao', 'true', 'Permite cancelar após confirmação')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- POLICIES RLS
-- ============================================================

ALTER TABLE config_politicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueios ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se usuario e admin ativo via session
CREATE OR REPLACE FUNCTION is_admin_session()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a
    WHERE a.user_id = auth.uid() AND a.ativo = true
    LIMIT 1
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper: admin via email configurado
CREATE OR REPLACE FUNCTION is_admin_by_email()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admins a
    WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND a.ativo = true
    LIMIT 1
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profissionais: apenas admins ativos veem e gerenciam
CREATE POLICY "admin_gerencia_profissionais" ON profissionais
  FOR ALL USING (
    is_admin_session() = true OR is_admin_by_email() = true
  );

CREATE POLICY "admin_gerencia_bloqueios" ON bloqueios
  FOR ALL USING (
    is_admin_session() = true OR is_admin_by_email() = true
  );

CREATE POLICY "admin_gerencia_politicas" ON config_politicas
  FOR ALL USING (
    is_admin_session() = true OR is_admin_by_email() = true
  );

-- Leitura minima para o fluxo de booking autenticado.
CREATE POLICY "bloqueios_select_authenticated" ON bloqueios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "politicas_buffer_select_authenticated" ON config_politicas
  FOR SELECT USING (
    auth.role() = 'authenticated' AND chave = 'buffer_minutos'
  );

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Busca política por chave
CREATE OR REPLACE FUNCTION get_politica(p_chave TEXT)
RETURNS TEXT AS $$
  SELECT valor FROM config_politicas WHERE chave = p_chave;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Lista profissionais ativos
CREATE OR REPLACE FUNCTION list_profissionais_ativos()
RETURNS TABLE(id UUID, nome TEXT, telefone TEXT, servicos_ids UUID[]) AS $$
  SELECT id, nome, telefone, servicos_ids FROM profissionais
  WHERE ativo = true ORDER BY nome;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Verifica se horário está bloqueado
CREATE OR REPLACE FUNCTION horario_bloqueado(p_data DATE, p_horario TIME, p_profissional_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM bloqueios
    WHERE data = p_data
      AND (p_profissional_id IS NULL OR profissional_id = p_profissional_id)
      AND (
        (horario_inicio IS NULL AND horario_fim IS NULL)
        OR (p_horario >= horario_inicio AND p_horario <= horario_fim)
      )
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Lista bloqueios do dia
CREATE OR REPLACE FUNCTION list_bloqueios_dia(p_data DATE)
RETURNS TABLE(id UUID, data DATE, horario_inicio TIME, horario_fim TIME, tipo TEXT, motivo TEXT, profissional_nome TEXT) AS $$
  SELECT b.id, b.data, b.horario_inicio, b.horario_fim, b.tipo, b.motivo, COALESCE(p.nome, 'Geral')
  FROM bloqueios b
  LEFT JOIN profissionais p ON p.id = b.profissional_id
  WHERE b.data = p_data
  ORDER BY b.horario_inicio NULLS FIRST;
$$ LANGUAGE SQL SECURITY DEFINER;