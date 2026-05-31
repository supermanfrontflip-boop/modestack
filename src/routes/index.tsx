import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      { title: "Prompt Command Center" },
      { name: "description", content: "Pick the best AI prompt mode for your situation." },
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
    if (listening) {
      stop();
      return;
    }
    if (!supported) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    baseRef.current = situation;
    start();
  };

  const canSubmit = situation.trim().length > 2;

  const onRecommend = () => {
    if (!canSubmit) {
      toast.error("Describe your situation first");
      return;
    }
    const result = recommend(situation, modes);
    if (!result) {
      toast.error("No modes available");
      return;
    }
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

          {rec.avoid && (
            <div className="hud-panel p-3 border-destructive/40">
              <div className="flex items-start gap-2">
                <Ban className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] mono tracking-widest text-destructive">AVOID</div>
                  <div className="text-sm mono">{rec.avoid.mode}</div>
                  <div className="text-xs text-muted-foreground mt-1">{rec.avoid.avoidWhen}</div>
                </div>
              </div>
            </div>
          )}

          <div className="hud-panel p-4 space-y-2">
            <SectionLabel>EXPLANATION</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">{rec.explanation}</p>
          </div>

          <div className="hud-panel hud-corner p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>COMBINED PROMPT</SectionLabel>
              <CopyButton value={rec.combinedPrompt} label="Copy Prompt" />
            </div>
            <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono bg-background/60 border border-border rounded-md p-3 text-foreground/90 max-h-80 overflow-auto">
              {rec.combinedPrompt}
            </pre>
            <Button
              variant="outline"
              onClick={() => setSaveOpen(true)}
              className="w-full mono tracking-wider"
            >
              <Star className="h-4 w-4 mr-2" />
              SAVE AS FAVORITE STACK
            </Button>
          </div>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] mono tracking-[0.25em] text-muted-foreground">
      // {children}
    </div>
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
            <IntensityPill intensity={mode.intensity} />
          </div>
        </div>
        <CopyButton value={mode.fullPrompt} label="Prompt" />
      </div>
      {!compact && (
        <p className="text-sm text-foreground/85 leading-relaxed">{mode.purpose}</p>
      )}
      {!compact && (
        <div className="grid grid-cols-1 gap-1 pt-1 text-xs">
          <Row k="Best for" v={mode.bestFor} />
          <Row k="Avoid when" v={mode.avoidWhen} />
          <Row k="Stack with" v={mode.stackWith} />
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
