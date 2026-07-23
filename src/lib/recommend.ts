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
  /** True when the avoid pick is supported by a specific, high-confidence conflict. */
  avoidIsHighConfidence: boolean;
  explanation: string;
  combinedPrompt: string;
  /** Legacy overall confidence (kept for compatibility). */
  confidence: number;
  /** Confidence the chosen primary mode fits the situation. */
  primaryConfidence: number;
  /** Confidence the full combined stack fits the situation. */
  stackConfidence: number;
  /** Confidence the detected stage is correct. */
  stageConfidence: number;
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
  /** Reasoning trace summarizing how the recommendation was built. */
  reasoning: string[];
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
  "platform-tutor": { role: "execution", contribution: "beginner-friendly, one-step-at-a-time device-specific guidance" },
};

/** Map user-defined role strings to the recommender's CognitiveRole buckets. */
const ROLE_ALIAS: Record<string, CognitiveRole> = {
  analysis: "perspective",
  perspective: "perspective",
  creative: "perspective",
  creativity: "perspective",
  risk: "risk",
  verification: "risk",
  boundary: "risk",
  execution: "execution",
  output_control: "execution",
  quality_control: "execution",
  optimization: "execution",
  strategy: "execution",
  operations: "execution",
  communication: "execution",
  tone_control: "execution",
  teaching: "execution",
};

function roleOf(mode: Mode): RoleSpec {
  const mapped = ROLE_MAP[mode.id];
  if (mapped) return mapped;
  const custom = (mode.role ?? "").trim().toLowerCase();
  if (custom && ROLE_ALIAS[custom]) {
    return { role: ROLE_ALIAS[custom], contribution: mode.purpose.toLowerCase() || custom };
  }
  return { role: "execution", contribution: mode.purpose.toLowerCase() };
}

const ROLE_LABEL: Record<CognitiveRole, string> = {
  perspective: "expands perspective",
  execution: "improves execution quality",
  risk: "improves risk detection and consistency",
};

// ---- Functional roles (drive CORE vs LAYERS composition) ----
// The mode's `role` field is a functional signal about WHAT it contributes.
// CORE should be a task-performing role. Output-control / verification roles
// should normally be layers, not core, unless the task itself is verification.

export type FunctionalRole =
  | "execution"
  | "optimization"
  | "analysis"
  | "output_control"
  | "verification"
  | "strategy"
  | "operations"
  | "communication"
  | "creativity"
  | "teaching";

const FN_ROLE_ALIAS: Record<string, FunctionalRole> = {
  execution: "execution",
  optimization: "optimization",
  analysis: "analysis",
  perspective: "analysis",
  output_control: "output_control",
  quality_control: "output_control",
  tone_control: "output_control",
  verification: "verification",
  risk: "verification",
  boundary: "communication",
  strategy: "strategy",
  operations: "operations",
  communication: "communication",
  creative: "creativity",
  creativity: "creativity",
  teaching: "teaching",
};

/** Roles that can plausibly perform the main task and therefore be CORE. */
const TASK_PERFORMING_ROLES: Set<FunctionalRole> = new Set([
  "execution",
  "optimization",
  "analysis",
  "strategy",
  "operations",
  "communication",
  "creativity",
  "teaching",
]);

/** Roles that finish, constrain, or verify — normally LAYERS, not CORE. */
const CONSTRAINT_ROLES: Set<FunctionalRole> = new Set(["output_control", "verification"]);

/** Heuristic fallback when mode.role is missing/unknown. */
function inferFunctionalRoleFallback(mode: Mode): FunctionalRole {
  const id = mode.id.toLowerCase();
  const name = (mode.mode || "").toLowerCase();
  if (/systems?[- ]?architect|architect/.test(id) || /systems? architect/.test(name)) return "optimization";
  if (/verbatim|quotation|citation|literal/.test(id + " " + name)) return "output_control";
  if (/verif|fact.?check|audit/.test(id + " " + name)) return "verification";
  if (/legal.?research|research/.test(id + " " + name)) return "execution";
  if (/curator|clear|diplomat|glove/.test(id)) return "output_control";
  if (/shadow/.test(id)) return "verification";
  if (/owl|alien|raven/.test(id)) return "analysis";
  if (/captain|whaler|apex|hawk/.test(id)) return "execution";
  return "execution";
}

export function functionalRole(mode: Mode): FunctionalRole {
  const raw = (mode.role || "").trim().toLowerCase();
  if (raw && FN_ROLE_ALIAS[raw]) return FN_ROLE_ALIAS[raw];
  return inferFunctionalRoleFallback(mode);
}


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
    signals: [
      "client", "clients", "customer", "customers", "lead generation",
      "acquire", "land a", "win a", "paying", "first ten", "first 10",
      "first client", "first clients", "paying client", "paying clients",
      "law firm clients", "outreach",
    ],
    primary: "captain",
    supporting: ["diplomat", "wild-bird-seed", "architect"],
    reason: "The user is trying to acquire customers. First-client and first-paying-client situations are acquisition work, not evidence that the business is already in a growth stage.",
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
    signals: ["interpersonal conflict", "personal conflict", "workplace conflict", "family conflict", "conflict with", "dispute with", "disagreement with", "argument with", "complaint about", "tension with", "resolve a conflict", "de-escalate", "mediator"],
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
  type: "Legal Prediction",
  signals: ["predict how", "most likely to rule", "likely to rule", "judge is most likely", "judicial outcome", "how a judge", "motion to compel", "defendant responded"],
  primary: "owl",
