
-- =============================================================
-- SERVICE DESK VEMPLAST — Schema (Lovable Cloud)
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('colaborador','atendente','gestor','admin');
CREATE TYPE public.prioridade_chamado AS ENUM ('baixa','media','alta','critica');
CREATE TYPE public.status_chamado AS ENUM (
  'aberto','em_andamento','aguardando_usuario','aguardando_terceiro','resolvido','fechado','cancelado'
);
CREATE TYPE public.tipo_notificacao AS ENUM (
  'chamado_aberto','chamado_atribuido','comentario_adicionado','status_alterado',
  'sla_proximo','sla_vencido','chamado_resolvido'
);

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  departamento VARCHAR(100),
  ramal VARCHAR(20),
  avatar_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_ativo ON public.profiles(ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

-- Profiles policies
CREATE POLICY "Usuário vê próprio perfil" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Atendente/gestor/admin veem todos perfis" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]));
CREATE POLICY "Usuário atualiza próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin gerencia perfis" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Usuário vê próprios papéis" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin vê todos papéis" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia papéis" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, departamento)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'departamento'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'colaborador')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== CATEGORIAS ==========
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  parent_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  icone VARCHAR(50),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_categorias_parent ON public.categorias(parent_id);
CREATE INDEX idx_categorias_ativo ON public.categorias(ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem categorias" ON public.categorias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia categorias" ON public.categorias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.categorias (nome, descricao, ordem) VALUES
('Suporte', 'Rede, servidores, VPN e conectividade, Go To, Telefonia, Celulares', 1),
('Acesso e Permissões', 'Acesso a e-mail, acesso sistemas, acesso Teams, bloqueio de acessos por desligamento, novos acessos por contratação', 2),
('Hardware', 'Computadores, impressoras, celulares, telefonia', 3),
('Sistemas', 'Erros, novas solicitações e atualizações', 4),
('Projetos', 'Novos projetos, melhorias e correções', 5),
('RH', 'Benefícios, férias, documentação, desligamento e nova contratação', 6),
('Financeiro', 'Reembolsos, notas fiscais e pagamentos', 7);

-- ========== SUBCATEGORIAS ==========
CREATE TABLE public.subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subcategorias_categoria ON public.subcategorias(categoria_id);
CREATE INDEX idx_subcategorias_ativo ON public.subcategorias(ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategorias TO authenticated;
GRANT ALL ON public.subcategorias TO service_role;
ALTER TABLE public.subcategorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem subcategorias" ON public.subcategorias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia subcategorias" ON public.subcategorias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Suporte
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Internet / Rede',1 FROM public.categorias WHERE nome='Suporte';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Telefonia',2 FROM public.categorias WHERE nome='Suporte';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Celular Corporativo',3 FROM public.categorias WHERE nome='Suporte';
-- Acesso
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Acesso E-mail',1 FROM public.categorias WHERE nome='Acesso e Permissões';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Acesso Sistema',2 FROM public.categorias WHERE nome='Acesso e Permissões';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Acesso Teams',3 FROM public.categorias WHERE nome='Acesso e Permissões';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Novo Usuário',4 FROM public.categorias WHERE nome='Acesso e Permissões';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Bloqueio Usuário',5 FROM public.categorias WHERE nome='Acesso e Permissões';
-- Hardware
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Notebook',1 FROM public.categorias WHERE nome='Hardware';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Impressora',2 FROM public.categorias WHERE nome='Hardware';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Monitor',3 FROM public.categorias WHERE nome='Hardware';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Mouse / Teclado',4 FROM public.categorias WHERE nome='Hardware';
-- Sistemas
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Erro',1 FROM public.categorias WHERE nome='Sistemas';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Nova Solicitação',2 FROM public.categorias WHERE nome='Sistemas';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Atualização',3 FROM public.categorias WHERE nome='Sistemas';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Relatórios',4 FROM public.categorias WHERE nome='Sistemas';
-- Projetos
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Novo Projeto',1 FROM public.categorias WHERE nome='Projetos';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Melhoria',2 FROM public.categorias WHERE nome='Projetos';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Correção',3 FROM public.categorias WHERE nome='Projetos';
-- RH
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Férias',1 FROM public.categorias WHERE nome='RH';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Benefícios',2 FROM public.categorias WHERE nome='RH';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Admissão',3 FROM public.categorias WHERE nome='RH';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Desligamento',4 FROM public.categorias WHERE nome='RH';
-- Financeiro
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Reembolso',1 FROM public.categorias WHERE nome='Financeiro';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Nota Fiscal',2 FROM public.categorias WHERE nome='Financeiro';
INSERT INTO public.subcategorias (categoria_id,nome,ordem) SELECT id,'Pagamento',3 FROM public.categorias WHERE nome='Financeiro';

-- ========== SLAS ==========
CREATE TABLE public.slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  prioridade public.prioridade_chamado NOT NULL UNIQUE,
  tempo_resposta_h INT NOT NULL,
  tempo_resolucao_h INT NOT NULL,
  horario_comercial BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slas TO authenticated;
GRANT ALL ON public.slas TO service_role;
ALTER TABLE public.slas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem slas" ON public.slas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia slas" ON public.slas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.slas (nome, prioridade, tempo_resposta_h, tempo_resolucao_h) VALUES
('SLA Baixa','baixa',24,72),
('SLA Média','media',8,24),
('SLA Alta','alta',4,8),
('SLA Crítica','critica',1,4);

-- ========== CHAMADOS ==========
CREATE SEQUENCE public.chamado_seq START 1;

CREATE TABLE public.chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(250) NOT NULL,
  descricao TEXT NOT NULL,
  prioridade public.prioridade_chamado NOT NULL DEFAULT 'media',
  status public.status_chamado NOT NULL DEFAULT 'aberto',
  solicitante_id UUID NOT NULL REFERENCES auth.users(id),
  atendente_id UUID REFERENCES auth.users(id),
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  subcategoria_id UUID REFERENCES public.subcategorias(id) ON DELETE SET NULL,
  sla_id UUID REFERENCES public.slas(id) ON DELETE SET NULL,
  aberto_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respondido_em TIMESTAMPTZ,
  resolvido_em TIMESTAMPTZ,
  fechado_em TIMESTAMPTZ,
  prazo_resposta TIMESTAMPTZ,
  prazo_resolucao TIMESTAMPTZ,
  sla_resposta_violado BOOLEAN NOT NULL DEFAULT FALSE,
  sla_resolucao_violado BOOLEAN NOT NULL DEFAULT FALSE,
  avaliacao_nota SMALLINT CHECK (avaliacao_nota BETWEEN 1 AND 5),
  avaliacao_comentario TEXT,
  tags TEXT[],
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chamados_status ON public.chamados(status);
CREATE INDEX idx_chamados_prioridade ON public.chamados(prioridade);
CREATE INDEX idx_chamados_solicitante ON public.chamados(solicitante_id);
CREATE INDEX idx_chamados_atendente ON public.chamados(atendente_id);
CREATE INDEX idx_chamados_categoria ON public.chamados(categoria_id);
CREATE INDEX idx_chamados_subcategoria ON public.chamados(subcategoria_id);
CREATE INDEX idx_chamados_aberto_em ON public.chamados(aberto_em DESC);
CREATE INDEX idx_chamados_tags ON public.chamados USING GIN(tags);
CREATE INDEX idx_chamados_fts ON public.chamados USING GIN (to_tsvector('portuguese', titulo || ' ' || descricao));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados TO authenticated;
GRANT ALL ON public.chamados TO service_role;
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

-- Numeração + SLA + prazos + updated_at
CREATE OR REPLACE FUNCTION public.chamado_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sla public.slas%ROWTYPE;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'SD-' || LPAD(nextval('public.chamado_seq')::TEXT, 5, '0');
  END IF;

  SELECT * INTO v_sla FROM public.slas WHERE prioridade = NEW.prioridade;
  IF FOUND THEN
    NEW.sla_id := v_sla.id;
    NEW.prazo_resposta := COALESCE(NEW.prazo_resposta, NEW.aberto_em + (v_sla.tempo_resposta_h || ' hours')::interval);
    NEW.prazo_resolucao := COALESCE(NEW.prazo_resolucao, NEW.aberto_em + (v_sla.tempo_resolucao_h || ' hours')::interval);
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_chamado_before_insert
BEFORE INSERT ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.chamado_before_insert();

CREATE OR REPLACE FUNCTION public.tg_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em := NOW(); RETURN NEW; END; $$;
CREATE TRIGGER trg_chamados_updated BEFORE UPDATE ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.tg_atualizado_em();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_atualizado_em();

-- Chamados policies
CREATE POLICY "Solicitante vê próprios chamados" ON public.chamados
  FOR SELECT TO authenticated USING (auth.uid() = solicitante_id);
CREATE POLICY "Atendente/gestor/admin veem todos chamados" ON public.chamados
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]));
CREATE POLICY "Colaborador abre chamado" ON public.chamados
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = solicitante_id);
CREATE POLICY "Solicitante atualiza próprios chamados abertos" ON public.chamados
  FOR UPDATE TO authenticated
  USING (auth.uid() = solicitante_id AND status IN ('aberto','aguardando_usuario'))
  WITH CHECK (auth.uid() = solicitante_id);
