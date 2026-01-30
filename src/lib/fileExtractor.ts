import { extractPptxText } from "./pptxExtractor";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import ExcelJS from "exceljs";

/**
 * Extracts raw text from various file formats.
 * @param buffer - The file buffer
 * @param mimeType - The MIME type of the file
 * @param fileName - The original file name
 * @returns The extracted text content
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lowerName = fileName.toLowerCase();

  // 1. PDF
  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (e) {
      console.error("Error extracting text from PDF:", e);
      throw new Error(`Failed to extract text from PDF: ${(e as Error).message}`);
    }
  }

  // 2. DOCX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (e) {
      console.error("Error extracting text from DOCX:", e);
      throw new Error(`Failed to extract text from DOCX: ${(e as Error).message}`);
    }
  }

  // 3. PPTX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lowerName.endsWith(".pptx")
  ) {
    return extractPptxText(buffer);
  }

  // 4. XLSX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    lowerName.endsWith(".xlsx")
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      let text = "";
      workbook.eachSheet((worksheet, sheetId) => {
        text += `\n--- Sheet: ${worksheet.name} ---\n`;
        worksheet.eachRow((row, rowNumber) => {
          // row.values is an array (1-indexed for some reason in exceljs, index 0 is null/undefined)
          // We join the values to simulate CSV-like line
          const rowValues = Array.isArray(row.values)
            ? row.values.slice(1).map(val => val?.toString() || "").join(", ")
            : "";
          if (rowValues.trim()) {
            text += rowValues + "\n";
          }
        });
      });
      return text;
    } catch (e) {
      console.error("Error extracting text from XLSX:", e);
      throw new Error(`Failed to extract text from XLSX: ${(e as Error).message}`);
    }
  }

  // 5. CSV
  if (
    mimeType === "text/csv" ||
    lowerName.endsWith(".csv")
  ) {
    // For CSV, we can just treat it as text since the requirement is "extraction"
    return buffer.toString("utf-8");
  }

  // 6. JSON
  if (mimeType === "application/json" || lowerName.endsWith(".json")) {
    try {
      const str = buffer.toString("utf-8");
      // Validate JSON
      JSON.parse(str);
      return str;
    } catch (e) {
      // treating as text
      return buffer.toString("utf-8");
    }
  }

  // 7. Plain Text / Fallback
  // If it's text/* or we just want to try reading as text
  return buffer.toString("utf-8");
}
