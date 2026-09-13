import { useCallback, useEffect, useState } from "react";

/**
 * Local progress store. Keys are problem slugs.
 * This is the single read/write surface for progress + bookmarks, so it can be
 * swapped for a database-backed implementation without touching the UI.
 */
export interface ProgressState {
  solved: string[];
  bookmarked: string[];
}

const KEY = "codexsheet:progress:v1";
const empty: ProgressState = { solved: [], bookmarked: [] };

function read(): ProgressState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return { solved: parsed.solved ?? [], bookmarked: parsed.bookmarked ?? [] };
  } catch {
    return empty;
  }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(empty);

  useEffect(() => {
    setState(read());
  }, []);

  const persist = useCallback((next: ProgressState) => {
    setState(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = useCallback(
    (field: keyof ProgressState, slug: string) => {
      setState((prev) => {
        const list = prev[field];
        const next = {
          ...prev,
          [field]: list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug],
        } as ProgressState;
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
    },
    [],
  );

  return {
    solved: state.solved,
    bookmarked: state.bookmarked,
    toggleSolved: (slug: string) => toggle("solved", slug),
    toggleBookmark: (slug: string) => toggle("bookmarked", slug),
    reset: () => persist(empty),
  };
}
