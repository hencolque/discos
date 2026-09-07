# 💿 Discoteca

Catálogo web para tu colección de medios físicos: **CDs, vinilos, cassettes, VHS, DVDs, Blu-rays, MiniDisc y más**, con **fotos y precios en Bolivianos (Bs)** y **estado de conservación del 1 al 10** (por defecto 8). Funciona 100% en español.

## 🛠 Stack

| Capa | Herramienta | Por qué |
|---|---|---|
| Frontend | **Vite + React 19 + TypeScript** | Build instantáneo, tipado seguro |
| Estilos | **Tailwind CSS 4** | Diseño rápido y consistente |
| Base de datos | **Supabase (Postgres)** | Gratis (500 MB), persistente, con panel de administración |
| Fotos | **Supabase Storage** | Gratis (1 GB), URLs públicas por ítem |
| Despliegue | **Vercel** (sitio estático, Root Directory = `client`) | Gratis (100 GB/mes), HTTPS y CDN incluidos |

**Sin backend propio:** el navegador habla directamente con Supabase con la anon key; la seguridad la dan las políticas RLS.

## 📁 Estructura

```
├── client/                     # Frontend (lo único que se despliega)
│   ├── .env.local              # Claves de Supabase (crear; ver .env.example en la raíz)
│   └── src/
│       ├── App.tsx             # Galería, buscador, filtros
│       ├── api.ts              # Capa de datos: tabla items + Storage
│       ├── supabase.ts         # Cliente de Supabase (lee las variables VITE_*)
│       ├── types.ts            # Tipos, formatos, colores y formato de precio Bs
│       └── components/         # ItemCard, ItemForm (modal), SetupScreen
├── supabase-setup.sql          # SQL a ejecutar en Supabase (tabla + bucket + RLS)
├── migrar-datos.sql            # (Opcional) ítems de la colección anterior
├── .env.example                # Plantilla de variables de entorno
└── backend-sqlite-antiguo.tar.gz  # Backup del backend Express/SQLite anterior
```

## 🚀 Puesta en marcha

Requisitos: Node.js ≥ 20 y una cuenta gratis en [supabase.com](https://supabase.com).

1. **Instalar:** `npm run setup` (o `npm install --prefix client`).
2. **Crear la base de datos:** en tu proyecto de Supabase abre **SQL Editor**, pega el contenido de `supabase-setup.sql` y ejecútalo. Crea la tabla `items`, el bucket `fotos` y sus políticas de acceso.
3. **(Opcional) Recuperar datos antiguos:** ejecuta `migrar-datos.sql` en el SQL Editor. Las fotos no se migran: súbelas de nuevo editando cada ítem.
4. **Configurar claves:** en Supabase → **Project Settings → API** copia la *Project URL* y la *anon key*. Copia `.env.example` como `client/.env.local` y rellénalo:
   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
   ```
5. **Arrancar:** `npm run dev` → abre http://localhost:5173.

Si faltan las claves, la app muestra una pantalla de configuración con estos mismos pasos.

## ☁️ Desplegar en Vercel (gratis)

1. Sube el proyecto a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. En la pantalla de configuración:
   - **Root Directory:** `client` (Vercel detecta Vite y usa sus comandos por defecto: no configures Build/Install/Output a mano).
   - **Environment Variables:** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los mismos valores del paso 4 local (marca Production, Preview y Development). Vercel avisará que el prefijo `VITE_` expone los valores al navegador: es lo esperado, la anon key es pública por diseño.
4. **Deploy** → tendrás una URL `https://tu-proyecto.vercel.app` persistente y con HTTPS.

⚠️ No uses comandos con `--prefix client` ni archivos `vercel.json` en la raíz: con Root Directory = `client` duplicarían la ruta (`client/client`). Si agregas variables después del primer deploy, haz **Redeploy** para que el build las incorpore. Cada `git push` redespliega automáticamente.

## 🔐 Seguridad

Las políticas RLS de `supabase-setup.sql` permiten que **cualquiera con la URL** vea y edite el catálogo (modo simple, pensado para uso personal). Para restringirlo:

- Crea un usuario en **Supabase → Authentication** y activa el login por email en la app (`supabase.auth.signInWithPassword`), o
- Cambia las políticas para que solo `auth.role() = 'authenticated'` pueda escribir (instrucciones comentadas dentro del propio SQL).

El plan gratis de Supabase **pausa el proyecto tras 7 días sin actividad** de base de datos; basta con abrir la app de vez en cuando (se reactiva desde el panel o con la primera visita).

## 🔧 Personalizar

- **Formatos soportados:** lista `FORMATS` y colores en `client/src/types.ts`.
- **Límite de foto:** 5 MB (constante `MAX_PHOTO_BYTES` en `client/src/api.ts`).
- **Moneda:** `Bs` con formato boliviano en `formatPrice()` de `client/src/types.ts`.
- **Estado:** escala 1–10 con defecto 8; colores en `conditionColor()` de `client/src/types.ts`. Para cambiar el defecto, ajusta también `DEFAULT 8` en `supabase-setup.sql`.
