"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import {
  DURATIONS,
  FORMATS,
  PREVIOUS_EVENTS,
  ROLES,
  TOPICS,
  type SurveyRow,
} from "@/lib/survey";
import { supabase } from "@/lib/supabase";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "biocrea";

function labelOf(
  list: readonly { id: string; label: string }[],
  id: string | null,
) {
  return list.find((item) => item.id === id)?.label ?? id ?? "—";
}

export function AdminDashboard() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("survey_responses")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (queryError) {
      setError(
        queryError.message.includes("Could not find the table")
          ? "Crea la tabla con supabase/schema.sql en el SQL Editor de Supabase."
          : queryError.message,
      );
      return;
    }
    setRows((data ?? []) as SurveyRow[]);
  }

  function unlock(event: FormEvent) {
    event.preventDefault();
    if (pin.trim() !== PIN) {
      setError("PIN incorrecto.");
      return;
    }
    setUnlocked(true);
    setError("");
  }

  useEffect(() => {
    if (unlocked) void load();
  }, [unlocked]);

  const stats = useMemo(() => {
    const topicCounts = new Map<string, number>();
    const roleCounts = new Map<string, number>();
    const formatCounts = new Map<string, number>();
    let satisfactionSum = 0;
    let satisfactionN = 0;

    for (const row of rows) {
      for (const topic of row.topics ?? []) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
      }
      if (row.role) roleCounts.set(row.role, (roleCounts.get(row.role) ?? 0) + 1);
      if (row.format) formatCounts.set(row.format, (formatCounts.get(row.format) ?? 0) + 1);
      if (row.satisfaction) {
        satisfactionSum += row.satisfaction;
        satisfactionN += 1;
      }
    }

    const rankedTopics = TOPICS.map((topic) => ({
      ...topic,
      count: topicCounts.get(topic.id) ?? 0,
    })).sort((a, b) => b.count - a.count);

    const maxTopic = Math.max(1, ...rankedTopics.map((item) => item.count));

    return {
      rankedTopics,
      maxTopic,
      roleCounts,
      formatCounts,
      avgSatisfaction: satisfactionN ? satisfactionSum / satisfactionN : 0,
      satisfactionN,
    };
  }, [rows]);

  if (!unlocked) {
    return (
      <main className="grain mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
        <Logo className="mb-4 h-14 w-14 text-forest" />
        <h1 className="font-display text-4xl font-semibold">Resultados</h1>
        <p className="mt-2 mb-6 text-ink-soft">Panel interno BIOCREA</p>
        <form onSubmit={unlock} className="space-y-3">
          <input
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN"
            className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 outline-none focus:border-forest"
          />
          {error ? <p className="text-sm text-red-800">{error}</p> : null}
          <button className="cta w-full rounded-full font-semibold">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="grain mx-auto min-h-dvh max-w-2xl px-5 py-[max(1.2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-end justify-between gap-3 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">BIOCREA</p>
          <h1 className="font-display text-4xl font-semibold">Agenda viva</h1>
        </div>
        <button onClick={() => void load()} className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm">
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </header>

      {error ? <p className="mb-4 text-sm text-red-800">{error}</p> : null}

      <section className="mb-5 grid grid-cols-2 gap-3">
        <Stat label="Respuestas" value={String(rows.length)} />
        <Stat
          label="Satisfacción"
          value={stats.satisfactionN ? stats.avgSatisfaction.toFixed(1) : "—"}
        />
      </section>

      <section className="mb-8 rounded-[1.6rem] border border-[var(--line)] bg-white/65 p-4">
        <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
          Especialidades más pedidas
        </h2>
        <div className="space-y-3">
          {stats.rankedTopics.map((topic) => (
            <div key={topic.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{topic.label}</span>
                <span className="text-ink-soft">{topic.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${(topic.count / stats.maxTopic) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <Breakdown title="Roles" counts={stats.roleCounts} labels={ROLES} />
        <Breakdown title="Formato" counts={stats.formatCounts} labels={FORMATS} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Respuestas</h2>
        <div className="space-y-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className="rounded-[1.4rem] border border-[var(--line)] bg-white/65 p-4"
            >
              <p className="text-xs text-ink-soft">
                {new Date(row.created_at).toLocaleString("es-CO")} ·{" "}
                {labelOf(ROLES, row.role)}
              </p>
              <p className="mt-2 font-medium">
                {(row.topics ?? [])
                  .map((id) => labelOf(TOPICS, id))
                  .join(" · ") || "Sin temas"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {labelOf(PREVIOUS_EVENTS, row.previous_event)}
                {row.satisfaction ? ` · ${row.satisfaction}/5` : ""}
                {row.format ? ` · ${labelOf(FORMATS, row.format)}` : ""}
                {row.duration ? ` · ${labelOf(DURATIONS, row.duration)}` : ""}
              </p>
              {row.other_topic ? (
                <p className="mt-2 text-sm">Otro: {row.other_topic}</p>
              ) : null}
              {row.comment ? <p className="mt-2 text-sm">{row.comment}</p> : null}
              {row.name || row.contact ? (
                <p className="mt-2 text-sm text-forest">
                  {[row.name, row.contact].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </article>
          ))}
          {rows.length === 0 && !loading ? (
            <p className="text-ink-soft">Todavía no hay respuestas.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/65 p-4">
      <p className="text-xs tracking-wide text-ink-soft uppercase">{label}</p>
      <p className="font-display mt-1 text-4xl font-semibold">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  counts,
  labels,
}: {
  title: string;
  counts: Map<string, number>;
  labels: readonly { id: string; label: string }[];
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/65 p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">{title}</h2>
      <ul className="space-y-1.5 text-sm">
        {labels.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>{item.label}</span>
            <span className="text-ink-soft">{counts.get(item.id) ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
