import { useEffect, useState, useCallback } from "react";
import { useModeLibrary } from "./mode-provider";

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

/**
 * Single authoritative mode collection. Every consumer (Vault, recommender,
 * stacks, CSV export/import, regression tests) reads from the same provider.
 */
export function useModes() {
  return useModeLibrary();
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
