import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle, FlaskConical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModes } from "@/lib/vault-store";
import { recommend } from "@/lib/recommend";
import benchmarks from "@/lib/benchmarks.json";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Regression Tests — ModeStack" },
      {
        name: "description",
        content:
          "Run ModeStack's benchmark library against the live recommender and compare expected CORE and LAYERS with actual results.",
      },
      { property: "og:title", content: "Regression Tests — ModeStack" },
      {
        property: "og:description",
        content:
          "Run ModeStack's benchmark library against the live recommender and compare expected CORE and LAYERS with actual results.",
      },
    ],
  }),
  component: TestsPage,
});

interface BenchCase {
  id: string;
  name: string;
  situation: string;
  expectedCore: string;
  expectedLayers: string[];
}

interface Result {
  bench: BenchCase;
  actualCore: string;
  actualLayers: string[];
  corePass: boolean;
  layersPass: boolean;
  pass: boolean;
}

const CASES = (benchmarks as { cases: BenchCase[] }).cases;

function norm(s: string) {
  return s.trim().toLowerCase();
}

function TestsPage() {
  const { modes, hydrated } = useModes();
  const [results, setResults] = useState<Result[] | null>(null);
  const [ranWith, setRanWith] = useState<number | null>(null);

  const summary = useMemo(() => {
    if (!results) return null;
    const passed = results.filter((r) => r.pass).length;
    return { passed, total: results.length };
  }, [results]);


  const runAll = () => {
    const next: Result[] = CASES.map((bench) => {
      const rec = recommend(bench.situation, modes);
      const actualCore = rec?.primary.mode ?? "—";
      const actualLayers = rec?.supporting.map((m) => m.mode) ?? [];
      const corePass = norm(actualCore) === norm(bench.expectedCore);
      const layersPass = bench.expectedLayers.every((exp) =>
        actualLayers.some((a) => norm(a) === norm(exp)),
      );
      return {
        bench,
        actualCore,
        actualLayers,
        corePass,
        layersPass,
        pass: corePass && layersPass,
      };
    });
    setResults(next);
  };

  return (
    <div className="space-y-5">
      <section className="hud-corner border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h1 className="mono text-sm tracking-[0.2em] text-primary glow-text">
            REGRESSION TESTS
          </h1>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Benchmark prompts with expected CORE and LAYERS, evaluated against the live
          recommender. Cases live in <span className="mono">src/lib/benchmarks.json</span>{" "}
          and can grow without code changes.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            onClick={runAll}
            disabled={!hydrated}
            className="mono tracking-wider"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="ml-1.5">RUN ALL TESTS</span>
          </Button>
          <span className="mono text-[11px] text-muted-foreground">
            {hydrated ? `${CASES.length} CASES / ${modes.length} MODES` : "LOADING VAULT…"}
          </span>
        </div>
        {summary && (
          <div
            className={`mt-3 mono text-xs ${
              summary.passed === summary.total ? "text-primary" : "text-destructive"
            }`}
          >
            {summary.passed} / {summary.total} PASSING
          </div>
        )}
      </section>

      {results?.map((r) => (
        <section
          key={r.bench.id}
          className={`hud-corner border bg-card p-4 ${
            r.pass ? "border-border" : "border-destructive/60"
          }`}
        >
          <div className="flex items-start gap-2">
            {r.pass ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            )}
            <div className="min-w-0">
              <div className="mono text-[10px] tracking-widest text-muted-foreground">
                {r.bench.id.toUpperCase()}
              </div>
              <div className="text-sm font-semibold text-foreground">{r.bench.name}</div>
            </div>
          </div>

          <p className="mt-2 text-xs italic text-muted-foreground">"{r.bench.situation}"</p>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="border border-border p-2">
              <div className="mono text-[10px] tracking-widest text-muted-foreground">
                EXPECTED
              </div>
              <div className="mt-1">
                <span className="mono text-[10px] text-muted-foreground">CORE </span>
                <span className={r.corePass ? "text-foreground" : "text-destructive"}>
                  {r.bench.expectedCore}
                </span>
              </div>
              <div className="mt-1">
                <span className="mono text-[10px] text-muted-foreground">LAYERS </span>
                <span className={r.layersPass ? "text-foreground" : "text-destructive"}>
                  {r.bench.expectedLayers.length ? r.bench.expectedLayers.join(", ") : "any"}
                </span>
              </div>
            </div>
            <div className="border border-border p-2">
              <div className="mono text-[10px] tracking-widest text-muted-foreground">
                ACTUAL
              </div>
              <div className="mt-1">
                <span className="mono text-[10px] text-muted-foreground">CORE </span>
                <span className="text-foreground">{r.actualCore}</span>
              </div>
              <div className="mt-1">
                <span className="mono text-[10px] text-muted-foreground">LAYERS </span>
                <span className="text-foreground">
                  {r.actualLayers.length ? r.actualLayers.join(", ") : "—"}
                </span>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
