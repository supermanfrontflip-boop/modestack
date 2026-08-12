import { test } from "vitest";
import { recommend } from "@/lib/recommend";
import { BASELINE_MODES } from "@/lib/mode-library";
import bench from "@/lib/benchmarks.json";
test("bench", () => {
  console.log("count", BASELINE_MODES.length,
    "roles", BASELINE_MODES.filter(m=>m.role).length,
    "dupIds", BASELINE_MODES.length-new Set(BASELINE_MODES.map(m=>m.id)).size,
    "dupNames", BASELINE_MODES.length-new Set(BASELINE_MODES.map(m=>m.mode)).size);
  let pass=0;
  for (const c of (bench as any).cases) {
    const r = recommend(c.situation, BASELINE_MODES as any);
    const core = r?.primary.mode ?? "-";
    const layers = r?.supporting.map((m:any)=>m.mode) ?? [];
    const ok = core===c.expectedCore && c.expectedLayers.every((e:string)=>layers.includes(e));
    if (ok) pass++;
    console.log(`${c.id} ${ok?"PASS":"FAIL"} | expCORE=${c.expectedCore} actCORE=${core} | expLAYERS=[${c.expectedLayers}] actLAYERS=[${layers}]`);
  }
  console.log("TOTAL", pass, "/", (bench as any).cases.length);
});
