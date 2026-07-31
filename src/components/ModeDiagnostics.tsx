import { useModeLibrary } from "@/lib/mode-provider";

export function ModeDiagnostics() {
  const {
    source,
    modes,
    initialized,
    schemaVersion,
    loadError,
    baselineComplete,
    baselineCount,
    missingBaselineModes,
  } = useModeLibrary();

  const rows: [string, string][] = [
    ["MODE SOURCE", source],
    ["MODE COUNT", String(modes.length)],
    ["INITIALIZED", initialized ? "yes" : "no"],
    ["SCHEMA VERSION", schemaVersion],
    ["LOAD ERROR", loadError ?? "none"],
  ];

  return (
    <section className="hud-corner border border-border bg-card p-3">
      <div className="mono text-[10px] tracking-[0.25em] text-muted-foreground">
        INITIALIZATION DIAGNOSTICS
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="mono text-[10px] tracking-widest text-muted-foreground">{k}</dt>
            <dd
              className={`mono text-[10px] break-words ${
                k === "LOAD ERROR" && v !== "none" ? "text-destructive" : "text-foreground"
              }`}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      {!baselineComplete && (
        <p className="mt-2 border border-destructive/60 p-2 mono text-[10px] leading-relaxed text-destructive">
          REPOSITORY BASELINE INCOMPLETE — {baselineCount} modes committed. Missing:{" "}
          {missingBaselineModes.join(", ")}. Import the approved CSV, or commit it to
          src/lib/mode-library.ts, to make the baseline authoritative.
        </p>
      )}
    </section>
  );
}
