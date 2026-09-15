import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  executiveSummary,
  formatReportDate,
  type RankedItem,
  type SurveyReport,
} from "@/lib/report";

const FOREST: [number, number, number] = [36, 56, 46];
const GOLD: [number, number, number] = [184, 137, 62];
const INK: [number, number, number] = [23, 20, 17];
const SOFT: [number, number, number] = [74, 67, 59];
const PAPER: [number, number, number] = [247, 241, 231];
const LINE: [number, number, number] = [231, 220, 203];
const MARGIN = 14;
const FOOTER = 12;

type PdfDoc = jsPDF & { lastAutoTable?: { finalY: number } };

async function logoDataUrl() {
  const response = await fetch("/logo.png");
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function fileName(date: Date) {
  return `BIOCREA-informe-encuesta-congreso-${date.toISOString().slice(0, 10)}.pdf`;
}

function pageSize(doc: jsPDF) {
  return {
    w: doc.internal.pageSize.getWidth(),
    h: doc.internal.pageSize.getHeight(),
  };
}

function lastY(doc: PdfDoc, fallback: number) {
  return doc.lastAutoTable?.finalY ?? fallback;
}

function drawFooter(doc: jsPDF, page: number, total: number) {
  const { w, h } = pageSize(doc);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, h - FOOTER, w - MARGIN, h - FOOTER);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...SOFT);
  doc.text("BIOCREA · Informe de encuesta", MARGIN, h - 6);
  doc.text(`${page} / ${total}`, w - MARGIN, h - 6, { align: "right" });
}

function drawInnerHeader(doc: jsPDF, title: string) {
  const { w } = pageSize(doc);
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, w, 10, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 10, w, 0.8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(246, 240, 230);
  doc.text(title, MARGIN, 7);
}

function ensureSpace(doc: PdfDoc, y: number, need: number, header = "BIOCREA · Informe de encuesta") {
  const { h } = pageSize(doc);
  if (y + need <= h - FOOTER - 4) return y;
  doc.addPage();
  drawInnerHeader(doc, header);
  return 16;
}

function sectionTitle(doc: PdfDoc, text: string, y: number) {
  y = ensureSpace(doc, y, 12);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 1.6, MARGIN + 22, y + 1.6);
  return y + 5;
}

function withCount(rows: RankedItem[]) {
  return rows.filter((item) => item.count > 0);
}

function rankedTable(
  doc: PdfDoc,
  title: string,
  rows: RankedItem[],
  startY: number,
  options?: { extraHeader?: string; marginLeft?: number; tableWidth?: number },
) {
  const visible = withCount(rows);
  if (!visible.length) return startY;
  autoTable(doc, {
    startY,
    margin: {
      left: options?.marginLeft ?? MARGIN,
      right: MARGIN,
      bottom: FOOTER + 4,
    },
    tableWidth: options?.tableWidth,
    head: options?.extraHeader
      ? [["#", title, "N.º", "1.ª", "%"]]
      : [["#", title, "N.º", "%"]],
    body: visible.map((item, index) =>
      options?.extraHeader
        ? [
            String(index + 1),
            item.label,
            String(item.count),
            String(item.firstChoice ?? 0),
            `${item.pct}%`,
          ]
        : [String(index + 1), item.label, String(item.count), `${item.pct}%`],
    ),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: INK,
      cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
    },
    headStyles: {
      fillColor: FOREST,
      textColor: [246, 240, 230],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: PAPER },
    columnStyles: options?.extraHeader
      ? {
          0: { cellWidth: 8 },
          2: { cellWidth: 12, halign: "right" },
          3: { cellWidth: 12, halign: "right" },
          4: { cellWidth: 14, halign: "right" },
        }
      : {
          0: { cellWidth: 8 },
          2: { cellWidth: 14, halign: "right" },
          3: { cellWidth: 16, halign: "right" },
        },
  });
  return lastY(doc, startY) + 4;
}

function kpiBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...LINE);
  doc.roundedRect(x, y, w, 18, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...SOFT);
  doc.text(label.toUpperCase(), x + 4, y + 6);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...FOREST);
  doc.text(value, x + 4, y + 14);
}

