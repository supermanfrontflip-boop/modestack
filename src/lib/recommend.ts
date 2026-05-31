import type { Mode } from "./modes-data";

export type CognitiveRole = "perspective" | "execution" | "risk";

export interface TeamMember {
  mode: Mode;
  role: CognitiveRole;
  contribution: string;
}

export interface Recommendation {
  primary: Mode;
  primaryRole: CognitiveRole;
  primaryContribution: string;
  supporting: Mode[];
  team: TeamMember[]; // primary + supporting with role notes
  avoid: Mode | null;
  explanation: string;
  combinedPrompt: string;
  confidence: number; // 0-100
}

// ---- Cognitive role registry ------------------------------------------------------
// Each mode has a primary cognitive role and a short, mode-specific contribution
// note used in the "Why These Modes Work Together" section.

interface RoleSpec {
  role: CognitiveRole;
  contribution: string;
}

const ROLE_MAP: Record<string, RoleSpec> = {
  owl:        { role: "perspective", contribution: "wide-angle analysis that surfaces what is being missed" },
  alien:      { role: "perspective", contribution: "outsider reframing that breaks default assumptions" },
  architect:  { role: "perspective", contribution: "structural coherence across the whole system" },
  shadow:     { role: "risk",        contribution: "quiet pattern collection that surfaces hidden risks" },
  raven:      { role: "risk",        contribution: "contrarian stress-test that hunts weak points" },
  hawk:       { role: "execution",   contribution: "single-target precision for the next concrete action" },
  apex:       { role: "execution",   contribution: "no-compromise quality bar on the final output" },
  captain:    { role: "execution",   contribution: "decisive command voice that commits to a direction" },
  snail:      { role: "execution",   contribution: "step-by-step pacing so nothing gets glossed over" },
  clear:      { role: "execution",   contribution: "plain-language clarity for the reader" },
  glove:      { role: "execution",   contribution: "firm boundary-holding without admissions or waivers" },
  diplomat:   { role: "execution",   contribution: "respectful, measured tone that de-escalates" },
  "gomer-pyle": { role: "perspective", contribution: "folksy comedic voice for satire and parody" },
};

function roleOf(mode: Mode): RoleSpec {
  return ROLE_MAP[mode.id] ?? { role: "execution", contribution: mode.purpose.toLowerCase() };
}

const ROLE_ORDER: CognitiveRole[] = ["perspective", "execution", "risk"];

const ROLE_LABEL: Record<CognitiveRole, string> = {
  perspective: "expands perspective",
  execution: "improves execution quality",
  risk: "improves risk detection and consistency",
};

// ---- Scoring ----------------------------------------------------------------------

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

// ---- Boundary detection -----------------------------------------------------------

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
  for (const s of BOUNDARY_SIGNALS) if (text.includes(s)) return true;
  return false;
}

// ---- Team assembly ----------------------------------------------------------------

/**
 * Build a complementary team: one supporting mode per cognitive role that the
 * primary does not already cover. Never picks the primary as a supporter, and
 * never picks two supporters with the same role.
 */
function buildTeam(
  primary: Mode,
  scored: Scored[],
  modes: Mode[],
  preferredIds: string[] = [],
): { supporting: Mode[]; team: TeamMember[] } {
  const primaryRole = roleOf(primary).role;
  const usedIds = new Set<string>([primary.id]);
  const supporting: Mode[] = [];

  // Roles we want to fill, in priority order, excluding the primary's role.
  const rolesNeeded = ROLE_ORDER.filter((r) => r !== primaryRole);

  const scoredById = new Map(scored.map((s) => [s.mode.id, s]));

  const pickForRole = (role: CognitiveRole): Mode | null => {
    // 1. Preferred (curated) candidates first.
    for (const id of preferredIds) {
      if (usedIds.has(id)) continue;
      const m = modes.find((mm) => mm.id === id);
      if (m && roleOf(m).role === role) return m;
    }
    // 2. Highest-scoring mode with this role.
    const candidates = modes
      .filter((m) => !usedIds.has(m.id) && roleOf(m).role === role)
      .map((m) => scoredById.get(m.id) ?? { mode: m, score: 0, hits: [] })
      .sort((a, b) => b.score - a.score);
    return candidates[0]?.mode ?? null;
  };

  for (const role of rolesNeeded) {
    const pick = pickForRole(role);
    if (pick) {
      supporting.push(pick);
      usedIds.add(pick.id);
    }
  }

  const team: TeamMember[] = [
    { mode: primary, role: primaryRole, contribution: roleOf(primary).contribution },
    ...supporting.map((m) => ({
      mode: m,
      role: roleOf(m).role,
      contribution: roleOf(m).contribution,
    })),
  ];

  return { supporting, team };
}

function computeConfidence(top: Scored, supporting: Mode[], rolesCovered: number): number {
  let c = 40;
  c += Math.min(top.score * 4, 35); // up to +35 from trigger strength
  c += Math.min(rolesCovered, 2) * 10; // +10 per additional role covered (max 20)
  if (supporting.length === 0) c -= 10;
  if (top.score === 0) c -= 15;
  return Math.max(0, Math.min(100, Math.round(c)));
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

  const top =
    scored[0].score > 0
      ? scored[0]
      : { mode: modes.find((m) => m.id === "owl") ?? modes[0], score: 0, hits: [] };

  const { supporting, team } = buildTeam(top.mode, scored, modes);
  const avoid = pickAvoid(top.mode, modes, supporting);