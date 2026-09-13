# Encuesta Congreso BIOCREA

Sitio móvil para votar las especialidades del próximo congreso de medicina veterinaria equina.

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Resultados: [http://localhost:3000/admin](http://localhost:3000/admin) (PIN por defecto: `biocrea`).

## Supabase

1. Entra al [SQL Editor](https://supabase.com/dashboard/project/kywgsmefcosegnvipxjb/sql/new).
2. Pega y ejecuta `supabase/schema.sql`.
3. Confirma que `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
