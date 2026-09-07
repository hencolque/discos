-- Datos existentes de tu colección (exportados de la BD local antes de migrar a Supabase).
-- Ejecuta este archivo en el SQL Editor de Supabase DESPUÉS de supabase-setup.sql.
-- Nota: la foto no se migra automáticamente; edítalo desde la web y vuelve a subirla.

INSERT INTO public.items (title, artist, format, price, notes, condition) VALUES
  ('Paso A Paso', 'Sin Fronteras', 'CD', 50, '', 8);
