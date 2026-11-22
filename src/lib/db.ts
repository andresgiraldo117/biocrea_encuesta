import { appendFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { SurveyRow } from "@/lib/survey";

export type SurveyRecord = SurveyRow & {
  user_agent?: string | null;
};

const dataDir = process.env.SURVEY_DATA_DIR || path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "survey-responses.jsonl");

let writeQueue: Promise<void> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(work, work);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function listResponses(): Promise<SurveyRecord[]> {
  await ensureDir();
  let raw = "";
  try {
    raw = await readFile(dataFile, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const rows: SurveyRecord[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    rows.push(JSON.parse(line) as SurveyRecord);
  }
  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return rows;
}

export async function saveResponse(
  input: Omit<SurveyRecord, "id" | "created_at">,
): Promise<SurveyRecord> {
  const row: SurveyRecord = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  };

  await enqueue(async () => {
    await ensureDir();
    await appendFile(dataFile, `${JSON.stringify(row)}\n`, "utf8");
  });

  return row;
}
