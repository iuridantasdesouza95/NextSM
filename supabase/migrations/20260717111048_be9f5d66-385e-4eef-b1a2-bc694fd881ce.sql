
-- Storage policies para bucket chamados-anexos
-- Convenção de path: {chamado_id}/{uuid}-{filename}

CREATE POLICY "Ler anexos do chamado (storage)"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chamados-anexos'
  AND EXISTS (
    SELECT 1 FROM public.chamados c
    WHERE c.id::text = split_part(name, '/', 1)
      AND (c.solicitante_id = auth.uid()
        OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]))
  )
);

CREATE POLICY "Enviar anexo do chamado (storage)"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chamados-anexos'
  AND owner = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chamados c
    WHERE c.id::text = split_part(name, '/', 1)
      AND (c.solicitante_id = auth.uid()
        OR public.has_any_role(auth.uid(), ARRAY['atendente','gestor','admin']::public.app_role[]))
  )
);

CREATE POLICY "Remover anexo do chamado (storage)"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chamados-anexos'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
);
