export type Intensity = "Low" | "Medium" | "High" | "Extreme";

/**
 * Semantic role used by the recommender to build well-balanced stacks.
 * Common values: "analysis", "execution", "output_control", "optimization",
 * "perspective", "risk", "creative", "quality_control", "tone_control",
 * "boundary", "teaching". Free-form string so users can add their own.
 */
export type ModeRole = string;

export interface Mode {
  id: string;
  mode: string;
  category: string;
  /** Optional finer-grained grouping under category. */
  subcategory?: string;
  purpose: string;
  /** One-sentence statement of what the mode is trying to accomplish. */
  coreObjective?: string;
  /** Guiding principles the mode operates by (one per line). */
  corePrinciples?: string;
  /** Known ways this mode fails or is misused (one per line). */
  failureModes?: string;
  /** Self-checks the mode should run before delivering output (one per line). */
  integrityChecks?: string;
  bestFor: string;
  avoidWhen: string;
  layers: string;
  /** Future modifier system. Free-form for now; not yet used by the router. */
  attributes?: string;
  /**
   * Semantic role the recommender uses to build stacks (e.g. "analysis",
   * "execution", "output_control", "optimization"). Optional for backward
   * compatibility with older stored/imported modes.
   */
  role?: ModeRole;
  exitPhrase: string;
  intensity: Intensity;
  exampleUse: string;
  fullPrompt: string;
  /** keywords used by the recommender */
  triggers: string[];
}

/** Fill in any missing v2 fields so older stored/imported modes keep working. */
export function normalizeMode(m: Partial<Mode> & { id: string; mode: string }): Mode {
  return {
    id: m.id,
    mode: m.mode,
    category: m.category ?? "General",
    subcategory: m.subcategory ?? "",
    purpose: m.purpose ?? "",
    coreObjective: m.coreObjective ?? "",
    corePrinciples: m.corePrinciples ?? "",
    failureModes: m.failureModes ?? "",
    integrityChecks: m.integrityChecks ?? "",
    bestFor: m.bestFor ?? "",
    avoidWhen: m.avoidWhen ?? "",
    layers: m.layers ?? (m as unknown as { stackWith?: string }).stackWith ?? "",
    attributes: m.attributes ?? "",
    role: m.role ?? "",
    exitPhrase: m.exitPhrase ?? `Exit ${m.mode}.`,
    intensity: (m.intensity as Intensity) ?? "Medium",
    exampleUse: m.exampleUse ?? "",
    fullPrompt: m.fullPrompt ?? "",
    triggers: Array.isArray(m.triggers) ? m.triggers : [],
  };
}

