-- Enable RLS on all public tables because Supabase exposes the public schema through PostgREST/Data API.
-- This app uses a private Express + Prisma backend, so we intentionally add no public policies.
ALTER TABLE IF EXISTS public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."titles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."title_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."patents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."patent_classifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."patent_assignments" ENABLE ROW LEVEL SECURITY;
