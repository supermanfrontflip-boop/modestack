import type { Mode } from "./modes-data";
import { AUTHORITATIVE_MODES } from "./mode-library-data";

/**
 * Repository baseline mode library — the single authoritative collection used
 * by the application, the Vault, the recommender and the regression suite.
 *
 * Source of truth: the 52-record authoritative CSV plus the five audited
 * restorations EXP-053…EXP-057 (Shadow, Glove, Clear, Platform Tutor, Hawk),
 * plus the audited restoration of Raven Mode (EXP-058), for a final authoritative baseline of 58 records.
 * The legacy 17-mode starter seed (SEED_MODES) is retired and is no longer a
 * production fallback nor appended to imported collections.
 *
 * CSV Replace remains supported as an intentional user override; a fresh
 * installation with no stored override loads these 58 records.
 */
export const BASELINE_MODES: Mode[] = AUTHORITATIVE_MODES;

/** The approved library is committed to the repository. */
export const BASELINE_COMPLETE = BASELINE_MODES.length === 58;

/** Modes the regression suite requires; empty means the baseline covers them. */
export const BASELINE_MISSING_MODES = [
  "Legal Research Mode",
  "Verbatim Mode",
  "Systems Architect Mode",
  "Operator Mode",
  "Lucy Mode",
  "Dream Logic Mode",
  "Shadow Mode",
  "Glove Mode",
  "Clear Mode",
  "Platform Tutor Mode",
  "Hawk Mode",
].filter((name) => !BASELINE_MODES.some((m) => m.mode === name));

export const SCHEMA_VERSION = "v4.authoritative-58";

