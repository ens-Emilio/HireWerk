-- Tabela e função de rate limit (por chave/janela)

create table if not exists public.rate_limits (
  key text not null,
  window bigint not null,
  count integer not null default 0,
  last_hit timestamptz not null default now(),
  primary key (key, window)
);

create index if not exists rate_limits_last_hit_idx on public.rate_limits(last_hit);

alter table public.rate_limits enable row level security;

-- Nenhum acesso para anon/authenticated por padrão (apenas service_role bypassa RLS)

create or replace function public.rate_limit_hit(
  p_key text,
  p_window bigint,
  p_limit integer
)
returns table(exceeded boolean, current_count integer)
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as rl (key, window, count)
  values (p_key, p_window, 1)
  on conflict (key, window)
  do update set count = rl.count + 1, last_hit = now()
  returning rl.count into v_count;

  return query select (v_count > p_limit) as exceeded, v_count as current_count;
end;
$$;


