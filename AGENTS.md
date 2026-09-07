# AGENTS.md — Discoteca

Web app en español para catalogar medios físicos (CD, Vinilo, Cassette, VHS, DVD, Blu-ray, MiniDisc, Otro) con fotos, precios en Bolivianos (Bs) y estado de conservación 1–10 (defecto 8).

## Arquitectura (v2, sin backend)

SPA estática: **Vite + React 19 + TypeScript + Tailwind 4** en `client/`, que habla directamente con **Supabase** (Postgres + Storage) mediante `@supabase/supabase-js`. Se despliega en Vercel (Root Directory = `client`). Ya NO existe backend Express/SQLite: el código anterior está respaldado en `backend-sqlite-antiguo.tar.gz`.

- `client/src/api.ts`: ÚNICA capa de datos (CRUD en tabla `items` + subida/borrado de fotos en bucket `fotos`).
- `client/src/supabase.ts`: cliente + constantes; requiere `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Sin ellas, `App.tsx` renderiza `SetupScreen` con instrucciones.
- `supabase-setup.sql`: fuente de verdad del esquema (tabla `items`, bucket `fotos`, políticas RLS). Cambios de esquema = editar este SQL + `client/src/types.ts` juntos.
- `vercel.json` (raíz): build desde la raíz del repo (`npm run build --prefix client`, output `client/dist`); si se configura Root Directory = `client` en Vercel, este archivo se ignora y Vite funciona con su configuración por defecto.
- `migrar-datos.sql`: INSERT de los ítems de la colección previa (fotos no migradas).

## Comandos

```bash
npm run setup     # instala client
npm run dev       # Vite en :5173
npm run build     # tsc + vite build → client/dist
npm run preview   # sirve dist en :4173
```

Requiere Node ≥ 20 y `client/.env.local` con las claves (plantilla en `.env.example`).

## Convenciones

- Toda la UI y los mensajes de error están en español.
- Precios en Bs: `formatPrice()` usa locale `es-BO` en `client/src/types.ts`.
- `condition` (estado 1–10, defecto 8) se valida en el cliente y en `supabase-setup.sql` (DEFAULT 8); colores en `conditionColor()`.
- Formatos: lista única `FORMATS` en `client/src/types.ts` (la columna `format` en Postgres es TEXT sin CHECK a propósito).
- Clases de Tailwind siempre literales en el código; nada de construir nombres dinámicamente.

## Gotchas

- `tsconfig.json` lleva `skipLibCheck: true`: sin él, los .d.ts de supabase-js exigen tipos de Node (`Buffer`, `NodeJS`).
- `price` es `double precision` a propósito: la columna `numeric` de Postgres llega como string a supabase-js.
- El buscador sanitiza `q` (quita comas/paréntesis) porque PostgREST rompe el `.or()` con esos caracteres.
- El borrado/reemplazo de fotos extrae la ruta del bucket buscando `/object/public/fotos/`; si cambias el nombre del bucket (`BUCKET` en `supabase.ts`), cambia también `supabase-setup.sql` y ese marcador.
- Las políticas RLS son abiertas a propósito (uso personal); para producción multiusuario requieren Supabase Auth (ver comentarios en el SQL).
- curl desde Git Bash no envía UTF-8 ni acepta `;type=`: para probar Supabase por script usa `node -e` con `fetch`.