CREATE POLICY "Atendente/gestor/admin atualizam chamados" ON public.chamados
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]));
CREATE POLICY "Admin exclui chamado" ON public.chamados
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== COMENTÁRIOS ==========
CREATE TABLE public.comentarios_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id),
  conteudo TEXT NOT NULL,
  interno BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comentarios_chamado ON public.comentarios_chamado(chamado_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comentarios_chamado TO authenticated;
GRANT ALL ON public.comentarios_chamado TO service_role;
ALTER TABLE public.comentarios_chamado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler comentários do chamado" ON public.comentarios_chamado
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_id
      AND (
        c.solicitante_id = auth.uid() AND interno = FALSE
        OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[])
      )
    )
  );
CREATE POLICY "Autor cria comentário no próprio chamado ou atendente/gestor/admin" ON public.comentarios_chamado
  FOR INSERT TO authenticated WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_id
      AND (c.solicitante_id = auth.uid()
           OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]))
    )
  );
CREATE POLICY "Autor edita próprio comentário" ON public.comentarios_chamado
  FOR UPDATE TO authenticated USING (autor_id = auth.uid()) WITH CHECK (autor_id = auth.uid());
CREATE POLICY "Admin exclui comentário" ON public.comentarios_chamado
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== ANEXOS ==========
CREATE TABLE public.anexos_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id),
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  content_type TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_anexos_chamado ON public.anexos_chamado(chamado_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anexos_chamado TO authenticated;
GRANT ALL ON public.anexos_chamado TO service_role;
ALTER TABLE public.anexos_chamado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler anexos do chamado" ON public.anexos_chamado
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_id
      AND (c.solicitante_id = auth.uid()
           OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]))
    )
  );
