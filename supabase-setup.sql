-- ═══════════════════════════════════════════════════════════════
-- Setup de Supabase para "Discoteca"
-- Pega y ejecuta este archivo completo en:
--   Supabase → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

-- 1) Tabla de ítems de la colección
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  artist      text not null default '',
  format      text not null,
  price       double precision not null default 0,
  notes       text not null default '',
  photo       text,
  condition   int not null default 8,
  created_at  timestamptz not null default now()
);

-- 2) Seguridad a nivel de fila (RLS)
--    ⚠ Estas políticas permiten que CUALQUIERA con la URL lea y edite.
--    Para restringir la edición solo a ti, configura Supabase Auth y
--    reemplaza `using (true)` por `using (auth.role() = 'authenticated')`.
alter table public.items enable row level security;

drop policy if exists "acceso publico items" on public.items;
create policy "acceso publico items"
  on public.items
  for all
  using (true)
  with check (true);

-- 3) Bucket público para las fotos
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "lectura publica fotos" on storage.objects;
drop policy if exists "escritura fotos" on storage.objects;
drop policy if exists "borrado fotos" on storage.objects;

create policy "lectura publica fotos"
  on storage.objects for select
  using (bucket_id = 'fotos');

create policy "escritura fotos"
  on storage.objects for insert
  with check (bucket_id = 'fotos');

create policy "borrado fotos"
  on storage.objects for delete
  using (bucket_id = 'fotos');
