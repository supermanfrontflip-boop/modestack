import type { Mode } from "./modes-data";

/**
 * INTENT-FIRST RANKING MODEL
 * ==========================
 * The recommender used to score modes on surface vocabulary, which meant SUBJECT
 * MATTER (nouns like "courthouse", "contract", "client") could outrank USER INTENT
 * (the requested operation: "brainstorm", "poke holes", "hold my boundary").
 *
 * This module separates a situation into independent semantic dimensions and ranks
 * modes primarily by the requested OPERATION and REASONING STYLE. Topic/domain is a
 * weak tiebreaker only. Nothing here is keyed to a benchmark id or benchmark phrase:
 * every rule is a general vocabulary family.
 */

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export type IntentClass =
  | "operation" // performs the task -> may be CORE
  | "output_control"; // constrains the output -> LAYERS only

export interface IntentDef {
  id: string;
  label: string;
  /** Higher wins when several operations are requested at once. */
  priority: number;
  class: IntentClass;
  /** Requested-operation vocabulary (verbs / verb phrases, not topics). */
  patterns: RegExp[];
  /** Reasoning-style words that reinforce the same operation. */
  style?: RegExp[];
  /** Modes whose NAME declares this capability (strongest match tier). */
  capabilityName: RegExp;
  /** Modes whose category / subcategory / purpose declares this capability. */
  capabilityMeta?: RegExp;
  /** Adjacent-but-wrong capabilities: they share topic vocabulary, not the operation. */
  suppress?: RegExp;
}

export interface DimensionReading {
  label: string;
  evidence: string[];
}

const has = (text: string, list: RegExp[]) => list.filter((rx) => rx.test(text)).map((rx) => rx.source);

// ---------------------------------------------------------------------------
// Intent hierarchy — requested operation outranks topical nouns by construction,
// because topics are never used to select an intent.
// ---------------------------------------------------------------------------

