"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";

const SQL = `create extension if not exists "pgcrypto";

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

grant usage on schema public to anon, authenticated;
grant insert, select on table public.survey_responses to anon, authenticated;`;

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="grain mx-auto min-h-dvh max-w-md px-5 py-8">
      <Logo className="mb-4 h-12 w-12 text-forest" />
      <h1 className="font-display text-4xl font-semibold">Activar respuestas</h1>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-soft">
        <li>Abre el SQL Editor de tu proyecto en Supabase.</li>
        <li>Pega el script y ejecútalo.</li>
        <li>Vuelve a la encuesta e inténtalo de nuevo.</li>
      </ol>
      <div className="mt-5 flex gap-2">
        <a
          href="https://supabase.com/dashboard/project/kywgsmefcosegnvipxjb/sql/new"
          className="cta flex-1 rounded-full text-center leading-[3.35rem] font-semibold"
        >
          Abrir SQL Editor
        </a>
        <button onClick={copy} className="rounded-full border border-[var(--line)] bg-white/70 px-4 font-medium">
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="mt-5 overflow-x-auto rounded-[1.4rem] bg-[#171411] p-4 text-[0.7rem] leading-relaxed text-[#f6f0e6]">
        {SQL}
      </pre>
    </main>
  );
}
