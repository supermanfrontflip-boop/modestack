import type { Intensity } from "@/lib/modes-data";
import { cn } from "@/lib/utils";

const intensityColors: Record<Intensity, string> = {
  Low: "bg-green-500/15 text-green-400 border-green-500/40",
  Medium: "bg-yellow-400/15 text-yellow-300 border-yellow-400/40",
  High: "bg-red-500/15 text-red-400 border-red-500/40",
  Extreme: "bg-red-500/25 text-red-300 border-red-500/60",
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
