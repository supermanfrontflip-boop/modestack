import type { Mode } from "./modes-data";

export type CognitiveRole = "perspective" | "execution" | "risk";

export interface TeamMember {
  mode: Mode;
  role: CognitiveRole;
  contribution: string;
}

export interface SituationTypeMatch {
  type: string;
  score: number;
  hits: string[];
}

export type WorkStage =
  | "Idea"
  | "Planning"
  | "Drafting"
  | "Building"
  | "Refining"
  | "Reviewing"
  | "Shipping"
  | "Post-Launch";

export type AIFit = "Yes" | "Limited" | "No";
export type Complexity = "Minimal" | "Light" | "Standard" | "Heavy";

export interface Recommendation {
  primary: Mode;
  primaryRole: CognitiveRole;
  primaryContribution: string;
  supporting: Mode[];
  team: TeamMember[];
  avoid: Mode | null;
  explanation: string;
  combinedPrompt: string;
  confidence: number;
  situationTypes: SituationTypeMatch[];
  situationReason: string;
  stage: WorkStage;
  deliverable: string;
  aiRecommended: AIFit;
  aiReason: string;
  complexity: Complexity;
}

// ---- Cognitive role registry ----

interface RoleSpec {
  role: CognitiveRole;
  contribution: string;
}

const ROLE_MAP: Record<string, RoleSpec> = {
  owl:        { role: "perspective", contribution: "wide-angle analysis that surfaces what is being missed" },
  alien:      { role: "perspective", contribution: "outsider reframing that breaks default assumptions" },
  architect:  { role: "perspective", contribution: "structural coherence across the whole system" },
  raven:      { role: "perspective", contribution: "associative, symbolic, emotionally resonant creative angle" },
  shadow:     { role: "risk",        contribution: "skeptical adversary stress-testing for weaknesses and exploits" },
  hawk:       { role: "execution",   contribution: "single-target precision for the next concrete action" },
  apex:       { role: "execution",   contribution: "no-compromise quality bar on the final output" },
  captain:    { role: "execution",   contribution: "decisive command voice that commits to a direction" },
  snail:      { role: "execution",   contribution: "step-by-step pacing so nothing gets glossed over" },
  clear:      { role: "execution",   contribution: "plain-language clarity for the reader" },
  glove:      { role: "execution",   contribution: "firm boundary-holding without admissions or waivers" },
  diplomat:   { role: "execution",   contribution: "respectful, measured tone that de-escalates" },
  curator:    { role: "execution",   contribution: "selects strongest options and refines for elegance" },
  whaler:     { role: "execution",   contribution: "patient pursuit of a single high-value client or deal" },
  "wild-bird-seed": { role: "execution", contribution: "attraction-based value scattering for inbound leads" },
  "gomer-pyle": { role: "perspective", contribution: "folksy comedic voice for satire and parody" },
};

function roleOf(mode: Mode): RoleSpec {
  return ROLE_MAP[mode.id] ?? { role: "execution", contribution: mode.purpose.toLowerCase() };
}

const ROLE_LABEL: Record<CognitiveRole, string> = {
  perspective: "expands perspective",
  execution: "improves execution quality",
  risk: "improves risk detection and consistency",
};

// ---- Situation Type registry ----
// Each type has signal keywords plus a preferred primary mode id and
// preferred supporting mode ids (each filling a distinct cognitive role).

interface SituationType {
  type: string;
  signals: string[];
  primary: string;
  supporting: string[]; // preferred candidates in priority order
  reason: string; // human-readable reason this type maps to these modes
}

