import { NextResponse } from "next/server";
import { listResponses, saveResponse } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "biocrea";

export async function GET(request: Request) {
  const pin = request.headers.get("x-admin-pin") ?? "";
  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  const rows = await listResponses();
  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "La respuesta no es válida." }, { status: 400 });
  }

  const role = text(body.role);
  const previousEvent = text(body.previous_event);
  const topics = Array.isArray(body.topics)
    ? body.topics.filter((item): item is string => typeof item === "string")
    : [];

  if (!role || !previousEvent || topics.length === 0) {
    return NextResponse.json({ error: "Faltan datos de la encuesta." }, { status: 400 });
  }

  const row = await saveResponse({
    role,
    previous_event: previousEvent,
    satisfaction: numberOrNull(body.satisfaction),
    topics,
    other_topic: text(body.other_topic),
    format: text(body.format),
    duration: text(body.duration),
    comment: text(body.comment),
    name: text(body.name),
    contact: text(body.contact),
    user_agent: text(body.user_agent),
  });

  return NextResponse.json({ ok: true, id: row.id });
}

function text(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
