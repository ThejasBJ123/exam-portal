/**
 * Utility to export datasets to Excel-compatible CSV files with UTF-8 BOM.
 * Microsoft Excel, Google Sheets, and LibreOffice immediately parse UTF-8 BOM CSVs
 * into structured columns with full support for international characters and numbers.
 */

export interface ExcelColumn<T = any> {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string;
}

export function downloadExcel<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: ExcelColumn<T>[]
) {
  if (!data || data.length === 0) {
    alert("No candidate records available to download.");
    return;
  }

  // Header row
  const headerRow = columns
    .map((col) => `"${String(col.label).replace(/"/g, '""')}"`)
    .join(",");

  // Data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        let val: any = row[col.key as keyof T];
        let strVal = "";
        if (col.format) {
          strVal = col.format(val, row);
        } else if (val === null || val === undefined) {
          strVal = "";
        } else if (typeof val === "object" && val instanceof Date) {
          strVal = val.toLocaleString();
        } else {
          strVal = String(val);
        }
        return `"${strVal.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const cleanName = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", cleanName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
