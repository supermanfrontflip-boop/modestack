import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { normalizeMode, type Mode } from "./modes-data";
import {
  BASELINE_COMPLETE,
  BASELINE_MISSING_MODES,
  BASELINE_MODES,
  SCHEMA_VERSION,
} from "./mode-library";

/**
 * Storage key for an intentional user override (CSV Replace / Vault edits).
 * Bumped to v3 when the authoritative 52-mode repository baseline landed, so
 * stale 17-mode payloads written by earlier builds can never win again.
 */
export const MODES_KEY = "pcc.modes.v3";
export const LEGACY_MODES_KEYS = ["pcc.modes.v1", "pcc.modes.v2"];
export const MODES_BACKUP_KEY = "pcc.modes.corrupt-backup";

const STORE_EVENT = "pcc:store";

export type ModeSource = "repository" | "stored replacement" | "fallback";

export interface ModeInitState {
  modes: Mode[];
  source: ModeSource;
  error: string | null;
}

/** Validates the whole payload before it is allowed to become active data. */
export function validateModeCollection(value: unknown): Mode[] {
  if (!Array.isArray(value)) throw new Error("Stored mode data is not an array.");
  if (value.length === 0) throw new Error("Stored mode data is empty.");
  return value.map((raw, i) => {
    if (!raw || typeof raw !== "object") throw new Error(`Row ${i + 1}: not an object.`);
    const m = raw as Partial<Mode>;
    if (!m.mode || typeof m.mode !== "string") throw new Error(`Row ${i + 1}: missing "mode".`);
    if (!m.id || typeof m.id !== "string") throw new Error(`Row ${i + 1}: missing "id".`);
    return normalizeMode(m as Partial<Mode> & { id: string; mode: string });
  });
}

function initialize(): ModeInitState {
  if (typeof window === "undefined") {
    return { modes: BASELINE_MODES, source: "repository", error: null };
  }
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(MODES_KEY);
  } catch (e) {
    return {
      modes: BASELINE_MODES,
      source: "fallback",
      error: `localStorage unavailable: ${String(e)}`,
    };
  }
  if (raw == null) {
    // No user override: the repository baseline is authoritative.
    // Storage is intentionally NOT seeded, so a later baseline update is
    // picked up instead of being pinned by a stale copy.
    try {
      for (const k of LEGACY_MODES_KEYS) localStorage.removeItem(k);
    } catch {
      /* non-fatal */
    }
    return { modes: BASELINE_MODES, source: "repository", error: null };
  }

  try {
    const modes = validateModeCollection(JSON.parse(raw));
    return { modes, source: "stored replacement", error: null };
  } catch (e) {
    // Preserve the corrupt value for inspection, then load the baseline.
    try {
      localStorage.setItem(MODES_BACKUP_KEY, raw);
    } catch {
      /* ignore */
    }
    return {
      modes: BASELINE_MODES,
      source: "fallback",
      error: `${e instanceof Error ? e.message : String(e)} (corrupt value saved to ${MODES_BACKUP_KEY})`,
    };
  }
}

function persist(modes: Mode[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODES_KEY, JSON.stringify(modes));
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key: MODES_KEY } }));
}

export interface ModeContextValue {
  modes: Mode[];
  initialized: boolean;
  /** Alias kept for existing call sites. */
  hydrated: boolean;
  source: ModeSource;
  schemaVersion: string;
  loadError: string | null;
  baselineComplete: boolean;
  baselineCount: number;
  missingBaselineModes: string[];
  upsertMode: (mode: Mode) => void;
  deleteMode: (id: string) => void;
  resetModes: () => void;
  replaceModes: (next: Mode[]) => void;
  mergeModes: (incoming: Mode[]) => { added: number; updated: number };
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModeInitState | null>(null);

  useEffect(() => {
    const load = () => setState(initialize());
    load();
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === MODES_KEY) load();
    };
    window.addEventListener(STORE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(STORE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const modes = state?.modes ?? [];

  const value = useMemo<ModeContextValue>(() => {
    const initialized = state !== null;
    return {
      modes,
      initialized,
      hydrated: initialized,
      source: state?.source ?? "repository",
      schemaVersion: SCHEMA_VERSION,
      loadError: state?.error ?? null,
      baselineComplete: BASELINE_COMPLETE,
      baselineCount: BASELINE_MODES.length,
      missingBaselineModes: BASELINE_MISSING_MODES,
      upsertMode: (mode: Mode) => {
        const next = [...modes];
        const idx = next.findIndex((m) => m.id === mode.id);
        if (idx >= 0) next[idx] = mode;
        else next.push(mode);
        persist(next);
      },
      deleteMode: (id: string) => persist(modes.filter((m) => m.id !== id)),
      resetModes: () => persist(BASELINE_MODES),
      replaceModes: (next: Mode[]) => persist(validateModeCollection(next)),
      mergeModes: (incoming: Mode[]) => {
        const byId = new Map(modes.map((m) => [m.id, m]));
        let added = 0;
        let updated = 0;
        for (const m of incoming) {
          if (byId.has(m.id)) updated++;
          else added++;
          byId.set(m.id, m);
        }
        persist(Array.from(byId.values()));
        return { added, updated };
      },
    };
  }, [state, modes]);

  useEffect(() => {
    (globalThis as Record<string, unknown>).__modeInitializationDebug = {
      source: value.source,
      count: value.modes.length,
      initialized: value.initialized,
      schemaVersion: value.schemaVersion,
      loadError: value.loadError ?? "none",
      baselineComplete: value.baselineComplete,
      baselineCount: value.baselineCount,
      missingBaselineModes: value.missingBaselineModes,
      modeNames: value.modes.map((m) => m.mode),
    };
  }, [value]);

  if (!value.initialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mono text-xs tracking-[0.25em] text-primary glow-text animate-pulse">
          LOADING MODE LIBRARY…
        </div>
      </div>
    );
  }

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useModeLibrary(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useModeLibrary must be used inside <ModeProvider>.");
  return ctx;
}
