/**
 * Headless regression runner for the ModeStack recommender.
 *
 *   bun scripts/bench.ts                     # golden 8-case suite
 *   bun scripts/bench.ts expanded            # generalization suite
 *   bun scripts/bench.ts all                 # both
 *   bun scripts/bench.ts all 3               # both, 3 consecutive runs (determinism)
 *
 * layerMode semantics per case:
 *   (omitted) -> every listed layer is REQUIRED
 *   "any"     -> at least one complementary layer expected
 *   "multi"   -> at least two distinct-function layers expected
 *   "none"    -> no layer expected
 */
import { BASELINE_MODES, SCHEMA_VERSION } from "../src/lib/mode-library";
import { recommend } from "../src/lib/recommend";
import golden from "../src/lib/benchmarks.json";
import expanded from "../src/lib/benchmarks-expanded.json";

interface Case {
  id: string;
  name: string;
  situation: string;
  expectedCore: string;
  expectedLayers: string[];
  layerMode?: "any" | "multi" | "none";
}

function runSuite(label: string, cases: Case[]) {
  let pass = 0;
  const lines: string[] = [];
  const signature: string[] = [];
  for (const c of cases) {
    const r = recommend(c.situation, BASELINE_MODES);
    const core = r?.primary.mode ?? "(none)";
    const layers = (r?.supporting ?? []).map((m) => m.mode);
    let ok = core === c.expectedCore;
    if (ok) {
      if (c.layerMode === "any") ok = layers.length >= 1;
      else if (c.layerMode === "multi") ok = layers.length >= 2;
      else if (c.layerMode === "none") ok = layers.length === 0;
      else ok = c.expectedLayers.every((e) => layers.includes(e));
    }
    if (ok) pass++;
    signature.push(`${c.id}:${core}|${layers.join(">")}`);
    lines.push(
      `${ok ? "PASS" : "FAIL"} | ${c.id} | ${c.name} | expCORE ${c.expectedCore} | actCORE ${core} | expLAYERS [${c.expectedLayers.join(", ")}]${c.layerMode ? ` (${c.layerMode})` : " (required)"} | actLAYERS [${layers.join(", ")}]`,
    );
  }
  console.log(`\n### ${label}`);
  console.log(lines.join("\n"));
  console.log(`${label}: ${pass}/${cases.length} passing`);
  return { pass, total: cases.length, signature: signature.join("\n") };
}

const which = process.argv[2] ?? "golden";
const runs = Number(process.argv[3] ?? 1);
const suites: Array<[string, Case[]]> = [];
if (which === "golden" || which === "all") suites.push(["GOLDEN (8)", golden.cases as Case[]]);
if (which === "expanded" || which === "all")
  suites.push(["EXPANDED", expanded.cases as Case[]]);

const signatures: string[] = [];
for (let i = 0; i < runs; i++) {
  console.log(`\n===== RUN ${i + 1} =====`);
  const sigs = suites.map(([label, cases]) => runSuite(label, cases).signature);
  signatures.push(sigs.join("\n"));
}

console.log(
  `\nlibrary: count=${BASELINE_MODES.length} schema=${SCHEMA_VERSION} roles=${
    BASELINE_MODES.filter((m) => (m.role ?? "").trim()).length
  } dupIds=${BASELINE_MODES.length - new Set(BASELINE_MODES.map((m) => m.id)).size} dupNames=${
    BASELINE_MODES.length - new Set(BASELINE_MODES.map((m) => m.mode)).size
  }`,
);
if (runs > 1) {
  const identical = signatures.every((s) => s === signatures[0]);
  console.log(`determinism across ${runs} runs: ${identical ? "IDENTICAL" : "DIVERGENT"}`);
}
