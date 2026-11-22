"use client";

import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import {
  DURATIONS,
  FORMATS,
  MAX_TOPICS,
  PREVIOUS_EVENTS,
  ROLES,
  TOPICS,
  emptyDraft,
  type SurveyDraft,
} from "@/lib/survey";
import { supabase } from "@/lib/supabase";

const STEPS = [
  "bienvenida",
  "rol",
  "evento",
  "satisfaccion",
  "temas",
  "formato",
  "duracion",
  "comentario",
  "contacto",
  "gracias",
] as const;

type Step = (typeof STEPS)[number];

function visibleSteps(draft: SurveyDraft): Step[] {
  if (draft.previousEvent === "ninguno" || draft.previousEvent === "") {
    return STEPS.filter((step) => step !== "satisfaccion");
  }
  return [...STEPS];
}

export function SurveyApp() {
  const [draft, setDraft] = useState<SurveyDraft>(emptyDraft);
  const [step, setStep] = useState<Step>("bienvenida");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const flow = useMemo(() => visibleSteps(draft), [draft.previousEvent]);
  const index = Math.max(0, flow.indexOf(step));
  const progress = index / (flow.length - 1);

  function go(next: Step) {
    setError("");
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    const nextStep = flow[index + 1];
    if (nextStep) go(nextStep);
  }

  function back() {
    const prev = flow[index - 1];
    if (prev) go(prev);
  }

  function toggleTopic(id: string) {
    setDraft((current) => {
      if (current.topics.includes(id)) {
        return { ...current, topics: current.topics.filter((topic) => topic !== id) };
      }
      if (current.topics.length >= MAX_TOPICS) return current;
      return { ...current, topics: [...current.topics, id] };
    });
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setSending(true);
    setError("");

    const { error: insertError } = await supabase.from("survey_responses").insert({
      role: draft.role,
      previous_event: draft.previousEvent,
      satisfaction: draft.previousEvent === "ninguno" ? null : draft.satisfaction,
      topics: draft.topics,
      other_topic: draft.otherTopic.trim() || null,
      format: draft.format,
      duration: draft.duration,
      comment: draft.comment.trim() || null,
      name: draft.name.trim() || null,
      contact: draft.contact.trim() || null,
      user_agent: navigator.userAgent,
    });

    setSending(false);

    if (insertError) {
      const missingTable = /could not find the table|schema cache/i.test(insertError.message);
      setError(
        missingTable
          ? "Falta crear la tabla en Supabase. Abre /setup y ejecuta el SQL."
          : insertError.message,
      );
      return;
    }

    go("gracias");
  }

  const canContinue =
    (step === "rol" && Boolean(draft.role)) ||
    (step === "evento" && Boolean(draft.previousEvent)) ||
    (step === "satisfaccion" && Boolean(draft.satisfaction)) ||
    (step === "temas" && draft.topics.length > 0) ||
    (step === "formato" && Boolean(draft.format)) ||
    (step === "duracion" && Boolean(draft.duration)) ||
    step === "comentario" ||
    step === "contacto" ||
    step === "bienvenida";

  return (
    <main className="grain relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex shrink-0 items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2.5 text-forest">
          <Logo className="h-12 w-12" />
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-gold uppercase">
              BIOCREA
            </p>
            <p className="text-sm text-ink-soft">Congreso equino</p>
          </div>
        </div>
        {step !== "bienvenida" && step !== "gracias" ? (
          <p className="text-sm text-ink-soft">
            {index}/{flow.length - 2}
          </p>
        ) : null}
      </header>

      {step !== "bienvenida" && step !== "gracias" ? (
        <div className="mb-4 h-1 shrink-0 overflow-hidden rounded-full bg-paper-deep">
          <div
            className="progress-bar h-full rounded-full bg-gold"
            style={{ transform: `scaleX(${Math.max(progress, 0.08)})` }}
          />
        </div>
      ) : null}

      <section key={step} className="step-enter flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
        {step === "bienvenida" ? (
          <Welcome onStart={next} />
        ) : null}

        {step === "rol" ? (
          <Question title="¿Cuál es tu rol?" hint="Así entendemos quién está construyendo la agenda.">
            <ChoiceList
              options={ROLES.map((item) => ({ id: item.id, label: item.label }))}
              value={draft.role}
              onChange={(role) => setDraft((current) => ({ ...current, role }))}
            />
          </Question>
        ) : null}

        {step === "evento" ? (
          <Question
            title="¿Has estado en un evento BIOCREA?"
            hint="Incluye el congreso de neonatología y el curso de fisioterapia y rehabilitación."
          >
            <ChoiceList
              options={PREVIOUS_EVENTS.map((item) => ({ id: item.id, label: item.label }))}
              value={draft.previousEvent}
              onChange={(previousEvent) =>
                setDraft((current) => ({ ...current, previousEvent }))
              }
            />
          </Question>
        ) : null}

        {step === "satisfaccion" ? (
          <Question
            title="¿Qué tan satisfecho quedaste?"
            hint="Tu nota nos ayuda a cuidar el próximo congreso."
          >
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  data-selected={draft.satisfaction === score}
                  onClick={() => setDraft((current) => ({ ...current, satisfaction: score }))}
                  className="choice aspect-square rounded-2xl text-lg font-semibold"
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink-soft">
              <span>Bajo</span>
              <span>Excelente</span>
            </div>
          </Question>
        ) : null}

        {step === "temas" ? (
          <Question
            title="¿Qué te gustaría ver en el próximo congreso?"
            hint={`Elige hasta ${MAX_TOPICS}. El orden de toque cuenta como prioridad.`}
          >
            <div className="grid grid-cols-2 gap-2.5">
              {TOPICS.map((topic) => {
                const selectedIndex = draft.topics.indexOf(topic.id);
                const selected = selectedIndex >= 0;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    data-selected={selected}
                    onClick={() => toggleTopic(topic.id)}
                    className="choice relative flex min-h-[5.6rem] flex-col items-start justify-between rounded-[1.35rem] p-3 text-left"
                  >
                    {selected ? (
                      <span className="absolute top-2.5 right-2.5 grid h-6 w-6 place-items-center rounded-full bg-gold text-xs font-bold text-ink">
                        {selectedIndex + 1}
                      </span>
                    ) : null}
                    <span className="pr-7 text-[0.95rem] leading-tight font-semibold">
                      {topic.label}
                    </span>
                    <span className={`text-[0.7rem] leading-snug ${selected ? "text-white/70" : "text-ink-soft"}`}>
                      {topic.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-ink-soft">¿Otro tema?</span>
              <input
                value={draft.otherTopic}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, otherTopic: event.target.value }))
                }
                placeholder="Ej. cardiología, genética, laboratorio..."
                className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 outline-none focus:border-forest"
              />
            </label>
          </Question>
        ) : null}

        {step === "formato" ? (
          <Question title="¿Qué formato prefieres?" hint="Queremos que el congreso se sienta útil, no solo largo.">
            <ChoiceList
              options={FORMATS.map((item) => ({
                id: item.id,
                label: item.label,
                hint: item.hint,
              }))}
              value={draft.format}
              onChange={(format) => setDraft((current) => ({ ...current, format }))}
            />
          </Question>
        ) : null}

        {step === "duracion" ? (
          <Question title="¿Cuál sería la duración ideal?">
            <ChoiceList
              options={DURATIONS.map((item) => ({ id: item.id, label: item.label }))}
              value={draft.duration}
              onChange={(duration) => setDraft((current) => ({ ...current, duration }))}
            />
          </Question>
        ) : null}

        {step === "comentario" ? (
          <Question
            title="¿Algo que no puede faltar?"
            hint="Conferencista, caso clínico, estación práctica... lo que quieras."
          >
            <textarea
              value={draft.comment}
              onChange={(event) =>
                setDraft((current) => ({ ...current, comment: event.target.value }))
              }
              rows={6}
              placeholder="Escribe aquí, es opcional."
              className="w-full resize-none rounded-[1.4rem] border border-[var(--line)] bg-white/70 p-4 outline-none focus:border-forest"
            />
          </Question>
        ) : null}

        {step === "contacto" ? (
          <Question
            title="¿Te avisamos cuando abra la inscripción?"
            hint="Opcional. Solo lo usamos para el próximo congreso."
          >
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nombre"
              autoComplete="name"
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 outline-none focus:border-forest"
            />
            <input
              value={draft.contact}
              onChange={(event) =>
                setDraft((current) => ({ ...current, contact: event.target.value }))
              }
              placeholder="WhatsApp o correo"
              autoComplete="tel"
              inputMode="email"
              className="mt-2.5 h-12 w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 outline-none focus:border-forest"
            />
            {error ? (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <p>{error}</p>
                <a href="/setup" className="mt-2 inline-block font-semibold underline">
                  Abrir instrucciones y crear la tabla
                </a>
              </div>
            ) : null}
          </Question>
        ) : null}

        {step === "gracias" ? <Thanks /> : null}
      </section>

      {step !== "bienvenida" && step !== "gracias" ? (
        <Nav
          onBack={back}
          onNext={step === "contacto" ? submit : next}
          nextLabel={
            step === "contacto"
              ? sending
                ? "Enviando..."
                : "Enviar encuesta"
              : step === "comentario" && !draft.comment
                ? "Saltar"
                : "Continuar"
          }
          disabled={step === "contacto" ? sending : !canContinue}
        />
      ) : null}
    </main>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-between pb-2">
      <div className="pt-6">
        <p className="text-sm font-medium tracking-[0.18em] text-gold uppercase">
          Encuesta de satisfacción
        </p>
        <h1 className="font-display mt-3 max-w-[14ch] text-[2.55rem] leading-[0.95] font-semibold">
          ¿Qué quieres ver en el próximo congreso?
        </h1>
        <p className="mt-5 max-w-[34ch] text-[1.05rem] leading-relaxed text-ink-soft">
          Ortopedia, oftalmología, reproducción y más. Tu voto arma la agenda de
          BIOCREA.
        </p>
      </div>
      <div>
        <button type="button" onClick={onStart} className="cta w-full rounded-full text-base font-semibold">
          Empezar · 1 min
        </button>
        <p className="mt-3 text-center text-xs text-ink-soft">
          Medicina veterinaria equina · Medellín
        </p>
      </div>
    </div>
  );
}

