import { useState } from 'react';
import type { Item } from '../types';
import { FORMAT_STYLES, conditionColor, formatPrice } from '../types';

export default function ItemDetail({
  item,
  puedeEditar,
  onClose,
  onEdit,
  onDelete,
}: {
  item: Item;
  puedeEditar: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const photos = item.photos;
  const actual = photos[Math.min(idx, photos.length - 1)];

  const mover = (delta: number) => setIdx((i) => (i + delta + photos.length) % photos.length);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      {/* Sin onClick en el fondo: se cierra solo con la ✕ */}
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{item.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-xl leading-none text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800/60">
              {actual ? (
                <img src={actual} alt={`Foto ${idx + 1} de ${item.title}`} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-6xl text-zinc-700">
                  💿
                </div>
              )}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => mover(-1)}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 leading-none transition hover:bg-black/85"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(1)}
                    aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 leading-none transition hover:bg-black/85"
                  >
                    ›
                  </button>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
                    {Math.min(idx, photos.length - 1) + 1} / {photos.length}
                  </span>
                </>
              )}
            </div>

            {photos.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setIdx(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    className={`size-14 overflow-hidden rounded-lg border-2 transition ${
                      i === idx ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${FORMAT_STYLES[item.format]}`}
              >
                {item.format}
              </span>
              <span className="text-2xl font-bold text-amber-400">{formatPrice(item.price)}</span>
            </div>

            {item.artist && (
              <Dato label="Artista / Estudio">{item.artist}</Dato>
            )}
            {item.industry && <Dato label="Industria">{item.industry}</Dato>}
            <Dato label="Estado de conservación">
              <span className={`font-bold ${conditionColor(item.condition)}`}>
                {item.condition}/10
              </span>
            </Dato>
            {item.notes && <Dato label="Notas">{item.notes}</Dato>}

            {puedeEditar && (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/15"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-200">{children}</p>
    </div>
  );
}
