import { useEffect, useRef, useState } from 'react';
import type { Format, Item, ItemFields } from '../types';
import { FORMATS, conditionColor } from '../types';

export default function ItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: Item | null;
  onSave: (fields: ItemFields, file: File | null, id: string | null) => Promise<Item>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [artist, setArtist] = useState(item?.artist ?? '');
  const [format, setFormat] = useState<Format | ''>(item?.format ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [condition, setCondition] = useState(item?.condition ?? 8);
  const [preview, setPreview] = useState<string | null>(item?.photo ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  // Revoca la URL del preview al desmontar
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pickPhoto(selected: File | null) {
    setFile(selected);
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(selected ? URL.createObjectURL(selected) : (item?.photo ?? null));
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
      format,
      price: priceNumber,
      notes: notes.trim(),
      condition,
    };

    setSaving(true);
    setError('');
    try {
      await onSave(fields, file, item?.id ?? null);
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
          <Field label="Foto">
            <div className="flex items-start gap-4">
              <div className="size-24 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
                {preview ? (
                  <img src={preview} alt="Vista previa" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-3xl text-zinc-600">
                    💿
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-700"
                >
                  {preview ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInput.current) fileInput.current.value = '';
                      pickPhoto(null);
                    }}
                    className="block text-xs text-rose-400 hover:underline"
                  >
                    Quitar foto
                  </button>
                )}
                <p className="text-xs text-zinc-500">JPG, PNG, WebP, GIF o AVIF · máx. 5 MB</p>
              </div>
            </div>
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

          <Field label="Artista / Estudio">
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ej. The Beatles"
              className={inputClass}
            />
          </Field>

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
