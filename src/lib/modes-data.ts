export type Intensity = "Low" | "Medium" | "High" | "Extreme";

export interface Mode {
  id: string;
  mode: string;
  category: string;
  purpose: string;
  bestFor: string;
  avoidWhen: string;
  stackWith: string;
  exitPhrase: string;
  intensity: Intensity;
  exampleUse: string;
  fullPrompt: string;
  /** keywords used by the recommender */
  triggers: string[];
}

export const SEED_MODES: Mode[] = [
  {
    id: "owl",
    mode: "Owl Mode",
    category: "Analysis",
    purpose: "Deep, patient analysis with wide-angle perspective.",
    bestFor: "Research, long-form reasoning, weighing trade-offs.",
    avoidWhen: "You need a quick answer or a decisive call.",
    stackWith: "Architect Mode, Clear Mode",
    exitPhrase: "Exit Owl.",
    intensity: "Medium",
    exampleUse: "Compare three database options for a side project.",
    fullPrompt:
      "Enter Owl Mode. Take a patient, panoramic view. Lay out assumptions, weigh trade-offs, and surface what is being missed before recommending anything. Cite the strongest counter-argument to your own conclusion.",
    triggers: ["analyze", "research", "compare", "trade-off", "weigh", "review", "study", "understand", "investigate"],
  },
  {
    id: "hawk",
    mode: "Hawk Mode",
    category: "Focus",
    purpose: "Sharp, precise targeting of a single objective.",
    bestFor: "Bug hunts, fact-checks, finding the one right answer.",
    avoidWhen: "The problem is open-ended or exploratory.",
    stackWith: "Apex Mode, Clear Mode",
    exitPhrase: "Exit Hawk.",
    intensity: "High",
    exampleUse: "Find the exact line breaking my checkout flow.",
    fullPrompt:
      "Enter Hawk Mode. Lock onto one target. Ignore tangents. Return the single most likely cause, the evidence for it, and the one next action.",
    triggers: ["bug", "fix", "find", "debug", "exact", "specific", "pinpoint", "error", "broken"],
  },
  {
    id: "snail",
    mode: "Snail Mode",
    category: "Pacing",
    purpose: "Deliberate, step-by-step pacing with no shortcuts.",
    bestFor: "Learning, onboarding, walking through unfamiliar territory.",
    avoidWhen: "Time-pressured execution or expert-level conversation.",
    stackWith: "Clear Mode, Owl Mode",
    exitPhrase: "Exit Snail.",
    intensity: "Low",
    exampleUse: "Teach me Git rebase from zero.",
    fullPrompt:
      "Enter Snail Mode. Move one small step at a time. Define every term. Pause after each step and ask me to confirm before continuing.",
    triggers: ["learn", "teach", "explain", "beginner", "step by step", "how do i", "tutorial", "slow"],
  },
  {
    id: "alien",
    mode: "Alien Mode",
    category: "Creative",
    purpose: "Reframe the problem from an unfamiliar vantage point.",
    bestFor: "Breaking creative blocks, generating non-obvious angles.",
    avoidWhen: "You need conservative, on-brand output.",
    stackWith: "Raven Mode, Architect Mode",
    exitPhrase: "Exit Alien.",
    intensity: "High",
    exampleUse: "Re-pitch my product as if humans had never seen software.",
    fullPrompt:
      "Enter Alien Mode. Assume nothing about how this is normally done. Reframe the problem from an outsider perspective and produce three angles a human inside the field would not generate.",
    triggers: ["creative", "brainstorm", "idea", "reframe", "unstuck", "different", "novel", "weird"],
  },
  {
    id: "captain",
    mode: "Captain Mode",
    category: "Leadership",
    purpose: "Decisive command voice that commits to a direction.",
    bestFor: "Making the call when options are roughly equal.",
    avoidWhen: "You still need to gather information.",
    stackWith: "Apex Mode, Architect Mode",
    exitPhrase: "Exit Captain.",
    intensity: "High",
    exampleUse: "Pick a stack and tell me to start building.",
    fullPrompt:
      "Enter Captain Mode. Make the call. State the decision in one sentence, the top reason in one sentence, and the first three orders to execute it.",
    triggers: ["decide", "decision", "pick", "choose", "commit", "lead", "call it"],
  },
  {
    id: "apex",
    mode: "Apex Mode",
    category: "Performance",
    purpose: "Top-of-class execution with maximum standards.",
    bestFor: "Shipping the final version. No-compromise quality bar.",
    avoidWhen: "Early drafts, exploration, low-stakes work.",
    stackWith: "Hawk Mode, Captain Mode",
    exitPhrase: "Exit Apex.",
    intensity: "Extreme",
    exampleUse: "Polish my launch copy to publication standard.",
    fullPrompt:
      "Enter Apex Mode. Treat this as a final deliverable judged by the harshest expert in the field. Cut anything that is not best-in-class. Return only the version you would defend publicly.",
    triggers: ["polish", "final", "ship", "perfect", "best", "production", "launch", "publish"],
  },
  {
    id: "shadow",
    mode: "Shadow Mode",
    category: "Stealth",
    purpose: "Quiet observation and pattern collection without acting.",
    bestFor: "Audits, recon, surfacing hidden risks.",
    avoidWhen: "You need momentum or output now.",
    stackWith: "Owl Mode, Raven Mode",
    exitPhrase: "Exit Shadow.",
    intensity: "Low",
    exampleUse: "Audit my codebase for silent failure points.",
    fullPrompt:
      "Enter Shadow Mode. Do not propose action. Observe. Catalog patterns, risks, and anomalies you notice. Stay quiet on opinions until I ask.",
    triggers: ["audit", "review", "risk", "observe", "spot", "scan", "vulnerab", "hidden"],
  },
  {
    id: "architect",
    mode: "Architect Mode",
    category: "Design",
    purpose: "Structural thinking, systems, and long-horizon plans.",
    bestFor: "Designing systems, drafting plans, defining structure.",
    avoidWhen: "Quick tactical fixes.",
    stackWith: "Owl Mode, Captain Mode",
    exitPhrase: "Exit Architect.",
    intensity: "Medium",
    exampleUse: "Design the data model for a habit-tracking app.",
    fullPrompt:
      "Enter Architect Mode. Think in systems. Lay out components, interfaces, and constraints. Show the structure before any implementation detail.",
    triggers: ["design", "architecture", "plan", "structure", "system", "model", "schema", "blueprint"],
  },
  {
    id: "raven",
    mode: "Raven Mode",
    category: "Critique",
    purpose: "Sharp, contrarian critique that hunts weak spots.",
    bestFor: "Stress-testing arguments, plans, or drafts.",
    avoidWhen: "Morale is fragile or work is still embryonic.",
    stackWith: "Shadow Mode, Apex Mode",
    exitPhrase: "Exit Raven.",
    intensity: "High",
    exampleUse: "Tear apart my pitch deck like a skeptical investor.",
    fullPrompt:
      "Enter Raven Mode. Be sharp, contrarian, and unsentimental. Attack the weakest points first. Quote the exact line you are critiquing.",
    triggers: ["critique", "criticize", "stress test", "attack", "weakness", "feedback", "tear apart", "challenge"],
  },
  {
    id: "clear",
    mode: "Clear Mode",
    category: "Communication",
    purpose: "Strip everything down to plain, unambiguous language.",
    bestFor: "Explaining, summarizing, writing for non-experts.",
    avoidWhen: "Nuance or precise jargon is required.",
    stackWith: "Snail Mode, Owl Mode",
    exitPhrase: "Exit Clear.",
    intensity: "Low",
    exampleUse: "Rewrite this contract in plain English.",
    fullPrompt:
      "Enter Clear Mode. Use plain language. Short sentences. No jargon. One idea per line. If a term must stay, define it inline.",
    triggers: ["simplify", "plain", "clear", "summarize", "summary", "tldr", "explain simply", "rewrite"],
  },
  {
    id: "glove",
    mode: "Glove Mode",
    category: "Boundary",
    purpose: "Firm, respectful boundary-holding without surrendering position or making admissions.",
    bestFor: "Responses to authorities, supervisors, agencies, or counterparties where you must stay calm, preserve rights, and concede nothing.",
    avoidWhen: "Satire, comedy, casual chat, or when you actually want to escalate aggressively.",
    stackWith: "Diplomat Mode, Captain Mode, Snail Mode, Owl Mode",
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
    mode: "Diplomat Mode",
    category: "Communication",
    purpose: "Respectful, measured tone that de-escalates while keeping substance intact.",
    bestFor: "Formal letters, agency correspondence, conflict communication that must read as professional.",
    avoidWhen: "You need bluntness, satire, or aggressive pressure.",
    stackWith: "Glove Mode, Captain Mode",
    exitPhrase: "Exit Diplomat.",
    intensity: "Low",
    exampleUse: "Write a respectful reply to a hostile email from an agency.",
    fullPrompt:
      "Enter Diplomat Mode. Use respectful, measured, professional language. Acknowledge the other party's role without endorsing their claims. Remove sarcasm, insults, threats, and emotional charge. Keep the substance unchanged.",
    triggers: ["respectful", "diplomatic", "tone", "professional tone", "polite", "courteous", "formal letter", "de-escalate"],
  },
  {
    id: "gomer-pyle",
    mode: "Gomer Pyle Mode",
    category: "Creative",
    purpose: "Folksy, comedic, satirical voice for fiction, lyrics, and roast writing.",
    bestFor: "Comedy, satire, song lyrics, parody, character writing.",
    avoidWhen: "Real correspondence, legal, agency, or professional boundary situations.",
    stackWith: "Alien Mode, Raven Mode",
    exitPhrase: "Exit Gomer Pyle.",
    intensity: "High",
    exampleUse: "Write a satirical country verse roasting a bad landlord.",
    fullPrompt:
      "Enter Gomer Pyle Mode. Folksy, exaggerated, comedic voice. Lean into satire, parody, and character. Only use when the user explicitly wants comedy, fiction, lyrics, or roast writing.",
    triggers: ["satire", "comedy", "comedic", "roast", "lyrics", "song", "parody", "fiction", "joke", "funny"],
  },
];
