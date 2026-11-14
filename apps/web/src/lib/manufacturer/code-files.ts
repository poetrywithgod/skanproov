import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { site } from "@/lib/site";

/**
 * Builds the two files a manufacturer downloads after generating codes: a CSV (for the printer or
 * packing line) and a PDF of print-ready labels. Everything is built in memory from the readable
 * codes returned by the database once; the codes are never stored anywhere else.
 */

export type CodeFormat = "qr_pin" | "pin_only";

export interface GeneratedCode {
  token: string;
  pin: string;
}

export interface LabelInfo {
  productName: string;
  variant: string | null;
  batchNumber: string;
  runNo: number;
  format: CodeFormat;
}

/** What a printed QR code opens. The scanner only reads the last part, the code itself. */
export function codeUrl(token: string): string {
  return `${site.url}${site.links.verify}/${token}`;
}

/** "123456789012" -> "1234 5678 9012" */
export function groupedPin(pin: string): string {
  return pin.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function csvCell(value: string | number): string {
  const text = String(value);
  // Spreadsheet programs run text that starts with = + - @ as a formula; none of ours does, but stay safe.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildCsv(codes: GeneratedCode[], info: LabelInfo): string {
  const header = info.format === "qr_pin" ? ["No", "QR link", "Backup PIN", "Product", "Batch"] : ["No", "Backup PIN", "Product", "Batch"];
  const product = [info.productName, info.variant].filter(Boolean).join(" ");
  const lines = [header.map(csvCell).join(",")];
  codes.forEach((code, index) => {
    const row =
      info.format === "qr_pin"
        ? [index + 1, codeUrl(code.token), groupedPin(code.pin), product, info.batchNumber]
        : [index + 1, groupedPin(code.pin), product, info.batchNumber];
    lines.push(row.map(csvCell).join(","));
  });
  // A leading byte-order mark makes Excel open the file as UTF-8.
  return `﻿${lines.join("\r\n")}\r\n`;
}

const MM = 72 / 25.4;
const PAGE = { width: 210 * MM, height: 297 * MM };
const COLS = 3;
const ROWS = 8;
const LABEL = { width: 66 * MM, height: 31 * MM };
const MARGIN = { x: (PAGE.width - COLS * LABEL.width) / 2, y: (PAGE.height - ROWS * LABEL.height) / 2 };
const GREEN = "#0e6b4f";

/** One QR code drawn as vector squares, so it stays sharp at any print size. */
function drawQr(doc: PDFKit.PDFDocument, text: string, x: number, y: number, size: number): void {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const quiet = 2; // modules of white around the code
  const cell = size / (n + quiet * 2);
  const data = qr.modules.data;
  // Join runs of dark squares in a row, so a code is a couple of hundred shapes, not a thousand.
  for (let row = 0; row < n; row += 1) {
    let start = -1;
    for (let col = 0; col <= n; col += 1) {
      const dark = col < n && data[row * n + col] === 1;
      if (dark && start < 0) start = col;
      if (!dark && start >= 0) {
        doc.rect(x + (start + quiet) * cell, y + (row + quiet) * cell, (col - start) * cell + 0.15, cell + 0.15);
        start = -1;
      }
    }
  }
  doc.fill("#000000");
}

/** A4 sheets of labels, 3 across and 8 down, each with the QR code (if used), the backup PIN and the batch. */
export function buildLabelPdf(codes: GeneratedCode[], info: LabelInfo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE.width, PAGE.height], margin: 0, compress: true, info: { Title: `Codes GEN-${info.runNo}`, Author: "SKANPROOV" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const perPage = COLS * ROWS;
    const product = [info.productName, info.variant].filter(Boolean).join(" · ");
    const qrSize = 24 * MM;

    codes.forEach((code, index) => {
      const slot = index % perPage;
      if (index > 0 && slot === 0) doc.addPage();
      const x = MARGIN.x + (slot % COLS) * LABEL.width;
      const y = MARGIN.y + Math.floor(slot / COLS) * LABEL.height;

      doc.lineWidth(0.4).strokeColor("#c8d1cc").rect(x + 1.5 * MM, y + 1.5 * MM, LABEL.width - 3 * MM, LABEL.height - 3 * MM).stroke();

      const pad = 3.5 * MM;
      let textX = x + pad;
      let textWidth = LABEL.width - pad * 2;
      if (info.format === "qr_pin") {
        drawQr(doc, codeUrl(code.token), x + pad - 1.5 * MM, y + (LABEL.height - qrSize) / 2, qrSize);
        textX = x + pad + qrSize - 1 * MM;
        textWidth = LABEL.width - (textX - x) - pad;
      }

      doc.fillColor("#111111").font("Helvetica-Bold").fontSize(7.5).text(product, textX, y + 5 * MM, { width: textWidth, height: 18, ellipsis: true, lineBreak: true });
      doc.fillColor("#555555").font("Helvetica").fontSize(6.5).text(`Batch ${info.batchNumber}`, textX, y + 11.5 * MM, { width: textWidth, lineBreak: false });
      doc.fillColor("#555555").fontSize(6).text("Backup PIN", textX, y + 17 * MM, { width: textWidth, lineBreak: false });
      doc.fillColor(GREEN).font("Courier-Bold").fontSize(info.format === "qr_pin" ? 9.5 : 12).text(groupedPin(code.pin), textX, y + 20.5 * MM, { width: textWidth, lineBreak: false });
      doc.fillColor("#777777").font("Helvetica").fontSize(5).text("Verify at skanproov.com", textX, y + 26 * MM, { width: textWidth, lineBreak: false });
    });
    doc.end();
  });
}
