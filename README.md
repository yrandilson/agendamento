

# 📅 Sistema de Agendamento Online

Sistema completo para clínicas, barbearias, salões e qualquer negócio que precisa de agendamento.

## 📘 Documento de Evolução

Se você quer aprender o projeto por etapas, como se estivesse começando do zero, leia o guia:

- [Fluxo de desenvolvimento do zero](docs/FLUXO_DESENVOLVIMENTO_DO_ZERO.md)

Se você quer simular como trabalhar em equipe no mesmo projeto, leia também:

- [Fluxo de desenvolvimento em equipe](docs/FLUXO_DE_DESENVOLVIMENTO_EM_EQUIPE.md)

Se você quer um passo a passo tecnico (codigo, funcoes, rotas e configuracoes) como se fosse implementar do zero, leia:

- [Sequencia pratica de implementacao](docs/SEQUENCIA_PRATICA_IMPLEMENTACAO.md)

Se voce quer o roadmap das funcionalidades essenciais (prioridades, sprints e arquitetura), leia:

- [Roadmap de funcionalidades essenciais](docs/ROADMAP_FUNCIONALIDADES_ESSENCIAIS.md)

---

## 🗂 Estrutura do Projeto

```
agendamento/
├── api/
│   └── notify.js          ← Serverless function (envia WhatsApp)
├── src/
│   ├── pages/
│   │   ├── Booking.jsx    ← Página pública de agendamento
│   │   ├── Admin.jsx      ← Painel do dono
│   │   └── AdminLogin.jsx ← Login do admin
│   ├── lib/
│   │   └── supabase.js    ← Conexão com banco de dados
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase_schema.sql    ← SQL para criar o banco
├── vercel.json
├── .env.example
└── package.json
```

---

## 🚀 PASSO A PASSO COMPLETO

---

### PASSO 1 — Criar conta no Supabase (banco de dados)

