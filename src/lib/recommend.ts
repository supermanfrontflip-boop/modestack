import type { Mode } from "./modes-data";

export interface Recommendation {
  primary: Mode;
  supporting: Mode[];
  avoid: Mode | null;
  explanation: string;
  combinedPrompt: string;
}

interface Scored {
  mode: Mode;
  score: number;
  hits: string[];
}

function scoreMode(mode: Mode, text: string): Scored {
  const hits: string[] = [];
  let score = 0;
  for (const t of mode.triggers) {
    if (text.includes(t)) {
      hits.push(t);
      score += t.length > 5 ? 3 : 2;
    }
  }
  // soft category nudge
  if (text.includes(mode.category.toLowerCase())) score += 1;
  return { mode, score, hits };
}

export function recommend(situation: string, modes: Mode[]): Recommendation | null {
  if (!modes.length) return null;
  const text = ` ${situation.toLowerCase()} `;
  const scored = modes.map((m) => scoreMode(m, text));
  scored.sort((a, b) => b.score - a.score);

  // Fallbacks if nothing matched
  const top = scored[0].score > 0
    ? scored[0]
    : { mode: modes.find((m) => m.id === "owl") ?? modes[0], score: 0, hits: [] };

  const supporting = scored
    .filter((s) => s.mode.id !== top.mode.id && s.score > 0)
    .slice(0, 2)
    .map((s) => s.mode);

  // If no supporting matches, derive from primary.stackWith
  if (supporting.length === 0) {
    const stackNames = top.mode.stackWith.split(",").map((s) => s.trim().toLowerCase());
    for (const m of modes) {
      if (m.id === top.mode.id) continue;
      if (stackNames.some((n) => n && m.mode.toLowerCase().includes(n.split(" ")[0]))) {
        supporting.push(m);
      }
      if (supporting.length >= 2) break;
    }
  }

  // Avoid: lowest scoring mode whose intensity clashes
  const avoid = pickAvoid(top.mode, modes);

  const matched = top.hits.length
    ? `matched signals: ${top.hits.slice(0, 4).join(", ")}`
    : "no strong keyword signals — defaulted to a wide-angle analytical mode";

  const explanation =
    `${top.mode.mode} is primary because ${matched}. ` +
    `It is best for ${top.mode.bestFor.toLowerCase()} ` +
    (supporting.length
      ? `Stack with ${supporting.map((s) => s.mode).join(" and ")} to ${supporting[0].purpose.toLowerCase()}`
      : `Run it solo for a focused pass.`) +
    (avoid ? ` Avoid ${avoid.mode} here — ${avoid.avoidWhen.toLowerCase()}` : "");

  const combinedPrompt = buildCombinedPrompt(situation, top.mode, supporting);

  return {
    primary: top.mode,
    supporting,
    avoid,
    explanation,
    combinedPrompt,
  };
}

function pickAvoid(primary: Mode, modes: Mode[]): Mode | null {
  // Heuristic: pace opposite of primary
  const opposites: Record<string, string> = {
    Extreme: "Low",
    High: "Low",
    Low: "High",
    Medium: "Extreme",
  };
  const target = opposites[primary.intensity];
  const candidate = modes.find(
    (m) => m.id !== primary.id && m.intensity === target,
  );
  return candidate ?? null;
}

function buildCombinedPrompt(situation: string, primary: Mode, supporting: Mode[]): string {
  const lines: string[] = [];
  lines.push(`# Situation`);
  lines.push(situation.trim() || "(describe the situation here)");
  lines.push("");
  lines.push(`# Primary: ${primary.mode}`);
  lines.push(primary.fullPrompt);
  if (supporting.length) {
    lines.push("");
    lines.push(`# Stack`);
    for (const s of supporting) {
      lines.push(`- ${s.mode}: ${s.fullPrompt}`);
    }
  }
  lines.push("");
  lines.push(`# Exit`);
  lines.push(
    [primary, ...supporting].map((m) => m.exitPhrase).join(" "),
  );
  return lines.join("\n");
}