supporting: ["shadow", "glove"],
  reason: "The user is asking to predict how a court is likely to rule, so outcome prediction beats advocacy or drafting.",
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
    signals: ["investigate", "investigation", "what really happened", "look into", "dig into",
      "uncover", "fraud", "leak", "forensic", "contradiction", "contradict",
      "timeline of events", "cover up", "cover-up", "whodunit", "suspicious",
      "what's missing", "missing evidence", "inconsistency", "inconsistencies",
      "facts do not match", "facts don't match", "witness statements conflict",
      "witness statement", "witness statements", "conflicting accounts",
      "conflicting witness", "timeline inconsistencies", "inconsistent dates",
      "evidence supports both", "determine what happened", "reconstruct events",
      "reconstruct the events", "piece together",
    ],
    preferredPrimary: ["owl", "shadow"],
preferredSupport: ["shadow", "glove"],
    avoid: ["architect", "captain", "whaler", "wild-bird-seed", "diplomat", "raven", "gomer-pyle"],
    deliverableRules: [
      { rx: /timeline|chronology|sequence of events|inconsistent dates/, label: "Timeline Analysis" },
      { rx: /contradict|inconsist|conflicting|do(es)? not match|don'?t match/, label: "Contradiction Map" },
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
      "step by step", "step-by-step", "one step at a time", "no experience", "show me how",
      "android", "iphone", "chromebook", "windows", "mac", "browser", "upload", "download",
      "export", "import", "setup", "set up", "install", "app", "website",
    ],
    preferredPrimary: ["platform-tutor", "snail", "clear"],
    preferredSupport: ["snail", "platform-tutor", "owl", "clear"],
    avoid: ["shadow", "glove", "whaler", "wild-bird-seed", "captain", "architect", "raven", "gomer-pyle"],
    softAvoidUnless: { ids: ["shadow"], rx: /\b(critique|review|red.?team|audit|stress test)\b/ },
    deliverableRules: [
      { rx: /lesson plan/, label: "Lesson Plan" },
      { rx: /learning path|curriculum/, label: "Learning Path" },
      { rx: /step by step|step-by-step|one step at a time|how do i|show me|upload|download|export|import|install|setup|set up|android|iphone|chromebook|windows|mac|app\b|website|browser/, label: "Step-by-Step Walkthrough" },
      { rx: /walk ?through|concept|explain/, label: "Concept Walkthrough" },
    ],
    defaultDeliverable: "Concept Walkthrough",
  },
  {
    name: "Communication & Negotiation",
    signals: [
      "negotiate", "negotiation", "counter offer", "counteroffer", "counter proposal",
      "counter-proposal", "terms", "leverage", "bargain", "dispute with",
      "disagreement with", "argument with", "de-escalate", "mediator", "apology",
      "tough conversation", "resolve a conflict", "resolve our conflict",
      "team conflict", "family conflict", "coworker conflict",
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
    preferredPrimary: ["judge", "owl", "glove"],
    preferredSupport: ["glove", "owl", "architect", "shadow"],
    avoid: ["whaler", "wild-bird-seed", "alien", "raven", "gomer-pyle", "captain", "diplomat"],
    deliverableRules: [
      { rx: /predict|likely to rule|most likely to rule|judicial outcome|how a judge/, label: "Judicial Outcome Prediction" },
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
      { rx: /client acquisition|acquisition plan|first\s+(ten|10|\d+)\s+paying\s+(clients?|customers?)|first\s+(ten|10|\d+)\s+(clients?|customers?)|first\s+paying\s+(clients?|customers?)|first\s+(clients?|customers?)/, label: "Client Acquisition Plan" },
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
  situationType?: string | null,
): { label: string; evidence: string[] } {
  if (situationType === "Client Acquisition") {
    return {
      label: "Client Acquisition Plan",
      evidence: ["Client Acquisition situation type overrides generic Strategy & Positioning deliverable"],
    };
  }

  for (const r of spec.deliverableRules) {
    if (r.rx.test(text)) {
      return {
        label: r.label,
        evidence: [`matched "${r.label}" rule for ${spec.name}`],
      };
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
  avoidIds: Set<string> = new Set(),
): { supporting: Mode[]; team: TeamMember[] } {
  const primaryRole = roleOf(primary).role;
  const used = new Set<string>([primary.id]);
  const supporting: Mode[] = [];
  const usedRoles = new Set<CognitiveRole>([primaryRole]);

  // 1. Preferred candidates that bring a distinct role.
  for (const id of preferredIds) {
    if (supporting.length >= 2) break;
    if (used.has(id) || avoidIds.has(id)) continue;
    const m = modes.find((mm) => mm.id === id);
    if (!m) continue;
    const r = roleOf(m).role;
    if (usedRoles.has(r)) continue;
    // soft frequency penalty: skip preferred if it's been used heavily and a fresher option exists
    if (freqPenalty(id) >= 3) {
      const fresh = modes.find(
        (mm) => !used.has(mm.id) && !avoidIds.has(mm.id) && roleOf(mm).role === r && freqPenalty(mm.id) < 2,
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
      .filter((m) => !used.has(m.id) && !avoidIds.has(m.id) && roleOf(m).role === role)
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
  { rx: /\bexisting paying customers?\b/, label: "existing paying customers" },
{ rx: /\bcurrent paying customers?\b/, label: "current paying customers" },
{ rx: /\b\d+\s+paying customers?\b/, label: "number of paying customers" },
  { rx: /\brecurring clients?\b/, label: "recurring clients" },
  { rx: /\brepeat business\b/, label: "repeat business" },
  { rx: /\brepeat customers?\b/, label: "repeat customers" },
  { rx: /\bdocumented workflows?\b/, label: "documented workflows" },
  { rx: /\bexisting (pricing sheets?|price list|service catalog)\b/, label: "existing pricing sheets" },
  { rx: /\b(we|i) (already )?have (a |our )?(pricing sheet|price list|service catalog|sop|playbook)/, label: "already has core docs" },
  { rx: /\bvendor relationships?\b/, label: "vendor relationships" },
  { rx: /\b(established|existing|running|operating) (business|company|firm|practice|shop)\b/, label: "established business" },
  { rx: /\b(recurring law firm clients?|existing law firm clients?|current law firm clients?)\b/, label: "existing law firm clients" },
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

// ---- Semantic constraint layer (data-driven) ----
// Explicit user constraints boost any mode whose OWN metadata addresses that
// constraint. This works with ANY mode collection (numeric, EXP-*, seed ids)
// because it reads from the mode records, not hardcoded id lookups.

interface ConstraintSignal {
  key: string;
  label: string;
  patterns: RegExp[];
  /** matches when a mode's metadata is a good fit for this constraint */
  modeMatch: RegExp;
  /** matches when a mode is clearly wrong for this constraint (negative) */
  modeExclude?: RegExp;
  weight: number;
  /** if primary addresses this, deliverable label overrides */
  deliverable?: string;
  /** synthetic Situation Type label surfaced in the UI */
  situationType?: string;
  /** preferred stage if this constraint dominates */
  stage?: WorkStage;
}

const CONSTRAINT_SIGNALS: ConstraintSignal[] = [
  {
    key: "verbatim_quotation",
    label: "Verbatim quotation required",
    patterns: [
      /\bverbatim\b/,
      /\bexact\s+(quote|quotes|quotation|quotations|wording|language|text)\b/,
      /\bdo not paraphrase\b/,
      /\bdon'?t paraphrase\b/,
      /\bno paraphras/,
      /\bonly (verified )?direct quot/,
      /\bdirect quot(e|ation)/,
      /\bword[- ]for[- ]word\b/,
      /\bexactly as (stated|written|said|quoted)\b/,
      /\bpreserve (the )?wording\b/,
      /\bunaltered quot/,
    ],
    modeMatch: /verbatim|exact\s+quot|direct\s+quot|word[- ]for[- ]word|no paraphras|preserve.*word|unaltered|literal (transcription|quotation)/i,
    weight: 45,
    deliverable: "Verified Direct Quotations",
    situationType: "Verbatim Citation",
    stage: "Reviewing",
  },
  {
    key: "legal_research",
    label: "Legal authority research",
    patterns: [
      /\bcase\s?law\b/,
      /\bstatute\b/,
      /\bstatutory\b/,
      /\bprecedent\b/,
      /\bprimary authority\b/,
      /\bpublished (case|opinion|decision)\b/,
      /\bverif(y|ied|ying) citation/,
      /\bsearch\s+\w+\s+law\b/,
      /\blegal research\b/,
      /\bauthority (on|for)\b/,
      /\bcite (a )?(case|statute|rule)/,
      /\bcolorado law\b|\bfederal law\b|\bstate law\b/,
      /\brules? of (civil|criminal|appellate) procedure\b/,
    ],
    modeMatch: /legal research|case ?law|statute|primary authority|citation|precedent|primary source|legal analysis|research (mode|the) law/i,
    modeExclude: /comedy|satire|roast|hype|wrestl/i,
    weight: 40,
    deliverable: "Legal Authority Research",
    situationType: "Legal Research",
    stage: "Planning",
  },
  {
    key: "judicial_prediction",
    label: "Predict judicial ruling",
    patterns: [
      /\bpredict how\b.*\b(judge|court|magistrate|panel)\b/,
      /\bmost likely to rule\b/,
      /\blikely (ruling|to rule)\b/,
      /\bhow (a|the) (judge|court|magistrate)\b.*\brule\b/,
      /\bjudicial outcome\b/,
      /\bwhat (is )?the (judge|court) likely\b/,
    ],
    modeMatch: /judge|judicial|predict.*rul|likely to rule|court.*rule|bench (analysis|perspective)/i,
    modeExclude: /comedy|satire|roast/i,
    weight: 40,
    deliverable: "Judicial Outcome Prediction",
    situationType: "Judicial Prediction",
    stage: "Planning",
  },
  {
    key: "device_tutorial",
    label: "Beginner device tutorial",
    patterns: [
      /\bone step at a time\b/,
      /\bstep[- ]by[- ]step\b/,
      /\bteach me how to (upload|download|install|export|import|set ?up|configure)/,
      /\b(android|iphone|ipad|chromebook|windows|mac|browser)\b.*\b(upload|download|install|export|import|open|find|tap|click)/,
      /\b(upload|download|install|export|import).*\b(from|on|to) my (android|iphone|ipad|chromebook|windows|mac|phone|laptop)/,
    ],
    modeMatch: /platform tutor|device[- ]specific|beginner.*step|one step at a time|step[- ]by[- ]step.*device|platform.*instruction/i,
    weight: 35,
    deliverable: "Step-by-Step Walkthrough",
    situationType: "Device Tutorial",
    stage: "Drafting",
  },
  {
    key: "surreal_visual",
    label: "Surreal visual/associative imagery",
    patterns: [
      /\bpsychedelic\b/,
      /\bsurreal(ist)?\b/,
      /\bdreamlike\b/,
      /\bmetamorphos/,
      /\bposter\b.*\b(where|becomes)\b/,
      /\b(hair|road|highway|river|letter|memory)\b.*\bbecomes\b.*\b(a|an|the)\b.*\bbecomes\b/,
      /\bmorphs? into\b.*\bmorphs? into\b/,
    ],
    modeMatch: /surreal|dreamlike|associative|symbolic|imagery|visual metaphor|psychedelic|lucy|raven|character arc|freestyle|inventor|alien|creative/i,
    modeExclude: /legal|court|compliance|dispatch|operat(ing|ions)/i,
    weight: 35,
    deliverable: "Visual Concept",
    situationType: "Creative Visual",
    stage: "Drafting",
  },
  {
    key: "evidence_reconciliation",
    label: "Reconcile conflicting evidence",
    patterns: [
      /\bfacts.*do not match\b/,
      /\bfacts.*don'?t match\b/,
      /\bfacts.*do not agree\b/,
      /\bwhat most likely happened\b/,
      /\bdetermine what (most likely )?happened\b/,
      /\btimeline.*inconsist/,
      /\bconflicting (accounts|witnesses|statements|evidence)/,
      /\breconcile\b.*evidence/,
      /\bpiece together\b.*\b(what happened|events)\b/,
    ],
    modeMatch: /detective|investigat|evidence|reconstruct|contradict|forensic|reconcile|piece together/i,
    modeExclude: /comedy|satire|roast|hype/i,
    weight: 40,
    deliverable: "Most Likely Explanation",
    situationType: "Evidence Reconciliation",
    stage: "Reviewing",
  },
];

function modeBlob(m: Mode): string {
  return [
    m.mode,
    m.category,
    m.subcategory,
    m.purpose,
    m.coreObjective,
    m.corePrinciples,
    m.bestFor,
    m.attributes,
    m.fullPrompt,
    (m.triggers || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function extractConstraints(text: string): ConstraintSignal[] {
  const active: ConstraintSignal[] = [];
  for (const c of CONSTRAINT_SIGNALS) {
    if (c.patterns.some((rx) => rx.test(text))) active.push(c);
  }
  return active;
}

interface SemanticScore {
  mode: Mode;
  score: number;
  reasons: string[];
  addressedConstraints: string[];
}

function semanticRank(
  modes: Mode[],
  text: string,
  constraints: ConstraintSignal[],
): SemanticScore[] {
  const results: SemanticScore[] = [];
  for (const m of modes) {
    const reasons: string[] = [];
    const addressed: string[] = [];
    let s = 0;
    const blob = modeBlob(m);

    // trigger hits
    for (const t of m.triggers || []) {
      if (t && text.includes(t.toLowerCase())) {
        s += t.length > 6 ? 4 : 2;
        reasons.push(`trigger:${t}`);
      }
    }
    // category / subcategory presence in text
    const catL = (m.category || "").toLowerCase();
    const subL = (m.subcategory || "").toLowerCase();
    if (catL && catL.length > 3 && text.includes(catL)) { s += 4; reasons.push(`cat:${m.category}`); }
    if (subL && subL.length > 3 && text.includes(subL)) { s += 3; reasons.push(`sub:${m.subcategory}`); }

    // bestFor / purpose / coreObjective word overlap (weak signal)
    const target = `${m.bestFor} ${m.purpose} ${m.coreObjective ?? ""}`.toLowerCase();
    const words = target.split(/\W+/).filter((w) => w.length >= 5);
    let overlap = 0;
    for (const w of new Set(words)) {
      if (text.includes(w)) overlap++;
    }
    if (overlap) { s += Math.min(overlap, 6); reasons.push(`overlap:${overlap}`); }

    // constraint boosts (dominant signal)
    for (const c of constraints) {
      const excluded = c.modeExclude?.test(blob);
      const matched = c.modeMatch.test(blob);
      if (matched && !excluded) {
        s += c.weight;
        addressed.push(c.key);
        reasons.push(`constraint:${c.key}+${c.weight}`);
      } else if (excluded && c.patterns.some((rx) => rx.test(text))) {
        s -= 10;
        reasons.push(`constraint-exclude:${c.key}`);
      }
    }

    // avoidWhen negative signal
    if (m.avoidWhen) {
      const avWords = m.avoidWhen.toLowerCase().split(/\W+/).filter((w) => w.length >= 5);
      let hits = 0;
      for (const w of new Set(avWords)) if (text.includes(w)) hits++;
      if (hits >= 2) { s -= 6 + hits; reasons.push(`avoidWhen-hits:${hits}`); }
    }

    results.push({ mode: m, score: s, reasons, addressedConstraints: addressed });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

/** layers is stored as free-form prose; parse mode names/ids from it */
function layersIds(primary: Mode, modes: Mode[]): Set<string> {
  const raw = (primary.layers || "").toLowerCase();
  const ids = new Set<string>();
  if (!raw) return ids;
  for (const m of modes) {
    if (m.id === primary.id) continue;
    const nameL = m.mode.toLowerCase();
    const shortName = nameL.replace(/\s*mode\s*$/, "");
    if (raw.includes(nameL) || (shortName.length > 3 && raw.includes(shortName))) {
      ids.add(m.id);
    }
  }
  return ids;
}

/** Build stack: constraint-coverage first, then layers compatibility, then role diversity.
 *  Up to 3 layers, each contributing a distinct functional role from CORE and each other
 *  unless a constraint forces a duplicate role. */
function buildSemanticStack(
  primary: Mode,
  modes: Mode[],
  ranked: SemanticScore[],
  constraints: ConstraintSignal[],
  avoidIds: Set<string>,
  maxLayers = 3,
): { supporting: Mode[]; team: TeamMember[]; stackReasons: string[]; layerCoverage: Record<string, string[]> } {
  const used = new Set<string>([primary.id]);
  const supporting: Mode[] = [];
  const stackReasons: string[] = [];
  const layerCoverage: Record<string, string[]> = {};
  const primaryScore = ranked.find((r) => r.mode.id === primary.id);
  const primaryAddressed = new Set(primaryScore?.addressedConstraints ?? []);
  const stackCompat = layersIds(primary, modes);
  const primaryFn = functionalRole(primary);
  const usedFnRoles = new Set<FunctionalRole>([primaryFn]);

  const addLayer = (m: Mode, reason: string, covers: string[] = []) => {
    supporting.push(m);
    used.add(m.id);
    usedFnRoles.add(functionalRole(m));
    stackReasons.push(reason);
    layerCoverage[m.id] = covers;
  };

  // 1. For each active constraint NOT already addressed by primary,
  //    add the top-scored mode that addresses it. Constraints override role diversity.
  for (const c of constraints) {
    if (supporting.length >= maxLayers) break;
    if (primaryAddressed.has(c.key)) continue;
    const cand = ranked.find(
      (r) =>
        !used.has(r.mode.id) &&
        !avoidIds.has(r.mode.id) &&
        r.addressedConstraints.includes(c.key) &&
        r.score > 0,
    );
    if (cand) {
      addLayer(
        cand.mode,
        `${cand.mode.mode} addresses ${c.label} [${functionalRole(cand.mode)}] (score ${cand.score})`,
        [c.label],
      );
    }
  }

  // 2. Fill from layers-compatibility list with strong semantic score AND a distinct
  //    functional role from CORE and already-picked layers.
  if (supporting.length < maxLayers) {
    for (const r of ranked) {
      if (supporting.length >= maxLayers) break;
      if (used.has(r.mode.id) || avoidIds.has(r.mode.id)) continue;
      if (!stackCompat.has(r.mode.id)) continue;
      if (r.score < 4) continue;
      const fn = functionalRole(r.mode);
      if (usedFnRoles.has(fn)) continue;
      addLayer(
        r.mode,
        `${r.mode.mode} is layers-compatible, distinct role [${fn}], semantic score ${r.score}`,
      );
    }
  }

  // 3. Fill remaining slots by functional-role diversity from top scorers.
  if (supporting.length < maxLayers) {
    for (const r of ranked) {
      if (supporting.length >= maxLayers) break;
      if (used.has(r.mode.id) || avoidIds.has(r.mode.id)) continue;
      if (r.score < 6) continue;
      const fn = functionalRole(r.mode);
      if (usedFnRoles.has(fn)) continue;
      addLayer(
        r.mode,
        `${r.mode.mode} adds a distinct functional role [${fn}] (score ${r.score})`,
      );
    }
  }

  const team: TeamMember[] = [
    { mode: primary, role: roleOf(primary).role, contribution: roleOf(primary).contribution },
    ...supporting.map((m) => ({
      mode: m,
      role: roleOf(m).role,
      contribution: roleOf(m).contribution,
    })),
  ];
  return { supporting, team, stackReasons, layerCoverage };
}


// ---- Main ----

export function recommend(situation: string, modes: Mode[]): Recommendation | null {
  if (!modes.length) return null;
  const text = ` ${situation.toLowerCase()} `;
  const byId = (id: string) => modes.find((m) => m.id === id);

  const types = detectSituationTypes(text);
  const scored = modes.map((m) => scoreMode(m, text)).sort((a, b) => b.score - a.score);

  // STEP 1: extract explicit constraint signals (verbatim, legal research, judicial
  // prediction, tutorial, surreal visual, evidence reconciliation, etc.).
  const constraints = extractConstraints(text);
  const constraintKeys = constraints.map((c) => c.key);

  // STEP 2: category detection (kept as a soft compatibility signal, no longer
  // the sole primary picker).
  const { spec: catSpec, evidence: categoryEvidence } = detectCategory(text);
  const avoidIds = catSpec ? resolveCategoryAvoid(catSpec, text) : new Set<string>();

  // STEP 3: semantic ranking against ALL mode metadata + constraints.
  const ranked = semanticRank(modes, text, constraints);
  const rankedAllowed = ranked.filter((r) => !avoidIds.has(r.mode.id));
  const semanticTop = rankedAllowed[0];

  // Determine Situation Type (existing detector — used for reason text + fallback).
  const primaryType = types[0];
  const detectedTypeNames: string[] = [];
  if (primaryType) {
    detectedTypeNames.push(primaryType.type);
    if (types[1] && types[1].score >= primaryType.score * 0.75) {
      detectedTypeNames.push(types[1].type);
    }
  }

  // STEP 4: pick CORE. Priority:
  //   (a) Systems Architect promotion when the user asks to design whole workflows/systems.
  //   (b) Semantic top — but if that mode's functional role is a CONSTRAINT role
  //       (output_control / verification), swap in the best task-performing candidate
  //       and let the constraint mode become a LAYER.
  //   (c) Category preferred → situation-type preferred → keyword fallback.
  let primaryMode: Mode | null = null;
  let typeReason = "";
  let primarySource = "semantic";

  // (a) Systems-Architect / workflow-system promotion.
  const systemsCoreSignal = detectSystemsArchitectCore(text);
  if (systemsCoreSignal) {
    const arch = findOptimizationCore(modes, avoidIds);
    if (arch) {
      primaryMode = arch;
      primarySource = "systems-architect-workflow";
      typeReason =
        "Whole-workflow / reusable-system language detected — Systems Architect (optimization role) promoted to CORE.";
    }
  }

  const semanticThreshold = 6;
  const dominantConstraint = constraints.length > 0 &&
    semanticTop &&
    semanticTop.addressedConstraints.length > 0;

  if (!primaryMode && (dominantConstraint || (semanticTop && semanticTop.score >= semanticThreshold))) {
    let chosen = semanticTop!.mode;
    typeReason = dominantConstraint
      ? `The situation contains explicit constraint(s) [${constraints.map((c) => c.label).join("; ")}], and ${chosen.mode}'s metadata directly addresses them.`
      : `Selected from semantic scoring across category/purpose/bestFor/triggers (score ${semanticTop!.score}).`;

    // Guard: don't let a pure output-constraint or verification mode become CORE
    // when a task-performing mode is also a strong fit. Legal Research > Verbatim.
    const chosenFn = functionalRole(chosen);
    if (CONSTRAINT_ROLES.has(chosenFn)) {
      const alt = rankedAllowed.find((r) => {
        if (r.mode.id === chosen.id) return false;
        if (!TASK_PERFORMING_ROLES.has(functionalRole(r.mode))) return false;
        const addressesConstraint = r.addressedConstraints.length > 0;
        return addressesConstraint || r.score >= Math.max(semanticThreshold, (semanticTop!.score) - 15);
      });
      if (alt) {
        typeReason = `${alt.mode.mode} performs the task (${functionalRole(alt.mode)}); ${chosen.mode} (${chosenFn}) is a finishing constraint and belongs in LAYERS. Semantic scores: core ${alt.score} vs demoted ${semanticTop!.score}.`;
        chosen = alt.mode;
        primarySource = "task-performing-swap";
      }
    }
    primaryMode = chosen;
  }

  // Fallback: category preferred, then situation-type preferred, then top keyword.
  if (!primaryMode && catSpec) {
    for (const id of catSpec.preferredPrimary) {
      if (avoidIds.has(id)) continue;
      const m = byId(id);
      if (m) { primaryMode = m; primarySource = "category"; break; }
    }
    if (primaryMode) {
      typeReason = `Category "${catSpec.name}" preferred CORE — no dominant semantic or constraint signal.`;
    }
  }
  if (!primaryMode && primaryType) {
    const st = SITUATION_TYPES.find((s) => s.type === primaryType.type)!;
    const candidate = byId(st.primary);
    if (candidate && !avoidIds.has(candidate.id)) {
      primaryMode = candidate;
      primarySource = "situation-type";
      typeReason = st.reason;
    }
  }
  if (!primaryMode) {
    const allowed = scored.filter((s) => !avoidIds.has(s.mode.id));
    primaryMode = (allowed[0]?.score ?? 0) > 0 ? allowed[0].mode : (byId("owl") ?? modes[0]);
    primarySource = "keyword-fallback";
    if (!typeReason) typeReason = "No dominant signals — falling back to strongest keyword match.";
  }

  // STEP 5: build LAYERS. Constraints not covered by CORE come first, then
  // layers-compatibility, then functional-role diversity. Up to 3 layers.
  const { supporting, team, stackReasons, layerCoverage } = buildSemanticStack(
    primaryMode,
    modes,
    ranked,
    constraints,
    avoidIds,
    3,
  );


  const { avoid, isHighConfidence: avoidIsHighConfidence } = pickAvoid(
    primaryMode,
    modes,
    supporting,
    text,
    catSpec,
  );

  const triggerScore = scored.find((s) => s.mode.id === primaryMode!.id)?.score ?? 0;
  const rolesCovered = new Set(team.map((t) => t.role)).size - 1;
  const primarySemanticScore = ranked.find((r) => r.mode.id === primaryMode!.id)?.score ?? 0;

  const confidence = computeConfidence(
    (primaryType?.hits.length ?? 0) + (catSpec ? categoryEvidence.length : 0) + constraints.length * 2,
    triggerScore + Math.max(0, primarySemanticScore - triggerScore),
    rolesCovered,
    supporting.length > 0,
  );

  const primaryConfidence = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        30 +
          (constraints.length ? Math.min(constraints.length * 15, 35) : 0) +
          Math.min(primarySemanticScore, 30) +
          (catSpec ? 10 : 0) -
          freqPenalty(primaryMode.id) * 2,
      ),
    ),
  );
  const stackConfidence = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        primaryConfidence * 0.6 +
          Math.min(rolesCovered, 2) * 10 +
          (supporting.length ? 12 : -10),
      ),
    ),
  );

  const { stage: rawStage, evidence: stageEvidence } = detectStage(text);
  // Constraint-driven stage override
  const constraintStage = constraints.find((c) => c.stage)?.stage;
  const stage: WorkStage = constraintStage ?? rawStage;
  if (constraintStage && constraintStage !== rawStage) {
    stageEvidence.unshift(`overridden by constraint: ${constraints.find((c) => c.stage)?.label}`);
  }
  const stageConfidence = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (constraintStage ? 65 : stage === "Idea" && stageEvidence[0]?.startsWith("no stage-specific") ? 25 : 50) +
          Math.min(stageEvidence.length * 15, 45),
      ),
    ),
  );

  // STEP 6: deliverable — constraint override > category rules > generic rules.
  let deliverable: string;
  let deliverableEvidence: string[];
  const overrideConstraint = constraints.find((c) => c.deliverable);
  if (overrideConstraint) {
    deliverable = overrideConstraint.deliverable!;
    deliverableEvidence = [`explicit constraint: ${overrideConstraint.label}`];
  } else if (catSpec) {
    const cd = categoryDeliverable(catSpec, text, primaryType?.type ?? null);
    deliverable = cd.label;
    deliverableEvidence = cd.evidence;
  } else {
    const dd = detectDeliverable(text, primaryType?.type ?? null, stage);
    deliverable = dd.deliverable;
    deliverableEvidence = dd.evidence;
  }

  // STEP 7: situation-type display — surface constraint-driven types too.
  const constraintTypeNames = constraints.map((c) => c.situationType).filter((s): s is string => !!s);
  const displayTypeNames = constraintTypeNames.length ? constraintTypeNames : detectedTypeNames;
  const situationTypesForDisplay: SituationTypeMatch[] = constraintTypeNames.length
    ? constraints
        .filter((c) => c.situationType)
        .map((c) => ({ type: c.situationType!, score: c.weight, hits: [c.key] }))
    : types.slice(0, 3);

  const categoryName = catSpec?.name ?? primaryMode.category ?? "Uncategorized";

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

  const supportEvidence =
    primarySemanticScore > 0
      ? `Semantic score ${primarySemanticScore} against the mode's own metadata.`
      : `No strong semantic signals — pick came from ${primarySource}.`;

  const explanation =
    `Category: ${categoryName}. ` +
    (displayTypeNames.length
      ? `Situation Type: ${displayTypeNames.join(" + ")}. `
      : `No clear Situation Type signals. `) +
    `${primaryMode.mode} is primary because ${typeReason} ` +
    supportEvidence +
    (supporting.length
      ? ` Stack: ${supporting.map((s) => s.mode).join(" and ")}${stackReasons.length ? ` (${stackReasons.join("; ")})` : ""}.`
      : ` No complementary mode surfaced a distinct-enough function to stack.`) +
    (avoid && avoidIsHighConfidence ? ` Avoid ${avoid.mode} here — ${avoid.avoidWhen.toLowerCase()}` : "");

  const combinedPrompt = buildCombinedPrompt(
    situation,
    primaryMode,
    supporting,
    displayTypeNames,
    stage,
    deliverable,
  );

  const reasoning: string[] = [
    `Constraints detected: ${constraints.length ? constraints.map((c) => c.label).join(", ") : "none"}.`,
    `Semantic top: ${semanticTop ? `${semanticTop.mode.mode} (score ${semanticTop.score}, addresses ${semanticTop.addressedConstraints.join(",") || "no constraints"})` : "none"}.`,
    `Category "${categoryName}"${catSpec ? ` from signals: ${categoryEvidence.join(", ")}` : ""}.`,
    primaryType
      ? `Top situation type "${primaryType.type}" with ${primaryType.hits.length} signal hit(s).`
      : `No clear situation type via keyword detector.`,
    `Primary ${primaryMode.mode} via ${primarySource}.`,
    supporting.length
      ? `Stack: ${stackReasons.join(" | ")}.`
      : `Stack: none — no complementary function found.`,
    `Deliverable "${deliverable}" — ${deliverableEvidence.join("; ")}.`,
    `Stage "${stage}" — ${stageEvidence.join("; ")}.`,
  ];

  // Development diagnostics — inspect with window.__lastRecommendationDebug
  if (typeof globalThis !== "undefined") {
    (globalThis as unknown as { __lastRecommendationDebug?: unknown }).__lastRecommendationDebug = {
      situation,
      constraints: constraintKeys,
      semanticTop10: rankedAllowed.slice(0, 10).map((r) => ({
        id: r.mode.id, mode: r.mode.mode, score: r.score, addresses: r.addressedConstraints, reasons: r.reasons,
      })),
      primary: { id: primaryMode.id, mode: primaryMode.mode, source: primarySource, semanticScore: primarySemanticScore },
      supporting: supporting.map((s) => ({ id: s.id, mode: s.mode })),
      stackReasons,
      avoidIds: [...avoidIds],
      category: categoryName,
      situationType: displayTypeNames,
      stage,
      deliverable,
    };
  }

  bumpCounts([primaryMode.id, ...supporting.map((s) => s.id)]);

  return {
    primary: primaryMode,
    primaryRole: roleOf(primaryMode).role,
    primaryContribution: roleOf(primaryMode).contribution,
    supporting,
    team,
    avoid: avoidIsHighConfidence ? avoid : null,
    avoidIsHighConfidence,
    explanation,
    combinedPrompt,
    confidence,
    primaryConfidence,
    stackConfidence,
    stageConfidence,
    situationTypes: situationTypesForDisplay,
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
    category: categoryName,
    categoryEvidence,
    reasoning,
  };
}

// ---- Avoid selection ----

const COMEDY_OPT_IN = ["satire", "comedy", "comedic", "roast", "lyrics", "song", "parody", "fiction", "joke"];

function pickAvoid(
  primary: Mode,
  modes: Mode[],
  supporting: Mode[],
  text: string,
  catSpec: CategorySpec | null,
): { avoid: Mode | null; isHighConfidence: boolean } {
  const usedIds = new Set([primary.id, ...supporting.map((s) => s.id)]);
  const wantsComedy = COMEDY_OPT_IN.some((k) => text.includes(k));

  // High-confidence conflict #1: Gomer Pyle in a serious/legal/professional context.
  const seriousContext =
    /\b(legal|court|magistrate|attorney|agency|investigation|witness|client|customer|professional)\b/.test(text);
  if (!wantsComedy && seriousContext) {
    const gp = modes.find((m) => m.id === "gomer-pyle" && !usedIds.has(m.id));
    if (gp) return { avoid: gp, isHighConfidence: true };
  }

  // High-confidence conflict #2: category explicitly avoids a mode that the user's
  // keywords would otherwise pull in (e.g. Architect in Creative Writing when the
  // user mentions "structure" but the category bans it without storytelling intent).
  if (catSpec) {
    for (const id of catSpec.avoid) {
      const m = modes.find((mm) => mm.id === id);
      if (!m || usedIds.has(id)) continue;
      const triggered = m.triggers.some((t) => text.includes(t));
      if (triggered) return { avoid: m, isHighConfidence: true };
    }
  }

  // Low-confidence fallback: opposite-intensity contrast pick. Not surfaced by UI
  // unless the caller treats it as informational.
  const opposites: Record<string, string> = {
    Extreme: "Low",
    High: "Low",
    Low: "High",
    Medium: "Extreme",
  };
  const target = opposites[primary.intensity];
  const fallback = modes.find((m) => !usedIds.has(m.id) && m.intensity === target) ?? null;
  return { avoid: fallback, isHighConfidence: false };
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
