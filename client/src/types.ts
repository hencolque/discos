export const FORMATS = [
  'CD',
  'Vinilo',
  'Cassette',
  'VHS',
  'DVD',
  'Blu-ray',
  'MiniDisc',
  'Otro',
] as const;

export type Format = (typeof FORMATS)[number];

export interface Item {
  id: string;
  title: string;
  artist: string;
  format: Format;
  price: number;
  notes: string;
  photo: string | null;
  /** Estado de conservación del 1 al 10 */
  condition: number;
  created_at: string;
}

/** Campos que edita el formulario (la foto va aparte como File). */
export interface ItemFields {
  title: string;
  artist: string;
  format: Format;
  price: number;
  notes: string;
  condition: number;
}

/** Colores del badge por formato (clases literales para que Tailwind las detecte). */
export const FORMAT_STYLES: Record<Format, string> = {
  CD: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  Vinilo: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  Cassette: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  VHS: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  DVD: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
  'Blu-ray': 'bg-blue-500/15 text-blue-300 ring-blue-400/30',
  MiniDisc: 'bg-orange-500/15 text-orange-300 ring-orange-400/30',
  Otro: 'bg-zinc-500/15 text-zinc-300 ring-zinc-400/30',
};

export function formatPrice(price: number): string {
  return (
    'Bs ' +
    price.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

/** Color del texto de estado según conservación: 8-10 bien, 4-7 regular, 1-3 deteriorado. */
export function conditionColor(condition: number): string {
  if (condition >= 8) return 'text-emerald-400';
  if (condition >= 4) return 'text-amber-400';
  return 'text-rose-400';
}
