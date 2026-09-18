-- ═══════════════════════════════════════════════════════════════
-- Migración: login con roles (admin / viewer)
-- Ejecuta en: Supabase → SQL Editor → Run
-- Es idempotente: puedes ejecutarla varias veces sin romper nada.
-- ═══════════════════════════════════════════════════════════════

-- 1) Perfiles con rol (uno por usuario de autenticación)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "leer propio perfil" on public.profiles;
create policy "leer propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- 2) Función auxiliar: evita recursión de RLS al consultar perfiles
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3) Perfil automático para cada usuario nuevo
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- 4) Ítems: lectura para cualquier usuario autenticado;
--    escritura y borrado solo para admin.
--    (Reemplaza la política abierta "acceso publico items".)
drop policy if exists "acceso publico items" on public.items;
drop policy if exists "lectura items" on public.items;
create policy "lectura items"
  on public.items for select
  using (auth.role() = 'authenticated');

drop policy if exists "insercion items" on public.items;
create policy "insercion items"
  on public.items for insert
  with check (public.is_admin());

drop policy if exists "actualizacion items" on public.items;
create policy "actualizacion items"
  on public.items for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "borrado items" on public.items;
create policy "borrado items"
  on public.items for delete
  using (public.is_admin());

-- 5) Fotos: la lectura pública se queda (las etiquetas <img> no envían
--    token); subir y borrar solo admin.
drop policy if exists "escritura fotos" on storage.objects;
create policy "escritura fotos"
  on storage.objects for insert
  with check (bucket_id = 'fotos' and public.is_admin());

drop policy if exists "borrado fotos" on storage.objects;
create policy "borrado fotos"
  on storage.objects for delete
  using (bucket_id = 'fotos' and public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- 6) PROMOVERTE A ADMIN (edita el correo y descomenta):
--
-- update public.profiles p
-- set role = 'admin'
-- from auth.users u
-- where u.id = p.id and u.email = 'tu-correo@ejemplo.com';
--
-- 7) CREAR USUARIOS: Supabase → Authentication → Users → Add user
--    (define tú la contraseña; no hay registro público en la web).
-- ═══════════════════════════════════════════════════════════════
