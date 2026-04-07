# Patent Navi Backend API

Backend API for Patent Navi using Express, TypeScript, Prisma, and Supabase Postgres.

## Local setup

1. Copy `.env.example` to `.env`
2. Replace `REPLACE_WITH_DB_PASSWORD` with your real Supabase DB password
3. Install dependencies
4. Run Prisma and start the server

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

## Notes

- Runtime uses `DATABASE_URL`
- Prisma CLI uses `DIRECT_URL`
- Attachments still use local filesystem storage via `UPLOAD_DIR`
- Public tables have RLS enabled because Supabase exposes the `public` schema through the Data API by default; this app relies on the Express backend instead of direct browser access to PostgREST.
