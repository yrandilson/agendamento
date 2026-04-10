# Fluxo de Desenvolvimento do Zero

Este documento mostra como construir o projeto em etapas, como se ele estivesse sendo criado do zero. A ideia aqui é servir como roteiro de aprendizado e também como guia de evolução do sistema.

## Visão geral

O projeto foi evoluindo em camadas:

1. Base do projeto e infraestrutura
2. Banco de dados e schema inicial
3. Fluxo público de agendamento
4. Painel administrativo
5. Login e área do cliente
6. Experiência visual e navegação
7. Segurança e regras de negócio
8. Migrações e endurecimento final
9. Deploy e manutenção

## Etapa 1 - Comecar do zero

Objetivo: criar a base mínima do sistema.

O que entra aqui:

- Criar o projeto com Vite + React
- Organizar pastas principais
- Configurar Tailwind CSS
- Criar a conexão com Supabase
- Preparar o deploy com Vercel

Arquivos que normalmente aparecem aqui:

- `package.json`
- `vite.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `src/main.jsx`
- `src/App.jsx`
- `src/index.css`
- `src/lib/supabase.js`

Resultado esperado:

- A aplicação abre no navegador
- Existe uma estrutura pronta para crescer
- O banco ainda é simples, mas o projeto já roda

## Etapa 2 - Estrutura do banco

Objetivo: definir onde os dados vão morar.

O que entra aqui:

- Tabela de serviços
- Tabela de agendamentos
- Campos de data, horário, nome, telefone, status e serviço
- Regras básicas de consulta

Arquivo principal:

- `supabase_schema.sql`

Resultado esperado:

- É possível salvar agendamentos no banco
- O sistema já tem uma base funcional para consulta e listagem

## Etapa 3 - Agendamento público

Objetivo: permitir que o cliente faça uma reserva.

O que entra aqui:

- Tela pública de agendamento
- Seleção de serviço
- Escolha de data e horário
- Validação de conflito de horário
- Confirmação do agendamento

Arquivo principal:

- `src/pages/Booking.jsx`

Resultado esperado:

- O cliente consegue agendar sozinho
- Horários ocupados são bloqueados
- O fluxo já resolve a necessidade principal do sistema

## Etapa 4 - Painel admin

Objetivo: permitir que o dono do negócio gerencie tudo.

O que entra aqui:

- Login do admin
- Lista de agendamentos
- Busca rapida por nome, telefone e servico
- Filtro rapido por status
- Paginacao da agenda para volume alto
- Atalho de WhatsApp por agendamento
- Gestao de equipe admin (adicionar e ativar/desativar)
- Confirmação, conclusão e cancelamento
- Filtros e visão operacional

Arquivos principais:

- `src/pages/AdminLogin.jsx`
- `src/pages/Admin.jsx`
- `src/lib/adminAuth.js`

Resultado esperado:

- O administrador acessa uma área protegida
- É possível operar a agenda sem depender do cliente
- Contato com cliente fica mais rápido durante a operação diária
- Controle de quem pode acessar o painel fica centralizado no proprio sistema

## Etapa 5 - Área do cliente

Objetivo: dar identidade para cada usuário e permitir histórico.

O que entra aqui:

- Cadastro e login de cliente
- Perfil com nome e telefone
- Histórico de agendamentos
- Cancelamento e reagendamento

Arquivos principais:

- `src/pages/ClientAuth.jsx`
- `src/pages/ClientAccount.jsx`
- `src/pages/Booking.jsx`

Resultado esperado:

- O cliente deixa de ser apenas um formulário solto
- Existe vínculo real com o usuário autenticado
- O sistema passa a ter experiência de conta

## Etapa 6 - UX e visual

Objetivo: deixar o sistema com aparência profissional.

O que entra aqui:

- Landing page moderna
- Sidebar no admin
- Gráficos e KPIs
- Botões de voltar e navegação clara
- Melhor uso de cores, cards e organização visual

Arquivos principais:

- `src/pages/Home.jsx`
- `src/pages/Admin.jsx`
- `src/pages/ClientAccount.jsx`
- `src/index.css`

Resultado esperado:

- O sistema deixa de parecer um protótipo cru
- O usuário entende onde está e o que pode fazer

## Etapa 7 - Segurança e regras de negócio

Objetivo: mover validações importantes para o banco.

O que entra aqui:

- Tabela de admins
- RLS por dono e por admin
- Ownership real por `cliente_user_id`
- Índice único de slot
- Auditoria de alterações
- Função pública segura para horários ocupados

Arquivos principais:

- `supabase_security_rules.sql`
- `supabase_security_rules_step2.sql`
- `supabase_security_migration_step2.sql`
- `supabase_security_rules_step3.sql`
- `supabase_security_rules_step4.sql`

Resultado esperado:

- O banco passa a proteger os dados de forma séria
- O frontend não pode burlar as regras de negócio
- O sistema fica pronto para uso real

## Etapa 8 - Migração de dados antigos

Objetivo: não quebrar o sistema quando houver dados legados.

O que entra aqui:

- Preenchimento de `cliente_user_id`
- Mapeamento por telefone quando possível
- Tratamento de registros órfãos
- Uso de cliente técnico para migração quando necessário

Resultado esperado:

- O banco aceita a evolução sem perder dados antigos
- As migrações podem ser aplicadas com segurança

## Etapa 9 - Deploy e manutenção

Objetivo: colocar o sistema no ar e manter a evolução organizada.

O que entra aqui:

- Commit e push no GitHub
- Deploy automático no Vercel
- Atualização de variáveis de ambiente
- Execução das migrações no Supabase
- Registro de novas funcionalidades no README

Resultado esperado:

- Cada mudança segue um fluxo claro
- O projeto fica fácil de manter e evoluir

## Como estudar o projeto na prática

Se você quiser aprender de forma ordenada, siga esta sequência:

1. Leia `README.md` para entender o objetivo do sistema
2. Leia `supabase_schema.sql` para entender o modelo inicial
3. Leia `src/pages/Booking.jsx` para ver o fluxo do cliente
4. Leia `src/pages/Admin.jsx` para ver a operação do painel
5. Leia `src/pages/ClientAccount.jsx` para entender a área do usuário
6. Leia os arquivos `supabase_security_*.sql` para entender a segurança
7. Compare os commits registrados no README para ver a evolução por etapas

## Resumo do raciocínio

O projeto foi construído em três blocos principais:

- Produto: landing, booking, cliente e admin
- Banco: schema, ownership, RLS e migrações
- Operação: deploy, documentação e evolução contínua

Essa é a forma mais segura de crescer o sistema sem perder controle do que foi feito em cada fase.
