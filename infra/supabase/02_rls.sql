-- RLS (Row Level Security) e políticas de acesso

-- Users
alter table public.users enable row level security;

drop policy if exists users_self_select on public.users;
create policy users_self_select
on public.users for select
to authenticated
using (id = auth.uid());

drop policy if exists users_self_update on public.users;
create policy users_self_update
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Templates (leitura pública)
alter table public.templates enable row level security;

drop policy if exists templates_public_read on public.templates;
create policy templates_public_read
on public.templates for select
to anon, authenticated
using (true);

-- Resumes (proprietário)
alter table public.resumes enable row level security;

drop policy if exists resumes_owner_select on public.resumes;
create policy resumes_owner_select
on public.resumes for select
to authenticated
using (user_id = auth.uid());

drop policy if exists resumes_owner_insert on public.resumes;
create policy resumes_owner_insert
on public.resumes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists resumes_owner_update on public.resumes;
create policy resumes_owner_update
on public.resumes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists resumes_owner_delete on public.resumes;
create policy resumes_owner_delete
on public.resumes for delete
to authenticated
using (user_id = auth.uid());

-- Leitura pública opcional por is_public (sem token)
drop policy if exists resumes_public_read on public.resumes;
create policy resumes_public_read
on public.resumes for select
to anon
using (is_public = true);

-- Exports (proprietário)
alter table public.exports enable row level security;

drop policy if exists exports_owner_select on public.exports;
create policy exports_owner_select
on public.exports for select
to authenticated
using (user_id = auth.uid());

drop policy if exists exports_owner_insert on public.exports;
create policy exports_owner_insert
on public.exports for insert
to authenticated
with check (user_id = auth.uid());

-- Trigger para criar public.users na inscrição
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