export async function downloadSurveyPdf(report: SurveyReport) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as PdfDoc;
  const { w } = pageSize(doc);
  const contentW = w - MARGIN * 2;
  const logo = await logoDataUrl().catch(() => "");

  doc.setFillColor(...FOREST);
  doc.rect(0, 0, w, 42, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 42, w, 1.2, "F");

  if (logo) {
    doc.setFillColor(255, 255, 255);
    doc.circle(24, 21, 9, "F");
    doc.addImage(logo, "PNG", 16.5, 13.5, 15, 15);
  }

  const textX = logo ? 38 : MARGIN;
  doc.setTextColor(215, 181, 106);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BIOCREA  ·  MEDICINA VETERINARIA EQUINA", textX, 14);

  doc.setTextColor(246, 240, 230);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("Informe de encuesta", textX, 23);
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.text("¿Qué quieres ver en el próximo congreso?", textX, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(214, 204, 188);
  doc.text(`Generado el ${formatReportDate(report.generatedAt)} · Uso interno`, textX, 37);

  const boxW = (contentW - 8) / 3;
  kpiBox(doc, MARGIN, 48, boxW, "Respuestas", String(report.total));
  kpiBox(
    doc,
    MARGIN + boxW + 4,
    48,
    boxW,
    "Satisfacción",
    report.avgSatisfaction ? `${report.avgSatisfaction.toFixed(1)} / 5` : "—",
  );
  const top = report.rankedTopics.find((item) => item.count > 0);
  kpiBox(doc, MARGIN + (boxW + 4) * 2, 48, boxW, "Especialidad líder", top?.label ?? "—");

  let y = sectionTitle(doc, "Resumen ejecutivo", 74);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SOFT);
  const summary = doc.splitTextToSize(executiveSummary(report), contentW);
  y = ensureSpace(doc, y, summary.length * 4.4);
  doc.text(summary, MARGIN, y);
  y += summary.length * 4.4 + 4;

  y = sectionTitle(doc, "Especialidades más pedidas", y);
  y = rankedTable(doc, "Especialidad", report.rankedTopics, y, { extraHeader: "1.ª" });

  y = sectionTitle(doc, "Perfil, formato y duración", y);
  y = ensureSpace(doc, y, 42);
  const colW = (contentW - 6) / 2;
  const leftY = y;
  const afterLeft = rankedTable(doc, "Rol", report.roles, leftY, {
    marginLeft: MARGIN,
    tableWidth: colW,
  });
  const afterRight = rankedTable(doc, "Participación previa", report.previousEvents, leftY, {
    marginLeft: MARGIN + colW + 6,
    tableWidth: colW,
  });
  y = Math.max(afterLeft, afterRight);

  const afterFormat = rankedTable(doc, "Formato", report.formats, y, {
    marginLeft: MARGIN,
    tableWidth: colW,
  });
  const afterDuration = rankedTable(doc, "Duración", report.durations, y, {
    marginLeft: MARGIN + colW + 6,
    tableWidth: colW,
  });
  y = Math.max(afterFormat, afterDuration) + 2;

  if (report.otherTopics.length || report.comments.length) {
    y = sectionTitle(doc, "Voces de la comunidad", y);
    if (report.otherTopics.length) {
      y = ensureSpace(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...FOREST);
      doc.text("Otros temas propuestos", MARGIN, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      for (const topic of report.otherTopics) {
        const lines = doc.splitTextToSize(`•  ${topic}`, contentW);
        y = ensureSpace(doc, y, lines.length * 4.2 + 1);
        doc.text(lines, MARGIN, y);
        y += lines.length * 4.2 + 1;
      }
      y += 3;
    }

    if (report.comments.length) {
      y = ensureSpace(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...FOREST);
      doc.text("Comentarios", MARGIN, y);
      y += 5;
      for (const item of report.comments) {
        const body = doc.splitTextToSize(`“${item.comment.trim()}”`, contentW);
        y = ensureSpace(doc, y, 9 + body.length * 4.2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...SOFT);
        doc.text(`${item.date}  ·  ${item.role}`, MARGIN, y);
        y += 4;
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.setTextColor(...INK);
        doc.text(body, MARGIN, y);
        y += body.length * 4.2 + 3;
      }
    }
  }

  if (report.contacts.length) {
    y = sectionTitle(doc, "Aviso de inscripción", y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: FOOTER + 4 },
      head: [["Fecha", "Nombre", "Contacto"]],
      body: report.contacts.map((item) => [item.date, item.name, item.contact]),
      theme: "plain",
      styles: {
        fontSize: 8,
        textColor: INK,
        cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
      },
      headStyles: { fillColor: FOREST, textColor: [246, 240, 230], fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: PAPER },
    });
    y = lastY(doc, y) + 4;
  }

  if (report.responses.length) {
    y = sectionTitle(doc, "Anexo · respuestas", y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: FOOTER + 4 },
      head: [["Fecha", "Rol", "Especialidades", "Formato", "Duración", "Nota"]],
      body: report.responses.map((row) => [
        row.date,
        row.role,
        row.topics,
        row.format,
        row.duration,
        row.satisfaction,
      ]),
      styles: {
        fontSize: 7,
        textColor: INK,
        cellPadding: { top: 1.4, bottom: 1.4, left: 1.6, right: 1.6 },
        overflow: "linebreak",
      },
      headStyles: { fillColor: FOREST, textColor: [246, 240, 230], fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: PAPER },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 24 },
        5: { cellWidth: 14 },
      },
    });
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    drawFooter(doc, page, pages);
  }

  doc.save(fileName(report.generatedAt));
}
