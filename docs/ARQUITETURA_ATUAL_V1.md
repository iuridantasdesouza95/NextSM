# NextSM — Arquitetura Atual v1

> Baseline documental da arquitetura existente. Este documento registra o estado atual antes da reconstrução planejada do ecossistema Next.

## 1. Escopo

O NextSM é o produto de Service Management da plataforma Next. Ele permanece responsável pelo domínio operacional de Service Desk e ITSM.

Stack atual:
- Frontend/Backend: React + TanStack Start/Router
- Dados, autenticação e storage atuais: Supabase
- Deploy: Vercel
- Versionamento: GitHub
- Integração de IA: camada MCP existente em `src/lib/mcp/`

## 2. Domínios atualmente presentes

### Service Desk
- chamados
- comentários e histórico
- status, prioridade, impacto e urgência
- categorias, subcategorias, segmentos e tipos de chamado
- grupos de atendimento e atendentes
- triagem, filas e sequenciamento
- atribuição automática
- escalonamento
- SLA, regras e calendários
- avaliações/feedback
- anexos
- notificações
- automações operacionais

### ITSM
- ativos/CMDB
- serviços
- problemas
- mudanças
- catálogo de serviços
- relacionamentos entre objetos
- aprovações
- permissões operacionais
- auditoria

### Conhecimento e IA
- base de conhecimento
- feedback e avaliações de conhecimento
- embeddings/vector search
- conversas e mensagens de IA
- logs do assistente
- documentos do assistente
- perguntas sem resposta

## 3. Banco atual

O banco oficial auditado para este projeto é o Supabase `byuvcguynctqftnoylno`.

A pasta `supabase/migrations/` contém a evolução histórica do schema. As migrations existentes são consideradas histórico e **não devem ser reescritas** para refletir decisões futuras.

Há evidências de evolução incremental e corretiva do modelo, incluindo múltiplas migrations para SLA, triagem, atribuição, escalonamento, ITSM, conhecimento, permissões e correções de schema.

## 4. Identidade — estado atual e direção

Hoje o NextSM possui dependências internas de Supabase Auth, `profiles` e estruturas próprias de papéis/permissões.

Direção arquitetural aprovada para o ecossistema Next:

- **Next ID** será a identidade central da plataforma.
- O NextSM continuará proprietário das regras de autorização específicas do Service Desk/ITSM.
- Identificadores de usuário deverão evoluir para o identificador canônico fornecido pelo Next ID.
- Não duplicar no NextSM dados cadastrais globais que pertençam ao Next ID.

Essa migração ainda **não deve ser executada nesta etapa**.

## 5. Responsabilidade do NextSM

Permanecem no NextSM:

- regras de negócio de chamados
- workflow e transições de status
- classificação e categorização
- filas e atribuição
- SLA e cálculo operacional
- escalonamento
- catálogo e serviços de Service Management
- ativos/CMDB
- problemas e mudanças
- conhecimento específico do Service Desk
- auditoria operacional
- métricas operacionais do produto

## 6. Responsabilidades externas previstas

### Next ID
Identidade global, autenticação, MFA, recuperação, identidade do usuário e dados cadastrais globais.

### Next AI
Experiência conversacional e inteligência artificial. Deve consumir dados do NextSM por contratos de integração, sem replicar o domínio de chamados.

### n8n
Orquestração externa de automações e rotinas agendadas. Não deve substituir as regras de negócio do NextSM.

### Next Intranet / Next RH
Produtos independentes, cada um com seu próprio domínio e banco. Compartilharão identidade por meio do Next ID, não tabelas de negócio do NextSM.

## 7. MCP atual

O NextSM já possui um servidor MCP com as ferramentas:

- `listar_chamados`
- `obter_chamado`
- `criar_chamado`
- `comentar_chamado`
- `buscar_base_conhecimento`

A autenticação atual utiliza bearer token e o contexto autenticado do Supabase, permitindo que RLS participe da autorização.

O MCP será evoluído posteriormente para um contrato semântico e estável, evitando expor diretamente o formato físico das tabelas.

## 8. Integrações que deverão ser desacopladas

Os handlers MCP atuais ainda misturam domínio com algumas preocupações de infraestrutura, principalmente:

- leitura direta de `profiles`
- consulta direta de `user_roles`
- envio de e-mail dentro de comandos de negócio
- dependência do formato físico de `chamados` via `select("*")`

Esses pontos ficam registrados como itens de refatoração futura; não devem ser alterados durante o baseline.

## 9. Banco — pontos registrados para reconstrução futura

A auditoria atual identificou, entre outros:

- relacionamentos lógicos relevantes sem enforcement completo por foreign keys
- políticas RLS permissivas/duplicadas em algumas tabelas
- funções `SECURITY DEFINER` que precisam de revisão de privilégios
- índices candidatos a duplicidade ou baixo uso
- sobreposição entre modelos `slas` e `sla_regras`
- sobreposição conceitual entre estruturas de conhecimento
- tabela `chamados` muito ampla, concentrando várias responsabilidades
- estruturas de IA/RAG que precisam ser delimitadas entre NextSM e Next AI

Nada disso deve ser corrigido automaticamente agora.

## 10. Regra de preservação

Este documento representa um **baseline de arquitetura**, não uma autorização de alteração.

Antes de qualquer mudança física:

1. comparar este baseline com o schema real;
2. validar regras de negócio no código;
3. definir fronteiras entre produtos;
4. definir o contrato do Next ID;
5. definir contratos MCP/API;
6. produzir o desenho do banco futuro;
7. somente então criar migrations de transição.

## 11. Estado do baseline

**Status:** registrado para referência arquitetural.

**Data:** 2026-09-06

**Projeto:** NextSM

**Supabase:** `byuvcguynctqftnoylno`

**Branch:** `main`
