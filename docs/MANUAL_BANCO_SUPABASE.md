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
10. [Glossario SQL (conceitos e significado)](#glossario-sql-conceitos-e-significado)

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

## Glossario SQL (conceitos e significado)

1. `CREATE TABLE`: cria uma tabela nova.
2. `PRIMARY KEY`: identificador unico da linha (nao repete e nao pode ser nulo).
3. `UUID`: tipo de identificador global unico.
4. `DEFAULT gen_random_uuid()`: gera UUID automaticamente ao inserir.
5. `TEXT`: campo de texto livre.
6. `BOOLEAN`: campo verdadeiro/falso.
7. `INTEGER`: numero inteiro.
8. `DECIMAL(p,s)`: numero com casas decimais controladas.
9. `TIMESTAMP`: data e hora sem fuso.
10. `TIMESTAMPTZ`: data e hora com fuso horario.
11. `DEFAULT now()`: preenche data/hora atual por padrao.
12. `REFERENCES tabela(coluna)`: chave estrangeira para relacionamento entre tabelas.
13. `CHECK (condicao)`: valida regra de valor na coluna.
14. `UNIQUE`: impede valores duplicados.
15. `CREATE INDEX`: acelera consultas por filtro/ordenacao.
16. `CREATE UNIQUE INDEX`: acelera e tambem garante unicidade.
17. `INSERT INTO`: insere dados novos.
18. `ON CONFLICT DO NOTHING`: ignora duplicidade sem erro.
19. `ON CONFLICT DO UPDATE`: atualiza quando houver conflito.
20. `ALTER TABLE`: altera estrutura/configuracao de tabela existente.
21. `ADD COLUMN`: adiciona coluna nova.
22. `ALTER COLUMN ... SET NOT NULL`: torna campo obrigatorio.
23. `ENABLE ROW LEVEL SECURITY`: ativa seguranca por linha (RLS).
24. `CREATE POLICY`: define regra de acesso com RLS.
25. `USING`: condicao para leitura/alteracao de linhas existentes.
26. `WITH CHECK`: condicao para inserir/atualizar novos valores.
27. `DROP POLICY IF EXISTS`: remove policy antiga sem quebrar reexecucao.
28. `auth.uid()`: retorna id do usuario autenticado na sessao.
29. `auth.jwt()`: le dados do token JWT (ex.: email).
30. `auth.role()`: papel da requisicao (`anon` ou `authenticated`).
31. `CREATE OR REPLACE FUNCTION`: cria ou atualiza funcao.
32. `RETURNS`: define tipo de retorno da funcao.
33. `LANGUAGE sql|plpgsql`: define linguagem da funcao.
34. `SECURITY DEFINER`: executa com permissao do dono da funcao.
35. `SET search_path = public`: fixa schema padrao para evitar ambiguidade.
36. `GRANT EXECUTE ON FUNCTION`: concede permissao de executar funcao.
37. `REVOKE ALL ON FUNCTION`: remove permissoes anteriores da funcao.
38. `DO $$ ... $$`: bloco procedural anonimo para migracoes/condicionais.
39. `IF NOT EXISTS` (em bloco `DO`): cria objeto apenas se ainda nao existir.
40. `WITH ...` (CTE): consulta temporaria nomeada para reaproveito.
41. `UPDATE ... FROM ...`: atualiza com base em outra consulta/tabela.
42. `CREATE TRIGGER`: executa funcao automaticamente em evento da tabela.
43. `AFTER UPDATE`: trigger dispara apos atualizacao.
44. `FOR EACH ROW`: trigger roda para cada linha alterada.
45. `DROP TRIGGER IF EXISTS`: remove trigger sem erro se nao existir.
46. `EXISTS (subquery)`: retorna verdadeiro se a subconsulta tiver ao menos 1 linha.
47. `COALESCE(a,b)`: usa `a`; se nulo, usa `b`.
48. `lower(texto)`: normaliza texto para comparacao sem diferenca de maiusculas/minusculas.
49. `NULL` e `NOT NULL`: permite ou proibe valor vazio.
50. `ORDER BY ... NULLS FIRST`: ordena e coloca nulos primeiro.
