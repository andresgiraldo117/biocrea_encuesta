"use client";

import { Logo } from "@/components/Logo";
import {
  buildReport,
  executiveSummary,
  formatReportDate,
  type SurveyReport,
} from "@/lib/report";
import type { SurveyRow } from "@/lib/survey";

export function InformeDocument({
  rows,
  report,
}: {
  rows?: SurveyRow[];
  report?: SurveyReport;
}) {
  const data = report ?? buildReport(rows ?? []);
  const generated = formatReportDate(data.generatedAt);
  const maxTopic = Math.max(1, ...data.rankedTopics.map((item) => item.count));
  const topTopics = data.rankedTopics.filter((item) => item.count > 0).slice(0, 5);

  return (
    <article className="informe mx-auto w-full max-w-[210mm] bg-[#fffaf3] text-ink shadow-[0_24px_60px_rgba(23,20,17,0.12)]">
      <header className="bg-forest px-8 pt-8 pb-7 text-[#f6f0e6] print:px-10">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
            <Logo className="h-12 w-12" />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-gold-soft uppercase">
              BIOCREA · Medicina veterinaria equina
            </p>
            <h1 className="font-display mt-1 text-4xl leading-none">Informe de encuesta</h1>
            <p className="font-display mt-2 text-xl text-white/75 italic">
              ¿Qué quieres ver en el próximo congreso?
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-white/65">
          Generado el {generated} · Uso interno para armar la agenda académica
        </p>
      </header>
      <div className="h-1.5 bg-gold" />

      <section className="grid grid-cols-3 gap-3 px-8 py-6 print:px-10">
        <Kpi label="Respuestas" value={String(data.total)} />
        <Kpi
          label="Satisfacción"
          value={data.avgSatisfaction ? `${data.avgSatisfaction.toFixed(1)} / 5` : "—"}
        />
        <Kpi label="Especialidad líder" value={topTopics[0]?.label ?? "—"} />
      </section>

      <section className="px-8 pb-6 print:px-10">
        <h2 className="font-display text-2xl">Resumen ejecutivo</h2>
        <div className="mt-1 mb-3 h-0.5 w-12 bg-gold" />
        <p className="text-[1.02rem] leading-relaxed text-ink-soft">{executiveSummary(data)}</p>
      </section>

      <section className="px-8 pb-8 print:px-10">
        <h2 className="font-display text-2xl">Especialidades más pedidas</h2>
        <div className="mt-1 mb-5 h-0.5 w-12 bg-gold" />
        <div className="space-y-3">
          {data.rankedTopics.map((item, index) => (
            <div key={item.id}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span>
                  <span className="mr-2 text-ink-soft">{index + 1}.</span>
                  {item.label}
                  {item.firstChoice ? (
                    <span className="ml-2 text-xs text-ink-soft">
                      {item.firstChoice} la eligieron 1.ª
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-ink-soft">
                  {item.count} · {item.pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${(item.count / maxTopic) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 px-8 pb-8 sm:grid-cols-2 print:grid-cols-2 print:px-10">
        <ListCard title="Rol" items={data.roles} />
        <ListCard title="Participación previa" items={data.previousEvents} />
        <ListCard title="Formato" items={data.formats} />
        <ListCard title="Duración" items={data.durations} />
      </section>

      {data.otherTopics.length ? (
        <section className="px-8 pb-8 print:px-10">
          <h2 className="font-display text-2xl">Otros temas propuestos</h2>
          <div className="mt-1 mb-4 h-0.5 w-12 bg-gold" />
          <ul className="list-disc space-y-1 pl-5 text-ink-soft">
            {data.otherTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.comments.length ? (
        <section className="px-8 pb-8 print:px-10">
          <h2 className="font-display text-2xl">Comentarios</h2>
          <div className="mt-1 mb-4 h-0.5 w-12 bg-gold" />
          <div className="space-y-4">
            {data.comments.map((item) => (
              <blockquote key={`${item.date}-${item.comment}`} className="border-l-2 border-gold pl-4">
                <p className="font-display text-lg leading-snug">“{item.comment}”</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {item.date} · {item.role}
                </p>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      {data.contacts.length ? (
        <section className="px-8 pb-8 print:px-10">
          <h2 className="font-display text-2xl">Aviso de inscripción</h2>
          <div className="mt-1 mb-4 h-0.5 w-12 bg-gold" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-xs tracking-wide text-ink-soft uppercase">
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium">Nombre</th>
                <th className="py-2 font-medium">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {data.contacts.map((item) => (
                <tr key={`${item.date}-${item.contact}`} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-3 text-ink-soft">{item.date}</td>
                  <td className="py-2 pr-3">{item.name}</td>
                  <td className="py-2">{item.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <footer className="border-t border-[var(--line)] px-8 py-5 text-xs text-ink-soft print:px-10">
        BIOCREA · Encuesta de satisfacción y agenda del próximo congreso · {generated}
      </footer>
    </article>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
      <p className="text-[0.65rem] tracking-[0.16em] text-ink-soft uppercase">{label}</p>
      <p className="font-display mt-1 text-2xl leading-tight">{value}</p>
    </div>
  );
}

function ListCard({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string; count: number; pct: number }[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      <ul className="space-y-1.5 text-sm">
        {items.filter((item) => item.count > 0).length ? (
          items
            .filter((item) => item.count > 0)
            .map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>{item.label}</span>
                <span className="text-ink-soft">
                  {item.count} · {item.pct}%
                </span>
              </li>
            ))
        ) : (
          <li className="text-ink-soft">Sin datos todavía</li>
        )}
      </ul>
    </div>
  );
}
