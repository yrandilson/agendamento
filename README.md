

# 📅 Sistema de Agendamento Online

Sistema completo para clínicas, barbearias, salões e qualquer negócio que precisa de agendamento.

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
