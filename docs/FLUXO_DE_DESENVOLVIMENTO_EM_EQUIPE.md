# Fluxo de Desenvolvimento em Equipe

Este documento simula como o projeto seria construído por mais de um desenvolvedor trabalhando no mesmo repositório.

O objetivo nao é só ensinar o código. É ensinar a trabalhar com organização, divisão de tarefas, revisão e integração sem quebrar o projeto.

## Como pensar o trabalho em equipe

Em um projeto real, ninguém faz tudo sozinho. O fluxo costuma ser:

1. Alguém define a tarefa
2. A tarefa vira uma issue ou nota de trabalho
3. Cada pessoa pega uma parte pequena e clara
4. Cada dev trabalha em uma branch separada
5. O código passa por revisão
6. Depois é integrado na branch principal

## Papéis simulados no projeto

### Dev 1 - Frontend

Cuida de:

- páginas React
- componentes visuais
- navegação
- experiência do usuário
- responsividade

Exemplos de arquivos:

- `src/pages/Home.jsx`
- `src/pages/Booking.jsx`
- `src/pages/Admin.jsx`
- `src/pages/ClientAccount.jsx`

### Dev 2 - Banco e segurança

Cuida de:

- schema do Supabase
- RLS
- policies
- funções SQL
- migrações

Exemplos de arquivos:

- `supabase_schema.sql`
- `supabase_security_rules.sql`
- `supabase_security_rules_step2.sql`
- `supabase_security_migration_step2.sql`
- `supabase_security_rules_step3.sql`

### Dev 3 - Integração e produto

Cuida de:

- validar se frontend e banco conversam corretamente
- revisar fluxos de negócio
- garantir que a interface combina com a regra de dados
- testar cenários reais

Exemplos de atuação:

- conferir se o booking grava `cliente_user_id`
- validar se o admin consegue ver só o que pode ver
- revisar se o cliente consegue acessar a própria conta

### Dev 4 - Revisão e qualidade

Cuida de:

- revisar pull requests
- testar bugs de regressão
- apontar inconsistências
- validar documentação

## Fluxo de trabalho recomendado

### 1. Criar uma tarefa pequena

Exemplo:

- "Adicionar auditoria de agendamentos"
- "Melhorar dashboard do admin"
- "Aplicar RLS para cliente autenticado"

Tarefas pequenas são mais fáceis de revisar e integrar.

### 2. Criar branch por tarefa

Exemplo de padrão:

- `feature/dashboard-admin`
- `feature/rules-cliente`
- `fix/slot-conflito`
- `docs/fluxo-equipe`

Cada branch deve resolver uma coisa só.

### 3. Implementar com commits pequenos

Exemplo de sequência:

```bash
git checkout -b feature/dashboard-admin
git add src/pages/Admin.jsx
git commit -m "feat: melhorar dashboard do admin"
git add README.md
git commit -m "docs: registrar dashboard do admin"
```

Commits pequenos deixam a evolução clara.

### 4. Abrir pull request

O pull request deve responder:

- o que mudou
- por que mudou
- como testar
- se mexeu no banco ou só no frontend

### 5. Fazer revisão

Na revisão, a equipe verifica:

- se o código faz sentido
- se não quebrou outros fluxos
- se a regra de negócio continua correta
- se a documentação foi atualizada

### 6. Integrar na main

Depois da aprovação:

- merge na branch principal
- testar build
- validar deploy no Vercel
- conferir se o Supabase continua consistente

## Simulação prática de equipe no projeto

### Cenário 1 - Frontend e banco sendo feitos em paralelo

Dev 1 cria a nova tela de analytics no admin.

Dev 2 cria a função SQL e a policy necessária para liberar os dados.

Dev 4 revisa se a tela não está pedindo mais informação do que o banco entrega.

Resultado esperado:

- a interface fica pronta
- o banco expõe os dados certos
- nada fica dependente de gambiarra no frontend

### Cenário 2 - Mudança de regra de negócio

Dev 2 decide que `cliente_user_id` deve ser obrigatório.

Dev 1 ajusta o booking para sempre enviar o ID autenticado.

Dev 3 testa se o cliente consegue agendar e depois ver o próprio histórico.

Resultado esperado:

- a regra vive no banco
- a interface acompanha a regra
- a experiência não quebra

