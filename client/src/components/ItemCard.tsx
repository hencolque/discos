import type { Item } from '../types';
import { FORMAT_STYLES, conditionColor, formatPrice } from '../types';

export default function ItemCard({
  item,
  puedeEditar,
  onOpen,
  onEdit,
  onDelete,
}: {
  item: Item;
  puedeEditar: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const portada = item.photos[0] ?? null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition hover:-translate-y-1 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/40">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalles de ${item.title}`}
        className="relative block aspect-square w-full overflow-hidden bg-zinc-800/60"
      >
        {portada ? (
          <img
            src={portada}
            alt={item.title}
            loading="lazy"
            className="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-700">
            <VinylPlaceholder />
          </div>
        )}
        {item.photos.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-zinc-200">
            📷 {item.photos.length}
          </span>
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-sm font-semibold text-zinc-100 group-hover:flex">
          🔍 Ver detalles
        </span>
      </button>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${FORMAT_STYLES[item.format]}`}
          >
            {item.format}
          </span>
          <span className="text-lg font-bold text-amber-400">{formatPrice(item.price)}</span>
        </div>

        <h3 className="line-clamp-1 font-semibold" title={item.title}>
          <button
            type="button"
            onClick={onOpen}
            className="w-full text-left transition hover:text-amber-300"
          >
            {item.title}
          </button>
        </h3>
        {item.artist && <p className="line-clamp-1 text-sm text-zinc-400">{item.artist}</p>}
        {item.industry && (
          <p className="line-clamp-1 text-xs text-zinc-500" title={`Industria: ${item.industry}`}>
            🏭 {item.industry}
          </p>
        )}
        <p className={`text-xs font-medium ${conditionColor(item.condition)}`}>
          Estado: {item.condition}/10
        </p>

        {puedeEditar && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={onEdit}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/15"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function VinylPlaceholder() {
  return (
    <svg viewBox="0 0 100 100" className="size-2/3 opacity-60">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
    </svg>
  );
}
