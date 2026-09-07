export default function SetupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="max-w-xl space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-2xl font-black tracking-tight">
          💿 Discoteca · configuración necesaria
        </h1>
        <p className="text-sm text-zinc-400">
          La app aún no está conectada a Supabase. Sigue estos pasos (5 minutos, gratis):
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          <li>
            Crea un proyecto en{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline"
            >
              supabase.com
            </a>
            .
          </li>
          <li>
            En <b>SQL Editor</b>, pega y ejecuta el archivo{' '}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">supabase-setup.sql</code> de
            la raíz del proyecto.
          </li>
          <li>
            (Opcional) Ejecuta{' '}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">migrar-datos.sql</code> para
            recuperar los ítems de tu colección anterior.
          </li>
          <li>
            En <b>Project Settings → API</b> copia la <b>Project URL</b> y la <b>anon key</b>, y
            créalas en <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">client/.env.local</code>:
            <pre className="mt-2 overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs leading-5">
{`VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
            </pre>
          </li>
          <li>
            Reinicia <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">npm run dev</code> y
            recarga esta página.
          </li>
        </ol>
        <p className="text-xs text-zinc-500">
          En producción (Vercel), esas mismas variables se configuran en Project Settings →
          Environment Variables.
        </p>
      </div>
    </div>
  );
}
