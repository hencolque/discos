import { useState } from 'react';

export default function LoginScreen({
  onIngresar,
}: {
  onIngresar: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (cargando) return;
    if (!email.trim() || !password) return setError('Escribe tu correo y contraseña.');

    setCargando(true);
    setError('');
    try {
      await onIngresar(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,rgba(245,158,11,0.08),transparent)]"
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <svg viewBox="0 0 100 100" className="size-14">
            <circle cx="50" cy="50" r="47" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#3f3f46" strokeWidth="3" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#52525b" strokeWidth="2" />
            <circle cx="50" cy="50" r="14" fill="#f59e0b" />
            <circle cx="50" cy="50" r="4" fill="#18181b" />
          </svg>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Discoteca</h1>
            <p className="mt-1 text-sm text-zinc-400">Inicia sesión para ver tu colección</p>
          </div>
        </div>

        <form onSubmit={enviar} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Correo
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoFocus
              autoComplete="email"
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputClass}
            />
          </label>

          {error && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-500">
          Las cuentas las crea el administrador desde el panel de Supabase
          (Authentication → Users). No hay registro público.
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20';
