export const ROLES = [
  { id: "veterinario", label: "Médico veterinario" },
  { id: "estudiante", label: "Estudiante de MV" },
  { id: "zootecnista", label: "Zootecnista" },
  { id: "propietario", label: "Propietario / criadero" },
  { id: "tecnico", label: "Técnico o auxiliar" },
  { id: "otro", label: "Otro" },
] as const;

export const PREVIOUS_EVENTS = [
  { id: "neonatologia", label: "Sí, el congreso de neonatología" },
  {
    id: "fisioterapia",
    label: "Sí, el curso de fisioterapia y rehabilitación",
    badge: "Actual",
  },
  { id: "otro-evento", label: "Sí, otro curso o evento BIOCREA" },
  { id: "ninguno", label: "Aún no he participado" },
] as const satisfies readonly { id: string; label: string; badge?: string }[];

export const TOPICS = [
  {
    id: "ortopedia",
    label: "Ortopedia",
    hint: "Cojeras, articulaciones y traumatología",
  },
  {
    id: "oftalmologia",
    label: "Oftalmología",
    hint: "Ojo, córnea y urgencias visuales",
  },
  {
    id: "reproduccion",
    label: "Reproducción",
    hint: "IA, semen, embriones y yeguas",
  },
  {
    id: "odontologia",
    label: "Odontología",
    hint: "Boca, oclusión y performance",
  },
  {
    id: "endoscopia",
    label: "Endoscopia",
    hint: "Vías aéreas y diagnóstico interno",
  },
  {
    id: "neonatologia",
    label: "Neonatología",
    hint: "Potrillos y cuidados críticos",
  },
  {
    id: "medicina-interna",
    label: "Medicina interna",
    hint: "Cólico, metabólico y clínico",
  },
  {
    id: "cirugia",
    label: "Cirugía",
    hint: "Tejidos blandos y procedimientos",
  },
  {
    id: "anestesia",
    label: "Anestesia y analgesia",
    hint: "Dolor, sedación y quirófano",
  },
  {
    id: "imagen",
    label: "Diagnóstico por imagen",
    hint: "Eco, RX y estudios avanzados",
  },
  {
    id: "podologia",
    label: "Podología",
    hint: "Casco, aplomos y herrado",
  },
  {
    id: "nutricion",
    label: "Nutrición",
    hint: "Dieta, rendimiento y metabolismo",
  },
  {
    id: "deportiva",
    label: "Medicina deportiva",
    hint: "Atleta equino y recuperación",
  },
  {
    id: "dermatologia",
    label: "Dermatología",
    hint: "Piel, alergias y heridas",
  },
  {
    id: "bienestar",
    label: "Bienestar y etología",
    hint: "Comportamiento y manejo",
  },
  {
    id: "emergencias",
    label: "Emergencias y UCI",
    hint: "Estable y cuidados intensivos",
  },
] as const;

export const FORMATS = [
  { id: "mixto", label: "Mixto", hint: "Conferencias + talleres prácticos" },
  { id: "practico", label: "Práctico", hint: "Hands-on, casos y estación" },
  { id: "teorico", label: "Teórico", hint: "Conferencias y actualización" },
  { id: "hibrido", label: "Híbrido", hint: "Presencial con transmisión virtual" },
] as const;

export const DURATIONS = [
  { id: "1-dia", label: "1 día" },
  { id: "2-dias", label: "2 días" },
  { id: "3-dias", label: "3 días o más" },
  { id: "cursos-cortos", label: "Cursos cortos durante el año" },
] as const;

export const MAX_TOPICS = 5;

export function labelOf(
  list: readonly { id: string; label: string }[],
  id: string | null | undefined,
) {
  if (!id) return "—";
  return list.find((item) => item.id === id)?.label ?? id;
}

export type SurveyDraft = {
  role: string;
  previousEvent: string;
  satisfaction: number | null;
  topics: string[];
  otherTopic: string;
  format: string;
  duration: string;
  comment: string;
  name: string;
  contact: string;
};

export const emptyDraft = (): SurveyDraft => ({
  role: "",
  previousEvent: "",
  satisfaction: null,
  topics: [],
  otherTopic: "",
  format: "",
  duration: "",
  comment: "",
  name: "",
  contact: "",
});

export type SurveyRow = {
  id: string;
  created_at: string;
  role: string | null;
  previous_event: string | null;
  satisfaction: number | null;
  topics: string[] | null;
  other_topic: string | null;
  format: string | null;
  duration: string | null;
  comment: string | null;
  name: string | null;
  contact: string | null;
};
