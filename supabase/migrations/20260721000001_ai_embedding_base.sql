-- NextSM — preparação de embeddings da Base de Conhecimento
-- A migration 20260803123011 cria índices e busca vetorial sobre esta coluna.

ALTER TABLE public.base_conhecimento
  ADD COLUMN IF NOT EXISTS embedding vector(1536);
