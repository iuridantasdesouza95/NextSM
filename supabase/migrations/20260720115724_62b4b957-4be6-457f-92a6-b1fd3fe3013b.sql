
ALTER TABLE public.chamados ADD CONSTRAINT chamados_solicitante_profile_fkey FOREIGN KEY (solicitante_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chamados ADD CONSTRAINT chamados_atendente_profile_fkey FOREIGN KEY (atendente_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.comentarios_chamado ADD CONSTRAINT comentarios_chamado_autor_profile_fkey FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.anexos_chamado ADD CONSTRAINT anexos_chamado_autor_profile_fkey FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.historico_chamado ADD CONSTRAINT historico_chamado_autor_profile_fkey FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
