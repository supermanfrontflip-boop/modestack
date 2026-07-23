import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFavorites, useModes } from "@/lib/vault-store";
import { recommend, ROLE_LABEL, type Recommendation } from "@/lib/recommend";
import { CopyButton } from "@/components/CopyButton";
import { CategoryTag, IntensityPill } from "@/components/ModeBadge";
import { Radar, Zap, Ban, Star, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ModeStack — Workflow Advisor" },
      { name: "description", content: "Identify the next step and the minimum effective mode stack." },
    ],
  }),
  component: HomePage,
});

const EXAMPLES = [
  "Debug a checkout bug in my Stripe flow",
  "Decide which framework to use for my startup",
  "Teach me how transformers work from scratch",
  "Polish my launch announcement to publication quality",
];

function HomePage() {
  const { modes } = useModes();
  const { addFavorite } = useFavorites();
  const [situation, setSituation] = useState("");
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [view, setView] = useState<"quick" | "detailed">("quick");
  const [saveOpen, setSaveOpen] = useState(false);
  const [favName, setFavName] = useState("");
  const baseRef = useRef("");

  const { listening, supported, start, stop } = useSpeechRecognition((sessionText) => {
    const base = baseRef.current;
    const joined = base
      ? `${base.replace(/\s+$/, "")}${sessionText ? " " + sessionText : ""}`
      : sessionText;
    setSituation(joined);
  });

  const toggleMic = () => {
    if (listening) { stop(); return; }
    if (!supported) { toast.error("Voice input not supported in this browser"); return; }
    baseRef.current = situation;
    start();
  };

  const canSubmit = situation.trim().length > 2;

  const onRecommend = () => {
    if (!canSubmit) { toast.error("Describe your situation first"); return; }
    const result = recommend(situation, modes);
    if (!result) { toast.error("No modes available"); return; }
    setRec(result);
  };

  const stackName = useMemo(() => {
    if (!rec) return "";
    return [rec.primary.mode, ...rec.supporting.map((s) => s.mode)].join(" + ");
  }, [rec]);

  const onSaveStack = () => {
    if (!rec) return;
    addFavorite({
      name: favName.trim() || stackName,
      note: situation.slice(0, 140),
      modeIds: [rec.primary.id, ...rec.supporting.map((s) => s.id)],
    });
    setSaveOpen(false);
    setFavName("");
    toast.success("Stack saved to Favorites");
  };

  return (
    <div className="space-y-5">
      <section className="hud-panel hud-corner p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] mono tracking-[0.25em] text-muted-foreground">// SITUATION INPUT</div>
          <Radar className="h-4 w-4 text-primary" />
        </div>
        <label className="block text-base text-foreground">
          What are you trying to accomplish?
        </label>
        <div className="relative">
          <Textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="Describe the mission, the constraint, or the question…"
            className="min-h-[110px] bg-input/60 border-border focus-visible:ring-primary pr-12"
          />
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            className={`absolute top-2 right-2 inline-flex items-center justify-center h-9 w-9 rounded-md border transition-colors ${
              listening
                ? "border-destructive/60 bg-destructive/10 text-destructive animate-pulse"
                : "border-border bg-muted/40 text-muted-foreground hover:text-primary hover:border-primary/50"
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          {listening && (
            <div className="absolute bottom-2 left-3 text-[10px] mono tracking-widest text-destructive">
              ● REC — listening…
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setSituation(ex)}
              className="text-[10px] mono tracking-wider rounded-sm border border-border bg-muted/40 px-2 py-1 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
        <Button
          onClick={onRecommend}
          disabled={!canSubmit}
          className="w-full mono tracking-widest text-sm h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Zap className="h-4 w-4 mr-2" />
          RECOMMEND MODES
        </Button>
      </section>

      {rec && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Tabs value={view} onValueChange={(v) => setView(v as "quick" | "detailed")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="quick" className="mono tracking-widest text-xs">QUICK VIEW</TabsTrigger>
              <TabsTrigger value="detailed" className="mono tracking-widest text-xs">DETAILED VIEW</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4 mt-3">
              <QuickView rec={rec} onSave={() => setSaveOpen(true)} />
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4 mt-3">
              <DetailedView rec={rec} onSave={() => setSaveOpen(true)} />
            </TabsContent>
          </Tabs>
        </section>
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="mono tracking-widest text-primary">SAVE STACK</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Stack: <span className="mono text-foreground">{stackName}</span>
            </div>
            <Input
              placeholder={stackName}
              value={favName}
              onChange={(e) => setFavName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={onSaveStack} className="mono tracking-wider">SAVE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Quick View ---------- */

function StackLayersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3 2.5 8 12 13l9.5-5L12 3Z" />
      <path d="M2.5 12 12 17l9.5-5" opacity="0.75" />
      <path d="M2.5 16 12 21l9.5-5" opacity="0.5" />
    </svg>
  );
}

function DecorativeHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-center text-primary tracking-[0.35em] uppercase glow-text"
      style={{
        fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
        fontWeight: 600,
        fontStyle: "italic",
        fontSize: "1.75rem",
        letterSpacing: "0.2em",
      }}
    >
      {children}
    </h3>
  );
}

function StackDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden={false}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground font-sans">
        {label}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
    </div>
  );
}

function QuickView({ rec, onSave }: { rec: Recommendation; onSave: () => void }) {
  const combinedStack = [rec.primary.mode, ...rec.supporting.map((s) => s.mode)].join(" + ");
  return (
    <>
      <div className="hud-panel hud-corner p-4 space-y-2 border-primary/40">
        <SectionLabel>RECOMMENDED NEXT ACTION</SectionLabel>
        <p className="text-sm text-foreground leading-relaxed">{rec.recommendedAction}</p>
      </div>

      <div className="hud-panel hud-corner p-5 space-y-4 border-primary/40">
        <div className="space-y-2">
          <DecorativeHeading>Core</DecorativeHeading>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="mono text-xl text-foreground">{rec.primary.mode}</h4>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <CategoryTag category={rec.primary.category} />
                <IntensityPill intensity={rec.primary.intensity} />
              </div>
            </div>
            <CopyButton value={rec.primary.fullPrompt} label="Copy Core Prompt" />
          </div>
        </div>

        <StackDivider label="Stack With" />

        <div className="space-y-3">
          <DecorativeHeading>Layers</DecorativeHeading>
          {rec.supporting.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center italic">
              No additional layers recommended.
            </p>
          ) : (
            <ul className="space-y-2">
              {rec.supporting.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-sm border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <StackLayersIcon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="mono text-sm text-foreground truncate">{m.mode}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <CategoryTag category={m.category} />
                    </div>
                  </div>
                  <CopyButton value={m.fullPrompt} label="Prompt" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="hud-panel p-4 space-y-3">
        <SectionLabel>COMBINED STACK</SectionLabel>
        <div className="mono text-sm text-foreground">{combinedStack}</div>
        <ConfidenceRow label="Combined Stack Confidence" value={rec.stackConfidence} />
        <div className="flex gap-2">
          <CopyButton value={rec.combinedPrompt} label="Copy Combined Prompt" />
          <Button variant="outline" onClick={onSave} className="mono tracking-wider flex-1">
            <Star className="h-4 w-4 mr-2" />
            SAVE STACK
          </Button>
        </div>
      </div>
    </>
  );
}

/* ---------- Detailed View ---------- */

function DetailedView({ rec, onSave }: { rec: Recommendation; onSave: () => void }) {
  return (
    <>
      <div className="hud-panel hud-corner p-4 space-y-2 border-primary/40">
        <SectionLabel>SITUATION TYPE</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {rec.situationTypes.length === 0 && (
            <span className="text-xs text-muted-foreground">No specific situation type detected.</span>
          )}
          {rec.situationTypes.map((st, i) => (
            <span
              key={st.type}
              className={`mono text-xs tracking-wider px-2 py-1 rounded-sm border ${
                i === 0
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              {st.type}
              {i === 0 && <span className="ml-1 text-[9px] opacity-70">PRIMARY</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="hud-panel hud-corner p-4 space-y-2 border-primary/40">
        <SectionLabel>CATEGORY</SectionLabel>
        <div className="mono text-sm text-primary">{rec.category}</div>
        {rec.categoryEvidence.length > 0 && (
          <EvidenceList items={rec.categoryEvidence} />
        )}
      </div>

      <div className="hud-panel hud-corner p-4 grid grid-cols-2 gap-3 border-primary/30">
        <Stat label="CURRENT STAGE" value={rec.stage} />
        <Stat label="COMPLEXITY" value={rec.complexity} />
        <Stat
          label="AI RECOMMENDED?"
          value={rec.aiRecommended}
          tone={rec.aiRecommended === "Yes" ? "good" : rec.aiRecommended === "Limited" ? "warn" : "bad"}
        />
        <Stat label="TARGET DELIVERABLE" value={rec.deliverable} wide />
        {rec.stageEvidence.length > 0 && (
          <EvidenceBlock label="STAGE EVIDENCE" items={rec.stageEvidence} />
        )}
        {rec.deliverableEvidence.length > 0 && (
          <EvidenceBlock label="DELIVERABLE EVIDENCE" items={rec.deliverableEvidence} />
        )}
        <div className="col-span-2 text-[11px] text-muted-foreground leading-relaxed">
          {rec.aiReason}
        </div>
      </div>

      <div className="hud-panel p-4 space-y-2">
        <SectionLabel>CONFIDENCE</SectionLabel>
        <ConfidenceRow label="Primary Mode Confidence" value={rec.primaryConfidence} />
        <ConfidenceRow label="Combined Stack Confidence" value={rec.stackConfidence} />
        <ConfidenceRow label="Stage Confidence" value={rec.stageConfidence} />
      </div>

      <div className="hud-panel hud-corner p-4 space-y-2 border-primary/40">
        <SectionLabel>RECOMMENDED NEXT ACTION</SectionLabel>
        <p className="text-sm text-foreground leading-relaxed">{rec.recommendedAction}</p>
        {rec.bottleneck && (
          <p className="text-[11px] text-yellow-400/90 leading-relaxed">
            Bottleneck: {rec.bottleneck}
          </p>
        )}
      </div>

      {rec.missingPrerequisites.length > 0 && (
        <div className="hud-panel p-4 space-y-2 border-yellow-400/40">
          <SectionLabel>MISSING PREREQUISITES</SectionLabel>
          <ul className="space-y-1">
            {rec.missingPrerequisites.map((p) => (
              <li key={p} className="text-sm text-foreground/90 flex items-start gap-2">
                <span className="text-yellow-400 mono text-xs mt-0.5">▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
            Build these first — the target deliverable depends on them.
          </p>
        </div>
      )}

      <ModeCard label="PRIMARY MODE" mode={rec.primary} accent="primary" />

      {rec.supporting.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>SUPPORTING MODES</SectionLabel>
          <div className="space-y-2">
            {rec.supporting.map((m) => (
              <ModeCard key={m.id} mode={m} compact />
            ))}
          </div>
        </div>
      )}

      <div className="hud-panel p-4 space-y-2">
        <SectionLabel>REASONING</SectionLabel>
        <ul className="space-y-1">
          {rec.reasoning.map((r, i) => (
            <li key={i} className="text-xs text-foreground/85 flex items-start gap-1.5">
              <span className="text-primary mono mt-0.5">{i + 1}.</span>
              <span className="leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {(rec.primary.failureModes || rec.supporting.some((s) => s.failureModes)) && (
        <div className="hud-panel p-4 space-y-2">
          <SectionLabel>FAILURE MODES</SectionLabel>
          {[rec.primary, ...rec.supporting]
            .filter((m) => m.failureModes)
            .map((m) => (
              <div key={m.id} className="text-xs">
                <span className="mono text-primary">{m.mode}:</span>
                <span className="text-foreground/85 whitespace-pre-line ml-1">{m.failureModes}</span>
              </div>
            ))}
        </div>
      )}

      {(rec.primary.integrityChecks || rec.supporting.some((s) => s.integrityChecks)) && (
        <div className="hud-panel p-4 space-y-2">
          <SectionLabel>INTEGRITY CHECKS</SectionLabel>
          {[rec.primary, ...rec.supporting]
            .filter((m) => m.integrityChecks)
            .map((m) => (
              <div key={m.id} className="text-xs">
                <span className="mono text-primary">{m.mode}:</span>
                <span className="text-foreground/85 whitespace-pre-line ml-1">{m.integrityChecks}</span>
              </div>
            ))}
        </div>
      )}

      <div className="hud-panel p-4 space-y-3">
        <SectionLabel>WHY THESE MODES WORK TOGETHER</SectionLabel>
        <ul className="space-y-2">
          {rec.team.map((member, i) => (
            <li key={member.mode.id} className="text-sm text-foreground/90 leading-relaxed">
              <span className="mono text-primary">{member.mode.mode}</span>{" "}
              <span className="text-[10px] mono tracking-widest text-muted-foreground">
                [{i === 0 ? "PRIMARY" : "SUPPORT"} · {ROLE_LABEL[member.role].toUpperCase()}]
              </span>
              <div className="text-xs text-foreground/80 mt-0.5">{member.contribution}.</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hud-panel p-3 border-border">
        <div className="flex items-start gap-2">
          <Ban className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0 w-full">
            <div className="text-[10px] mono tracking-widest text-muted-foreground">AVOID MODES</div>
            {rec.avoid && rec.avoidIsHighConfidence ? (
              <>
                <div className="text-sm mono text-destructive">{rec.avoid.mode}</div>
                <div className="text-xs text-muted-foreground mt-1">{rec.avoid.avoidWhen}</div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground mt-0.5">
                No significant mode conflicts detected.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hud-panel p-4 space-y-2">
        <SectionLabel>EXPLANATION</SectionLabel>
        <p className="text-sm leading-relaxed text-foreground/90">{rec.explanation}</p>
      </div>

      <div className="hud-panel hud-corner p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>COMBINED PROMPT</SectionLabel>
          <CopyButton value={rec.combinedPrompt} label="Copy Combined Prompt" />
        </div>
        <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono bg-background/60 border border-border rounded-md p-3 text-foreground/90 max-h-80 overflow-auto">
          {rec.combinedPrompt}
        </pre>
        <Button
          variant="outline"
          onClick={onSave}
          className="w-full mono tracking-wider"
        >
          <Star className="h-4 w-4 mr-2" />
          SAVE AS FAVORITE STACK
        </Button>
      </div>
    </>
  );
}

/* ---------- Shared bits ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] mono tracking-[0.25em] text-muted-foreground">
      // {children}
    </div>
  );
}

function IntensityRow({ intensity }: { intensity: "Low" | "Medium" | "High" | "Extreme" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-foreground">Intensity:</span>
      <IntensityPill intensity={intensity} />
      <span className="text-[10px] text-muted-foreground leading-snug">
        Indicator only — helps you decide whether to use no prompt, the primary prompt, the combined prompt, or supporting prompts.
      </span>
    </div>
  );
}

function ConfidenceRow({ label, value }: { label: string; value: number }) {
  const tier = value >= 80 ? "HIGH" : value >= 55 ? "MEDIUM" : "LOW";
  const color =
    value >= 80 ? "bg-green-500" : value >= 55 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="mono text-foreground">
          {value}% <span className="text-[10px] text-muted-foreground tracking-widest">· {tier}</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted/40 rounded-sm overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  wide,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
  wide?: boolean;
}) {
  const color =
    tone === "good"
      ? "text-primary"
      : tone === "warn"
      ? "text-yellow-400"
      : tone === "bad"
      ? "text-destructive"
      : "text-foreground";
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[9px] mono tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className={`mono text-sm mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function EvidenceBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="col-span-2 border-t border-border/60 pt-2">
      <div className="text-[9px] mono tracking-[0.25em] text-muted-foreground">{label}</div>
      <EvidenceList items={items} />
    </div>
  );
}

function EvidenceList({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {items.map((it) => (
        <li key={it} className="text-[11px] text-foreground/85 flex items-start gap-1.5">
          <span className="text-primary mono mt-0.5">·</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function ModeCard({
  mode,
  label,
  accent,
  compact,
}: {
  mode: import("@/lib/modes-data").Mode;
  label?: string;
  accent?: "primary";
  compact?: boolean;
}) {
  return (
    <div
      className={`hud-panel ${accent === "primary" ? "hud-corner" : ""} p-4 space-y-2 ${
        accent === "primary" ? "border-primary/40" : ""
      }`}
    >
      {label && (
        <div className="text-[10px] mono tracking-[0.25em] text-primary glow-text">
          // {label}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={`mono ${compact ? "text-base" : "text-xl"} text-foreground`}>
            {mode.mode}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <CategoryTag category={mode.category} />
          </div>
        </div>
        <CopyButton value={mode.fullPrompt} label="Prompt" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-foreground">Intensity:</span>
        <IntensityPill intensity={mode.intensity} />
      </div>
      {!compact && (
        <p className="text-sm text-foreground/85 leading-relaxed">{mode.purpose}</p>
      )}
      {!compact && (
        <div className="grid grid-cols-1 gap-1 pt-1 text-xs">
          <Row k="Best for" v={mode.bestFor} />
          <Row k="Avoid when" v={mode.avoidWhen} />
          <Row k="Stack with" v={mode.layers} />
          <Row k="Exit" v={mode.exitPhrase} mono />
        </div>
      )}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2">
      <span className="text-[10px] mono tracking-widest text-muted-foreground self-start pt-0.5">
        {k.toUpperCase()}
      </span>
      <span className={`text-xs text-foreground/85 ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