CREATE POLICY "Autor anexa no chamado" ON public.anexos_chamado
  FOR INSERT TO authenticated WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_id
      AND (c.solicitante_id = auth.uid()
           OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]))
    )
  );
CREATE POLICY "Autor remove próprio anexo" ON public.anexos_chamado
  FOR DELETE TO authenticated USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ========== HISTÓRICO ==========
CREATE TABLE public.historico_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id),
  acao VARCHAR(50) NOT NULL,
  de TEXT,
  para TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_historico_chamado ON public.historico_chamado(chamado_id);
GRANT SELECT, INSERT ON public.historico_chamado TO authenticated;
GRANT ALL ON public.historico_chamado TO service_role;
ALTER TABLE public.historico_chamado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler histórico do chamado" ON public.historico_chamado
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_id
      AND (c.solicitante_id = auth.uid()
           OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]))
    )
  );
CREATE POLICY "Sistema/usuário insere histórico" ON public.historico_chamado
  FOR INSERT TO authenticated WITH CHECK (autor_id IS NULL OR autor_id = auth.uid());

-- ========== NOTIFICAÇÕES ==========
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.tipo_notificacao NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT,
  chamado_id UUID REFERENCES public.chamados(id) ON DELETE CASCADE,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notificacoes_destinatario ON public.notificacoes(destinatario_id, lida);
GRANT SELECT, UPDATE, DELETE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Destinatário vê próprias notificações" ON public.notificacoes
  FOR SELECT TO authenticated USING (destinatario_id = auth.uid());
CREATE POLICY "Destinatário atualiza (marcar lida)" ON public.notificacoes
  FOR UPDATE TO authenticated USING (destinatario_id = auth.uid()) WITH CHECK (destinatario_id = auth.uid());
CREATE POLICY "Destinatário exclui própria notificação" ON public.notificacoes
  FOR DELETE TO authenticated USING (destinatario_id = auth.uid());

-- ========== BASE DE CONHECIMENTO ==========
CREATE TABLE public.base_conhecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(250) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  conteudo TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  autor_id UUID REFERENCES auth.users(id),
  publicado BOOLEAN NOT NULL DEFAULT FALSE,
  visualizacoes INT NOT NULL DEFAULT 0,
  tags TEXT[],
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bc_categoria ON public.base_conhecimento(categoria_id);
CREATE INDEX idx_bc_publicado ON public.base_conhecimento(publicado);
CREATE INDEX idx_bc_fts ON public.base_conhecimento USING GIN (to_tsvector('portuguese', titulo || ' ' || conteudo));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.base_conhecimento TO authenticated;
GRANT ALL ON public.base_conhecimento TO service_role;
ALTER TABLE public.base_conhecimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem artigos publicados" ON public.base_conhecimento
  FOR SELECT TO authenticated USING (
    publicado = TRUE
    OR autor_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[])
  );
CREATE POLICY "Atendente/gestor/admin criam artigo" ON public.base_conhecimento
  FOR INSERT TO authenticated WITH CHECK (
    autor_id = auth.uid()
    AND public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[])
  );
CREATE POLICY "Autor ou admin editam artigo" ON public.base_conhecimento
  FOR UPDATE TO authenticated
  USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Autor ou admin excluem artigo" ON public.base_conhecimento
  FOR DELETE TO authenticated USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_bc_updated BEFORE UPDATE ON public.base_conhecimento
FOR EACH ROW EXECUTE FUNCTION public.tg_atualizado_em();
