import { useEffect, useRef, useState } from 'react';
import type { Format, Item, ItemFields } from '../types';
import { FORMATS, INDUSTRIAS, conditionColor } from '../types';
import { validarFoto, type FotoEntrada } from '../api';

interface FotoUI {
  /** URL mostrada: la definitiva (ya subida) o un blob de vista previa */
  url: string;
  /** Presente solo en fotos nuevas aún no subidas */
  file?: File;
}

export default function ItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: Item | null;
  onSave: (fields: ItemFields, fotos: FotoEntrada[], id: string | null) => Promise<Item>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [artist, setArtist] = useState(item?.artist ?? '');
  const [industry, setIndustry] = useState(item?.industry ?? '');
  const [format, setFormat] = useState<Format | ''>(item?.format ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [condition, setCondition] = useState(item?.condition ?? 8);
  const [fotos, setFotos] = useState<FotoUI[]>(() =>
    item ? item.photos.map((url) => ({ url })) : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const blobUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function agregarFotos(seleccion: FileList | null) {
    if (!seleccion?.length) return;
    const aceptadas: FotoUI[] = [];
    for (const file of seleccion) {
      const invalido = validarFoto(file);
      if (invalido) {
        setError(invalido);
        continue;
      }
      const url = URL.createObjectURL(file);
      blobUrls.current.push(url);
      aceptadas.push({ url, file });
    }
    if (aceptadas.length) setError('');
    setFotos((prev) => [...prev, ...aceptadas]);
  }

  function quitarFoto(idx: number) {
    setFotos((prev) =>
      prev.filter((f, i) => {
        if (i !== idx) return true;
        if (f.file && blobUrls.current.includes(f.url)) {
          URL.revokeObjectURL(f.url);
          blobUrls.current = blobUrls.current.filter((u) => u !== f.url);
        }
        return false;
      }),
    );
  }

  function hacerPortada(idx: number) {
    setFotos((prev) => {
      if (idx === 0) return prev;
      const elegida = prev[idx];
      return [elegida, ...prev.filter((_, i) => i !== idx)];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const priceNumber = Number(price);
    if (!title.trim()) return setError('El título es obligatorio.');
    if (!format) return setError('Selecciona un formato.');
    if (!Number.isFinite(priceNumber) || priceNumber < 0)
      return setError('El precio debe ser un número mayor o igual a 0.');

    const fields: ItemFields = {
      title: title.trim(),
      artist: artist.trim(),
      industry: industry.trim(),
      format,
      price: priceNumber,
      notes: notes.trim(),
      condition,
    };

    setSaving(true);
    setError('');
    try {
      const entradas: FotoEntrada[] = fotos.map((f) => (f.file ? { file: f.file } : { url: f.url }));
      await onSave(fields, entradas, item?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      {/* Sin onClick en el fondo: un clic accidental fuera del formulario no debe cerrarlo */}
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">
            {item ? 'Editar ítem' : 'Agregar a la colección'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-xl leading-none text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label={`Fotos (${fotos.length}) — la primera es la portada`}>
            <div className="flex flex-wrap gap-2">
              {fotos.map((foto, idx) => (
                <div
                  key={foto.url}
                  className="group relative size-20 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800"
                >
                  <img src={foto.url} alt={`Foto ${idx + 1}`} className="size-full object-cover" />
                  {idx === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                      Portada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => hacerPortada(idx)}
                      title="Hacer portada"
                      className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200 opacity-0 transition group-hover:opacity-100"
                    >
                      ★ Portada
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => quitarFoto(idx)}
                    aria-label={`Quitar foto ${idx + 1}`}
                    className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/30"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                aria-label="Agregar fotos"
                className="flex size-20 items-center justify-center rounded-xl border border-dashed border-zinc-600 text-2xl text-zinc-500 transition hover:border-amber-500/60 hover:text-amber-400"
              >
                ＋
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              onChange={(e) => {
                agregarFotos(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              JPG, PNG, WebP, GIF o AVIF · máx. 5 MB por foto
            </p>
          </Field>

          <Field label="Título *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Abbey Road"
              autoFocus
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Artista / Estudio">
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ej. The Beatles"
                className={inputClass}
              />
            </Field>

            <Field label="Industria (país/región)">
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Ej. Europa, USA, Japón…"
                list="opciones-industria"
                className={inputClass}
              />
              <datalist id="opciones-industria">
                {INDUSTRIAS.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Formato *">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as Format | '')}
                className={inputClass}
              >
                <option value="">Selecciona…</option>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Precio *">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">Bs</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={inputClass + ' pl-9'}
                />
              </div>
            </Field>
          </div>

          <Field label="Estado de conservación">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={condition}
                onChange={(e) => setCondition(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-amber-500"
              />
              <span
                className={`w-14 shrink-0 rounded-lg bg-zinc-800 py-1 text-center text-sm font-bold ${conditionColor(condition)}`}
              >
                {condition}/10
              </span>
            </div>
          </Field>

          <Field label="Notas">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Edición, estado, detalles…"
              className={inputClass + ' resize-none'}
            />
          </Field>

          {error && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : item ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
