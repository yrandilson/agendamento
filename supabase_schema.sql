-- ============================================
-- COLE ESSE SQL NO SUPABASE SQL EDITOR
-- ============================================

-- Tabela de serviços oferecidos
CREATE TABLE servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  duracao_min INTEGER NOT NULL DEFAULT 60,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT NOT NULL,
  servico_id UUID REFERENCES servicos(id),
  servico_nome TEXT NOT NULL,
  data DATE NOT NULL,
  horario TEXT NOT NULL,
  status TEXT DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'cancelado', 'concluido')),
  created_at TIMESTAMP DEFAULT now()
);

-- Índice para buscar agendamentos por data
CREATE INDEX idx_agendamentos_data ON agendamentos(data);

-- ============================================
-- DADOS DE EXEMPLO (ajuste pro seu negócio)
-- ============================================

INSERT INTO servicos (nome, duracao_min, preco) VALUES
  ('Corte de Cabelo', 30, 35.00),
  ('Barba', 20, 25.00),
  ('Corte + Barba', 50, 55.00),
  ('Hidratação', 40, 45.00);

-- ============================================
-- PERMISSÕES (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode VER serviços
CREATE POLICY "servicos_publico" ON servicos FOR SELECT USING (true);

-- Qualquer um pode INSERIR agendamentos (clientes agendando)
CREATE POLICY "agendamentos_insert" ON agendamentos FOR INSERT WITH CHECK (true);

-- Qualquer um pode LER agendamentos (para checar horários ocupados)
CREATE POLICY "agendamentos_select" ON agendamentos FOR SELECT USING (true);

-- Qualquer um pode ATUALIZAR (para cancelar via admin)
CREATE POLICY "agendamentos_update" ON agendamentos FOR UPDATE USING (true);
