import { useCallback, useEffect, useRef, useState } from 'react';
import { createItem, deleteItem, fetchItems, updateItem } from './api';
import { supabaseConfigured } from './supabase';
import type { Format, Item, ItemFields } from './types';
import { FORMATS, formatPrice } from './types';
import ItemCard from './components/ItemCard';
import ItemForm from './components/ItemForm';
import SetupScreen from './components/SetupScreen';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [format, setFormat] = useState<Format | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const loadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++loadToken.current;
    setLoading(true);
    try {
      const result = await fetchItems({ q, format });
      if (token === loadToken.current) {
        setItems(result);
        setError('');
      }
    } catch (err) {
      if (token === loadToken.current) setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      if (token === loadToken.current) setLoading(false);
    }
  }, [q, format]);

  // Recarga con debounce al escribir en el buscador
  useEffect(() => {
    const t = setTimeout(load, q || format ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q, format]);

  const handleSave = useCallback(
    async (fields: ItemFields, file: File | null, id: string | null) => {
      const original = id !== null ? editing : null;
      const saved = original
        ? await updateItem(original, fields, file)
        : await createItem(fields, file);
      setFormOpen(false);
      setEditing(null);
      await load();
      return saved;
    },
    [load, editing],
  );

  const handleDelete = useCallback(
    async (item: Item) => {
      if (!window.confirm(`¿Eliminar “${item.title}”? Esta acción no se puede deshacer.`)) return;
      try {
        await deleteItem(item);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar');
      }
    },
    [load],
  );

  if (!supabaseConfigured) return <SetupScreen />;

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Resplandor decorativo de fondo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,rgba(245,158,11,0.08),transparent),radial-gradient(50rem_25rem_at_10%_0%,rgba(56,189,248,0.06),transparent)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <header className="flex flex-wrap items-center gap-4 py-6">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Discoteca
              </h1>
              <p className="text-sm text-zinc-400">
                Tu colección de CDs, vinilos, cassettes, VHS y más
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="ml-auto rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-95"
          >
            + Agregar ítem
          </button>
        </header>

        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur">
          <label className="relative min-w-56 flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              🔍
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, artista o notas…"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-zinc-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            <FormatPill active={format === ''} onClick={() => setFormat('')}>
              Todos
            </FormatPill>
            {FORMATS.map((f) => (
              <FormatPill key={f} active={format === f} onClick={() => setFormat(f)}>
                {f}
              </FormatPill>
            ))}
          </div>
        </section>

        <p className="mt-4 text-sm text-zinc-400">
          {loading
            ? 'Cargando…'
            : `${items.length} ${items.length === 1 ? 'ítem' : 'ítems'} · valor total ${formatPrice(total)}`}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <span className="text-6xl">💿</span>
            <div>
              <p className="text-lg font-semibold">
                {q || format ? 'Sin resultados' : 'Tu colección está vacía'}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {q || format
                  ? 'Prueba con otro término de búsqueda o cambia el filtro de formato.'
                  : 'Agrega tu primer disco, cassette o película con su foto y precio.'}
              </p>
            </div>
            {!q && !format && (
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                + Agregar ítem
              </button>
            )}
          </div>
        )}

        <main className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </main>
      </div>

      {formOpen && (
        <ItemForm
          item={editing}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function FormatPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-full px-3 py-1.5 text-xs font-semibold transition ' +
        (active
          ? 'bg-amber-500 text-zinc-950'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')
      }
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 100 100" className="size-12 animate-[spin_8s_linear_infinite] motion-reduce:animate-none">
      <circle cx="50" cy="50" r="47" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#3f3f46" strokeWidth="3" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#52525b" strokeWidth="2" />
      <circle cx="50" cy="50" r="14" fill="#f59e0b" />
      <circle cx="50" cy="50" r="4" fill="#18181b" />
    </svg>
  );
}
