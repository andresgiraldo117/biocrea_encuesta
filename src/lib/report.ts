import {
  DURATIONS,
  FORMATS,
  PREVIOUS_EVENTS,
  ROLES,
  TOPICS,
  labelOf,
  type SurveyRow,
} from "@/lib/survey";

export type RankedItem = {
  id: string;
  label: string;
  hint?: string;
  count: number;
  pct: number;
  firstChoice?: number;
};

export type SurveyReport = {
  generatedAt: Date;
  total: number;
  avgSatisfaction: number | null;
  satisfactionN: number;
  rankedTopics: RankedItem[];
  roles: RankedItem[];
  formats: RankedItem[];
  durations: RankedItem[];
  previousEvents: RankedItem[];
  otherTopics: string[];
  comments: { date: string; role: string; comment: string }[];
  contacts: { date: string; name: string; contact: string }[];
  responses: {
    date: string;
    role: string;
    topics: string;
    event: string;
    satisfaction: string;
    format: string;
    duration: string;
    other: string;
    comment: string;
    contact: string;
  }[];
};

function countMap(
  rows: SurveyRow[],
  pick: (row: SurveyRow) => string | null | undefined,
) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const id = pick(row);
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

function ranked(
  list: readonly { id: string; label: string; hint?: string }[],
  map: Map<string, number>,
  total: number,
  extra?: Map<string, number>,
): RankedItem[] {
  return list
    .map((item) => ({
      id: item.id,
      label: item.label,
      hint: item.hint,
      count: map.get(item.id) ?? 0,
      pct: total ? Math.round(((map.get(item.id) ?? 0) / total) * 100) : 0,
      firstChoice: extra?.get(item.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
}

export function formatReportDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatReportDateTime(date: Date | string) {
  return new Date(date).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildReport(rows: SurveyRow[], generatedAt = new Date()): SurveyReport {
  const total = rows.length;
  const topicCounts = new Map<string, number>();
  const firstChoice = new Map<string, number>();
  let satisfactionSum = 0;
  let satisfactionN = 0;
  const otherTopics: string[] = [];
  const comments: SurveyReport["comments"] = [];
  const contacts: SurveyReport["contacts"] = [];

  for (const row of rows) {
    const topics = row.topics ?? [];
    topics.forEach((topic, index) => {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
      if (index === 0) firstChoice.set(topic, (firstChoice.get(topic) ?? 0) + 1);
    });
    if (row.satisfaction) {
      satisfactionSum += row.satisfaction;
      satisfactionN += 1;
    }
    if (row.other_topic?.trim()) otherTopics.push(row.other_topic.trim());
    if (row.comment?.trim()) {
      comments.push({
        date: formatReportDateTime(row.created_at),
        role: labelOf(ROLES, row.role),
        comment: row.comment.trim(),
      });
    }
    if (row.name?.trim() || row.contact?.trim()) {
      contacts.push({
        date: formatReportDateTime(row.created_at),
        name: row.name?.trim() || "—",
        contact: row.contact?.trim() || "—",
      });
    }
  }

  return {
    generatedAt,
    total,
    avgSatisfaction: satisfactionN ? satisfactionSum / satisfactionN : null,
    satisfactionN,
    rankedTopics: ranked(TOPICS, topicCounts, total, firstChoice),
    roles: ranked(ROLES, countMap(rows, (row) => row.role), total),
    formats: ranked(FORMATS, countMap(rows, (row) => row.format), total),
    durations: ranked(DURATIONS, countMap(rows, (row) => row.duration), total),
    previousEvents: ranked(PREVIOUS_EVENTS, countMap(rows, (row) => row.previous_event), total),
    otherTopics,
    comments,
    contacts,
    responses: rows.map((row) => ({
      date: formatReportDateTime(row.created_at),
      role: labelOf(ROLES, row.role),
      topics: (row.topics ?? []).map((id) => labelOf(TOPICS, id)).join(", ") || "—",
      event: labelOf(PREVIOUS_EVENTS, row.previous_event),
      satisfaction: row.satisfaction ? `${row.satisfaction}/5` : "—",
      format: labelOf(FORMATS, row.format),
      duration: labelOf(DURATIONS, row.duration),
      other: row.other_topic?.trim() || "—",
      comment: row.comment?.trim() || "—",
      contact: [row.name, row.contact].filter(Boolean).join(" · ") || "—",
    })),
  };
}

export function executiveSummary(report: SurveyReport) {
  if (report.total === 0) {
    return "Todavía no hay respuestas registradas. Este informe se actualizará en cuanto la encuesta reciba participación.";
  }

  const top = report.rankedTopics.find((item) => item.count > 0);
  const format = report.formats.find((item) => item.count > 0);
  const duration = report.durations.find((item) => item.count > 0);
  const parts = [
    `Se recibieron ${report.total} ${report.total === 1 ? "respuesta" : "respuestas"} de la comunidad BIOCREA.`,
  ];

  if (top) {
    parts.push(
      `La especialidad más pedida para el próximo congreso es ${top.label} (${top.count} ${top.count === 1 ? "mención" : "menciones"}, ${top.pct}% de las personas).`,
    );
  }
  if (format) {
    parts.push(`El formato preferido es ${format.label.toLowerCase()}.`);
  }
  if (duration) {
    parts.push(`La duración más votada es ${duration.label.toLowerCase()}.`);
  }
  if (report.avgSatisfaction) {
    parts.push(
      `Quienes ya participaron en un evento BIOCREA calificaron su experiencia con ${report.avgSatisfaction.toFixed(1)} de 5.`,
    );
  }

  return parts.join(" ");
}
