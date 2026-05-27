import type { Intensity } from "@/lib/modes-data";
import { cn } from "@/lib/utils";

const intensityColors: Record<Intensity, string> = {
  Low: "bg-secondary text-muted-foreground border-border",
  Medium: "bg-primary/10 text-primary border-primary/30",
  High: "bg-accent/15 text-accent border-accent/40",
  Extreme: "bg-destructive/15 text-destructive border-destructive/40",
};

export function IntensityPill({ intensity }: { intensity: Intensity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] mono tracking-widest",
        intensityColors[intensity],
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {intensity.toUpperCase()}
    </span>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] mono tracking-widest text-muted-foreground">
      {category.toUpperCase()}
    </span>
  );
}