const SITUATION_TYPES: SituationType[] = [
  {
    type: "Learning",
    signals: ["learn", "understand", "teach me", "how do i", "from scratch", "beginner", "new to", "tutorial", "study"],
    primary: "snail",
    supporting: ["owl"],
    reason: "The user is absorbing unfamiliar material and needs paced guidance with wide-angle context. Shadow is avoided here unless explicit critique is requested.",
  },
  {
    type: "Teaching",
    signals: ["teach", "explain to", "lesson", "curriculum", "onboard", "walk them through", "train my", "audience"],
    primary: "clear",
    supporting: ["snail", "architect"],
    reason: "The user is conveying knowledge to others and needs plain language, structured pacing, and a coherent shape.",
  },
  {
    type: "Business Launch",
    signals: ["launch", "start a business", "startup", "mvp", "go to market", "go-to-market", "founding", "ship the product", "first version"],
    primary: "captain",
    supporting: ["architect", "apex"],
    reason: "The user is committing to a direction and shipping something new — decisive command beats more analysis, structure keeps it durable, and a hard quality bar protects the launch.",
  },
  {
    type: "Client Acquisition",
    signals: ["client", "clients", "customer", "customers", "lead generation", "acquire", "land a", "win a", "paying", "first ten", "outreach"],
    primary: "captain",
    supporting: ["diplomat", "wild-bird-seed", "architect"],
    reason: "The user is seeking paying customers, trust-building, and business growth rather than analysis. Shadow only as a risk check, Alien only for unconventional approaches.",
  },

  {
    type: "Marketing",
    signals: ["marketing", "campaign", "brand", "positioning", "messaging", "copy", "ad", "ads", "landing page", "content"],
    primary: "alien",
    supporting: ["apex", "clear"],
    reason: "Marketing rewards fresh angles and polished, plainly written messaging more than internal system analysis.",
  },
  {
    type: "Sales",
    signals: ["sell", "selling", "sales", "pitch", "close the deal", "objection", "discovery call", "demo", "follow up"],
    primary: "captain",
    supporting: ["diplomat", "hawk"],
    reason: "Sales requires commitment, respectful tone with the buyer, and precise next-action focus.",
  },
  {
    type: "Operations",
    signals: ["operations", "process", "workflow", "sop", "playbook", "logistics", "scale up", "automate", "throughput"],
    primary: "architect",
    supporting: ["hawk", "shadow"],
    reason: "Operations is about durable structure, precise execution at the bottleneck, and watching for silent failure.",
  },
  {
    type: "Leadership",
    signals: ["team", "leadership", "lead my", "manager", "direct report", "1:1", "company culture", "vision", "rally"],
    primary: "captain",
    supporting: ["architect", "shadow"],
    reason: "Leadership demands a clear call, a coherent structure to lead toward, and an honest critic to pressure-test it.",
  },
  {
    type: "Negotiation",
    signals: ["negotiate", "negotiation", "counter offer", "counteroffer", "terms", "leverage", "bargain", "deal"],
    primary: "diplomat",
    supporting: ["glove", "captain"],
    reason: "Negotiation rewards measured tone, firm position-holding, and decisive commitment when the moment arrives.",
  },
  {
    type: "Conflict Resolution",
    signals: ["conflict", "dispute", "disagreement", "argument", "complaint about", "tension", "resolve", "de-escalate", "mediator"],
    primary: "diplomat",
    supporting: ["glove", "owl"],
    reason: "De-escalation needs respectful tone, firm but non-conceding boundaries, and a wide view of what's actually happening.",
  },
  {
    type: "Engineering",
    signals: ["build", "code", "implement", "refactor", "library", "framework", "api", "database", "deploy", "engineer"],
    primary: "architect",
    supporting: ["hawk", "shadow"],
    reason: "Engineering needs structural design, precise execution on the bug or feature, and a stress-tester for weak points.",
  },
  {
    type: "Product Design",
    signals: ["product design", "ux", "user experience", "user flow", "wireframe", "prototype", "interface", "design the"],
    primary: "architect",
    supporting: ["alien", "apex"],
    reason: "Product design wants coherent structure, an outsider's reframe of defaults, and a no-compromise quality bar.",
  },
  {
    type: "Creative Writing",
    signals: ["write a story", "novel", "fiction", "screenplay", "poem", "lyrics", "character", "scene", "dialogue"],
    primary: "alien",
    supporting: ["raven", "architect"],
    reason: "Creative writing rewards non-obvious angles, associative symbolic depth, and a coherent structural spine. Shadow is avoided unless critique is requested.",
  },
  {
    type: "Worldbuilding",
    signals: ["worldbuilding", "world building", "lore", "setting", "magic system", "factions", "fictional world", "universe"],
    primary: "architect",
    supporting: ["alien", "owl"],
    reason: "Worldbuilding is system design with creative outsider angles and patient, panoramic consistency checks.",
  },
  {
    type: "Research",
    signals: ["research", "literature", "compare", "trade-off", "tradeoff", "survey of", "evaluate options", "background on"],
    primary: "owl",
    supporting: ["shadow", "architect"],
    reason: "Research needs patient analysis, quiet pattern collection, and structural framing of findings.",
  },
  {
    type: "Legal Analysis",
    signals: ["legal", "lawsuit", "court", "magistrate", "judge", "statute", "case law", "motion", "filing", "attorney"],
    primary: "glove",
    supporting: ["owl", "architect"],
    reason: "Legal work demands firm position-holding without admissions, deep analysis, and structural argument.",
  },
  {
    type: "Investigation",
    signals: ["investigate", "investigation", "what really happened", "look into", "dig into", "uncover", "fraud", "leak"],
    primary: "shadow",
    supporting: ["owl", "architect"],
    reason: "The user's primary goal is uncovering hidden facts, supported by panoramic analysis and a sharp critic.",
  },
  {
    type: "Compliance",
    signals: ["compliance", "regulation", "regulatory", "policy", "audit", "controls", "gdpr", "hipaa", "soc 2", "sox"],
    primary: "shadow",
    supporting: ["architect", "glove"],
    reason: "Compliance work is risk surveillance, structural mapping, and firm procedural posture.",
  },
  {
    type: "Planning",
    signals: ["plan", "planning", "roadmap", "timeline", "milestones", "schedule", "quarter", "long term", "long-term"],
    primary: "architect",
    supporting: ["captain", "owl"],
    reason: "Planning needs structure, a decisive call on direction, and patient analysis of trade-offs.",
  },
  {
    type: "Troubleshooting",
    signals: ["bug", "broken", "not working", "error", "crash", "debug", "fails", "regression", "stack trace", "fix the"],
    primary: "hawk",
    supporting: ["owl", "shadow"],
    reason: "Troubleshooting wants single-target precision, panoramic context, and a contrarian eye on what's still suspicious.",
  },
];

