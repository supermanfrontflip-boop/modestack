import { SEED_MODES, type Mode } from "./modes-data";

/**
 * Repository baseline mode library.
 *
 * This is the single authoritative collection the application, the Vault,
 * the recommender and the regression suite fall back to when no valid stored
 * replacement exists.
 *
 * ⚠️ BASELINE IS INCOMPLETE.
 * The approved production library (Legal Research Mode, Verbatim Mode,
 * Systems Architect Mode, Operator Mode, Lucy Mode, …) has never been
 * committed to this repository — it only ever existed inside a browser's
 * localStorage after a CSV import. Until that CSV is committed here, the
 * baseline below is the 17-mode starter set and is reported loudly through
 * the initialization diagnostics as an incomplete baseline.
 *
 * To complete the baseline, replace this file's export with the full library.
 */
export const BASELINE_MODES: Mode[] = SEED_MODES;

/** False until the full approved library is committed to the repository. */
export const BASELINE_COMPLETE = false;

/** Modes the regression suite requires that the baseline is known to lack. */
export const BASELINE_MISSING_MODES = [
  "Legal Research Mode",
  "Verbatim Mode",
  "Systems Architect Mode",
  "Operator Mode",
  "Lucy Mode",
];

export const SCHEMA_VERSION = "v2.role";