1. Acesse **https://supabase.com** e crie uma conta grátis
2. Clique em **"New Project"**
3. Dê um nome (ex: `agendamento-barbearia`) e escolha a senha do banco
4. Aguarde criar (1-2 minutos)
5. No menu lateral, clique em **"SQL Editor"**
6. Cole TODO o conteúdo do arquivo `supabase_schema.sql` e clique em **"Run"**
7. Vá em **Settings → API** e copie:
   - `Project URL` (ex: https://xxxx.supabase.co)
   - `anon public key`

---

### PASSO 2 — Criar conta na Z-API (WhatsApp)

1. Acesse **https://z-api.io** e crie uma conta
2. Crie uma instância gratuita
3. Escaneie o QR Code com seu WhatsApp
4. Copie o **Instance ID** e o **Token**
5. Anote seu número de WhatsApp com DDD (ex: 88999999999)

> ⚠️ Se não quiser WhatsApp agora, pode pular o passo 2. O sistema funciona sem ele, só não vai enviar notificações.

---

### PASSO 3 — Fazer deploy no Vercel

1. Acesse **https://github.com** e crie uma conta
2. Crie um repositório novo (ex: `agendamento`)
3. Suba os arquivos do projeto para o repositório
   - Instale o Git se não tiver: https://git-scm.com
   - No terminal dentro da pasta do projeto:
     ```bash
     git init
     git add .
     git commit -m "primeiro commit"
     git branch -M main
     git remote add origin https://github.com/SEU_USUARIO/agendamento.git
     git push -u origin main
     ```

4. Acesse **https://vercel.com** e crie uma conta (pode entrar com GitHub)
5. Clique em **"New Project"**
6. Selecione o repositório `agendamento`
7. Clique em **"Environment Variables"** e adicione:

   | Nome | Valor |
   |------|-------|
   | VITE_SUPABASE_URL | https://xxxx.supabase.co |
   | VITE_SUPABASE_ANON_KEY | sua_anon_key |
   | VITE_ADMIN_PASSWORD | uma senha sua |
   | ZAPI_INSTANCE_ID | seu_instance_id |
   | ZAPI_TOKEN | seu_token |
   | ZAPI_PHONE | 5588999999999 |

8. Clique em **"Deploy"**
9. Aguarde 1-2 minutos
10. Seu site estará no ar em algo como: `https://agendamento-xxx.vercel.app`

---

### PASSO 4 — Testar localmente (opcional, antes do deploy)

Se quiser testar no seu computador antes:

```bash
# 1. Instalar Node.js em https://nodejs.org (versão LTS)

# 2. Na pasta do projeto, instalar dependências
npm install

# 3. Criar arquivo .env (copiar do exemplo)
cp .env.example .env
# Abrir .env e preencher as variáveis

# 4. Rodar o projeto
npm run dev

# 5. Abrir no navegador
# http://localhost:5173       ← página de agendamento
# http://localhost:5173/admin ← painel admin
```

---

## 📱 Páginas do Sistema

| URL | O que é |
|-----|---------|
| `/` | Página de agendamento para clientes |
| `/admin` | Login do painel administrativo |
| `/admin/painel` | Ver e gerenciar agendamentos |

---

## 🧾 Registro de Funcionalidades Implementadas

> Atualize esta seção a cada nova funcionalidade entregue, com commit e data.

### 2026-04-09

- **Dashboard do cliente com menu lateral, contatos, chat e calendario**
   - Commit: `pendente`
   - Alterações:
      - Área do cliente evoluída para layout de dashboard com menu lateral
      - Seções: Visão Geral, Calendário de Agendamento, Contatos, Chat e Configurações
      - Menu circular no topo com dropdown para atalhos rápidos da conta
      - Fluxo de calendário envia data/horário para a tela de agendamento
   - Arquivos:
      - `src/pages/ClientAccount.jsx`
      - `src/pages/Booking.jsx`

- **Paginação da Agenda no painel admin**
   - Commit: `pendente`
   - Alterações:
      - Lista da agenda agora exibe páginas com limite de itens por tela
      - Controles `Anterior` e `Proxima` para navegação
      - Reset automático da paginação ao trocar filtros
      - Contador com página atual, total de páginas e total de itens filtrados
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Agenda admin com filtro por status e CSV aderente aos filtros**
   - Commit: `pendente`
   - Alterações:
      - Novo filtro por status (todos, confirmado, concluido, cancelado)
      - Lista da agenda passa a combinar filtros de serviço, busca e status
      - Contadores da agenda refletem os itens filtrados
      - Exportação CSV passa a usar o mesmo conjunto filtrado exibido na tela
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Gestão de administradores no painel (Equipe)**
   - Commit: `pendente`
   - Alterações:
      - Nova seção `Equipe` no painel admin
      - Lista de admins com status ativo/inativo
      - Cadastro de novo admin por e-mail
      - Ação para ativar/desativar admin sem sair do painel
   - Arquivos:
      - `src/pages/Admin.jsx`
      - `supabase_security_rules_step4.sql`

- **Hardening etapa 4 para governança de admins**
   - Commit: `pendente`
   - Alterações:
      - Função SQL `is_admin_actor()` para validação de admin ativo
      - Policies de `SELECT/INSERT/UPDATE` na tabela `admins`
      - Campo `updated_at` para trilha de atualização
   - Arquivo:
      - `supabase_security_rules_step4.sql`

- **Agenda admin com busca inteligente e atalho WhatsApp**
   - Commit: `pendente`
   - Alterações:
      - Campo de busca na seção Agenda para filtrar por nome, telefone e serviço
      - Lista da agenda passa a respeitar o filtro de busca em tempo real
      - Atalho `WhatsApp rapido` em cada card de agendamento
      - Normalização automática do telefone para abrir link `wa.me`
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Documentação sincronizada da nova entrega**
   - Commit: `pendente`
   - Alterações:
      - Correção do link do guia de trabalho em equipe
      - Atualização dos guias técnicos com o novo fluxo da agenda
   - Arquivos:
      - `README.md`
      - `docs/SEQUENCIA_PRATICA_IMPLEMENTACAO.md`
      - `docs/FLUXO_DESENVOLVIMENTO_DO_ZERO.md`
      - `docs/FLUXO_DE_DESENVOLVIMENTO_EM_EQUIPE.md`

- **Concluir atendimento no painel admin**
   - Commit: `4d703de`
   - Alterações:
      - Botão para marcar agendamento como `concluido`
      - Contadores de status (confirmado, concluido, cancelado)
      - Horários ocupados no público passam a considerar tudo que não está `cancelado`
   - Arquivos:
      - `src/pages/Admin.jsx`
      - `src/pages/Booking.jsx`

- **Dashboard diário no painel admin**
   - Commit: `c08a534`
   - Alterações:
      - Cards com KPIs do dia (total, confirmados, concluidos, comparecimento)
      - Ranking de serviços mais agendados no dia
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Atalho para painel admin na página pública**
   - Commit: `404cd7b`
   - Alterações:
      - Link visível "Entrar no Painel Admin" na tela inicial de agendamento
      - Melhora a navegação para chegar ao dashboard
   - Arquivo:
      - `src/pages/Booking.jsx`

- **Login e cadastro de cliente (usuário)**
   - Commit: `ac3d072`
   - Alterações:
      - Nova página de autenticação de cliente com e-mail e senha (`/cliente`)
      - Estado de login exibido na home de agendamento
      - Bloqueio de confirmação de agendamento para cliente não autenticado
   - Arquivos:
      - `src/pages/ClientAuth.jsx`
      - `src/pages/Booking.jsx`
      - `src/App.jsx`

- **Melhorias no dashboard — abas e botão recarregar**
   - Commit: `7f08819`
   - Alterações:
      - Abas de visualização: Hoje, Próximos (confirmados), Todos
      - Botão 🔄 Recarregar para atualizar dados manualmente
      - Exibição de data quando visualizando múltiplos dias
      - Melhora navegação entre agendamentos de diferentes datas
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Dashboard moderno com menu lateral e graficos**
   - Commit: `e900ec1`
   - Alterações:
      - Novo layout premium com menu lateral no desktop
      - Header visual com destaque de desempenho e botão de recarregar
      - Grafico de agendamentos dos ultimos 14 dias
      - Painel de horarios de pico com barras de intensidade
      - KPIs de faturamento estimado e ticket medio
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Landing moderna + agendamento visivel apenas com login**
   - Commit: `b553e16`
   - Alterações:
      - Nova página inicial moderna em `/` com CTAs de entrada
      - Formulario de agendamento bloqueado para usuarios nao autenticados
      - Rota de agendamento movida para `/agendar`
      - Visual moderno na tela de login do cliente e na tela de agendamento
   - Arquivos:
      - `src/pages/Home.jsx`
      - `src/App.jsx`
      - `src/pages/ClientAuth.jsx`
      - `src/pages/Booking.jsx`

- **Menu lateral funcional no painel admin (Agenda e Analises)**
   - Commit: `3cb4ee1`
   - Alterações:
      - Botões laterais agora mudam de seção de verdade
      - `Dashboard`: visão executiva com KPIs e gráficos
      - `Agenda`: gestão operacional com filtros e ações de concluir/cancelar
      - `Analises`: leitura dos últimos 30 dias com métricas agregadas
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Minha Conta do cliente (perfil + historico)**
   - Commit: `aa3d3cb`
   - Alterações:
      - Nova página `Minha Conta` com dados do cliente
      - Salvamento de perfil (nome/telefone) para auto-preenchimento
      - Lista de próximos agendamentos e histórico
      - Cancelamento de agendamento confirmado pelo próprio cliente
      - Atalho `Minha conta` dentro da tela de agendamento
   - Arquivos:
      - `src/pages/ClientAccount.jsx`
      - `src/pages/Booking.jsx`
      - `src/App.jsx`

- **Admin moderno com voltar + cliente com reagendamento rapido**
   - Commit: `c53bb3a`
   - Alterações:
      - Painel admin com fundo moderno, navegação mobile e botão de voltar para o site
      - Barra de navegação superior no mobile para evitar painel “solto”
      - Cliente pode reagendar direto de `Minha Conta` e do histórico
      - Booking abre com serviço pré-selecionado ao reagendar
   - Arquivos:
      - `src/pages/Admin.jsx`
      - `src/pages/ClientAccount.jsx`
      - `src/pages/Booking.jsx`

- **UI premium contínua: tema, sidebar recolhível e conta cliente avançada**
   - Commit: `ada3a2d`
   - Alterações:
      - Painel admin com tema claro/escuro
      - Sidebar do admin recolhível no desktop
      - Navegação mobile mais forte com controles no topo
      - Botão flutuante para novo agendamento manual
      - Gráficos com animação suave de barras
      - Minha Conta com cards de resumo e abas (Próximos/Histórico)
      - Botão de voltar para início destacado na conta cliente
   - Arquivos:
      - `src/pages/Admin.jsx`
      - `src/pages/ClientAccount.jsx`

- **Admin premium com exportação CSV e métricas de clientes**
   - Commit: `8573543`
   - Alterações:
      - Botão `Exportar CSV` para baixar agenda atual
      - Métrica de `Clientes unicos` no Dashboard
      - Métrica de `Clientes unicos 30d` na seção Análises
      - Melhorias visuais no menu lateral com marcadores
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Admin analítico: filtro por serviço e comparativo mensal**
   - Commit: `1c2326c`
   - Alterações:
      - Filtro por serviço na seção Agenda
      - Lista e métricas da Agenda respeitam o filtro selecionado
      - Comparativo mês atual vs mês anterior (volume e faturamento)
      - Exibição de variação percentual de crescimento/queda
   - Arquivo:
      - `src/pages/Admin.jsx`

- **Hardening etapa 1: auth admin e regra anti-conflito**
   - Commit: `53366d2`
   - Alterações:
      - Login admin por Supabase Auth (email + senha)
      - Validação de permissão admin (whitelist por email e/ou tabela `admins`)
      - Verificação de autorização também ao abrir o painel admin
      - Tratamento amigável de erro de conflito de horário no booking
      - Script SQL de segurança com:
        - tabela `admins`
        - índice único de slot ativo (`data + horario`)
        - auditoria de alteração de status
   - Arquivos:
      - `src/lib/adminAuth.js`
      - `src/pages/AdminLogin.jsx`
      - `src/pages/Admin.jsx`
      - `src/pages/Booking.jsx`
      - `supabase_security_rules.sql`

- **Hardening etapa 2: ownership real e perfil no banco**
   - Commit: `12529ae`
   - Alterações:
      - `agendamentos` agora gravam `cliente_user_id = auth.uid()`
      - Nova tabela `clientes` para perfil persistente no Supabase
      - `Minha Conta` e `Booking` passam a usar perfil no banco (com fallback)
      - Histórico do cliente prioriza busca por `cliente_user_id`
      - Novo script SQL com políticas RLS por dono/admin
   - Arquivos:
      - `src/pages/Booking.jsx`
      - `src/pages/ClientAccount.jsx`
      - `supabase_security_rules_step2.sql`

- **Hardening etapa 2B: migração legado e função pública segura**
   - Commit: `1f0433c`
   - Alterações:
      - Backfill de `cliente_user_id` para agendamentos antigos via telefone
      - Função SQL `horarios_ocupados_publico(date)` com `SECURITY DEFINER`
      - Booking usa RPC para disponibilidade sem quebrar com RLS restrita
      - Políticas da etapa 2 ajustadas para transição de legado
   - Arquivos:
      - `supabase_security_rules_step2.sql`
      - `supabase_security_migration_step2.sql`
      - `src/pages/Booking.jsx`

- **Hardening etapa 3: RLS estrita e auditoria no admin**
   - Commit: `35ed4c4`
   - Alterações:
      - Script SQL de etapa 3 para remover exceções de legado
      - `cliente_user_id` passa a ser obrigatório em `agendamentos`
      - Frontend sem fallback legado de perfil/histórico
      - Nova seção `Auditoria` no painel admin (histórico de alterações)
   - Arquivos:
      - `supabase_security_rules_step3.sql`
      - `src/pages/Booking.jsx`
      - `src/pages/ClientAccount.jsx`
      - `src/pages/Admin.jsx`

> Importante: execute no Supabase, em ordem, os arquivos:
> 1) `supabase_security_rules.sql`
> 2) `supabase_security_rules_step2.sql`
> 3) `supabase_security_migration_step2.sql`
> 4) `supabase_security_rules_step3.sql`
> 5) `supabase_security_rules_step4.sql`

