"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { downloadSurveyPdf } from "@/lib/download-report";
import { buildReport } from "@/lib/report";
import {
  DURATIONS,
  FORMATS,
  PREVIOUS_EVENTS,
  ROLES,
  TOPICS,
  labelOf,
  type SurveyRow,
} from "@/lib/survey";
import { loadSurveys } from "@/lib/survey-client";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "biocrea";
const UNLOCK_KEY = "biocrea-admin-ok";

export function AdminDashboard() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [downloading, setDownloading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await loadSurveys(PIN);
      setRows(data);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar las respuestas.");
    } finally {
      setLoading(false);
    }
  }

  function unlock(event: FormEvent) {
    event.preventDefault();
    if (pin.trim() !== PIN) {
      setError("PIN incorrecto.");
      return;
    }
    setUnlocked(true);
    sessionStorage.setItem(UNLOCK_KEY, "1");
    setError("");
  }

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    if (unlocked) void load();
  }, [unlocked]);

  const report = useMemo(() => buildReport(rows), [rows]);
  const stats = report;

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
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={() => void load()} className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm">
            {loading ? "Cargando..." : "Actualizar"}
          </button>
          <a href="/admin/informe" className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm">
            Ver informe
          </a>
          <button
            type="button"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await downloadSurveyPdf(report);
              } finally {
                setDownloading(false);
              }
            }}
            className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-[#f6f0e6] disabled:opacity-40"
          >
            {downloading ? "Preparando..." : "Descargar PDF"}
          </button>
        </div>
      </header>

      {error ? <p className="mb-4 text-sm text-red-800">{error}</p> : null}

      <section className="mb-5 grid grid-cols-2 gap-3">
        <Stat label="Respuestas" value={String(rows.length)} />
        <Stat
          label="Satisfacción"
          value={stats.avgSatisfaction ? stats.avgSatisfaction.toFixed(1) : "—"}
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
                  style={{
                    width: `${(topic.count / Math.max(1, ...stats.rankedTopics.map((item) => item.count))) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <Breakdown title="Roles" items={stats.roles} />
        <Breakdown title="Formato" items={stats.formats} />
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
  items,
}: {
  title: string;
  items: { id: string; label: string; count: number }[];
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/65 p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">{title}</h2>
      <ul className="space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>{item.label}</span>
            <span className="text-ink-soft">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
