import { useEffect, useState, useCallback } from "react";
import { SEED_MODES, normalizeMode, type Mode } from "./modes-data";

const MODES_KEY = "pcc.modes.v1";
const FAVS_KEY = "pcc.favorites.v1";

export interface FavoriteStack {
  id: string;
  name: string;
  note?: string;
  modeIds: string[];
  createdAt: number;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("pcc:store", { detail: { key } }));
}

function loadModes(): Mode[] {
  const stored = read<Partial<Mode>[] | null>(MODES_KEY, null);
  if (!stored || stored.length === 0) {
    write(MODES_KEY, SEED_MODES);
    return SEED_MODES;
  }
  // Normalize legacy records so v2 fields (subcategory, coreObjective, etc.) exist.
  // Return the stored collection exactly as stored — do NOT append SEED_MODES.
  return stored
    .filter((m): m is Partial<Mode> & { id: string; mode: string } => !!m && !!m.id && !!m.mode)
    .map(normalizeMode);
}

export function useModes() {
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [modes, setModes] = useState<Mode[]>([]);

  useEffect(() => {
    setModes(loadModes());
    setHydrated(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === MODES_KEY) setModes(loadModes());
    };
    window.addEventListener("pcc:store", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pcc:store", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const upsertMode = useCallback((mode: Mode) => {
    const current = loadModes();
    const idx = current.findIndex((m) => m.id === mode.id);
    if (idx >= 0) current[idx] = mode;
    else current.push(mode);
    write(MODES_KEY, current);
  }, []);

  const deleteMode = useCallback((id: string) => {
    write(MODES_KEY, loadModes().filter((m) => m.id !== id));
  }, []);

  const resetModes = useCallback(() => {
    write(MODES_KEY, SEED_MODES);
  }, []);

  const replaceModes = useCallback((next: Mode[]) => {
    write(MODES_KEY, next);
  }, []);

  const mergeModes = useCallback((incoming: Mode[]) => {
    const current = loadModes();
    const byId = new Map(current.map((m) => [m.id, m]));
    let added = 0;
    let updated = 0;
    for (const m of incoming) {
      if (byId.has(m.id)) updated++;
      else added++;
      byId.set(m.id, m);
    }
    write(MODES_KEY, Array.from(byId.values()));
    return { added, updated };
  }, []);

  return { modes, hydrated, upsertMode, deleteMode, resetModes, replaceModes, mergeModes };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStack[]>(() =>
    typeof window === "undefined" ? [] : read<FavoriteStack[]>(FAVS_KEY, []),
  );

  useEffect(() => {
    setFavorites(read<FavoriteStack[]>(FAVS_KEY, []));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === FAVS_KEY) {
        setFavorites(read<FavoriteStack[]>(FAVS_KEY, []));
      }
    };
    window.addEventListener("pcc:store", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pcc:store", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const addFavorite = useCallback((fav: Omit<FavoriteStack, "id" | "createdAt">) => {
    const next: FavoriteStack = {
      ...fav,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    write(FAVS_KEY, [next, ...read<FavoriteStack[]>(FAVS_KEY, [])]);
  }, []);

  const deleteFavorite = useCallback((id: string) => {
    write(FAVS_KEY, read<FavoriteStack[]>(FAVS_KEY, []).filter((f) => f.id !== id));
  }, []);

  return { favorites, addFavorite, deleteFavorite };
}

export function makeId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || crypto.randomUUID();
}
