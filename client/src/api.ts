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

/** Foto como la maneja el formulario: ya subida (url) o por subir (file). */
export type FotoEntrada = { url: string } | { file: File };

export function validarFoto(file: File): string | null {
  if (!ALLOWED_MIME.includes(file.type))
    return 'Formato de imagen no permitido (usa JPG, PNG, WebP, GIF o AVIF)';
  if (file.size > MAX_PHOTO_BYTES) return `“${file.name}” supera el límite de 5 MB`;
  return null;
}

/** Fila cruda de la tabla, tolerando el esquema viejo (photo única, sin industry). */
interface ItemRow {
  id: string;
  title: string;
  artist: string;
  industry?: string;
  format: Item['format'];
  price: number | string;
  notes: string;
  photos?: string[] | null;
  photo?: string | null;
  condition: number;
  created_at: string;
}

function normalizar(row: ItemRow): Item {
  const photos =
    Array.isArray(row.photos) && row.photos.length > 0
      ? row.photos
      : row.photo
        ? [row.photo]
        : [];
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    industry: row.industry ?? '',
    format: row.format,
    price: Number(row.price),
    notes: row.notes,
    photos,
    condition: Number(row.condition),
    created_at: row.created_at,
  };
}

export async function fetchItems(params: { q?: string; format?: string }): Promise<Item[]> {
  let query = supabase.from('items').select('*').order('created_at', { ascending: false });
  if (params.format) query = query.eq('format', params.format);
  if (params.q) {
    const like = `%${sanitizar(params.q)}%`;
    query = query.or(
      `title.ilike.${like},artist.ilike.${like},industry.ilike.${like},notes.ilike.${like}`,
    );
  }
  const { data, error } = await query;
  if (error) throw traducirError(error, 'No se pudo cargar el catálogo');
  return (data ?? []).map(normalizar);
}

/** Sube una foto al bucket y devuelve su URL pública. */
async function uploadPhoto(file: File): Promise<string> {
  const invalido = validarFoto(file);
  if (invalido) throw new Error(invalido);

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
function photoPath(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

async function removePhotos(urls: string[]): Promise<void> {
  const paths = urls.map(photoPath).filter((p): p is string => p !== null);
  if (!paths.length) return;
  await supabase.storage.from(BUCKET).remove(paths);
}

/** Sube las fotos nuevas y devuelve la lista de URLs en el orden dado. */
async function resolverFotos(fotos: FotoEntrada[]): Promise<string[]> {
  const urls: string[] = [];
  for (const foto of fotos) {
    urls.push('file' in foto ? await uploadPhoto(foto.file) : foto.url);
  }
  return urls;
}

export async function createItem(fields: ItemFields, fotos: FotoEntrada[] = []): Promise<Item> {
  const photos = await resolverFotos(fotos);
  const { data, error } = await supabase
    .from('items')
    .insert({ ...fields, photos })
    .select()
    .single();
  if (error) {
    if (photos.length) await removePhotos(photos);
    throw traducirError(error, 'No se pudo guardar el ítem');
  }
  return data as Item;
}

export async function updateItem(
  original: Item,
  fields: ItemFields,
  fotos: FotoEntrada[],
): Promise<Item> {
  const photos = await resolverFotos(fotos);

  // Borra del bucket las fotos que el usuario quitó de la lista
  const conservadas = new Set(fotos.filter((f) => 'url' in f).map((f) => f.url));
  const porBorrar = original.photos.filter((u) => !conservadas.has(u));
  if (porBorrar.length) await removePhotos(porBorrar);

  const { data, error } = await supabase
    .from('items')
    .update({ ...fields, photos })
    .eq('id', original.id)
    .select()
    .single();
  if (error) throw traducirError(error, 'No se pudo actualizar el ítem');
  return data as Item;
}

export async function deleteItem(item: Item): Promise<void> {
  await removePhotos(item.photos);
  const { error } = await supabase.from('items').delete().eq('id', item.id);
  if (error) throw traducirError(error, 'No se pudo eliminar el ítem');
}
