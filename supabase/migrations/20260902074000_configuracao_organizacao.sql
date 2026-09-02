-- ============================================================
-- Configuração da organização / identidade do produto
--
-- Esta tabela concentra dados que não devem ficar hardcoded
-- no código da aplicação. Mantém os valores atuais da Vemplast
-- como defaults para preservar o comportamento em produção.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.configuracao_organizacao (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  nome_exibicao VARCHAR(150) NOT NULL DEFAULT 'Vemplast',
  nome_assistente VARCHAR(150) NOT NULL DEFAULT 'Assistente Inteligente',
  timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
  horario_comercial_inicio TIME NOT NULL DEFAULT '08:00',
  horario_comercial_fim TIME NOT NULL DEFAULT '18:00',
  dias_uteis SMALLINT[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5]::SMALLINT[],
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT configuracao_organizacao_singleton_chk CHECK (id = 1),
  CONSTRAINT configuracao_organizacao_horario_chk CHECK (horario_comercial_inicio < horario_comercial_fim),
  CONSTRAINT configuracao_organizacao_dias_uteis_chk CHECK (
    cardinality(dias_uteis) > 0
    AND dias_uteis <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]
  )
);

-- Uma única configuração por instalação.
INSERT INTO public.configuracao_organizacao (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Leitura para usuários autenticados; alterações ficam restritas
-- ao service_role nesta primeira etapa.
GRANT SELECT ON public.configuracao_organizacao TO authenticated;
GRANT ALL ON public.configuracao_organizacao TO service_role;

ALTER TABLE public.configuracao_organizacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios consultam configuracao da organizacao" ON public.configuracao_organizacao;
CREATE POLICY "Usuarios consultam configuracao da organizacao"
  ON public.configuracao_organizacao
  FOR SELECT
  TO authenticated
  USING (TRUE);