export const INTENTS: IntentDef[] = [
  {
    id: "hold_boundary",
    label: "hold boundaries",
    priority: 94,
    class: "operation",
    patterns: [
      /hold (my|the|our) (boundary|boundaries|line|ground|rate|rates|price|prices|fee|fees|position|terms)/,
      /(not|won'?t|refuse to|will not) budge/,
      /stand (firm|my ground)|hold firm|no discount/,
      /(decline|refuse|say no|push back|turn down)\b/,
      /(without|not) (caving|conceding|apologi[sz]ing)/,
      /firm (but |and )?(professional|polite|courteous)/,
      /keep (it|things) (professional|firm)/,
    ],
    style: [/\bfirm\b/, /\bprofessional\b/, /\bassertive\b/, /\bboundary\b/],
    capabilityName: /glove|boundary|assert/i,
    capabilityMeta: /boundar|assertive|firm professional|hold the line|decline|pushback|push back/i,
    // Investigation, judgement and adversarial teardown all look plausible because
    // the topic is a client / a contract / a case. The operation is correspondence.
    suppress:
      /detective|investigat|forensic|reconstruct|judge|judicial|verdict|prosecut|shadow|adversar|red team|interrogat/i,
  },
  {
    id: "stress_test",
    label: "stress-test / critique",
    priority: 92,
    class: "operation",
    patterns: [
      /poke holes/,
      /(find|list|surface|show me) (every |all |the )?(risk|risks|flaw|flaws|hole|holes|failure|failures|weakness|weaknesses|gap|gaps)/,
      /what could go wrong|worst case/,
      /failure (point|points|mode|modes)/,
      /stress[- ]test|red[- ]team|devil'?s advocate|pressure[- ]test/,
      /(risk|threat|vulnerabilit\w*|downside) (review|analysis|assessment|check)/,
      /(critique|tear apart|attack|challenge|rip apart) (my|this|the|it)/,
      /before i (sign|commit|agree|send|file)/,
    ],
    style: [/\badversarial\b/, /\bskeptical\b/, /\bcritical\b/, /\bharsh\b/],
    capabilityName: /shadow|adversar|risk|red ?team|critic|skeptic/i,
    capabilityMeta: /adversarial review|risk|failure|critique|stress|devil|red team|challenge assumptions/i,
    // A contract / vendor / deal topic pulls deal-making modes; the user asked for
    // an attack, not for terms to be agreed.
    suppress: /negotiat|diplomat|closer|deal[- ]?mak|glove|mediat|hype|cheer|persuad/i,
  },
  {
    id: "navigate_device",
    label: "navigate a device / platform",
    priority: 90,
    class: "operation",
    patterns: [
      /step[- ]by[- ]step/,
      /walk me through/,
      /how do i (set up|setup|enable|disable|turn on|turn off|configure|install|change|find|access)/,
      /(where|how) (is|do i find) the (setting|settings|option|menu|button)/,
      /show me (how to|the steps)/,
      /(set|setting|turn|turning) (up|on|off) [\w\s]{0,24}\b(phone|android|iphone|ios|windows|mac|tablet|laptop|router|app|account|settings|forwarding|voicemail|wifi|bluetooth|printer)\b/,
    ],
    style: [/\bexact steps\b/, /\bmenu\b/, /\btap\b/, /\bclick\b/],
    capabilityName: /platform tutor|tutor|tech|device|navigat|guide/i,
    capabilityMeta: /step[- ]by[- ]step|device|platform|settings|walkthrough|tutorial|interface/i,
    // Worldbuilding / storytelling / lore modes match "walk", "scene", "setting".
    suppress:
      /worldbuild|world[- ]build|legend|campfire|story|fiction|lore|myth|raven|symbol|metaphor|character arc/i,
  },
  {
    id: "simplify",
    label: "simplify / tighten language",
    priority: 88,
    class: "operation",
    patterns: [
      /cut (the )?(fluff|filler|crap|padding|noise)/,
      /\bno (fluff|filler|padding|preamble|jargon|buzzwords)\b/,
      /make (it|this) (plain|plainer|simple|simpler|short|shorter|concise|tight|tighter|clearer)/,
      /plain (english|language|words|terms)/,
      /\bsimplify\b|\bcondense\b|\btrim\b|\btighten\b|\bshorten\b|\bdeclutter\b/,
      /(shorter|clearer|plainer) and (shorter|clearer|plainer|simpler)/,
      /remove the (jargon|fluff|filler)/,
    ],
    style: [/\bplain\b/, /\bconcise\b/, /\bblunt\b/, /\bdirect\b/],
    capabilityName: /clear|plain|concise|editor|trim/i,
    capabilityMeta: /plain language|clarity|concise|simplif|edit|tighten|remove fluff/i,
    // Simplifying prose is NOT teaching a beginner, and not construction work.
    suppress:
      /kindergarten|snail|tutor|teach|lesson|curricul|beginner|eli5|gomer|builder|construct|assemble|architect|scaffold/i,
  },
  {
    id: "ideate",
    label: "brainstorm / generate imagery",
    priority: 86,
    class: "operation",
    patterns: [
      /\bbrainstorm\b|\bideate\b|\briff\b|\bfree associate\b/,
      /(generate|come up with|give me|help me find) [\w\s]{0,24}\b(ideas|metaphors|images|imagery|symbols|angles|names|concepts|titles)\b/,
      /\bmetaphor|\bimagery\b|\bsymbolis|\bsurreal\b|\bevocative\b|\bpoetic\b/,
      /(strange|unexpected|weird|unusual|fresh|novel) (ideas|angles|images|imagery|metaphors|takes)/,
      /\bimagine\b|\bwhat if\b/,
    ],
    style: [/\bcreative\b/, /\bdivergent\b/, /\blateral\b/, /\bstory\b/, /\bfiction\b/, /\bpoem\b/],
    capabilityName: /raven|creativ|muse|invent|alchemist|imagin/i,
    capabilityMeta: /creativ|symbol|metaphor|imagery|divergen|ideation|lateral|reframing|invent/i,
    // Fictional SETTINGS (a courthouse, a hospital, a precinct) must not route to
    // domain-expert modes. The operation is imagery, not law/medicine/policing.
    suppress:
      /judge|judicial|legal|statute|case law|litigat|detective|investigat|forensic|complian|negotiat|audit|regulat/i,
  },
  {
    id: "research",
    label: "research / find authority",
    priority: 84,
    class: "operation",
    patterns: [
      /\bresearch\b|\blook up\b|\bfind (the )?(law|statute|statutes|rule|rules|authority|authorities|precedent|source|sources|standard)\b/,
      /\bsearch\b [\w\s]{0,24}\b(law|code|statute|statutes|rules|cases|caselaw|case law|records)\b/,
      /\b(cite|citation|citations)\b/,
      /what (is|are) the (legal )?(standard|standards|requirement|requirements|elements)\b/,
      /\b(case law|caselaw|statute|statutes|court rule|rules of (civil|criminal) procedure)\b/,
    ],
    style: [/\bauthority\b/, /\bsources?\b/, /\bjurisdiction\b/],
    capabilityName: /legal research|research|owl|scholar|librarian/i,
    capabilityMeta: /research|authority|citation|source|statute|case law|legal analysis/i,
    suppress: /hype|roast|comedy|freestyle|worldbuild/i,
  },
  {
    id: "design_system",
    label: "design a system / workflow",
    priority: 80,
    class: "operation",
    patterns: [
      /(design|build|create|map|lay out|set up) (a |an |my |our |the )?[\w\s]{0,28}\b(system|workflow|process|pipeline|framework|sop|procedure)\b/,
      /(repeatable|reusable|standardi[sz]ed|end[- ]to[- ]end|scalable) (system|workflow|process|pipeline|framework)/,
      /systemati[sz]e|standardi[sz]e (my|our|the)/,
      /turn (my|our|the) [\w\s]{0,28} into (a |an )?(system|process|workflow|machine)/,
      /\b(intake|dispatch\w*)\b[\w\s]{0,40}\b(close[d]?[- ]?out|completion|closeout)\b/,
    ],
    style: [/\barchitecture\b/, /\bstructure\b/, /\bworkflow\b/],
    capabilityName: /systems? architect|architect|systems/i,
    capabilityMeta: /system design|workflow|architecture|process design|optimi[sz]ation|structure/i,
  },
  {
    id: "execute_fast",
    label: "produce a deliverable fast",
    priority: 78,
    class: "operation",
    patterns: [
      /knock (this |it |that )?out/,
      /\b(just )?get (it|this) done\b/,
      /\b(today|right now|asap|by tonight|this afternoon|by end of day|eod|in an hour)\b/,
      /\bquick(ly)?\b|\bfast\b|\brapid\b|\bno time\b/,
      /one[- ]pag(e|er)\b/,
      /\b(draft|write|make) (me )?(a|the|one) [\w\s]{0,24}\b(sheet|one[- ]pager|email|letter|doc|memo|list)\b/,
    ],
    style: [/\bfocus\b/, /\bship\b/, /\bnow\b/],
    capabilityName: /hawk|sprint|execut|ship|closer/i,
    capabilityMeta: /focus|rapid|execution|deliverable|speed|ship|momentum/i,
    // Ops/architecture modes read "process", "jobs", "rates" as a system to design;
    // the user wants one artifact produced now.
    suppress:
      /operator|architect|systems|workflow design|standard operating|ops\b|curator|snail|deliberat/i,
  },
  {
    id: "negotiate",
    label: "negotiate / reach agreement",
    priority: 72,
    class: "operation",
    patterns: [
      /\bnegotiat\w*\b/,
      /\bcounter[- ]?offer\b|\bcounter\b [\w\s]{0,12}\boffer\b/,
      /(reach|get to|land) (an? )?(agreement|deal|compromise|middle ground)/,
      /\bhaggle\b|\bsplit the difference\b|\bmeet in the middle\b/,
    ],
    capabilityName: /negotiat|diplomat|closer|mediat/i,
    capabilityMeta: /negotiat|agreement|diplomacy|persuasion|deal/i,
    suppress: /shadow|adversar|roast|red ?team/i,
  },
  {
    id: "teach_concept",
    label: "teach / explain a concept",
    priority: 64,
    class: "operation",
    patterns: [
      /teach me\b|help me understand\b/,
      /explain (how|why|what) [\w\s]{0,30}\b(works|means|happens)\b/,
      /\blike i'?m (five|5|new|a beginner)\b|\beli5\b/,
      /\bfrom scratch\b|\bfundamentals\b|\bbasics of\b/,
    ],
    capabilityName: /snail|tutor|teach|kindergarten|gomer|professor/i,
    capabilityMeta: /teaching|learning|step[- ]by[- ]step|explanation|pedagog/i,
  },
  {
    id: "verbatim_output",
    label: "verbatim / quotation-only output",
    priority: 40,
    class: "output_control",
    patterns: [
      /only (direct |exact |verbatim )?quotes?/,
      /\bverbatim\b/,
      /word[- ]for[- ]word/,
      /quote (it|them|the \w+) (exactly|directly)/,
      /exact (quote|quotes|wording|language|text)/,
      /(don'?t|do not|no) paraphras\w*/,
    ],
    capabilityName: /verbatim|quote|literal/i,
    capabilityMeta: /verbatim|quotation|exact wording|no paraphrase/i,
  },
];

// ---------------------------------------------------------------------------
// Secondary dimensions (weak signals; recorded for diagnostics, small weight)
// ---------------------------------------------------------------------------

const TOPICS: Array<{ label: string; rx: RegExp; capability: RegExp }> = [
  { label: "legal", rx: /\b(court|courthouse|judge|magistrate|statute|law|lawsuit|filing|attorney|legal|case)\b/, capability: /legal|judicial|court|statute|litigat/i },
  { label: "device / software", rx: /\b(phone|android|iphone|ios|windows|mac|app|browser|settings|wifi|email client)\b/, capability: /device|platform|tech|software/i },
  { label: "creative / fiction", rx: /\b(story|novel|poem|character|scene|myth|lore|song|lyrics)\b/, capability: /creativ|story|symbol|fiction/i },
  { label: "business / client work", rx: /\b(client|customer|invoice|rate|rates|pricing|vendor|contract|proposal|job|jobs)\b/, capability: /business|client|sales|operations/i },
  { label: "operations", rx: /\b(intake|dispatch|scheduling|route|workflow|process)\b/, capability: /operations|workflow|process/i },
];

const TONES: Array<{ label: string; rx: RegExp }> = [
  { label: "firm", rx: /\b(firm|assertive|no[- ]nonsense|hold the line|not budge)\b/ },
  { label: "warm", rx: /\b(warm|friendly|gentle|kind)\b/ },
  { label: "blunt", rx: /\b(blunt|brutal|harsh|direct|no fluff)\b/ },
  { label: "playful", rx: /\b(funny|playful|silly|roast)\b/ },
  { label: "neutral", rx: /\b(professional|neutral|formal)\b/ },
];

const URGENCIES: Array<{ label: string; rx: RegExp }> = [
  { label: "immediate", rx: /\b(now|today|asap|tonight|this afternoon|eod|by end of day|urgent)\b/ },
  { label: "near-term", rx: /\b(this week|tomorrow|soon|by friday)\b/ },
  { label: "no deadline stated", rx: /^(?!x)x/ },
];

const AUDIENCES: Array<{ label: string; rx: RegExp }> = [
  { label: "client / customer", rx: /\b(client|customer|law firm|vendor)\b/ },
  { label: "court / official", rx: /\b(court|judge|magistrate|clerk|agency)\b/ },
  { label: "self", rx: /\b(for me|my own|myself)\b/ },
  { label: "public / readers", rx: /\b(readers|audience|public|followers)\b/ },
];

const DELIVERABLES: Array<{ label: string; rx: RegExp }> = [
  { label: "email / letter", rx: /\b(email|letter|reply|message|correspondence)\b/ },
  { label: "one-page sheet", rx: /\b(one[- ]pager|one[- ]page|sheet|rate sheet|pricing sheet)\b/ },
  { label: "step list", rx: /\b(steps|instructions|walkthrough|guide)\b/ },
  { label: "idea list", rx: /\b(ideas|metaphors|imagery|list of|options)\b/ },
  { label: "risk list", rx: /\b(risks|failure points|holes|weaknesses)\b/ },
  { label: "research answer", rx: /\b(standard|statute|citation|authority|quotes)\b/ },
  { label: "system / workflow map", rx: /\b(system|workflow|process|pipeline|sop)\b/ },
  { label: "rewritten text", rx: /\b(paragraph|copy|draft|text|wording)\b/ },
];

// ---------------------------------------------------------------------------
// Mode capability matching — tiered so a mode that NAMES the capability beats a
// mode that merely mentions adjacent words in its metadata.
// ---------------------------------------------------------------------------

const NAME_WEIGHT = 62;
const META_WEIGHT = 30;
const BLOB_WEIGHT = 16;
const SECONDARY_FACTOR = 0.45;
const SUPPRESS_NAME = 55;
const SUPPRESS_META = 26;
const TOPIC_WEIGHT = 5;

function nameOf(m: Mode) {
  return (m.mode || "").trim().toLowerCase();
}
function metaOf(m: Mode) {
  return [m.category, m.subcategory, m.role, m.bestFor].filter(Boolean).join(" ").toLowerCase();
}
function blobOf(m: Mode) {
  return [m.purpose, m.coreObjective, m.corePrinciples, m.attributes, (m.triggers || []).join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export interface IntentModeScore {
  mode: Mode;
  score: number;
  reasons: string[];
  suppressedBy: string[];
  matchedIntents: string[];
}

export interface IntentModelResult {
  intents: Array<{ id: string; label: string; priority: number; class: IntentClass; evidence: string[] }>;
  dominant: IntentDef | null;
  /** dominant operation intent that may claim CORE (skips output_control) */
  coreIntent: IntentDef | null;
  topic: DimensionReading;
  tone: DimensionReading;
  urgency: DimensionReading;
  audience: DimensionReading;
  deliverable: DimensionReading;
  style: string[];
  ranked: IntentModeScore[];
  suppressed: Array<{ mode: string; by: string; penalty: number }>;
}

function readDimension(
  text: string,
  list: Array<{ label: string; rx: RegExp }>,
  fallback: string,
): DimensionReading {
  const hits = list.filter((d) => d.rx.test(text));
  if (!hits.length) return { label: fallback, evidence: [] };
  return { label: hits.map((h) => h.label).join(" + "), evidence: hits.map((h) => h.rx.source) };
}

export function detectIntents(text: string) {
  const found = INTENTS.map((def) => {
    const evidence = has(text, def.patterns);
    const styleHits = def.style ? has(text, def.style) : [];
    return { def, evidence, styleHits, hits: evidence.length };
  }).filter((x) => x.hits > 0);
  // Deterministic order: intent hierarchy first, then evidence count, then id.
  found.sort(
    (a, b) => b.def.priority - a.def.priority || b.hits - a.hits || a.def.id.localeCompare(b.def.id),
  );
  return found;
}

export function runIntentModel(text: string, modes: Mode[]): IntentModelResult {
  const found = detectIntents(text);
  const dominant = found[0]?.def ?? null;
  const coreIntent = found.find((f) => f.def.class === "operation")?.def ?? null;

  const topicHits = TOPICS.filter((t) => t.rx.test(text));
  const suppressedLog: Array<{ mode: string; by: string; penalty: number }> = [];

  const ranked: IntentModeScore[] = modes.map((m) => {
    const name = nameOf(m);
    const meta = metaOf(m);
    const blob = blobOf(m);
    const reasons: string[] = [];
    const suppressedBy: string[] = [];
    const matchedIntents: string[] = [];
    let score = 0;

    for (const f of found) {
      const isDominant = f.def.id === (dominant?.id ?? "");
      const factor = isDominant ? 1 : SECONDARY_FACTOR;
      let gained = 0;
      if (f.def.capabilityName.test(name)) {
        // Capability alternatives are written most-specific-first, so a mode whose
        // name matches an earlier alternative is the narrower specialist.
        const alts = f.def.capabilityName.source.split("|").filter(Boolean);
        const idx = alts.findIndex((a) => new RegExp(a, "i").test(name));
        const specificity = idx >= 0 ? (alts.length - idx) * SPECIFICITY_STEP : 0;
        gained = NAME_WEIGHT + specificity;
        reasons.push(
          `${f.def.id}: name declares capability +${Math.round(gained * factor)} (specificity tier ${idx + 1}/${alts.length})`,
        );
      } else if (f.def.capabilityMeta?.test(meta)) {
        gained = META_WEIGHT;
        reasons.push(`${f.def.id}: category/role declares capability +${Math.round(META_WEIGHT * factor)}`);
      } else if (f.def.capabilityMeta?.test(blob)) {
        gained = BLOB_WEIGHT;
        reasons.push(`${f.def.id}: metadata mentions capability +${Math.round(BLOB_WEIGHT * factor)}`);
      }
      if (gained > 0) {
        score += gained * factor;
        matchedIntents.push(f.def.id);
      }
    }


    // Negative evidence: adjacent capabilities that share the topic but not the
    // requested operation. Applied only when the mode is not itself a match for the
    // intent that suppresses it.
    for (const f of found) {
      if (!f.def.suppress) continue;
      if (matchedIntents.includes(f.def.id)) continue;
      const isDominant = f.def.id === (dominant?.id ?? "");
      const factor = isDominant ? 1 : SECONDARY_FACTOR;
      let pen = 0;
      if (f.def.suppress.test(name)) pen = SUPPRESS_NAME;
      else if (f.def.suppress.test(meta)) pen = SUPPRESS_META;
      if (pen > 0) {
        const applied = Math.round(pen * factor);
        score -= applied;
        suppressedBy.push(`${f.def.id} -${applied}`);
        suppressedLog.push({ mode: m.mode, by: f.def.id, penalty: applied });
      }
    }

    // Topic is a weak tiebreaker only — never enough to beat an operation match.
    for (const t of topicHits) {
      if (t.capability.test(name) || t.capability.test(meta)) {
        score += TOPIC_WEIGHT;
        reasons.push(`topic ${t.label} +${TOPIC_WEIGHT}`);
      }
    }

    return { mode: m, score: Math.round(score), reasons, suppressedBy, matchedIntents };
  });

  // Specialist confidence: when the top mode matched the dominant intent by NAME,
  // adjacent specialists that only matched via metadata lose ground.
  const nameWinner = ranked
    .filter((r) => dominant && r.matchedIntents.includes(dominant.id) && dominant.capabilityName.test(nameOf(r.mode)))
    .sort((a, b) => b.score - a.score || a.mode.id.localeCompare(b.mode.id))[0];
  if (nameWinner) {
    for (const r of ranked) {
      if (r.mode.id === nameWinner.mode.id) continue;
      if (!dominant) break;
      if (r.matchedIntents.includes(dominant.id) && !dominant.capabilityName.test(nameOf(r.mode))) {
        r.score -= 14;
        r.reasons.push(`adjacent specialist demoted (-14): ${nameWinner.mode.mode} names the capability`);
      }
    }
  }

  ranked.sort((a, b) => b.score - a.score || a.mode.id.localeCompare(b.mode.id));

  return {
    intents: found.map((f) => ({
      id: f.def.id,
      label: f.def.label,
      priority: f.def.priority,
      class: f.def.class,
      evidence: [...f.evidence, ...f.styleHits.map((s) => `style:${s}`)],
    })),
    dominant,
    coreIntent,
    topic: topicHits.length
      ? { label: topicHits.map((t) => t.label).join(" + "), evidence: topicHits.map((t) => t.rx.source) }
      : { label: "none detected", evidence: [] },
    tone: readDimension(text, TONES, "unspecified"),
    urgency: readDimension(text, URGENCIES, "no deadline stated"),
    audience: readDimension(text, AUDIENCES, "unspecified"),
    deliverable: readDimension(text, DELIVERABLES, "unspecified"),
    style: found.flatMap((f) => f.styleHits),
    ranked,
    suppressed: suppressedLog,
  };
}

/** Bonus map fed into the legacy semantic ranker so LAYERS respect intent too. */
export function intentBonusMap(result: IntentModelResult): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of result.ranked) map.set(r.mode.id, r.score);
  return map;
}
