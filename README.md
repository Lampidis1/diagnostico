# Programa de Empleabilidad

Réplica full-stack del portal público, diagnóstico empresarial y panel interno de estadísticas. Está preparada para GitHub + Vercel y usa **Neon PostgreSQL**, sin Supabase.

## Incluye

- Portada responsive con la identidad visual de referencia.
- Diagnóstico de 15 puntos con validación y progreso.
- Pool de 20 perfiles mineros y creación de perfiles personalizados.
- Fichas de demanda con requisitos, competencias, turnos y cantidad de personas.
- Persistencia relacional en PostgreSQL.
- Acceso interno con contraseña cifrada y cookie segura.
- Dashboard con totales, comunas, rubros, horizonte de contratación y perfiles más demandados.
- Búsqueda, filtros, detalle, eliminación administrativa y exportación CSV.

## Desarrollo local

Requiere Node.js 20.9 o superior y una base PostgreSQL en Neon.

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea `.env.local` desde `.env.example` y completa:

   - `DATABASE_URL`: cadena de conexión PostgreSQL de Neon.
   - `SESSION_SECRET`: secreto aleatorio de 32 caracteres o más.
   - `NEXT_PUBLIC_SITE_URL`: URL pública o `http://localhost:3000`.

3. Crea las tablas:

   ```bash
   node --env-file=.env.local scripts/migrate.mjs
   ```

4. Crea la primera cuenta administrativa:

   ```bash
   ADMIN_EMAIL=admin@ejemplo.cl ADMIN_PASSWORD='una-clave-segura' ADMIN_NAME='Administrador' node --env-file=.env.local scripts/create-admin.mjs
   ```

5. Inicia el proyecto:

   ```bash
   npm run dev
   ```

Rutas principales: `/`, `/diagnostico`, `/auth` y `/admin`.

## Publicación en GitHub y Vercel

1. Crea un repositorio vacío en GitHub y sube este proyecto.
2. En Vercel, importa ese repositorio como un proyecto Next.js.
3. Agrega `DATABASE_URL`, `SESSION_SECRET` y `NEXT_PUBLIC_SITE_URL` en **Settings → Environment Variables**.
4. Ejecuta una sola vez la migración y la creación del administrador contra la misma base de Neon.
5. Publica. Vercel detectará `npm run build` automáticamente.

## Seguridad y datos

- Las contraseñas se almacenan con bcrypt (12 rondas).
- Las sesiones se firman con HS256, duran 12 horas y usan cookies `httpOnly`.
- El formulario valida en cliente y servidor.
- Los perfiles se eliminan en cascada con su respuesta.
- Se guarda únicamente un hash de la IP para control operativo; no la dirección en texto claro.

## Marca

El logotipo y la identidad de Minera Centinela / Antofagasta Minerals pertenecen a sus titulares. Utilízalos únicamente si cuentas con autorización y reemplaza `public/logo-centinela.png` si el despliegue tendrá otra marca.
