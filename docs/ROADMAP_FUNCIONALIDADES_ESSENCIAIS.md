# Roadmap de Funcionalidades Essenciais

Este documento traduz os requisitos de produto em um plano executavel por etapas, com foco em entrega incremental, seguranca e baixa regressao.

## Objetivo

Transformar o sistema atual em uma plataforma completa de agendamento com:

- experiencia premium para cliente
- operacao forte para equipe/admin
- automacoes reais de comunicacao
- inteligencia de negocio
- regras de negocio configuraveis

## Status Atual (resumo)

### Ja entregue

- booking com autenticacao e vinculo por usuario
- painel admin com dashboard, agenda, filtros, busca, status e paginacao
- cliente com dashboard, menu lateral, historico e reagendamento
- auditoria de status
- hardening RLS ate etapa 4 (governanca de admins)
- **Sprint 1 (nov 2026): politicas configuraveis, bloqueio de horarios, profissionais e equipe, buffer entre atendimentos**

### Parcial

- automacao por WhatsApp ja existe no fluxo de confirmacao
- relatorios iniciais no admin ja existem (ticket, volume, comparativo)

### Pendente (alto impacto)

- selecao dinamica por profissional/unidade/faixa de preco
- pagamento online (pix/cartao)
- agenda multi-visualizacao (dia/semana/mes/colunas por profissional)
- CRM com historico rico e preferencias
- lista de espera inteligente
- lembretes multicanal (email/sms/whatsapp com janelas)
- confirmacao por clique no link
- sincronizacao Google/Outlook/iCal
- NPS automatico
- servicos combinados

## Backlog estruturado por modulo

## 1) Area do Cliente

### 1.1 Selecao dinamica
- filtros por categoria
- filtros por profissional
- filtros por unidade
- filtros por faixa de preco

Dependencias tecnicas:
- tabela de profissionais
- relacao servico x profissional
- relacao servico x unidade
- metadados de categoria/faixa

### 1.2 Calendario real-time sem overbooking
- exibir apenas horarios livres
- lock de slot no banco (ja existe base)
- feedback instantaneo no frontend

### 1.3 Reserva convidado + login social
- modo convidado opcional
- login social Google/Facebook

Dependencias:
- providers no Supabase Auth
- ajustes de RLS para convidados (via token temporario ou fluxo anonimo restrito)

### 1.4 Pagamento/sinal online
- pix e cartao
- status de pagamento por agendamento
- regras para confirmar somente apos sinal (quando habilitado)

Dependencias:
- gateway (ex: Mercado Pago/Stripe)
- webhooks
- tabela de transacoes

### 1.5 Gestao de agendamentos pelo cliente
- reagendar/cancelar com regra de antecedencia
- mensagens claras quando fora da politica

Dependencias:
- configuracoes de politica no banco
- validacao no backend e no frontend

## 2) Painel de Gestao (Admin/Profissional)

### 2.1 Agenda multi-visualizacao
- diaria
- semanal
- mensal
- por coluna de profissional

### 2.2 Bloqueio de horarios
- pausa almoco
- folga
- bloqueio pontual por imprevisto

### 2.3 Gestao de equipe
- permissoes por papel
- jornada por profissional
- comissao por profissional

### 2.4 CRM de clientes
- historico detalhado
- preferencias
- notas internas
- anexos (antes/depois)

### 2.5 Lista de espera inteligente
- fila por servico/profissional/horario
- disparo automatico quando surgir vaga

## 3) Automacao e Comunicacao

### 3.1 Lembretes multicanal
- 24h antes
- 2h antes
- canais: WhatsApp, email, SMS

### 3.2 Confirmacao por clique
- link de confirmacao
- atualizacao automatica de status

### 3.3 Sincronizacao externa
- Google Calendar
- Outlook
- iCal

## 4) Inteligencia de Negocio

### 4.1 No-show
- taxa por periodo
- taxa por profissional
- taxa por servico

### 4.2 Financeiro
- fluxo de caixa
- ticket medio por cliente
- produtividade por equipe/profissional

### 4.3 NPS
- envio automatico apos atendimento concluido
- painel com nota media e comentarios

## 5) Regras de Negocio e Configuracoes

### 5.1 Politica de cancelamento
- antecedencia minima para cancelamento gratuito
- regra geral + excecoes por servico

### 5.2 Buffer entre atendimentos
- intervalo automatico por servico/profissional

### 5.3 Servicos combinados
- composicao de 2+ servicos sequenciais
- calculo automatico de duracao total e custo

## Ordem recomendada de implementacao (sprints)

## Sprint 1 - Regras base e disponibilidade

Entregas:
- politica de cancelamento configuravel
- buffer de atendimento
- bloqueio de horarios no admin
- base de profissionais e agenda por profissional

Resultado:
- agenda robusta para operacao real

## Sprint 2 - Cliente avancado

Entregas:
- filtros por profissional/unidade/categoria/faixa
- calendario por profissional
- reagendamento com politicas

Resultado:
- experiencia de reserva superior

## Sprint 3 - Automacoes

Entregas:
- lembretes multicanal
- confirmacao por clique
- lista de espera inteligente

Resultado:
- reducao de no-show

## Sprint 4 - Financeiro e CRM

Entregas:
- pagamento online
- CRM com notas e anexos
- relatorios financeiros consolidados

Resultado:
- ganho operacional e comercial

## Sprint 5 - Integracoes e BI

Entregas:
- sincronizacao Google/Outlook/iCal
- NPS automatico
- dashboards finais (no-show, produtividade, receita)

Resultado:
- visao executiva completa

## Definicao de pronto (DoD) por funcionalidade

Cada feature so entra como concluida quando:

- UI pronta (desktop e mobile)
- regras no banco aplicadas (RLS/constraints/policies)
- logs e auditoria minima
- documentacao atualizada
- build de producao sem erro
- fluxo principal validado ponta a ponta

## Proxima entrega recomendada

Comecar por:

1. politica de cancelamento configuravel
2. buffer entre atendimentos
3. bloqueio de horarios no admin

Essas 3 entregas aumentam muito a maturidade do produto com risco baixo de regressao.
