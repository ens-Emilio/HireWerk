-- Seed de templates básicos do HireWerk
-- Execute no SQL Editor do Supabase (rodar com segurança múltiplas vezes)

insert into public.templates (slug, name, is_default, version, preview_image_url)
values
  ('classic', 'Clássico', true, '1.0.0', '/templates/classic.svg'),
  ('modern', 'Moderno', false, '1.0.0', '/templates/modern.svg'),
  ('minimal', 'Minimal', false, '1.0.0', '/templates/minimal.svg')
on conflict (slug) do update set
  name = excluded.name,
  is_default = excluded.is_default,
  version = excluded.version,
  preview_image_url = coalesce(excluded.preview_image_url, public.templates.preview_image_url);

-- Opcional: exemplo de schema de dados esperado (pode ser usado por validações futuras)
update public.templates
set schema = jsonb_build_object(
  'fields', jsonb_build_array(
    jsonb_build_object('key','name','type','string','max',120),
    jsonb_build_object('key','headline','type','string','max',200),
    jsonb_build_object('key','summary','type','string','max',2000),
    jsonb_build_object('key','skills','type','string[]','maxItems',50,'itemMax',60)
  )
)
where slug in ('classic','modern','minimal');
