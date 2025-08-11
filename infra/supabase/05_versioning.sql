-- Versionamento seguro de resumes: trigger de incremento + snapshot e RLS
-- Execute no SQL Editor do Supabase (ou via pipeline de migrations)

-- 1) Substitui trigger de updated_at por trigger que também incrementa a versão
create or replace function public.set_resumes_version_and_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- Sempre atualiza updated_at
  new.updated_at = now();

  -- Em updates, incrementa version quando campos de conteúdo mudarem
  if TG_OP = 'UPDATE' then
    if coalesce(new.title, '') is distinct from coalesce(old.title, '')
       or new.data is distinct from old.data
       or new.template_id is distinct from old.template_id
       or coalesce(new.locale, '') is distinct from coalesce(old.locale, '') then
      new.version = coalesce(old.version, 1) + 1;
    end if;
  end if;

  return new;
end;
$$;

-- Remove trigger antigo de updated_at (se existir) e cria o novo
drop trigger if exists set_updated_at on public.resumes;
create trigger set_resumes_version_and_updated_at
before update on public.resumes
for each row execute function public.set_resumes_version_and_updated_at();


-- 2) Tabela de snapshots de versões
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  version integer not null,
  title text not null default '',
  template_id uuid,
  data jsonb not null,
  locale text,
  created_at timestamptz not null default now()
);

create index if not exists resume_versions_resume_idx on public.resume_versions(resume_id, version desc);

-- 3) Trigger AFTER UPDATE para snapshot quando a versão mudar
create or replace function public.snapshot_resume_version()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' then
    if new.version is distinct from old.version then
      insert into public.resume_versions (resume_id, user_id, version, title, template_id, data, locale)
      values (new.id, new.user_id, new.version, new.title, new.template_id, new.data, new.locale);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_resumes_snapshot_version on public.resumes;
create trigger on_resumes_snapshot_version
after update on public.resumes
for each row execute procedure public.snapshot_resume_version();

-- 4) RLS para resume_versions (somente leitura pelo dono)
alter table public.resume_versions enable row level security;

drop policy if exists resume_versions_owner_select on public.resume_versions;
create policy resume_versions_owner_select
on public.resume_versions for select
to authenticated
using (user_id = auth.uid());

-- 5) exports: guardar a versão do currículo no histórico
alter table public.exports add column if not exists resume_version integer;
create index if not exists exports_resume_version_idx on public.exports(resume_id, resume_version desc);
