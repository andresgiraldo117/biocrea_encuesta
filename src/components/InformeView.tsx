"use client";

import { useEffect, useState } from "react";
import { InformeDocument } from "@/components/InformeDocument";
import { Logo } from "@/components/Logo";
import { downloadSurveyPdf } from "@/lib/download-report";
import { buildReport } from "@/lib/report";
import { loadSurveys } from "@/lib/survey-client";
import type { SurveyRow } from "@/lib/survey";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "biocrea";
const UNLOCK_KEY = "biocrea-admin-ok";

export function InformeView() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    void loadSurveys(PIN)
      .then((data) => {
        setRows(data);
      })
      .catch((queryError: unknown) => {
        setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar las respuestas.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [unlocked]);

  if (!unlocked) {
    return (
      <main className="grain mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
        <Logo className="mb-4 h-14 w-14" />
        <h1 className="font-display text-4xl font-semibold">Informe</h1>
        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (pin.trim() !== PIN) {
              setError("PIN incorrecto.");
              return;
            }
            sessionStorage.setItem(UNLOCK_KEY, "1");
            setUnlocked(true);
            setError("");
          }}
        >
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

  const report = buildReport(rows);

  return (
    <main className="grain min-h-dvh px-4 py-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <a href="/admin" className="text-sm text-ink-soft underline">
          Volver al panel
        </a>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium"
          >
            Imprimir
          </button>
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
            className="cta rounded-full px-5 py-2 text-sm font-semibold"
          >
            {downloading ? "Preparando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
      {loading ? <p className="mx-auto max-w-[210mm] text-ink-soft">Cargando resultados...</p> : null}
      {error ? <p className="mx-auto max-w-[210mm] text-sm text-red-800">{error}</p> : null}
      {!loading && !error ? <InformeDocument report={report} /> : null}
    </main>
  );
}
