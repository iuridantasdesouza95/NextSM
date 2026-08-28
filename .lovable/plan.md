# Service Desk Vemplast — Reconstrução no Lovable

Alinhado ao seu retorno: sem SSO Microsoft por enquanto, tudo em português, banco começa **zerado** e as **categorias/subcategorias/SLAs seguem exatamente o que já existe no repositório atual** (`001_service_desk_schema.sql`).

## Fundação
- **Lovable Cloud** (Postgres + Auth + Storage) — substitui o Postgres/FastAPI mantendo mesma modelagem
- **Auth**: e-mail + senha (Lovable Auth). SSO Microsoft **não** entra agora
- **Papéis** (`app_role`): `colaborador`, `atendente`, `gestor`, `admin` em tabela separada `user_roles` (segurança)
- **Idioma**: 100% português em UI, campos e mensagens

## Banco (migration única, banco zerado)
Espelhando o schema atual da Vemplast:
- `profiles` (nome, email, departamento, ramal, avatar_url, ativo)
- `user_roles` + enum `app_role` + função `has_role()`
- `categorias` e `subcategorias` — **seed idêntico ao SQL atual**: Suporte, Acesso e Permissões, Hardware, Sistemas, Projetos, RH, Financeiro (com as mesmas subcategorias)
- `slas` — seed **idêntico**: Baixa 24/72h, Média 8/24h, Alta 4/8h, Crítica 1/4h
- `chamados` (numeração `SD-00001` via sequence + trigger), com prioridade, status, prazos, violações de SLA, avaliação, tags
- `comentarios_chamado` (público/interno)
- `anexos_chamado` (Storage bucket `chamados-anexos`)
- `historico_chamado` (auditoria de mudanças de status/atendente)
- `notificacoes` + enum `tipo_notificacao`
- `base_conhecimento` (artigos)
- Todas as tabelas com RLS + GRANT explícito

## Backend (server functions TanStack)
- Chamados: criar / listar (fila para atendente, meus para colaborador) / detalhe / atualizar status / atribuir / avaliar
- Comentários + anexos
- Notificações (marcar lida, listar)
- Base de conhecimento (CRUD + sugestões)
- Dashboard (contadores por status, SLA, categoria)
- Job de SLA (via pg_cron marcando violações)
- **Email M365** e **Teams (canal + 1:1)** entram na **fase 2** — endpoint público `/api/public/*` já pronto, integração ativa quando você fornecer credenciais Graph API

## Frontend (mesma estrutura de páginas do repo atual)
- **Login** (e-mail + senha)
- **Colaborador**: Novo Chamado, Meus Chamados, Detalhe do Chamado
- **Atendente**: Dashboard, Fila de Chamados, Detalhe do Chamado
- **Admin**: Categorias, Usuários
- **Base de Conhecimento**: Lista, Detalhe do Artigo, Editor
- **Sininho de Notificações** no header
- Componentes UI reaproveitados (AppShell, AuthGuard, Badge, Modal, Select, Spinner)

## Detalhes técnicos
- Roteamento file-based TanStack Router em `src/routes/` (não `src/pages/`)
- Layout `_authenticated/` protege rotas logadas; `/auth` pública
- Reads via `useSuspenseQuery` + `ensureQueryData` em loaders
- Trigger `gerar_numero_chamado` mantido (formato `SD-00001`)
- SLA calculado no insert via trigger a partir da prioridade

## Fase 1 (este ciclo)
1. Habilita Lovable Cloud
2. Cria migration completa com schema + seeds
3. Configura Auth (e-mail/senha) e página `/auth`
4. Estrutura base do frontend: layout, rotas protegidas, contextos

## Fase 2 (ciclos seguintes)
5. CRUD de chamados end-to-end
6. Comentários, anexos, notificações
7. Dashboard, base de conhecimento
8. Integração Teams + Email M365 (quando você fornecer as credenciais Graph)

Confirma que posso iniciar a Fase 1?
