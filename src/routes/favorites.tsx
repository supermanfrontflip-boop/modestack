import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useFavorites, useModes } from "@/lib/vault-store";
import { CopyButton } from "@/components/CopyButton";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Mode } from "@/lib/modes-data";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorite Stacks — Prompt Command Center" },
      { name: "description", content: "Saved combinations of prompt modes." },
    ],
  }),
  component: FavoritesPage,
});

function buildStackPrompt(modes: Mode[]): string {
  if (!modes.length) return "";
  const [primary, ...rest] = modes;
  const lines = [
    `# Primary: ${primary.mode}`,
    primary.fullPrompt,
  ];
  if (rest.length) {
    lines.push("", "# Stack");
    for (const m of rest) lines.push(`- ${m.mode}: ${m.fullPrompt}`);
  }
  lines.push("", "# Exit", modes.map((m) => m.exitPhrase).join(" "));
  return lines.join("\n");
}

function FavoritesPage() {
  const { favorites, deleteFavorite } = useFavorites();
  const { modes } = useModes();

  const modeMap = useMemo(() => {
    const map = new Map<string, Mode>();
    for (const m of modes) map.set(m.id, m);
    return map;
  }, [modes]);

  if (favorites.length === 0) {
    return (
      <div className="hud-panel hud-corner p-8 text-center space-y-3">
        <Star className="h-8 w-8 text-primary mx-auto" />
        <h2 className="mono text-lg text-primary glow-text">NO STACKS SAVED</h2>
        <p className="text-sm text-muted-foreground">
          Run a recommendation, then save the combination here for quick reuse.
        </p>
        <Button asChild className="mono tracking-wider">
          <Link to="/">GO TO RECOMMEND</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((fav) => {
        const stackModes = fav.modeIds.map((id) => modeMap.get(id)).filter(Boolean) as Mode[];
        const prompt = buildStackPrompt(stackModes);
        return (
          <div key={fav.id} className="hud-panel p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] mono tracking-[0.25em] text-muted-foreground">
                  // STACK
                </div>
                <h3 className="mono text-base text-foreground truncate">{fav.name}</h3>
                {fav.note && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fav.note}</p>
                )}
              </div>
              <button
                onClick={() => { deleteFavorite(fav.id); toast.success("Stack removed"); }}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete stack"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stackModes.map((m, i) => (
                <span
                  key={m.id}
                  className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] mono tracking-wider ${
                    i === 0
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-foreground/80"
                  }`}
                >
                  {m.mode}
                </span>
              ))}
              {stackModes.length === 0 && (
                <span className="text-xs text-destructive">Modes in this stack were deleted.</span>
              )}
            </div>
            {prompt && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] mono tracking-widest text-muted-foreground">
                  COMBINED PROMPT READY
                </span>
                <CopyButton value={prompt} label="Copy Stack" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