---

## 🛠 Personalizar para seu cliente

### Mudar nome do negócio
Edite o arquivo `src/pages/Booking.jsx`, linha:
```jsx
<h1>📅 Agendamento Online</h1>
```
Troque por:
```jsx
<h1>📅 Barbearia do João</h1>
```

### Mudar horários disponíveis
No mesmo arquivo, linha:
```js
const HORARIOS = ['08:00', '09:00', ...]
```

### Mudar serviços
No Supabase, vá em **Table Editor → servicos** e edite diretamente.

---

## 💰 Quanto cobrar do cliente

| Plano | O que inclui | Sugestão |
|-------|-------------|----------|
| Básico | Sistema + domínio personalizado | R$ 150/mês |
| Pro | Básico + suporte + melhorias | R$ 300/mês |
| Setup | Taxa única de instalação | R$ 200 |

---

## ❓ Problemas comuns

**"Cannot read properties of undefined"**
→ Verifique se preencheu as variáveis de ambiente corretamente no Vercel

**WhatsApp não envia**
→ Verifique se escaneou o QR na Z-API e se o token está correto

**Página em branco**
→ Abra o console do navegador (F12) e veja o erro

---

## 🔗 Links úteis

- Supabase: https://supabase.com
- Vercel: https://vercel.com
- Z-API: https://z-api.io
- Node.js: https://nodejs.org
- Git: https://git-scm.com
