-- =============================================================
-- NextSM — Fundação do Assistente IA
-- Cria as estruturas consumidas pelas migrations de IA posteriores.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Nova conversa IA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id
  ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at
  ON public.ai_conversations(updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem visualizar suas conversas" ON public.ai_conversations;
CREATE POLICY "Usuários podem visualizar suas conversas"
ON public.ai_conversations FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin','atendente']::public.app_role[])
);

DROP POLICY IF EXISTS "Usuários podem criar suas conversas" ON public.ai_conversations;
CREATE POLICY "Usuários podem criar suas conversas"
ON public.ai_conversations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem atualizar suas conversas" ON public.ai_conversations;
CREATE POLICY "Usuários podem atualizar suas conversas"
ON public.ai_conversations FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem excluir suas conversas" ON public.ai_conversations;
CREATE POLICY "Usuários podem excluir suas conversas"
ON public.ai_conversations FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id
  ON public.ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id
  ON public.ai_messages(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem visualizar suas mensagens" ON public.ai_messages;
CREATE POLICY "Usuários podem visualizar suas mensagens"
ON public.ai_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND (
        c.user_id = auth.uid()
        OR public.has_any_role(auth.uid(), ARRAY['admin','atendente']::public.app_role[])
      )
  )
);

DROP POLICY IF EXISTS "Usuários podem inserir suas mensagens" ON public.ai_messages;
CREATE POLICY "Usuários podem inserir suas mensagens"
ON public.ai_messages FOR INSERT TO authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND (
        c.user_id = auth.uid()
        OR public.has_any_role(auth.uid(), ARRAY['admin','atendente']::public.app_role[])
      )
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar suas mensagens" ON public.ai_messages;
CREATE POLICY "Usuários podem atualizar suas mensagens"
ON public.ai_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuários podem excluir suas mensagens" ON public.ai_messages;
CREATE POLICY "Usuários podem excluir suas mensagens"
ON public.ai_messages FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.ai_conversations_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER trg_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION public.ai_conversations_touch_updated_at();

REVOKE ALL ON FUNCTION public.ai_conversations_touch_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_conversations_touch_updated_at() TO service_role;
