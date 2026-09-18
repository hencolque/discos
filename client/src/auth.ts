import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Rol = 'admin' | 'viewer';

export interface SesionInfo {
  session: Session;
  rol: Rol;
  email: string;
}

async function cargarRol(userId: string): Promise<Rol> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role === 'admin' ? 'admin' : 'viewer';
}

/** Devuelve la sesión actual con su rol, o null si nadie ha iniciado sesión. */
export async function cargarSesion(): Promise<SesionInfo | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const rol = await cargarRol(session.user.id);
  return { session, rol, email: session.user.email ?? '' };
}

const ERRORES_LOGIN: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Email not confirmed': 'El correo aún no fue confirmado',
};

export async function iniciarSesion(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return;
  throw new Error(ERRORES_LOGIN[error.message] ?? error.message);
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

/** Suscripción a cambios de sesión (login/cerrar sesión en esta u otra pestaña). */
export function onCambioSesion(cb: (sesion: SesionInfo | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
    if (!session?.user) {
      cb(null);
      return;
    }
    cargarRol(session.user.id).then((rol) =>
      cb({ session, rol, email: session.user!.email ?? '' }),
    );
  });
  return () => data.subscription.unsubscribe();
}
