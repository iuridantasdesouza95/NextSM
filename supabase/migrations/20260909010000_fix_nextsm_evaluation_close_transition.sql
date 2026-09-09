-- Keep the workflow state machine compatible with the mandatory evaluation flow.
-- Generic updates cannot close a ticket; only the evaluation RPC can move
-- resolvido -> fechado by writing avaliacao_nota in the same UPDATE.

create or replace function public.validar_transicao_chamado()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  actor_id uuid;
  actor_is_manager boolean := false;
  elapsed interval;
begin
  if old.status is not distinct from new.status then return new; end if;
  if pg_trigger_depth() > 1 then return new; end if;

  actor_id := nullif(current_setting('nextsm.actor_id', true), '')::uuid;
  if actor_id is null then actor_id := auth.uid(); end if;
  if actor_id is null then
    raise exception 'Não foi possível identificar o responsável pela alteração de status';
  end if;

  if new.status = 'fechado' then
    if old.status <> 'resolvido' then
      raise exception 'O chamado só pode ser fechado a partir de resolvido após avaliação';
    end if;
    if actor_id is distinct from old.solicitante_id then
      raise exception 'Somente o solicitante pode fechar o chamado por avaliação';
    end if;
    if new.avaliacao_nota is null then
      raise exception 'O chamado só pode ser fechado após a avaliação do solicitante';
    end if;
  end if;

  if new.status = 'reaberto' then
    if actor_id is distinct from old.solicitante_id then
      raise exception 'Somente o solicitante pode reabrir o chamado';
    end if;
    if old.status <> 'fechado' or old.fechado_em is null then
      raise exception 'Somente chamados fechados podem ser reabertos';
    end if;
    elapsed := now() - old.fechado_em;
    if elapsed > interval '48 hours' then
      raise exception 'O prazo de 48 horas para reabertura expirou';
    end if;
  end if;

  if new.status = 'cancelado' then
    select exists(
      select 1 from public.user_roles ur
      where ur.user_id = actor_id and ur.role in ('gestor','admin')
    ) into actor_is_manager;
    if not actor_is_manager then
      raise exception 'Somente gestor ou admin pode cancelar chamados';
    end if;
  end if;

  if not (
    (old.status='aberto' and new.status in ('em_andamento','cancelado')) or
    (old.status='em_triagem' and new.status in ('aberto','cancelado')) or
    (old.status='em_andamento' and new.status in ('aguardando_usuario','aguardando_terceiro','resolvido','cancelado')) or
    (old.status='aguardando_usuario' and new.status in ('em_andamento','resolvido','cancelado')) or
    (old.status='aguardando_terceiro' and new.status in ('em_andamento','resolvido','cancelado')) or
    (old.status='resolvido' and new.status='fechado') or
    (old.status='fechado' and new.status='reaberto') or
    (old.status='reaberto' and new.status='em_andamento')
  ) then
    raise exception 'Transição de status não permitida: % -> %', old.status, new.status;
  end if;

  if new.status='resolvido' and new.atendente_id is null then
    raise exception 'Um chamado precisa de atendente para ser resolvido';
  end if;

  if old.status<>'aguardando_terceiro' and new.status='aguardando_terceiro' then
    if not coalesce(old.sla_pausado,false) and old.prazo_resolucao is not null then
      new.sla_tempo_restante_segundos := greatest(0,extract(epoch from (old.prazo_resolucao-now()))::bigint);
    end if;
    new.sla_pausado := true;
    new.sla_pausado_em := now();
  elsif old.status='aguardando_terceiro' and new.status='em_andamento' then
    if old.sla_tempo_restante_segundos is not null then
      new.prazo_resolucao := now()+make_interval(secs=>greatest(0,old.sla_tempo_restante_segundos));
    end if;
    new.sla_tempo_restante_segundos := null;
    new.sla_pausado := false;
    new.sla_pausado_em := null;
  end if;

  if new.status in ('resolvido','cancelado') then
    new.sla_pausado := false;
  end if;

  return new;
end;
$$;

revoke execute on function public.validar_transicao_chamado() from public, anon, authenticated;
grant execute on function public.validar_transicao_chamado() to service_role;
