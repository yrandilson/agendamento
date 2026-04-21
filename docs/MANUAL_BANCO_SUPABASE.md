# Manual do Banco (Supabase)

Este guia explica, de forma pratica, o que cada etapa SQL faz no projeto e por que ela existe.

## Indice

1. [Ordem oficial de execucao](#ordem-oficial-de-execucao)
2. [Etapa 1 - Base do sistema](#etapa-1---base-do-sistema-supabase_schemasql)
3. [Etapa 2 - Hardening inicial](#etapa-2---hardening-inicial-supabase_security_rulessql)
4. [Etapa 3 - Ownership real do cliente](#etapa-3---ownership-real-do-cliente-supabase_security_rules_step2sql)
5. [Etapa 4 - Migracao segura](#etapa-4---migracao-segura-supabase_security_migration_step2sql)
6. [Etapa 5 - RLS estrita sem legado](#etapa-5---rls-estrita-sem-legado-supabase_security_rules_step3sql)
7. [Etapa 6 - Governanca de admins](#etapa-6---governanca-de-admins-supabase_security_rules_step4sql)
8. [Etapa 7 - Sprint 1](#etapa-7---sprint-1-supabase_sprint1sql)
9. [Dicionario rapido de comandos SQL usados](#dicionario-rapido-de-comandos-sql-usados)

## Ordem oficial de execucao

1. `supabase_schema.sql`
2. `supabase_security_rules.sql`
3. `supabase_security_rules_step2.sql`
4. `supabase_security_migration_step2.sql`
5. `supabase_security_rules_step3.sql`
6. `supabase_security_rules_step4.sql`
7. `supabase_sprint1.sql`

## Etapa 1 - Base do sistema (`supabase_schema.sql`)

- Cria `servicos` (catalogo de servicos do negocio).
- Cria `agendamentos` (reservas com data, horario, status e servico).
- Cria indice por data para acelerar consultas da agenda.
- Insere servicos iniciais para o sistema funcionar imediatamente.
- Ativa RLS e aplica policies iniciais (fase mais permissiva para bootstrap).

## Etapa 2 - Hardening inicial (`supabase_security_rules.sql`)

- Cria tabela `admins` (governanca administrativa).
- Ativa RLS de `admins` e policy de leitura do proprio registro.
- Cria indice unico de slot ativo para impedir conflito de horario.
- Adiciona validacao de formato `HH:MM` em `agendamentos.horario`.
- Cria tabela de auditoria `agendamentos_auditoria`.
- Cria trigger para registrar mudancas de status de agendamento.

## Etapa 3 - Ownership real do cliente (`supabase_security_rules_step2.sql`)

- Cria tabela `clientes` vinculada ao usuario autenticado.
- Adiciona policies para cliente ler/alterar apenas o proprio perfil.
- Adiciona coluna `cliente_user_id` em `agendamentos`.
- Remove policies antigas permissivas da tabela `agendamentos`.
- Cria policies novas de `INSERT/SELECT/UPDATE` com regra dono ou admin.

## Etapa 4 - Migracao segura (`supabase_security_migration_step2.sql`)

- Faz backfill de `cliente_user_id` em dados legados usando telefone unico.
- Cria funcao `horarios_ocupados_publico(date)` com `SECURITY DEFINER`.
- Libera execucao da funcao para `anon` e `authenticated`, sem abrir tabela inteira.

## Etapa 5 - RLS estrita sem legado (`supabase_security_rules_step3.sql`)

- Completa ownership faltante em agendamentos antigos.
- Associa registros restantes a usuario tecnico de migracao.
- Torna `cliente_user_id` obrigatorio (`NOT NULL`).
- Recria policies de `agendamentos` removendo excecoes de transicao.

## Etapa 6 - Governanca de admins (`supabase_security_rules_step4.sql`)

- Adiciona `updated_at` em `admins`.
- Cria helper `is_admin_actor()` para validar admin ativo.
- Recria policies de `admins` para:
  - leitura por admin ou proprio usuario
  - insercao apenas por admin
  - atualizacao apenas por admin

## Etapa 7 - Sprint 1 (`supabase_sprint1.sql`)

- Cria `config_politicas` (regras de negocio dinamicas).
- Cria `profissionais` (equipe, jornada e dias de trabalho).
- Cria `bloqueios` (indisponibilidade por dia/faixa/profissional).
- Insere politicas default (`buffer_minutos`, antecedencias etc).
- Ativa RLS nas tabelas da sprint e aplica policies de admin.
- Libera leitura minima para o booking autenticado:
  - bloqueios do dia
  - chave `buffer_minutos`
- Cria funcoes auxiliares de negocio:
  - `get_politica`
  - `list_profissionais_ativos`
  - `horario_bloqueado`
  - `list_bloqueios_dia`

## Dicionario rapido de comandos SQL usados

- `CREATE TABLE`: cria tabela nova.
- `IF NOT EXISTS`: evita erro se objeto ja existir.
- `ALTER TABLE`: altera estrutura ou configuracao da tabela.
- `ENABLE ROW LEVEL SECURITY`: ativa seguranca por linha (RLS).
- `CREATE POLICY`: define regra de acesso com RLS.
- `DROP POLICY IF EXISTS`: remove policy antiga sem quebrar reexecucao.
- `USING`: condicao para ler/alterar/deletar linhas existentes.
- `WITH CHECK`: condicao valida para inserir/atualizar dados.
- `CREATE INDEX`: acelera consultas.
- `CREATE UNIQUE INDEX`: acelera e impede duplicidade.
- `CREATE OR REPLACE FUNCTION`: cria ou atualiza funcao.
- `SECURITY DEFINER`: executa funcao com permissao do dono da funcao.
- `DO $$ ... $$`: bloco procedural para logica condicional.
- `CREATE TRIGGER`: executa funcao automaticamente em eventos.
- `ON CONFLICT DO NOTHING/UPDATE`: trata duplicidade sem erro.
