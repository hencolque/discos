-- ═══════════════════════════════════════════════════════════════
-- Migración de esquema: varias fotos + industria
-- Para proyectos de Supabase creados con la versión anterior.
-- Pega y ejecuta en: Supabase → SQL Editor → Run
-- (En instalaciones nuevas no hace falta: supabase-setup.sql ya
--  crea el esquema actualizado.)
-- ═══════════════════════════════════════════════════════════════

-- 1) Nueva columna "industry" (sello / editorial / país)
alter table public.items add column if not exists industry text not null default '';

-- 2) Nueva columna "photos" (arreglo de URLs; la primera es la portada)
alter table public.items add column if not exists photos text[] not null default '{}';

-- 3) Migrar la foto única antigua al arreglo (solo si aún no se migró)
update public.items
set photos = array[photo]
where photo is not null and cardinality(photos) = 0;

-- 4) La columna antigua ya no se usa
alter table public.items drop column if exists photo;
