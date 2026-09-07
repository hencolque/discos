import type { Item, ItemFields } from './types';
import { BUCKET, supabase } from './supabase';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function traducirError(error: { message: string }, fallback: string): Error {
  return new Error(error.message || fallback);
}

/** Buscador: PostgREST rechaza comas y paréntesis dentro de .or(); los quitamos. */
function sanitizar(q: string): string {
  return q.replace(/[,()]/g, ' ').trim();
}

export async function fetchItems(params: { q?: string; format?: string }): Promise<Item[]> {
  let query = supabase.from('items').select('*').order('created_at', { ascending: false });
  if (params.format) query = query.eq('format', params.format);
  if (params.q) {
    const like = `%${sanitizar(params.q)}%`;
    query = query.or(`title.ilike.${like},artist.ilike.${like},notes.ilike.${like}`);
  }
  const { data, error } = await query;
  if (error) throw traducirError(error, 'No se pudo cargar el catálogo');
  return (data ?? []) as Item[];
}

/** Sube la foto al bucket y devuelve su URL pública. */
async function uploadPhoto(file: File): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type))
    throw new Error('Formato de imagen no permitido (usa JPG, PNG, WebP, GIF o AVIF)');
  if (file.size > MAX_PHOTO_BYTES) throw new Error('La imagen supera el límite de 5 MB');

  const ext = file.type === 'image/jpeg' ? 'jpg' : (file.type.split('/')[1] ?? 'bin');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  });
  if (error) throw traducirError(error, 'No se pudo subir la foto');

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Extrae la ruta dentro del bucket a partir de una URL pública. */
function photoPath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;
  const marker = `/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

async function removePhoto(publicUrl: string | null): Promise<void> {
  const path = photoPath(publicUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function createItem(fields: ItemFields, file: File | null): Promise<Item> {
  const photo = file ? await uploadPhoto(file) : null;
  const { data, error } = await supabase.from('items').insert({ ...fields, photo }).select().single();
  if (error) {
    if (photo) await removePhoto(photo);
    throw traducirError(error, 'No se pudo guardar el ítem');
  }
  return data as Item;
}

export async function updateItem(
  original: Item,
  fields: ItemFields,
  file: File | null,
): Promise<Item> {
  let photo = original.photo;
  if (file) {
    const nueva = await uploadPhoto(file);
    await removePhoto(original.photo);
    photo = nueva;
  }
  const { data, error } = await supabase
    .from('items')
    .update({ ...fields, photo })
    .eq('id', original.id)
    .select()
    .single();
  if (error) throw traducirError(error, 'No se pudo actualizar el ítem');
  return data as Item;
}

export async function deleteItem(item: Item): Promise<void> {
  await removePhoto(item.photo);
  const { error } = await supabase.from('items').delete().eq('id', item.id);
  if (error) throw traducirError(error, 'No se pudo eliminar el ítem');
}
