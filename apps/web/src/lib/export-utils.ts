import ExcelJS from "exceljs";
import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  BorderStyle,
} from "docx";

// ── CSV ─────────────────────────────────────────────────────────────────────

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(
  rows: Array<Record<string, unknown>>,
  columns: string[]
): string {
  const header = columns.join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column])).join(",")
  );
  return [header, ...body].join("\n");
}

// ── Excel (.xlsx) ────────────────────────────────────────────────────────────

export async function toExcel(
  rows: Array<Record<string, unknown>>,
  columns: string[],
  sheetName = "Export"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI Work Diary";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  // Header row with styling
  sheet.columns = columns.map((col) => ({
    header: col,
    key: col,
    width: Math.max(12, col.length + 4),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  // Data rows
  for (const row of rows) {
    sheet.addRow(row);
  }

  // Auto-fit columns
  sheet.columns.forEach((col) => {
    let maxLen = col.header ? String(col.header).length : 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 60);
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

// ── Word (.docx) ─────────────────────────────────────────────────────────────

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
};

function makeCell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 18 })],
      }),
    ],
    borders: CELL_BORDER,
  });
}

export async function toWord(
  title: string,
  rows: Array<Record<string, unknown>>,
  columns: string[]
): Promise<Buffer> {
  const headerRow = new TableRow({
    children: columns.map((col) => makeCell(col, true)),
    tableHeader: true,
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: columns.map((col) => {
          const val = row[col];
          return makeCell(val === null || val === undefined ? "" : String(val));
        }),
      })
  );

  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Exported: ${new Date().toLocaleString()}`,
                italics: true,
                size: 18,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          table,
        ],
      },
    ],
  });

  const { Packer } = await import("docx");
  return Packer.toBuffer(doc);
}
