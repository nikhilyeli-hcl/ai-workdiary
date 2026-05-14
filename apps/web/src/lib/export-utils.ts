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
