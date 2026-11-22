import type { SurveyRow } from "@/lib/survey";

export async function submitSurvey(payload: Record<string, unknown>) {
  const response = await fetch("/api/survey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "No se pudo guardar la respuesta.");
  }
}

export async function loadSurveys(pin: string): Promise<SurveyRow[]> {
  const response = await fetch("/api/survey", {
    headers: { "x-admin-pin": pin },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | { rows?: SurveyRow[]; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.error || "No se pudieron cargar las respuestas.");
  }

  return data?.rows ?? [];
}
