-- Encuesta Congreso BIOCREA
-- Ejecuta este SQL en: https://supabase.com/dashboard/project/kywgsmefcosegnvipxjb/sql/new

create extension if not exists "pgcrypto";

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text,
  previous_event text,
  satisfaction smallint check (satisfaction is null or (satisfaction between 1 and 5)),
  topics text[] not null default '{}',
  other_topic text,
  format text,
  duration text,
  comment text,
  name text,
  contact text,
  user_agent text
);

create index if not exists survey_responses_created_at_idx
  on public.survey_responses (created_at desc);

alter table public.survey_responses enable row level security;

drop policy if exists "public_insert_survey" on public.survey_responses;
create policy "public_insert_survey"
  on public.survey_responses
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public_read_survey" on public.survey_responses;
create policy "public_read_survey"
  on public.survey_responses
  for select
  to anon, authenticated
  using (true);
