import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

function cleanText(raw: string): string {
  return raw
    .replace(/[^\x20-\x7E\n\r\t]/g, " ") // remove non-printable
    .replace(/[ \t]+/g, " ")              // collapse spaces
    .replace(/\n{3,}/g, "\n\n")           // collapse blank lines
    .trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    const raw = await file.text();
    return cleanText(raw);
  }

  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => item.str)
        .join(" ");
      pages.push(text);
    }
    return cleanText(pages.join("\n\n"));
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return cleanText(result.value);
  }

  throw new Error(`Unsupported file format: .${ext}`);
}
