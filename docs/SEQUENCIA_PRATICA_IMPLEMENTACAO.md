# Sequencia Pratica de Implementacao

Este guia descreve a ordem exata para construir o sistema do zero, com foco em:

- onde mexer
- qual funcao criar
- como ligar rotas
- quando mexer no banco
- como validar cada etapa

Use este roteiro como se voce fosse o dev principal conduzindo o projeto.

## Etapa 0 - Preparacao do ambiente

Objetivo: colocar projeto e infraestrutura prontos para iniciar codigo.

1. Instalar Node LTS e Git.
2. Criar projeto Supabase e copiar URL e anon key.
3. Criar `.env` com variaveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL` (opcional para whitelist)
4. Rodar:

```bash
npm install
npm run dev
```

Arquivos base que precisam existir:

- `package.json`
- `src/main.jsx`
- `src/App.jsx`
- `src/lib/supabase.js`

Validacao:

- app abre em localhost
- sem erro de variavel de ambiente no console

## Etapa 1 - Conexao com banco

Objetivo: garantir leitura/escrita no Supabase.

Arquivo:

- `src/lib/supabase.js`

O que precisa ter:

1. `createClient` importado de `@supabase/supabase-js`
2. leitura de `VITE_SUPABASE_URL`
3. leitura de `VITE_SUPABASE_ANON_KEY`
4. export do cliente `supabase`

Validacao:

- qualquer pagina consegue importar `supabase` sem erro

## Etapa 2 - Schema inicial do banco

Objetivo: subir estrutura minima para operar agendamentos.

Arquivo SQL:

- `supabase_schema.sql`

Execucao:

1. abrir SQL Editor no Supabase
2. colar SQL inicial
3. executar

Validacao:

- tabelas basicas criadas
- consultas simples funcionam

## Etapa 3 - Definir rotas da aplicacao

Objetivo: montar navegacao principal antes de detalhar telas.

Arquivo:

- `src/App.jsx`

Rotas ativas no projeto:

- `/` -> `Home`
- `/agendar` -> `Booking`
- `/cliente` -> `ClientAuth`
- `/minha-conta` -> `ClientAccount`
- `/admin` -> `AdminLogin`
- `/admin/painel` -> `Admin`

Sequencia para ligar rotas:

1. importar cada pagina em `src/App.jsx`
2. declarar `Routes`
3. mapear cada `Route` para path + element

Validacao:

- navegar manualmente em todas as URLs
- cada rota renderiza sem tela branca

## Etapa 4 - Fluxo publico de agendamento

Objetivo: cliente selecionar servico, data, horario e confirmar.

Arquivo principal:

- `src/pages/Booking.jsx`

Funcoes e blocos chave ja existentes:

1. carregamento de servicos via `supabase.from('servicos').select('*')`
2. controle de sessao com `supabase.auth.getUser()`
3. listener com `supabase.auth.onAuthStateChange(...)`
4. consulta de horarios ocupados via `supabase.rpc('horarios_ocupados_publico', { p_data })`
5. confirmacao em `confirmar()`:
   - validar login
   - validar campos
   - upsert do perfil em `clientes`
   - insert em `agendamentos`
   - tratar erro de conflito `23505`

Como implementar sem quebrar:

1. primeiro garantir leitura de servicos
2. depois montar selecao de data/horario
3. depois criar `confirmar()`
4. por ultimo integrar notificacao `/api/notify`

Validacao:

- cliente logado consegue agendar
- cliente sem login nao confirma
- horario ocupado nao duplica

## Etapa 5 - Login e cadastro de cliente

Objetivo: autenticar usuario final com conta propria.

Arquivo:

- `src/pages/ClientAuth.jsx`

Funcao principal:

- `enviar(e)`

Fluxo da funcao:

1. bloquear submit vazio
2. se cadastro: `supabase.auth.signUp`
3. se login: `supabase.auth.signInWithPassword`
4. em sucesso de login: `navigate('/agendar')`

Validacao:

- criar conta funciona
- login funciona
- redireciona para agendamento

## Etapa 6 - Minha conta do cliente

Objetivo: salvar perfil e mostrar historico do proprio usuario.

Arquivo:

- `src/pages/ClientAccount.jsx`

Funcoes chave:

1. `carregarPerfilCliente(user)`
2. `carregarHistorico(userId)`
3. `salvarPerfil()`
4. `cancelarAgendamento(id)`
5. `salvarRascunhoReagendamento(item)`

Regras importantes:

- consultar `agendamentos` por `cliente_user_id`
- permitir atualizar somente dados do proprio cliente
- ao sair da conta, redirecionar para `/cliente`

Validacao:

- perfil salva corretamente
- lista proximos e historico
- reagendamento volta para `/agendar` com rascunho

## Etapa 7 - Login admin e autorizacao

Objetivo: proteger acesso administrativo.

Arquivos:

- `src/pages/AdminLogin.jsx`
- `src/lib/adminAuth.js`

Funcoes chave:

1. `entrar()` em `AdminLogin.jsx`
2. `isAdminUser(user)` em `adminAuth.js`
3. `validarPorTabelaAdmins(user)` em `adminAuth.js`

Fluxo:

1. login com `signInWithPassword`
2. validar permissao admin
3. se nao permitido: `signOut`
4. se permitido: `navigate('/admin/painel')`

Validacao:

- usuario comum nao entra no admin
- admin entra normalmente

## Etapa 8 - Painel administrativo

Objetivo: gerir agenda, indicadores e auditoria.

Arquivo:

- `src/pages/Admin.jsx`

Funcoes principais no arquivo:

1. `validarAcessoAdmin()`
2. `carregarServicos()`
3. `carregar()`
4. `carregarAnalytics()`
5. `carregarAuditoria()`
6. `atualizarStatus(id, status)`
7. `cancelar(id)`
8. `concluir(id)`
9. `sair()`
10. `exportarAgendaCsv()`
11. `normalizarTelefone(telefone)`
12. `urlWhatsApp(telefone, nomeCliente)`
13. `carregarEquipeAdmins()`
14. `adicionarAdmin(e)`
15. `alternarAtivoAdmin(admin)`

Ordem recomendada de implementacao:

1. validar acesso admin
2. listar agenda
3. incluir busca por nome/telefone/servico na agenda
4. incluir filtro por status na agenda
5. incluir paginacao da lista da agenda
6. incluir atalho de WhatsApp por agendamento
7. acoes de status
8. analytics
9. auditoria
10. gestao de equipe admin (listar, adicionar, ativar/desativar)
11. exportacao CSV respeitando os filtros ativos

Validacao:

- admin visualiza agenda
- admin consegue pesquisar rapidamente por cliente/telefone/servico
- admin consegue filtrar por status com rapidez
- admin consegue navegar agenda longa com paginacao
- admin consegue iniciar contato por WhatsApp com um clique
- status altera sem erro
- analytics carrega
- auditoria aparece
- equipe de admins pode ser gerenciada no proprio painel
- CSV exportado bate com os filtros exibidos na agenda

## Etapa 9 - Hardening do banco (sequencia obrigatoria)

Objetivo: endurecer regras no banco para producao.

Ordem de execucao no Supabase:

1. `supabase_security_rules.sql`
2. `supabase_security_rules_step2.sql`
3. `supabase_security_migration_step2.sql`
4. `supabase_security_rules_step3.sql`
5. `supabase_security_rules_step4.sql`

O que cada etapa entrega:

1. base de seguranca admin, regra anti-conflito e auditoria
2. ownership real por `cliente_user_id`
3. migracao de legado + RPC publica segura para horarios ocupados
4. RLS estrita sem excecao de legado
5. governanca de admins com policies de leitura/escrita para o grupo admin

Validacao:

- `cliente_user_id` sem nulos
- politicas ativas
- cliente ve somente os dados dele
- admin ve e opera tudo que precisa

## Etapa 10 - Integracao final e deploy

Objetivo: garantir que frontend e banco estao alinhados em producao.

Checklist:

1. `npm run build`
2. revisar variaveis de ambiente no Vercel
3. confirmar rotas publicas e privadas
4. validar fluxo real:
   - cadastro cliente
   - login cliente
   - agendamento
   - visualizacao em minha conta
   - login admin
   - operacao no painel

## Etapa 11 - Fluxo de mudanca futura (como saber onde mexer)

Use esta regra de decisao:

1. mudanca visual ou UX -> `src/pages/*`, `src/index.css`
2. mudanca de navegacao -> `src/App.jsx` e links nas paginas
3. mudanca de autenticacao -> `ClientAuth.jsx`, `AdminLogin.jsx`, `adminAuth.js`
4. mudanca de regra de agenda -> `Booking.jsx` + SQL/policies
5. mudanca de seguranca -> arquivos `supabase_security_*.sql`
6. mudanca de dados no banco -> sempre criar/atualizar script SQL

## Etapa 12 - Padrao de branch e commit (recomendado)

Padrao:

- branch por tarefa: `feature/...`, `fix/...`, `docs/...`
- commits pequenos e objetivos

Exemplo:

```bash
git checkout -b feature/reagendamento-cliente
git add src/pages/ClientAccount.jsx src/pages/Booking.jsx
git commit -m "feat: adicionar fluxo de reagendamento"
git add README.md docs/SEQUENCIA_PRATICA_IMPLEMENTACAO.md
git commit -m "docs: atualizar fluxo e registro da feature"
git push origin HEAD
```

## Resumo executivo

Se voce quiser repetir o projeto inteiro com seguranca, execute nesta ordem:

1. ambiente
2. conexao supabase
3. schema SQL
4. rotas
5. booking
6. auth cliente
7. minha conta
8. auth admin
9. painel admin
10. hardening SQL
11. build/deploy
12. documentacao

Esse e o fluxo mais previsivel para codar, testar e evoluir o sistema sem retrabalho.