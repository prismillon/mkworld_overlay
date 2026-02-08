import { useState, useCallback } from "react";
import type { Player, GameMode, AsyncState } from "../types";
import { fetchPlayer } from "../lib/api";

interface UsePlayerReturn extends AsyncState<Player> {
  fetch: (name: string, game: GameMode) => Promise<void>;
  reset: () => void;
}

export function usePlayer(): UsePlayerReturn {
  const [state, setState] = useState<AsyncState<Player>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetch = useCallback(async (name: string, game: GameMode) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fetchPlayer(name, game);
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, fetch, reset };
}
