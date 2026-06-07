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
  | "Post-Launch"
  | "Growth"
  | "Scaling";


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
  recommendedAction: string;
  missingPrerequisites: string[];
  bottleneck: string;
  stageEvidence: string[];
  deliverableEvidence: string[];
  category: string;
  categoryEvidence: string[];
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

// ---- Category registry (Step 1: determine category first) ----
// Categories define ALLOWED + AVOIDED supporting modes so business-oriented
// modes (Architect/Shadow) can't leak into Performance, Creative Writing,
// Learning, etc.

interface CategorySpec {
  name: string;
  signals: string[];
  preferredPrimary: string[]; // ordered candidates
  preferredSupport: string[]; // ordered candidates
  avoid: string[]; // modes that must NOT be selected for this category
  deliverableRules: Array<{ rx: RegExp; label: string }>;
  defaultDeliverable: string;
  softAvoidUnless?: { ids: string[]; rx: RegExp }; // e.g. avoid Shadow in Learning unless "critique"
}

const CATEGORIES: CategorySpec[] = [
  {
    name: "Analysis & Investigation",
    signals: [
      "investigate", "investigation", "what really happened", "look into", "dig into",
      "uncover", "fraud", "leak", "forensic", "contradiction", "contradict",
      "timeline of events", "cover up", "cover-up", "whodunit", "suspicious",
      "what's missing", "missing evidence", "inconsistency", "inconsistencies",
    ],
    preferredPrimary: ["shadow", "owl"],
    preferredSupport: ["owl", "shadow", "glove"],
    avoid: ["architect", "captain", "whaler", "wild-bird-seed", "diplomat", "raven", "gomer-pyle"],
    deliverableRules: [
      { rx: /timeline|chronology|sequence of events/, label: "Timeline Analysis" },
      { rx: /contradict|inconsist|conflicting/, label: "Contradiction Map" },
      { rx: /gap|missing evidence|what'?s missing/, label: "Evidence Gap List" },
    ],
    defaultDeliverable: "Most Likely Explanation",
  },
  {
    name: "Creativity & Storytelling",
    signals: [
      "write a story", "novel", "fiction", "screenplay", "short story", "character arc",
      "character", "scene", "dialogue", "chapter", "plot", "worldbuilding", "world building",
      "lore", "setting", "magic system", "factions", "poem", "poetry", "fictional world",
    ],
    preferredPrimary: ["alien", "raven"],
    preferredSupport: ["raven", "alien", "owl", "curator"],
    avoid: ["architect", "shadow", "captain", "whaler", "glove", "wild-bird-seed", "diplomat", "hawk"],
    deliverableRules: [
      { rx: /character arc|character development/, label: "Character Arc" },
      { rx: /scene outline/, label: "Scene Outline" },
      { rx: /chapter/, label: "Chapter Draft" },
      { rx: /world ?building|lore|magic system|setting bible/, label: "Worldbuilding Document" },
    ],
    defaultDeliverable: "Story Draft",
  },
  {
    name: "Performance & Entertainment",
    signals: [
      "rap battle", "rap", "lyrics", "verse", "bars", "freestyle", "roast", "diss",
      "promo", "wrestling", "wrestler", "hype man", "stand up", "stand-up",
      "comedy set", "punchline", "open mic", "performance script",
    ],
    preferredPrimary: ["alien", "raven"],
    preferredSupport: ["raven", "alien", "gomer-pyle", "curator"],
    avoid: ["architect", "shadow", "glove", "whaler", "wild-bird-seed", "diplomat", "hawk", "captain"],
    deliverableRules: [
      { rx: /rap battle/, label: "Rap Battle" },
      { rx: /lyrics|verse|bars\b|song/, label: "Lyrics" },
      { rx: /roast/, label: "Roast" },
      { rx: /promo|hype/, label: "Promo" },
      { rx: /performance script|set list|comedy set/, label: "Performance Script" },
    ],
    defaultDeliverable: "Performance Script",
  },
  {
    name: "Learning & Teaching",
    signals: [
      "learn", "understand", "teach me", "teach", "how do i", "from scratch", "beginner",
      "new to", "tutorial", "lesson", "curriculum", "study", "onboard", "walk me through",
      "walk through", "explain to me", "explain it", "concept",
    ],
    preferredPrimary: ["snail", "clear"],
    preferredSupport: ["snail", "owl", "clear"],
    avoid: ["shadow", "glove", "whaler", "wild-bird-seed", "captain", "architect", "raven", "gomer-pyle"],
    softAvoidUnless: { ids: ["shadow"], rx: /\b(critique|review|red.?team|audit|stress test)\b/ },
    deliverableRules: [
      { rx: /lesson plan/, label: "Lesson Plan" },
      { rx: /learning path|curriculum/, label: "Learning Path" },
      { rx: /walk ?through|concept|explain/, label: "Concept Walkthrough" },
    ],
    defaultDeliverable: "Concept Walkthrough",
  },
  {
    name: "Communication & Negotiation",
    signals: [
      "negotiate", "negotiation", "counter offer", "counteroffer", "counter proposal",
      "counter-proposal", "terms", "leverage", "bargain", "conflict", "dispute",
      "disagreement", "argument", "de-escalate", "mediator", "apology", "tough conversation",
    ],
    preferredPrimary: ["diplomat", "glove"],
    preferredSupport: ["glove", "diplomat", "captain", "owl"],
    avoid: ["shadow", "architect", "alien", "raven", "whaler", "wild-bird-seed", "gomer-pyle"],
    deliverableRules: [
      { rx: /counter ?proposal|counter offer/, label: "Counter-proposal Draft" },
      { rx: /apology|measured response/, label: "Measured Response" },
    ],
    defaultDeliverable: "Negotiation Script",
  },
  {
    name: "Legal",
    signals: [
      "legal", "lawsuit", "court", "magistrate", "judge", "statute", "case law",
      "motion", "filing", "attorney", "subpoena", "cease and desist", "liability",
      "contract review", "legal response",
    ],
    preferredPrimary: ["glove", "owl"],
    preferredSupport: ["glove", "owl", "architect", "shadow"],
    avoid: ["whaler", "wild-bird-seed", "alien", "raven", "gomer-pyle", "captain", "diplomat"],
    deliverableRules: [
      { rx: /motion|filing/, label: "Legal Filing Draft" },
      { rx: /response|reply|answer to/, label: "Legal Response Draft" },
      { rx: /memo|analysis/, label: "Legal Analysis Memo" },
    ],
    defaultDeliverable: "Legal Analysis Memo",
  },
  {
    name: "Systems & Engineering",
    signals: [
      "build", "code", "implement", "refactor", "library", "framework", "api",
      "database", "deploy", "engineer", "debug", "bug", "crash", "stack trace",
      "architecture", "system design", "design doc",
    ],
    preferredPrimary: ["architect", "hawk"],
    preferredSupport: ["architect", "hawk", "shadow", "owl"],
    avoid: ["whaler", "wild-bird-seed", "diplomat", "raven", "gomer-pyle", "alien"],
    deliverableRules: [
      { rx: /bug|crash|error|stack trace|debug|broken|not working/, label: "Root-cause + Fix" },
      { rx: /design doc|architecture/, label: "Design Doc" },
      { rx: /refactor/, label: "Refactor Plan" },
    ],
    defaultDeliverable: "Design Doc + First Implementation",
  },
  {
    name: "Operations & Execution",
    signals: [
      "operations", "process", "workflow", "sop", "playbook", "logistics",
      "scheduling", "schedule", "dispatch", "dispatching", "quality control",
      "throughput", "automate", "status tracking", "routing jobs",
    ],
    preferredPrimary: ["architect", "hawk"],
    preferredSupport: ["architect", "hawk", "captain", "shadow"],
    avoid: ["raven", "alien", "gomer-pyle", "whaler", "wild-bird-seed", "diplomat"],
    deliverableRules: [
      { rx: /dispatch/, label: "Dispatch System" },
      { rx: /quality control/, label: "Quality Control Plan" },
      { rx: /sop|operating procedure/, label: "SOP" },
      { rx: /workflow/, label: "Workflow" },
    ],
    defaultDeliverable: "Workflow",
  },
  {
    name: "Strategy & Positioning",
    signals: [
      "positioning", "strategy", "brand", "go to market", "go-to-market",
      "market fit", "competitive", "differentiation", "mission statement",
      "north star", "roadmap", "launch", "startup", "mvp", "client", "clients",
      "customer", "customers", "lead generation", "acquire", "outreach",
      "marketing", "campaign", "pitch", "sales", "sell", "selling",
      "service catalog", "pricing", "scale up", "scaling",
    ],
    preferredPrimary: ["captain", "architect"],
    preferredSupport: ["architect", "captain", "alien", "apex", "diplomat", "wild-bird-seed", "whaler", "shadow", "hawk"],
    avoid: ["raven", "gomer-pyle"],
    deliverableRules: [
      { rx: /client acquisition|acquisition plan/, label: "Client Acquisition Plan" },
      { rx: /service catalog/, label: "Service Catalog" },
      { rx: /pricing( sheet| page| table)?/, label: "Pricing Sheet" },
      { rx: /landing page/, label: "Landing Page Copy" },
      { rx: /pitch deck|investor deck/, label: "Pitch Deck Outline" },
      { rx: /marketing campaign|ad campaign|campaign brief/, label: "Marketing Campaign Plan" },
      { rx: /positioning/, label: "Positioning Statement" },
    ],
    defaultDeliverable: "Positioning Statement",
  },
  {
    name: "Leadership & Action",
    signals: [
      "team", "leadership", "lead my", "manager", "direct report", "1:1",
      "company culture", "rally", "decision memo", "decide between", "commit to",
    ],
    preferredPrimary: ["captain", "hawk"],
    preferredSupport: ["captain", "hawk", "architect", "owl"],
    avoid: ["raven", "gomer-pyle", "whaler", "wild-bird-seed", "alien"],
    deliverableRules: [
      { rx: /decision/, label: "Decision Memo" },
      { rx: /memo|direction note/, label: "Leadership Memo" },
    ],
    defaultDeliverable: "Leadership Memo",
  },
  {
    name: "Prediction",
    signals: [
      "predict", "forecast", "what will happen", "likely outcome", "scenario",
      "odds", "probability", "trend forecast",
    ],
    preferredPrimary: ["owl", "shadow"],
    preferredSupport: ["owl", "shadow", "architect"],
    avoid: ["raven", "gomer-pyle", "whaler", "wild-bird-seed", "diplomat", "captain"],
    deliverableRules: [
      { rx: /scenario/, label: "Scenario Map" },
      { rx: /forecast|predict/, label: "Forecast Brief" },
    ],
    defaultDeliverable: "Scenario Map",
  },
];

function detectCategory(text: string): { spec: CategorySpec | null; evidence: string[] } {
  let best: { spec: CategorySpec; score: number; hits: string[] } | null = null;
  for (const c of CATEGORIES) {
    const hits = c.signals.filter((s) => text.includes(s));
    if (!hits.length) continue;
    const score = hits.reduce((a, h) => a + (h.length > 8 ? 3 : 2), 0);
    if (!best || score > best.score) best = { spec: c, score, hits };
  }
  if (!best) return { spec: null, evidence: ["no category-specific signals detected"] };
  return { spec: best.spec, evidence: best.hits.slice(0, 5) };
}

function resolveCategoryAvoid(spec: CategorySpec, text: string): Set<string> {
  const avoid = new Set(spec.avoid);
  // Soft-avoid: remove from avoid set if the triggering pattern matches.
  if (spec.softAvoidUnless && spec.softAvoidUnless.rx.test(text)) {
    for (const id of spec.softAvoidUnless.ids) avoid.delete(id);
  }
  return avoid;
}

function categoryDeliverable(
  spec: CategorySpec,
  text: string,
): { label: string; evidence: string[] } {
  for (const r of spec.deliverableRules) {
    if (r.rx.test(text)) {
      return { label: r.label, evidence: [`matched "${r.label}" rule for ${spec.name}`] };
    }
  }
  return {
    label: spec.defaultDeliverable,
    evidence: [`default deliverable for ${spec.name}`],
  };
}

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

// ---- Stage / Deliverable / AI-fit detection ----

// Phrases that prove the business is established (block "Idea" stage).
const ESTABLISHED_SIGNALS: Array<{ rx: RegExp; label: string }> = [
  { rx: /\b(\d{2,})\s+(paid|completed|finished)\s+(jobs|projects|gigs|contracts)\b/, label: "paid jobs completed" },
  { rx: /\bpaid jobs\b/, label: "paid jobs" },
  { rx: /\bpaying customers?\b/, label: "paying customers" },
  { rx: /\brecurring clients?\b/, label: "recurring clients" },
  { rx: /\brepeat business\b/, label: "repeat business" },
  { rx: /\brepeat customers?\b/, label: "repeat customers" },
  { rx: /\bdocumented workflows?\b/, label: "documented workflows" },
  { rx: /\bexisting (pricing sheets?|price list|service catalog)\b/, label: "existing pricing sheets" },
  { rx: /\b(we|i) (already )?have (a |our )?(pricing sheet|price list|service catalog|sop|playbook)/, label: "already has core docs" },
  { rx: /\bvendor relationships?\b/, label: "vendor relationships" },
  { rx: /\b(established|existing|running|operating) (business|company|firm|practice|shop)\b/, label: "established business" },
  { rx: /\b(law firm clients?|recurring law firm)\b/, label: "recurring law firm clients" },
  { rx: /\b(monthly|weekly) (revenue|jobs|clients)\b/, label: "recurring monthly volume" },
];

// Scaling / Growth volume language.
const SCALING_SIGNALS: Array<{ rx: RegExp; label: string }> = [
  { rx: /\b(scal(e|ing)|scale up|scale from)\b/, label: "scaling language" },
  { rx: /\bhigher volume|increase(d|s)? volume|more volume\b/, label: "higher volume" },
  { rx: /\bfrom\s+\d+\s+to\s+\d+\s+(jobs|clients|customers|orders)\b/, label: "explicit volume increase goal" },
  { rx: /\b(\d+)\s+to\s+(\d+)\s+(jobs|clients|customers|orders)\s*\/?\s*(month|mo|week|wk)\b/, label: "monthly volume goal" },
  { rx: /\bgrow(th|ing)\b/, label: "growth language" },
  { rx: /\bhandle (more|higher)\b/, label: "handle more volume" },
];

const OPS_SYSTEM_SIGNALS: Array<{ rx: RegExp; label: string }> = [
  { rx: /\bsched(ule|uling)\b/, label: "scheduling" },
  { rx: /\bdispatch(ing)?\b/, label: "dispatching" },
  { rx: /\bstatus track(ing)?\b/, label: "status tracking" },
  { rx: /\bquality control\b/, label: "quality control" },
  { rx: /\brout(e|ing) jobs?\b/, label: "routing jobs" },
  { rx: /\bhandle (higher|more) volume\b/, label: "handling higher volume" },
  { rx: /\bjobs?\s*\/?\s*(month|mo|week|wk)\b/, label: "monthly job volume target" },
];

function detectStage(text: string): { stage: WorkStage; evidence: string[] } {
  const evidence: string[] = [];

  const established = ESTABLISHED_SIGNALS.filter((s) => s.rx.test(text));
  const scaling = SCALING_SIGNALS.filter((s) => s.rx.test(text));

  // Rule 1+4: if business is established, never return "Idea".
  if (established.length || scaling.length) {
    established.forEach((s) => evidence.push(s.label));
    scaling.forEach((s) => evidence.push(s.label));
    if (scaling.length || /\bvolume|jobs?\s*\/\s*(month|week)|from\s+\d+\s+to\s+\d+/.test(text)) {
      return { stage: "Scaling", evidence };
    }
    return { stage: "Growth", evidence };
  }

  if (/\b(post.?launch|after launch|already shipped|in production|retention|churn)\b/.test(text)) {
    evidence.push("post-launch language");
    return { stage: "Post-Launch", evidence };
  }
  if (/\b(ship|launch|publish|go live|deploy|release)\b/.test(text)) {
    evidence.push("shipping language");
    return { stage: "Shipping", evidence };
  }
  if (/\b(review|audit|red.?team|red team|stress test|critique|feedback on)\b/.test(text)) {
    evidence.push("review language");
    return { stage: "Reviewing", evidence };
  }
  if (/\b(refine|polish|edit|tighten|cleanup|clean up|revise)\b/.test(text)) {
    evidence.push("refining language");
    return { stage: "Refining", evidence };
  }
  if (/\b(build|implement|code|develop|construct|wire up)\b/.test(text)) {
    evidence.push("building language");
    return { stage: "Building", evidence };
  }
  if (/\b(draft|write|outline|sketch|first version|first pass)\b/.test(text)) {
    evidence.push("drafting language");
    return { stage: "Drafting", evidence };
  }
  if (/\b(plan|planning|roadmap|strategy|map out|scope|decide)\b/.test(text)) {
    evidence.push("planning language");
    return { stage: "Planning", evidence };
  }
  evidence.push("no stage-specific signals — defaulting to early ideation");
  return { stage: "Idea", evidence };
}

// Phrases that mean "I already have X" — block recommending X.
const ALREADY_HAVE_PATTERNS: Array<{ rx: RegExp; deliverable: string }> = [
  { rx: /\b(we|i) (already )?have (a |our |an )?pricing (sheet|page|table|list)/, deliverable: "Pricing Sheet" },
  { rx: /\bexisting pricing (sheets?|page|table|list)/, deliverable: "Pricing Sheet" },
  { rx: /\b(we|i) (already )?have (a |our |an )?service catalog/, deliverable: "Service Catalog" },
  { rx: /\bexisting service catalog/, deliverable: "Service Catalog" },
  { rx: /\b(we|i) (already )?have (a |our |an )?vendor (info|information|sheet|packet)/, deliverable: "Vendor Information Sheet" },
  { rx: /\b(we|i) (already )?have (a |our |an )?(sop|operating procedure|playbook)/, deliverable: "Operating Procedure" },
  { rx: /\b(we|i) (already )?have (a |our |an )?client acquisition plan/, deliverable: "Client Acquisition Plan" },
  { rx: /\bdocumented workflows?\b/, deliverable: "Operating Procedure" },
];

function detectAlreadyHave(text: string): Set<string> {
  const have = new Set<string>();
  for (const p of ALREADY_HAVE_PATTERNS) {
    if (p.rx.test(text)) have.add(p.deliverable);
  }
  return have;
}

const DELIVERABLE_PATTERNS: Array<{ rx: RegExp; label: string }> = [
  { rx: /service catalog/, label: "Service Catalog" },
  { rx: /vendor (info|information|sheet)/, label: "Vendor Information Sheet" },
  { rx: /pricing( sheet| page| table)?/, label: "Pricing Sheet" },
  { rx: /client acquisition|acquisition plan/, label: "Client Acquisition Plan" },
  { rx: /website (copy|content|page)/, label: "Website Content" },
  { rx: /operating procedure|sop|playbook/, label: "Operating Procedure" },
  { rx: /marketing campaign|ad campaign|campaign brief/, label: "Marketing Campaign Plan" },
  { rx: /landing page/, label: "Landing Page Copy" },
  { rx: /pitch deck|investor deck/, label: "Pitch Deck Outline" },
  { rx: /email (sequence|drip|campaign)/, label: "Email Sequence" },
  { rx: /contract|agreement|terms of service|tos /, label: "Contract Draft" },
  { rx: /lead magnet|free (guide|resource|ebook)/, label: "Lead Magnet" },
  { rx: /lawsuit|complaint|motion|filing|legal response/, label: "Legal Response Draft" },
  { rx: /bug|crash|error|stack trace|debug/, label: "Root-cause + Fix" },
  { rx: /lesson|curriculum|tutorial/, label: "Lesson Outline" },
];

const DEFAULT_DELIVERABLE_BY_TYPE: Record<string, string> = {
  "Learning": "Concept walkthrough with checkpoints",
  "Teaching": "Lesson outline",
  "Business Launch": "Next-step deliverable (e.g. Service Catalog, Pricing Sheet, or Client Acquisition Plan)",
  "Client Acquisition": "Client Acquisition Plan",
  "Marketing": "Campaign brief",
  "Sales": "Outreach sequence",
  "Operations": "Operating Procedure",
  "Leadership": "Leadership memo or direction note",
  "Negotiation": "Counter-proposal draft",
  "Conflict Resolution": "Measured response draft",
  "Engineering": "Design doc + first implementation",
  "Product Design": "Flow + interface spec",
  "Creative Writing": "Draft scene or hook",
  "Worldbuilding": "Setting bible entry",
  "Research": "Findings summary with trade-offs",
  "Legal Analysis": "Legal response draft",
  "Investigation": "Findings report",
  "Compliance": "Control gap report",
  "Planning": "Roadmap with milestones",
  "Troubleshooting": "Root-cause + fix",
};



function detectDeliverable(
  text: string,
  situationType: string | null,
  stage: WorkStage,
): { deliverable: string; evidence: string[] } {
  const evidence: string[] = [];
  const already = detectAlreadyHave(text);
  if (already.size) {
    evidence.push(`user already has: ${[...already].join(", ")}`);
  }

  // Operations system signals override generic deliverables when scheduling /
  // dispatching / status tracking / quality control / volume handling appear.
  const opsHits = OPS_SYSTEM_SIGNALS.filter((s) => s.rx.test(text));
  if (opsHits.length >= 2) {
    opsHits.forEach((h) => evidence.push(`user requested ${h.label}`));
    const hasScheduling = opsHits.some((h) => /sched|dispatch|rout/.test(h.label));
    const hasQA = opsHits.some((h) => /quality|status/.test(h.label));
    if (hasScheduling && hasQA) {
      return { deliverable: "Dispatch Workflow + Quality Control Plan", evidence };
    }
    return { deliverable: "Operations System", evidence };
  }

  // Established + scaling without ops signals → Scaling Plan.
  if ((stage === "Scaling" || stage === "Growth") && opsHits.length === 0) {
    if (!already.has("Operating Procedure")) {
      evidence.push("established business looking to scale");
      return { deliverable: "Scaling Plan", evidence };
    }
  }

  for (const p of DELIVERABLE_PATTERNS) {
    if (p.rx.test(text) && !already.has(p.label)) {
      evidence.push(`mentioned ${p.label.toLowerCase()}`);
      return { deliverable: p.label, evidence };
    }
  }

  if (situationType && DEFAULT_DELIVERABLE_BY_TYPE[situationType]) {
    const candidate = DEFAULT_DELIVERABLE_BY_TYPE[situationType];
    if (!already.has(candidate)) {
      evidence.push(`default deliverable for ${situationType}`);
      return { deliverable: candidate, evidence };
    }
    // Already have the default — suggest the next logical step.
    if (situationType === "Operations") {
      evidence.push("user already has core ops docs — next step is a full system");
      return { deliverable: "Operations System", evidence };
    }
  }

  evidence.push("no clear deliverable signals");
  return { deliverable: "Clarify the next concrete deliverable before generating", evidence };
}


// ---- Prerequisites & Recommended Action ----

const PREREQUISITES: Record<string, string[]> = {
  "Client Acquisition Plan": ["Service Catalog", "Pricing Sheet", "Vendor/Capabilities Packet", "Ideal Client Profile"],
  "Marketing Campaign Plan": ["Positioning Statement", "Target Audience Profile", "Offer / Pricing Sheet"],
  "Outreach Campaign": ["Target List", "Service Catalog", "Pricing Sheet", "Offer / Hook"],
  "Email Sequence": ["Target Audience Profile", "Lead Magnet or Offer", "Brand Voice Notes"],
  "Pitch Deck Outline": ["Problem Statement", "Market Sizing", "Traction / Proof Points", "Financial Snapshot"],
  "Landing Page Copy": ["Positioning Statement", "Offer Details", "Target Audience Profile"],
  "Scaling Plan": ["Current Workflow Map", "Capacity Analysis", "Revenue Breakdown", "Operating Procedure"],
  "Operating Procedure": ["Current Workflow Map", "Roles & Responsibilities", "Tools / Systems Inventory"],
  "Service Catalog": ["List of Offerings", "Pricing Sheet", "Delivery Process Notes"],
  "Lead Magnet": ["Target Audience Profile", "Positioning Statement"],
  "Legal Response Draft": ["Underlying Documents / Filings", "Timeline of Events", "Desired Outcome"],
  "Counter-proposal draft": ["Original Offer Terms", "Walk-away Conditions", "Priority Tradeoffs"],
  "Roadmap with milestones": ["Goal / North Star", "Capacity & Resources", "Known Constraints"],
};

function detectPrerequisites(text: string, deliverable: string): string[] {
  const list = PREREQUISITES[deliverable];
  if (!list) return [];
  // Assume each prerequisite is missing unless the user explicitly mentions it.
  return list.filter((p) => {
    const key = p.toLowerCase().split(/[\/&]/)[0].trim();
    return !text.includes(key);
  });
}

// Bottleneck detection: signals that the real next step is human action, not AI generation.
const ACTION_SIGNALS = [
  "contact", "call", "email them", "reach out", "send to", "follow up with",
  "meet with", "talk to", "interview", "hire", "fire", "negotiate with",
  "file with", "show up", "deliver to", "ship to", "drive to", "visit",
];

function detectBottleneck(text: string, stage: WorkStage): { isHuman: boolean; reason: string } {
  for (const sig of ACTION_SIGNALS) {
    if (text.includes(sig)) {
      return {
        isHuman: true,
        reason: `The bottleneck is real-world action ("${sig}…"), not content generation. Use AI sparingly to prep, not to replace, the human step.`,
      };
    }
  }
  if (stage === "Post-Launch" && /\b(retention|churn|customer)\b/.test(text)) {
    return {
      isHuman: true,
      reason: "Post-launch retention is driven by human follow-up and product changes, not drafting.",
    };
  }
  return { isHuman: false, reason: "" };
}

function deriveRecommendedAction(
  deliverable: string,
  missing: string[],
  bottleneckIsHuman: boolean,
  text: string,
): string {
  if (missing.length) {
    return `Produce the missing prerequisite first: ${missing[0]}.`;
  }
  if (bottleneckIsHuman) {
    const m = ACTION_SIGNALS.find((s) => text.includes(s));
    return m
      ? `Take the real-world action (${m}…) — use AI only to prep talking points or templates.`
      : `Take the next real-world action — AI is not the bottleneck here.`;
  }
  return `Produce a first draft of: ${deliverable}.`;
}

function assessAIFit(
  text: string,
  deliverable: string,
  bottleneckIsHuman: boolean,
  bottleneckReason: string,
  missing: string[],
): { fit: AIFit; reason: string } {
  if (/\b(in person|in-person|sign the|notarize|physically|show up to court)\b/.test(text)) {
    return { fit: "No", reason: "This step requires real-world or in-person action that AI cannot perform." };
  }
  if (bottleneckIsHuman) {
    return { fit: "Limited", reason: bottleneckReason };
  }
  if (missing.length >= 2) {
    return {
      fit: "Limited",
      reason: `Several prerequisites are missing (${missing.slice(0, 2).join(", ")}…). AI can help build them one at a time, but cannot skip ahead to the final deliverable.`,
    };
  }
  if (/\b(legal advice|medical advice|diagnose|prescribe|file with the court|represent me)\b/.test(text)) {
    return {
      fit: "Limited",
      reason: "AI can draft and structure, but a licensed professional should review or perform the binding step.",
    };
  }
  if (/\b(decide for me|tell me what to feel|my values|my gut)\b/.test(text)) {
    return { fit: "Limited", reason: "The core decision is personal — AI should inform, not replace, your judgment." };
  }
  if (/draft|write|outline|brainstorm|summarize|plan|explain|design|review|edit|refine|debug|analyze/.test(deliverable.toLowerCase()) ||
      /draft|write|outline|brainstorm|summarize|plan|explain|design|review|edit|refine|debug|analyze/.test(text)) {
    return { fit: "Yes", reason: "Drafting, structuring, and refining text artifacts is squarely in AI's strengths." };
  }
  return { fit: "Yes", reason: "AI can produce a useful first version that you then review." };
}

function assessComplexity(
  primaryRole: CognitiveRole,
  supportingCount: number,
  stage: WorkStage,
  aiFit: AIFit,
): Complexity {
  if (aiFit === "No") return "Minimal";
  if (stage === "Idea" || stage === "Drafting") {
    return supportingCount <= 1 ? "Light" : "Standard";
  }
  if (stage === "Shipping" || stage === "Reviewing") {
    return supportingCount >= 2 ? "Heavy" : "Standard";
  }
  return supportingCount >= 2 ? "Standard" : "Light";
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

  const { stage, evidence: stageEvidence } = detectStage(text);
  const { deliverable, evidence: deliverableEvidence } = detectDeliverable(
    text,
    primaryType?.type ?? null,
    stage,
  );
  const missingPrerequisites = detectPrerequisites(text, deliverable);
  const { isHuman: bottleneckIsHuman, reason: bottleneckReason } = detectBottleneck(text, stage);
  const { fit: aiRecommended, reason: aiReason } = assessAIFit(
    text,
    deliverable,
    bottleneckIsHuman,
    bottleneckReason,
    missingPrerequisites,
  );
  const recommendedAction = deriveRecommendedAction(
    deliverable,
    missingPrerequisites,
    bottleneckIsHuman,
    text,
  );
  const complexity = assessComplexity(
    roleOf(primaryMode).role,
    supporting.length,
    stage,
    aiRecommended,
  );

  const combinedPrompt = buildCombinedPrompt(
    situation,
    primaryMode,
    supporting,
    detectedTypeNames,
    stage,
    deliverable,
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
    stage,
    deliverable,
    aiRecommended,
    aiReason,
    complexity,
    recommendedAction,
    missingPrerequisites,
    bottleneck: bottleneckIsHuman ? bottleneckReason : "",
    stageEvidence,
    deliverableEvidence,
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
  stage: WorkStage,
  deliverable: string,
): string {
  const lines: string[] = [];
  if (detectedTypes.length) {
    lines.push(`# Situation Type`);
    lines.push(detectedTypes.join(", "));
    lines.push("");
  }
  lines.push(`# Current Stage`);
  lines.push(stage);
  lines.push("");
  lines.push(`# Target Deliverable`);
  lines.push(deliverable);
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

export { ROLE_LABEL };
