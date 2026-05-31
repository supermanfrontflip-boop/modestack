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
  if (text.includes(mode.category.toLowerCase())) score += 1;
  return { mode, score, hits };
}

// ---- Boundary-situation detection -------------------------------------------------

const BOUNDARY_SIGNALS = [
  "boundary", "boundaries", "firm", "stand firm", "not budge", "don't budge",
  "hold the line", "not admit", "without admitting", "no admission",
  "preserve rights", "preserve my position", "without conceding", "without waiving",
  "procedural", "procedure", "formal complaint", "escalate", "escalation",
  "supervisor", "supervisory", "magistrate", "judge", "court", "lawsuit", "sue",
  "federal", "agency", "government", "official", "compliance", "ombudsman",
  "inspector general", "ada complaint", "title vi", "respectful but firm",
  "professional response", "file a complaint", "civil rights",
];

const COMEDY_OPT_IN = ["satire", "comedy", "comedic", "roast", "lyrics", "song", "parody", "fiction", "joke"];
const AGGRESSION_OPT_IN = ["aggressive", "attack", "go hard", "pressure", "seize", "dominate"];
const RESET_OPT_IN = ["reset", "plain language", "simplify", "tldr", "summarize"];

function detectBoundary(text: string): boolean {
  let count = 0;
  for (const s of BOUNDARY_SIGNALS) if (text.includes(s)) count++;
  return count >= 1;
}

// ---- Main -------------------------------------------------------------------------

export function recommend(situation: string, modes: Mode[]): Recommendation | null {
  if (!modes.length) return null;
  const text = ` ${situation.toLowerCase()} `;

  if (detectBoundary(text)) {
    const boundary = buildBoundaryRec(situation, text, modes);
    if (boundary) return boundary;
  }

  const scored = modes.map((m) => scoreMode(m, text));
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0].score > 0
    ? scored[0]
    : { mode: modes.find((m) => m.id === "owl") ?? modes[0], score: 0, hits: [] };

  const supporting = scored
    .filter((s) => s.mode.id !== top.mode.id && s.score > 0)
    .slice(0, 2)
    .map((s) => s.mode);

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

// ---- Boundary recommendation ------------------------------------------------------

function buildBoundaryRec(situation: string, text: string, modes: Mode[]): Recommendation | null {
  const byId = (id: string) => modes.find((m) => m.id === id);
  const glove = byId("glove");
  if (!glove) return null; // fall back to normal flow

  const wantsComedy = COMEDY_OPT_IN.some((k) => text.includes(k));
  const wantsAggression = AGGRESSION_OPT_IN.some((k) => text.includes(k));
  const wantsReset = RESET_OPT_IN.some((k) => text.includes(k));

  // Candidate stack in priority order
  const candidates: Array<{ id: string; reason: string }> = [
    { id: "diplomat", reason: "respectful, measured tone" },
    { id: "captain", reason: "procedural authority and clear command structure" },
    { id: "snail", reason: "step-by-step detail preservation so nothing is glossed over" },
    { id: "owl", reason: "scanning for hidden risks, admissions, and strategic wording" },
  ];

  const supporting: Mode[] = [];
  for (const c of candidates) {
    const m = byId(c.id);
    if (m && supporting.length < 2) supporting.push(m);
  }

  // Determine what to avoid (only one shown, but logic notes the rest)
  let avoid: Mode | null = null;
  if (!wantsComedy) avoid = byId("gomer-pyle") ?? null;
  if (!avoid && !wantsAggression) avoid = byId("hawk") ?? null;
  if (!avoid && !wantsReset) avoid = byId("clear") ?? null;

  const explanation =
    `${glove.mode} is primary because this is a firm professional boundary situation — ` +
    `you need to hold your position, avoid admissions, and stay procedurally correct without ` +
    `feeding conflict. ` +
    (supporting.length
      ? `Stack with ${supporting.map((s) => s.mode).join(" and ")} for ` +
        `${supporting.map((s) => candidates.find((c) => c.id === s.id)?.reason ?? s.purpose.toLowerCase()).join(" and ")}. `
      : ``) +
    (avoid
      ? `Avoid ${avoid.mode} here unless you specifically want ` +
        (avoid.id === "gomer-pyle"
          ? "satire, comedy, fiction, lyrics, or roast writing"
          : avoid.id === "hawk"
            ? "aggressive opportunity seizure"
            : avoid.id === "clear"
              ? "a plain-language reset"
              : avoid.avoidWhen.toLowerCase()) +
        "."
      : "");

  const combinedPrompt = buildBoundaryPrompt(situation, glove, supporting);

  return { primary: glove, supporting, avoid, explanation, combinedPrompt };
}

function buildBoundaryPrompt(situation: string, primary: Mode, supporting: Mode[]): string {
  const lines: string[] = [];
  lines.push(`# User Instructions`);
  lines.push(
    `Paste the combined prompt into your AI tool before asking it to draft the message. ` +
      `Do not use comedy, insults, threats, or emotional language unless intentionally ` +
      `writing fiction or satire.`,
  );
  lines.push("");
  lines.push(`# Task Instructions`);
  lines.push(`Create a message that:`);
  lines.push(`- stays calm and professional`);
  lines.push(`- preserves the user's position`);
  lines.push(`- avoids unnecessary admissions`);
  lines.push(`- uses procedural language`);
  lines.push(`- makes a specific request`);
  lines.push(`- escalates respectfully only if needed`);
  lines.push(`- avoids feeding conflict`);
  lines.push("");
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
  lines.push([primary, ...supporting].map((m) => m.exitPhrase).join(" "));
  return lines.join("\n");
}

// ---- Generic helpers --------------------------------------------------------------

function pickAvoid(primary: Mode, modes: Mode[]): Mode | null {
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
  lines.push([primary, ...supporting].map((m) => m.exitPhrase).join(" "));
  return lines.join("\n");
}