### Cenário 3 - Nova funcionalidade sem quebrar o que já existe

Dev 1 adiciona um novo filtro visual no admin.

Dev 4 valida se o filtro não afeta a lista antiga.

Dev 2 confirma que nenhuma query ficou insegura.

Resultado esperado:

- a feature nova entra sem regressão

### Cenário 4 - Operação diária mais rápida no admin

Dev 1 adiciona busca por nome, telefone e serviço na seção Agenda.

Dev 1 também adiciona atalho de WhatsApp no card do agendamento.

Dev 3 valida se os filtros continuam consistentes com os dados do banco.

Dev 4 revisa se a experiência ficou mais rápida sem afetar status e auditoria.

Resultado esperado:

- equipe reduz tempo de localização de cliente
- contato com cliente fica disponível em um clique
- fluxo antigo da agenda continua estável

### Cenário 5 - Governança de acesso admin

Dev 2 cria policies para permitir que apenas admins ativos gerenciem a tabela de admins.

Dev 1 cria a seção Equipe no painel para listar, adicionar e ativar/desativar admins.

Dev 3 valida que usuário comum não consegue alterar permissões.

Dev 4 revisa riscos de segurança e consistência da regra.

Resultado esperado:

- gestão de acesso deixa de ser manual
- equipe admin controla permissões sem sair do produto
- segurança continua centralizada no banco

### Cenário 6 - Agenda com filtros consistentes para operação

Dev 1 adiciona filtro por status para reduzir tempo de triagem da agenda.

Dev 1 ajusta a exportação CSV para respeitar os mesmos filtros visuais da tela.

Dev 3 valida se o total exibido na agenda bate com o CSV gerado.

Dev 4 revisa se não houve regressão em ações de concluir/cancelar.

Resultado esperado:

- equipe enxerga exatamente o recorte operacional necessário
- relatório exportado fica consistente com a visão do painel
- operação diária ganha previsibilidade

### Cenário 7 - Agenda extensa com paginação

Dev 1 adiciona paginação para evitar listas longas e lentas na seção Agenda.

Dev 3 valida se a paginação reseta corretamente ao mudar filtros.

Dev 4 revisa se os números de itens e páginas estão coerentes com o resultado filtrado.

Resultado esperado:

- painel continua rápido mesmo com muitos agendamentos
- navegação por lotes fica clara para a equipe
- operação diária mantém contexto sem perda de desempenho visual

## Regras para não bagunçar o projeto

- não trabalhar direto na `main`
- não misturar frontend, banco e docs em uma branch gigantesca
- não fazer commit com mudança sem explicação
- não alterar banco sem registrar no README
- não aprovar PR sem testar o fluxo completo

## Como dividir o projeto em módulos entre devs

### Módulo do cliente

- login
- cadastro
- agendamento
- perfil
- histórico

### Módulo do admin

- login admin
- dashboard
- agenda
- análises
- auditoria

### Módulo do banco

- schema
- RLS
- triggers
- índices
- migrações

### Módulo da documentação

- README
- guia de evolução
- fluxo em equipe
- histórico de funcionalidades

## Simulação de rotina semanal

### Segunda-feira

- planejar tarefas
- separar issues
- definir quem faz o quê

### Terça e quarta

- implementar em branches individuais
- fazer commits pequenos
- atualizar documentação parcial

### Quinta-feira

- revisão de PR
- correção de bugs
- validação de banco e frontend

### Sexta-feira

- merge na main
- build final
- deploy no Vercel
- checar se o Supabase ficou coerente

## Fluxo resumido de equipe

```text
Planejamento -> Branch por tarefa -> Desenvolvimento -> Revisao -> Teste -> Merge -> Deploy -> Documentacao
```

## O que você aprende com esse modelo

- como organizar trabalho com mais pessoas
- como evitar conflito de mudanças
- como dividir frontend, banco e revisão
- como manter o projeto limpo e escalavel
- como pensar como uma equipe real

## Melhor forma de estudar

Use este documento junto com o guia principal:

- [Fluxo de desenvolvimento do zero](FLUXO_DESENVOLVIMENTO_DO_ZERO.md)

Primeiro você aprende a construir sozinho. Depois aprende a coordenar esse mesmo sistema como equipe.