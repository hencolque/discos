import { createClient } from '@supabase/supabase-js';

// Estas claves se leen de client/.env.local (dev) o de las variables de Vercel (prod).
// La anon key es pública por diseño: la seguridad la dan las políticas RLS de Supabase.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const BUCKET = 'fotos';

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'sin-configurar');