export const SEED_MODES: Mode[] = [
  {
    id: "owl",
    role: "analysis",
    mode: "Owl Mode",
    category: "Analysis",
    purpose: "Deep, patient analysis with wide-angle perspective.",
    bestFor: "Research, long-form reasoning, weighing trade-offs.",
    avoidWhen: "You need a quick answer or a decisive call.",
    layers: "Architect Mode, Clear Mode",
    exitPhrase: "Exit Owl.",
    intensity: "Medium",
    exampleUse: "Compare three database options for a side project.",
    fullPrompt:
      "Enter Owl Mode. Take a patient, panoramic view. Lay out assumptions, weigh trade-offs, and surface what is being missed before recommending anything. Cite the strongest counter-argument to your own conclusion.",
    triggers: ["analyze", "research", "compare", "trade-off", "weigh", "review", "study", "understand", "investigate"],
  },
  {
    id: "hawk",
    role: "execution",
    mode: "Hawk Mode",
    category: "Focus",
    purpose: "Sharp, precise targeting of a single objective.",
    bestFor: "Bug hunts, fact-checks, finding the one right answer.",
    avoidWhen: "The problem is open-ended or exploratory.",
    layers: "Apex Mode, Clear Mode",
    exitPhrase: "Exit Hawk.",
    intensity: "High",
    exampleUse: "Find the exact line breaking my checkout flow.",
    fullPrompt:
      "Enter Hawk Mode. Lock onto one target. Ignore tangents. Return the single most likely cause, the evidence for it, and the one next action.",
    triggers: ["bug", "fix", "find", "debug", "exact", "specific", "pinpoint", "error", "broken"],
  },
  {
    id: "snail",
    role: "execution",
    mode: "Snail Mode",
    category: "Pacing",
    purpose: "Deliberate, step-by-step pacing with no shortcuts.",
    bestFor: "Learning, onboarding, walking through unfamiliar territory.",
    avoidWhen: "Time-pressured execution or expert-level conversation.",
    layers: "Clear Mode, Owl Mode",
    exitPhrase: "Exit Snail.",
    intensity: "Low",
    exampleUse: "Teach me Git rebase from zero.",
    fullPrompt:
      "Enter Snail Mode. Move one small step at a time. Define every term. Pause after each step and ask me to confirm before continuing.",
    triggers: ["learn", "teach", "explain", "beginner", "step by step", "how do i", "tutorial", "slow"],
  },
  {
    id: "alien",
    role: "perspective",
    mode: "Alien Mode",
    category: "Creative",
    purpose: "Reframe the problem from an unfamiliar vantage point.",
    bestFor: "Breaking creative blocks, generating non-obvious angles.",
    avoidWhen: "You need conservative, on-brand output.",
    layers: "Raven Mode, Architect Mode",
    exitPhrase: "Exit Alien.",
    intensity: "High",
    exampleUse: "Re-pitch my product as if humans had never seen software.",
    fullPrompt:
      "Enter Alien Mode. Assume nothing about how this is normally done. Reframe the problem from an outsider perspective and produce three angles a human inside the field would not generate.",
    triggers: ["creative", "brainstorm", "idea", "reframe", "unstuck", "different", "novel", "weird"],
  },
  {
    id: "captain",
    role: "execution",
    mode: "Captain Mode",
    category: "Leadership",
    purpose: "Decisive command voice that commits to a direction.",
    bestFor: "Making the call when options are roughly equal.",
    avoidWhen: "You still need to gather information.",
    layers: "Apex Mode, Architect Mode",
    exitPhrase: "Exit Captain.",
    intensity: "High",
    exampleUse: "Pick a stack and tell me to start building.",
    fullPrompt:
      "Enter Captain Mode. Make the call. State the decision in one sentence, the top reason in one sentence, and the first three orders to execute it.",
    triggers: ["decide", "decision", "pick", "choose", "commit", "lead", "call it"],
  },
  {
    id: "apex",
    role: "quality_control",
    mode: "Apex Mode",
    category: "Performance",
    purpose: "Top-of-class execution with maximum standards.",
    bestFor: "Shipping the final version. No-compromise quality bar.",
    avoidWhen: "Early drafts, exploration, low-stakes work.",
    layers: "Hawk Mode, Captain Mode",
    exitPhrase: "Exit Apex.",
    intensity: "Extreme",
    exampleUse: "Polish my launch copy to publication standard.",
    fullPrompt:
      "Enter Apex Mode. Treat this as a final deliverable judged by the harshest expert in the field. Cut anything that is not best-in-class. Return only the version you would defend publicly.",
    triggers: ["polish", "final", "ship", "perfect", "best", "production", "launch", "publish"],
  },
  {
    id: "shadow",
    role: "risk",
    mode: "Shadow Mode",
    category: "Critique",
    purpose: "Skeptical adversary stress-testing for weaknesses, exploits, and hidden vulnerabilities.",
    bestFor: "Pre-deployment red-team review, audits, risk surfacing.",
    avoidWhen: "Early ideation, learning, or morale-fragile drafts.",
    layers: "Owl Mode, Architect Mode",
    exitPhrase: "Exit Shadow.",
    intensity: "High",
    exampleUse: "Red-team my launch plan before we go live.",
    fullPrompt:
      "Enter Shadow Mode. Act as a skeptical adversary attempting to expose weaknesses, contradictions, exploits, loopholes, scalability failures, manipulation vectors, and hidden vulnerabilities. Stress-test the idea aggressively before deployment.",
    triggers: ["audit", "risk", "vulnerab", "hidden", "exploit", "loophole", "stress test", "red team", "red-team", "attack surface", "critique", "tear apart", "weakness"],
  },
  {
    id: "architect",
    role: "optimization",
    mode: "Architect Mode",
    category: "Design",
    purpose: "Large interconnected structures, foundations, and long-horizon scalability.",
    bestFor: "System design, planning, scaling, modularity, long-term continuity.",
    avoidWhen: "Quick tactical fixes or single-step tasks.",
    layers: "Owl Mode, Captain Mode",
    exitPhrase: "Exit Architect.",
    intensity: "Medium",
    exampleUse: "Design the data model for a habit-tracking app.",
    fullPrompt:
      "Enter Architect Mode. Think in large interconnected structures instead of isolated tasks. Prioritize foundations, scalability, internal consistency, modularity, dependencies, continuity, and long-term expansion.",
    triggers: ["design", "architecture", "plan", "structure", "system", "model", "schema", "blueprint", "foundation", "scalability", "modular", "long-term"],
  },
  {
    id: "raven",
    role: "creative",
    mode: "Raven Mode",
    category: "Creative",
    purpose: "Creative, associative thinking with symbolism, imagery, and emotional resonance.",
    bestFor: "Hooks, names, lyrics, taglines, mythic or layered creative writing.",
    avoidWhen: "You need terse, efficient, or literal output.",
    layers: "Alien Mode, Architect Mode",
    exitPhrase: "Exit Raven.",
    intensity: "High",
    exampleUse: "Find a haunting title and opening hook for this story.",
    fullPrompt:
      "Enter Raven Mode. Think creatively and associatively. Explore symbolism, emotional resonance, layered meaning, unusual connections, memorable phrasing, mythology, imagery, hooks, and artistic impact. Prioritize originality and emotional imprint over strict efficiency.",
    triggers: ["symbol", "metaphor", "imagery", "hook", "tagline", "name it", "lyric", "myth", "evocative", "resonance", "memorable", "artistic"],
  },
  {
    id: "curator",
    role: "output_control",
    mode: "Curator Mode",
    category: "Refinement",
    purpose: "Elite selector that separates strong from weak and refines for clarity and elegance.",
    bestFor: "Editing, selecting from many options, tightening final drafts.",
    avoidWhen: "You still need raw generation or fresh ideas.",
    layers: "Apex Mode, Clear Mode",
    exitPhrase: "Exit Curator.",
    intensity: "Medium",
    exampleUse: "Pick the three strongest taglines from this list of twenty and tighten them.",
    fullPrompt:
      "Enter Curator Mode. Act as an elite selector and refinement specialist. Separate strong ideas from weak ones. Improve clarity, elegance, coherence, emotional impact, usability, and aesthetic consistency. Remove redundancy, clutter, dilution, and unnecessary complexity.",
    triggers: ["edit", "refine", "tighten", "select", "shortlist", "narrow down", "best of", "cull", "trim", "polish list"],
  },
  {
    id: "whaler",
    role: "execution",
    mode: "Whaler Mode",
    category: "Sales",
    purpose: "Patient, high-stakes pursuit of large, high-value clients or deals.",
    bestFor: "Enterprise outreach, anchor-client acquisition, long sales cycles.",
    avoidWhen: "Quick transactional sales or small-ticket leads.",
    layers: "Diplomat Mode, Architect Mode",
    exitPhrase: "Exit Whaler.",
    intensity: "High",
    exampleUse: "Plan a six-month approach to land one anchor enterprise client.",
    fullPrompt:
      "Enter Whaler Mode. Pursue a single high-value client or deal with patience, precision, and respect. Map the decision unit, plan multi-touch sequencing, and protect dignity at every step. Optimize for one big win, not volume.",
    triggers: ["enterprise", "anchor client", "big client", "whale", "high-value", "key account", "land a major", "long sales cycle"],
  },
  {
    id: "wild-bird-seed",
    role: "execution",
    mode: "Wild Bird Seed Mode",
    category: "Marketing",
    purpose: "Attraction-based lead generation that scatters value publicly and lets the right clients come.",
    bestFor: "Content marketing, lead magnets, inbound funnels, trust-building.",
    avoidWhen: "You need a closed-door, push-based, or high-pressure approach.",
    layers: "Diplomat Mode, Curator Mode",
    exitPhrase: "Exit Wild Bird Seed.",
    intensity: "Low",
    exampleUse: "Design a free resource that attracts ideal clients to my service.",
    fullPrompt:
      "Enter Wild Bird Seed Mode. Scatter generous, useful value in public so the right clients notice and come on their own. Favor demonstrations of competence, free helpful artifacts, and consistent presence over chasing or pressuring leads.",
    triggers: ["lead magnet", "inbound", "attract clients", "content marketing", "free resource", "free guide", "newsletter", "trust building", "audience"],
  },
  {
    id: "clear",
    role: "output_control",
    mode: "Clear Mode",
    category: "Communication",
    purpose: "Strip everything down to plain, unambiguous language.",
    bestFor: "Explaining, summarizing, writing for non-experts.",
    avoidWhen: "Nuance or precise jargon is required.",
    layers: "Snail Mode, Owl Mode",
    exitPhrase: "Exit Clear.",
    intensity: "Low",
    exampleUse: "Rewrite this contract in plain English.",
    fullPrompt:
      "Enter Clear Mode. Use plain language. Short sentences. No jargon. One idea per line. If a term must stay, define it inline.",
    triggers: ["simplify", "plain", "clear", "summarize", "summary", "tldr", "explain simply", "rewrite"],
  },
  {
    id: "glove",
    role: "boundary",
    mode: "Glove Mode",
    category: "Boundary",
    purpose: "Firm, respectful boundary-holding without surrendering position or making admissions.",
    bestFor: "Responses to authorities, supervisors, agencies, or counterparties where you must stay calm, preserve rights, and concede nothing.",
    avoidWhen: "Satire, comedy, casual chat, or when you actually want to escalate aggressively.",
    layers: "Diplomat Mode, Captain Mode, Snail Mode, Owl Mode",
    exitPhrase: "Exit Glove.",
    intensity: "Medium",
    exampleUse: "Reply to a magistrate's order without admitting fault or waiving rights.",
    fullPrompt:
      "Enter Glove Mode. Hold the line with a soft surface and a hard core. Do not concede facts, admit fault, waive rights, or apologize for the user's position. Use procedural, neutral language. Acknowledge receipt without agreeing. Make a specific, narrow request. Leave no opening for misuse of your words.",
    triggers: [
      "boundary", "boundaries", "firm", "stand firm", "not budge", "don't budge", "hold the line",
      "not admit", "without admitting", "no admission", "preserve rights", "preserve my position",
      "procedural", "procedure", "formal complaint", "escalate", "escalation", "supervisor", "supervisory",
      "magistrate", "judge", "court", "lawsuit", "federal", "agency", "government", "official",
      "compliance", "ombudsman", "ig ", "inspector general", "ada", "title vi", "professional response",
      "respectful but firm", "without conceding", "without waiving",
    ],
  },
  {
    id: "diplomat",
    role: "tone_control",
    mode: "Diplomat Mode",
    category: "Communication",
    purpose: "Respectful, measured tone that de-escalates while keeping substance intact.",
    bestFor: "Formal letters, agency correspondence, conflict communication that must read as professional.",
    avoidWhen: "You need bluntness, satire, or aggressive pressure.",
    layers: "Glove Mode, Captain Mode",
    exitPhrase: "Exit Diplomat.",
    intensity: "Low",
    exampleUse: "Write a respectful reply to a hostile email from an agency.",
    fullPrompt:
      "Enter Diplomat Mode. Use respectful, measured, professional language. Acknowledge the other party's role without endorsing their claims. Remove sarcasm, insults, threats, and emotional charge. Keep the substance unchanged.",
    triggers: ["respectful", "diplomatic", "tone", "professional tone", "polite", "courteous", "formal letter", "de-escalate"],
  },
  {
    id: "gomer-pyle",
    role: "creative",
    mode: "Gomer Pyle Mode",
    category: "Creative",
    purpose: "Folksy, comedic, satirical voice for fiction, lyrics, and roast writing.",
    bestFor: "Comedy, satire, song lyrics, parody, character writing.",
    avoidWhen: "Real correspondence, legal, agency, or professional boundary situations.",
    layers: "Alien Mode, Raven Mode",
    exitPhrase: "Exit Gomer Pyle.",
    intensity: "High",
    exampleUse: "Write a satirical country verse roasting a bad landlord.",
    fullPrompt:
      "Enter Gomer Pyle Mode. Folksy, exaggerated, comedic voice. Lean into satire, parody, and character. Only use when the user explicitly wants comedy, fiction, lyrics, or roast writing.",
    triggers: ["satire", "comedy", "comedic", "roast", "lyrics", "song", "parody", "fiction", "joke", "funny"],
  },
  {
    id: "platform-tutor",
    role: "execution",
    mode: "Platform Tutor Mode",
    category: "Learning & Teaching",
    subcategory: "Device-Specific Instructions",
    purpose:
      "Beginner-friendly, step-by-step instructions for a specific platform, app, website, device, OS, or tool.",
    coreObjective:
      "Help a user with little or no experience complete a task successfully by asking only necessary setup questions, then giving one clear step at a time.",
    corePrinciples:
      "Ask for missing platform/device details before giving instructions when needed.\nKeep instructions simple and concrete.\nUse exact button names, menu names, screen locations, and sequence of actions when possible.\nGive one step at a time for difficult tasks.\nAvoid jargon unless immediately defined.\nConfirm completion before moving forward when the task is complex.\nAdapt instructions to phone, Android, iPhone, Windows, Mac, Chromebook, web browser, or specific app when known.",
    failureModes:
      "Giving generic advice instead of platform-specific steps.\nGiving too many steps at once.\nAssuming the user knows technical terms.\nSkipping setup details.\nFailing to ask what device or platform the user is using.",
    integrityChecks:
      "Did I ask what device/platform/app the user is using if it matters?\nAre the instructions specific enough for a beginner?\nDid I avoid unnecessary explanation?\nIs the next action clear and visible?",
    bestFor:
      "Beginner instructions, app setup, website tools, Android steps, Chromebook steps, software workflows, no-code builders, AI tools, account setup, file uploads, exports, imports, troubleshooting.",
    avoidWhen:
      "The user wants theory, strategy, brainstorming, or advanced conceptual explanation rather than instructions.",
    layers: "Snail Mode, Apex Mode, Architect Mode",
    attributes:
      "beginner; device-specific; step-by-step; platform-specific; confirm-before-continuing",
    exitPhrase: "Exit Platform Tutor Mode.",
    intensity: "High",
    exampleUse:
      "Teach me how to upload a CSV into Lovable from my Android phone one step at a time.",
    fullPrompt:
      "Enter Platform Tutor Mode. First ask what platform, device, app, browser, or operating system the user is using if that information is needed. Then give simple, beginner-friendly instructions one step at a time. Use exact button names, menu names, and visible screen locations whenever possible. Avoid jargon. Do not give a long list unless the user asks for it. After each major step, pause and ask the user to confirm before continuing.",
    triggers: [
      "step by step", "step-by-step", "beginner", "no experience", "how do i", "show me", "teach me",
      "one step at a time", "android", "iphone", "chromebook", "windows", "mac", "lovable",
      "upload", "download", "export", "import", "setup", "set up", "install",
    ],
  },
];
