import type { Intensity, Mode } from "./modes-data";
import { makeId } from "./vault-store";

const COLUMNS = [
  "id",
  "mode",
  "category",
  "subcategory",
  "purpose",
  "coreObjective",
  "corePrinciples",
  "failureModes",
  "integrityChecks",
  "bestFor",
  "avoidWhen",
  "stackWith",
  "attributes",
  "exitPhrase",
  "intensity",
  "exampleUse",
  "fullPrompt",
  "triggers",
] as const;

type Col = (typeof COLUMNS)[number];

function escapeCell(value: string): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function modesToCSV(modes: Mode[]): string {
  const header = COLUMNS.join(",");
  const rows = modes.map((m) =>
    COLUMNS.map((c) => {
      if (c === "triggers") return escapeCell(m.triggers.join("|"));
      return escapeCell((m as any)[c] ?? "");
    }).join(","),
  );
  return [header, ...rows].join("\n");
}

/** RFC 4180-ish CSV parser supporting quoted fields, escaped quotes, and newlines in quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && src[i + 1] === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

const VALID_INTENSITY: Intensity[] = ["Low", "Medium", "High", "Extreme"];

export interface ImportResult {
  modes: Mode[];
  errors: string[];
}

export function csvToModes(text: string): ImportResult {
  const errors: string[] = [];
  const rows = parseCSV(text);
  if (rows.length === 0) return { modes: [], errors: ["CSV is empty."] };
  const header = rows[0].map((h) => h.trim());
  const idx: Partial<Record<Col, number>> = {};
  COLUMNS.forEach((c) => {
    const i = header.indexOf(c);
    if (i >= 0) idx[c] = i;
  });
  const required: Col[] = ["mode", "purpose", "fullPrompt"];
  for (const r of required) {
    if (idx[r] === undefined) errors.push(`Missing required column: ${r}`);
  }
  if (errors.length) return { modes: [], errors };

  const modes: Mode[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (c: Col) => (idx[c] !== undefined ? (row[idx[c]!] ?? "").trim() : "");
    const name = get("mode");
    if (!name) {
      errors.push(`Row ${r + 1}: missing "mode" — skipped.`);
      continue;
    }
    const rawIntensity = get("intensity") || "Medium";
    const intensity = (VALID_INTENSITY.find((v) => v.toLowerCase() === rawIntensity.toLowerCase()) ??
      "Medium") as Intensity;
    const triggers = get("triggers")
      .split(/[|,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    modes.push({
      id: get("id") || makeId(name),
      mode: name,
      category: get("category") || "General",
      subcategory: get("subcategory"),
      purpose: get("purpose"),
      coreObjective: get("coreObjective"),
      corePrinciples: get("corePrinciples"),
      failureModes: get("failureModes"),
      integrityChecks: get("integrityChecks"),
      bestFor: get("bestFor"),
      avoidWhen: get("avoidWhen"),
      stackWith: get("stackWith"),
      attributes: get("attributes"),
      exitPhrase: get("exitPhrase") || `Exit ${name}.`,
      intensity,
      exampleUse: get("exampleUse"),
      fullPrompt: get("fullPrompt"),
      triggers,
    });
  }
  // de-duplicate ids
  const seen = new Set<string>();
  for (const m of modes) {
    let id = m.id;
    let n = 2;
    while (seen.has(id)) id = `${m.id}-${n++}`;
    m.id = id;
    seen.add(id);
  }
  return { modes, errors };
}

export async function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8",
  });

  const file = new File([blob], filename, {
    type: "text/csv;charset=utf-8",
  });

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "ModeStack Vault Export",
      });
      return;
    } catch {
      // If Android/Chrome denies share permission, fall through to normal download.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 5000);
}
