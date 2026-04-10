# 🔐 Como Criar Admin Simulado (Passo a Passo)

## Passo 1: Descobrir seu User ID no Supabase

1. Acesse [console.supabase.com](https://console.supabase.com)
2. Selecione seu projeto → **Authentication** → **Users**
3. Você verá uma lista de usuários. Anote o **ID** (GUID longo) do seu usuário

**Exemplo de ID:**
```
123e4567-e89b-12d3-a456-426614174000
```

---

## Passo 2: Rodar o Script SQL

1. No Supabase, vá para **SQL Editor** (lado esquerdo)
2. Clique em **"New Query"**
3. **Cole o código abaixo** (substitua `seu-user-id-aqui` pelo ID do Passo 1):

```sql
INSERT INTO admins (user_id, email, ativo, created_at, updated_at)
VALUES (
  'seu-user-id-aqui',
  'admin@simulado.com',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  ativo = true,
  updated_at = NOW();

-- Criar serviços
INSERT INTO servicos (nome, descricao, valor_minimo, duracao_minutos)
VALUES
  ('Corte de Cabelo', 'Corte profissional', 50.00, 30),
  ('Barba', 'Ajuste de barba', 30.00, 20),
  ('Pedicure', 'Cuidado com os pés', 40.00, 50)
ON CONFLICT DO NOTHING;

-- Verificar tudo
SELECT 'Admin criado!' as status;
SELECT * FROM admins;
SELECT * FROM servicos;
```

4. Clique em **"Run"** (ou Ctrl+Enter)
5. Veja o resultado ✅

---

## Passo 3: Fazer Login

1. Acesse seu app: `http://localhost:5173/admin`
2. Digite:
   - **Email**: seu email Supabase (mesmo que usou para criar conta)
   - **Senha**: a senha que definiu no Supabase
3. Clique em **"Entrar"** ✅

---

## ⚠️ Problema Comum

**Erro: "Usuario sem permissao de administrador"**

→ Significa que o INSERT no SQL falhou. Verifique:
1. Copiou o `user_id` correto? (sem espaços)
2. O SQL rodou sem erros?
3. Existe um `admins` verificado via `SELECT * FROM admins;`?

---

## Alternativa Rápida (Sem Descobrir User ID)

Se você conhece o email Supabase:

```sql
INSERT INTO admins (user_id, email, ativo, created_at, updated_at)
SELECT 
  id,
  email,
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'seu_email@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  ativo = true,
  updated_at = NOW();
```

---

## Dados de Teste Prontos

Execute isto também para ter dados para testar o painel:

```sql
-- Serviços
INSERT INTO servicos (nome, descricao, valor_minimo, duracao_minutos)
VALUES
  ('Corte de Cabelo', 'Corte profissional', 50.00, 30),
  ('Barba', 'Ajuste de barba', 30.00, 20),
  ('Coloração', 'Tintura de cabelo', 100.00, 60),
  ('Pedicure', 'Cuidado com os pés', 40.00, 50)
ON CONFLICT DO NOTHING;

-- Agendamentos de teste (próximos)
INSERT INTO agendamentos (cliente_id, cliente_user_id, servico_id, servico_nome, data, horario, status)
VALUES
  (NULL, 'test-1', 1, 'Corte de Cabelo', DATE(CURRENT_DATE + 3), '10:00', 'confirmado'),
  (NULL, 'test-2', 2, 'Barba', DATE(CURRENT_DATE + 5), '14:00', 'confirmado'),
  (NULL, 'test-3', 4, 'Pedicure', DATE(CURRENT_DATE + 7), '09:00', 'pendente')
ON CONFLICT DO NOTHING;
```

---

## ✅ Verification

Após rodar tudo, execute:

```sql
SELECT * FROM admins;
SELECT * FROM servicos;
SELECT * FROM agendamentos;
```

Você deve ver dados nas 3 tabelas! 🎉
