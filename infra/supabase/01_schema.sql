-- Schema base do HireWerk (gratuito no Supabase)
-- Execute no SQL Editor do projeto Supabase

create schema if not exists public;

-- Tabela de perfis (espelha auth.users.id)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Tabela de templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  html_template text,
  css text,
  preview_image_url text,
  version text default '1.0.0',
  is_default boolean not null default false,
  schema jsonb
);

-- Tabela de currículos
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default '',
  template_id uuid references public.templates(id),
  data jsonb not null default '{}',
  locale text default 'pt-BR',
  is_public boolean not null default false,
  share_token text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists resumes_user_id_idx on public.resumes(user_id);
create index if not exists resumes_user_updated_idx on public.resumes(user_id, updated_at desc);

-- Histórico de exportações
create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  format text not null default 'pdf',
  storage_path text,
  status text not null default 'queued', -- queued|running|succeeded|failed
  error text,
  duration_ms integer,
  size_bytes integer,
  checksum text,
  engine text, -- puppeteer|playwright|client
  created_at timestamptz not null default now()
);

create index if not exists exports_resume_idx on public.exports(resume_id);
create index if not exists exports_user_created_idx on public.exports(user_id, created_at desc);

-- Trigger para atualizar updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists set_updated_at on public.resumes;
create trigger set_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();