function Thanks() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center pb-8 text-center">
      <Logo className="mx-auto h-20 w-20 text-forest" />
      <h1 className="font-display mt-6 text-4xl font-semibold">Gracias</h1>
      <p className="mx-auto mt-3 max-w-[28ch] text-ink-soft">
        Ya quedó tu voto para el próximo congreso BIOCREA. Te esperamos en la
        siguiente cita.
      </p>
      <a
        href="https://www.instagram.com/biocrea_reproduccion/"
        className="cta mt-8 inline-flex items-center justify-center rounded-full px-6 text-base font-semibold"
      >
        Seguir a BIOCREA
      </a>
    </div>
  );
}

function Question({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1">
      <h2 className="font-display text-[1.85rem] leading-tight font-semibold">{title}</h2>
      {hint ? <p className="mt-2 mb-5 text-sm leading-relaxed text-ink-soft">{hint}</p> : <div className="mb-5" />}
      {children}
    </div>
  );
}

function ChoiceList({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; hint?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          data-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className="choice flex w-full flex-col items-start justify-center rounded-2xl px-4 py-3 text-left"
        >
          <span className="font-medium">{option.label}</span>
          {option.hint ? (
            <span
              className={`text-sm ${value === option.id ? "text-white/70" : "text-ink-soft"}`}
            >
              {option.hint}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  nextLabel,
  disabled,
}: {
  onBack: () => void;
  onNext: (event?: FormEvent) => void;
  nextLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-2 pt-2 pb-1">
      <button
        type="button"
        onClick={onBack}
        className="h-[3.35rem] min-w-[3.35rem] rounded-full border border-[var(--line)] bg-white/70 px-4 font-medium"
      >
        Atrás
      </button>
      <button
        type="button"
        onClick={() => onNext()}
        disabled={disabled}
        className="cta flex-1 rounded-full font-semibold"
      >
        {nextLabel}
      </button>
    </div>
  );
}
