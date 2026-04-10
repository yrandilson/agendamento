-- ============================================
-- SCRIPT PARA CRIAR ADMIN SIMULADO NO SUPABASE
-- Execute no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Criar usuário no Auth (simulado com email/senha padrão)
-- Nota: No Supabase, você precisa executar isto via interface ou usar Admin API

-- PASSO 2: Assuming você já tem um user_id do Supabase auth
-- Substitua 'seu-user-id-aqui' pelo ID real do seu usuário no Supabase

-- Para descobrir seu user_id:
-- SELECT id, email FROM auth.users LIMIT 10;

-- ENTÃO execute isto (substitua o user_id):

INSERT INTO admins (user_id, email, ativo, created_at, updated_at)
VALUES (
  'seu-user-id-aqui',  -- ← Substitua pelo seu user_id do Supabase
  'admin@simulado.com',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  ativo = true,
  updated_at = NOW();

-- ============================================
-- OPÇÃO ALTERNATIVA: Criar com email dinâmico
-- ============================================

INSERT INTO admins (user_id, email, ativo, created_at, updated_at)
SELECT 
  id,
  email,
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'seu_email_supabase@gmail.com'  -- ← Seu email real no Supabase
ON CONFLICT (user_id) DO UPDATE SET
  ativo = true,
  updated_at = NOW();

-- ============================================
-- VERIFICAR ADMINS JÁ CRIADOS
-- ============================================

SELECT id, user_id, email, ativo, created_at FROM admins;

-- ============================================
-- SEED DATA: Criar serviços simulados
-- ============================================

INSERT INTO servicos (nome, descricao, valor_minimo, duracao_minutos)
VALUES
  ('Corte de Cabelo', 'Corte profissional', 50.00, 30),
  ('Barba', 'Ajuste de barba', 30.00, 20),
  ('Coloração', 'Tintura de cabelo', 100.00, 60),
  ('Hidratação', 'Tratamento capilar', 80.00, 45),
  ('Pedicure', 'Cuidado com os pés', 40.00, 50)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Criar clientes de teste
-- ============================================

INSERT INTO clientes (user_id, email, nome, telefone, created_at, updated_at)
VALUES
  ('cliente-1-simulado', 'cliente1@test.com', 'João Silva', '(88) 98888-1111', NOW(), NOW()),
  ('cliente-2-simulado', 'cliente2@test.com', 'Maria Santos', '(88) 98888-2222', NOW(), NOW()),
  ('cliente-3-simulado', 'cliente3@test.com', 'Pedro Oliveira', '(88) 98888-3333', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Criar agendamentos simulados (próximos)
-- ============================================

INSERT INTO agendamentos (cliente_id, cliente_user_id, servico_id, servico_nome, data, horario, status, created_at, updated_at)
VALUES
  (1, 'cliente-1-simulado', 1, 'Corte de Cabelo', DATE(CURRENT_DATE + 3), '10:00', 'confirmado', NOW(), NOW()),
  (2, 'cliente-2-simulado', 2, 'Barba', DATE(CURRENT_DATE + 5), '14:00', 'confirmado', NOW(), NOW()),
  (3, 'cliente-3-simulado', 3, 'Coloração', DATE(CURRENT_DATE + 7), '09:00', 'pendente', NOW(), NOW()),
  (1, 'cliente-1-simulado', 4, 'Hidratação', DATE(CURRENT_DATE + 2), '15:30', 'confirmado', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Criar agendamentos simulados (histórico)
-- ============================================

INSERT INTO agendamentos (cliente_id, cliente_user_id, servico_id, servico_nome, data, horario, status, created_at, updated_at)
VALUES
  (1, 'cliente-1-simulado', 1, 'Corte de Cabelo', DATE(CURRENT_DATE - 7), '10:00', 'concluido', NOW(), NOW()),
  (2, 'cliente-2-simulado', 5, 'Pedicure', DATE(CURRENT_DATE - 5), '11:00', 'concluido', NOW(), NOW()),
  (3, 'cliente-3-simulado', 2, 'Barba', DATE(CURRENT_DATE - 2), '16:00', 'cancelado', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAR DADOS CRIADOS
-- ============================================

SELECT '=== ADMINS ===' as info;
SELECT id, user_id, email, ativo FROM admins;

SELECT '=== SERVIÇOS ===' as info;
SELECT id, nome, valor_minimo, duracao_minutos FROM servicos;

SELECT '=== CLIENTES ===' as info;
SELECT id, email, nome, telefone FROM clientes;

SELECT '=== AGENDAMENTOS ===' as info;
SELECT id, cliente_user_id, servico_nome, data, horario, status FROM agendamentos ORDER BY data DESC;