// ---- Recommendation frequency tracking ----
// Penalize modes that have been recommended often this session to avoid
// over-recommending the same modes across unrelated situation types.

const recCounts: Record<string, number> = {};
function bumpCounts(ids: string[]) {
  for (const id of ids) recCounts[id] = (recCounts[id] ?? 0) + 1;
}
function freqPenalty(id: string): number {
  const n = recCounts[id] ?? 0;
  return Math.min(n, 5); // soft cap
}

// ---- Trigger scoring (supporting evidence only) ----

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

// ---- Situation Type detection ----

function detectSituationTypes(text: string): SituationTypeMatch[] {
  const results: SituationTypeMatch[] = [];
  for (const st of SITUATION_TYPES) {
    const hits: string[] = [];
    for (const s of st.signals) if (text.includes(s)) hits.push(s);
    if (hits.length) {
      // weight by signal length (longer = more specific)
      const score = hits.reduce((acc, h) => acc + (h.length > 8 ? 3 : 2), 0);
      results.push({ type: st.type, score, hits });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ---- Team assembly ----

function buildTeamFromPreferred(
  primary: Mode,
  modes: Mode[],
  preferredIds: string[],
  scored: Scored[],
): { supporting: Mode[]; team: TeamMember[] } {
  const primaryRole = roleOf(primary).role;
  const used = new Set<string>([primary.id]);
  const supporting: Mode[] = [];
  const usedRoles = new Set<CognitiveRole>([primaryRole]);

  // 1. Preferred candidates that bring a distinct role.
  for (const id of preferredIds) {
    if (supporting.length >= 2) break;
    if (used.has(id)) continue;
    const m = modes.find((mm) => mm.id === id);
    if (!m) continue;
    const r = roleOf(m).role;
    if (usedRoles.has(r)) continue;
    // soft frequency penalty: skip preferred if it's been used heavily and a fresher option exists
    if (freqPenalty(id) >= 3) {
      const fresh = modes.find(
        (mm) => !used.has(mm.id) && roleOf(mm).role === r && freqPenalty(mm.id) < 2,
      );
      if (fresh) {
        supporting.push(fresh);
        used.add(fresh.id);
        usedRoles.add(r);
        continue;
      }
    }
    supporting.push(m);
    used.add(id);
    usedRoles.add(r);
  }

  // 2. Fill remaining roles from highest-scoring matches.
  const scoredById = new Map(scored.map((s) => [s.mode.id, s]));
  const needRoles: CognitiveRole[] = (["perspective", "execution", "risk"] as CognitiveRole[]).filter(
    (r) => !usedRoles.has(r),
  );
  for (const role of needRoles) {
    if (supporting.length >= 2) break;
    const cand = modes
      .filter((m) => !used.has(m.id) && roleOf(m).role === role)
      .map((m) => ({
        mode: m,
        s: (scoredById.get(m.id)?.score ?? 0) - freqPenalty(m.id),
      }))
      .sort((a, b) => b.s - a.s)[0];
    if (cand) {
      supporting.push(cand.mode);
      used.add(cand.mode.id);
      usedRoles.add(role);
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

function computeConfidence(
  typeHits: number,
  triggerScore: number,
  rolesCovered: number,
  hasSupport: boolean,
): number {
  let c = 35;
  c += Math.min(typeHits * 12, 35); // type signals dominate
  c += Math.min(triggerScore * 2, 20); // triggers as supporting evidence
  c += Math.min(rolesCovered, 2) * 5;
  if (!hasSupport) c -= 10;
  return Math.max(0, Math.min(100, Math.round(c)));
}

// ---- Main ----

export function recommend(situation: string, modes: Mode[]): Recommendation | null {
  if (!modes.length) return null;
  const text = ` ${situation.toLowerCase()} `;
  const byId = (id: string) => modes.find((m) => m.id === id);

  const types = detectSituationTypes(text);
  const scored = modes.map((m) => scoreMode(m, text)).sort((a, b) => b.score - a.score);

  // Step 1+2: determine primary Situation Type(s).
  const primaryType = types[0];

  // Step 3: select modes primarily by Situation Type.
  let primaryMode: Mode | null = null;
  let preferredSupport: string[] = [];
  let typeReason = "";
  const detectedTypeNames: string[] = [];

  if (primaryType) {
    const st = SITUATION_TYPES.find((s) => s.type === primaryType.type)!;
    primaryMode = byId(st.primary) ?? null;
    preferredSupport = st.supporting;
    typeReason = st.reason;
    detectedTypeNames.push(primaryType.type);
    // include any close second type
    if (types[1] && types[1].score >= primaryType.score * 0.75) {
      detectedTypeNames.push(types[1].type);
    }
  }

  // Step 4: keywords as supporting evidence only — fall back to top-scoring
  // mode if no situation type matched at all.
  if (!primaryMode) {
    primaryMode =
      scored[0].score > 0
        ? scored[0].mode
        : byId("owl") ?? modes[0];
    typeReason =
      "No specific situation type signals detected. Falling back to the strongest keyword match as a wide-angle starting point.";
  }

  const { supporting, team } = buildTeamFromPreferred(
    primaryMode,
    modes,
    preferredSupport,
    scored,
  );

  const avoid = pickAvoid(primaryMode, modes, supporting, text);

  const triggerScore = scored.find((s) => s.mode.id === primaryMode.id)?.score ?? 0;
  const rolesCovered = new Set(team.map((t) => t.role)).size - 1;
  const confidence = computeConfidence(
    primaryType?.hits.length ?? 0,
    triggerScore,
    rolesCovered,
    supporting.length > 0,
  );

  const supportEvidence =
    triggerScore > 0
      ? `Keyword evidence (${scored.find((s) => s.mode.id === primaryMode!.id)?.hits.slice(0, 3).join(", ")}) supports this pick.`
      : `No strong keyword signals for the primary mode — selection is driven by Situation Type.`;

  const explanation =
    (primaryType
      ? `Detected Situation Type: ${detectedTypeNames.join(" + ")}. `
      : `No clear Situation Type signals. `) +
    `${primaryMode.mode} is primary because ${typeReason} ` +
    supportEvidence +
    (supporting.length
      ? ` Supporting with ${supporting.map((s) => s.mode).join(" and ")} so the team covers distinct cognitive roles.`
      : ``) +
    (avoid ? ` Avoid ${avoid.mode} here — ${avoid.avoidWhen.toLowerCase()}` : "");

  const combinedPrompt = buildCombinedPrompt(
    situation,
    primaryMode,
    supporting,
    detectedTypeNames,
  );

  bumpCounts([primaryMode.id, ...supporting.map((s) => s.id)]);

  return {
    primary: primaryMode,
    primaryRole: roleOf(primaryMode).role,
    primaryContribution: roleOf(primaryMode).contribution,
    supporting,
    team,
    avoid,
    explanation,
    combinedPrompt,
    confidence,
    situationTypes: types.slice(0, 3),
    situationReason: typeReason,
  };
}

// ---- Avoid selection ----

const COMEDY_OPT_IN = ["satire", "comedy", "comedic", "roast", "lyrics", "song", "parody", "fiction", "joke"];

function pickAvoid(
  primary: Mode,
  modes: Mode[],
  supporting: Mode[],
  text: string,
): Mode | null {
  const usedIds = new Set([primary.id, ...supporting.map((s) => s.id)]);
  const wantsComedy = COMEDY_OPT_IN.some((k) => text.includes(k));
  // Gomer Pyle is almost never appropriate unless comedy was requested.
  if (!wantsComedy) {
    const gp = modes.find((m) => m.id === "gomer-pyle" && !usedIds.has(m.id));
    if (gp) return gp;
  }
  // Fall back to an opposite-intensity mode for contrast.
  const opposites: Record<string, string> = {
    Extreme: "Low",
    High: "Low",
    Low: "High",
    Medium: "Extreme",
  };
  const target = opposites[primary.intensity];
  return modes.find((m) => !usedIds.has(m.id) && m.intensity === target) ?? null;
}

// ---- Prompt assembly ----

function buildCombinedPrompt(
  situation: string,
  primary: Mode,
  supporting: Mode[],
  detectedTypes: string[],
): string {
  const lines: string[] = [];
  if (detectedTypes.length) {
    lines.push(`# Situation Type`);
    lines.push(detectedTypes.join(", "));
    lines.push("");
  }
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

export { ROLE_LABEL };
