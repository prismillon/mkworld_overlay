/**
 * Player data returned from the API
 */
export interface Player {
  readonly mmr: number | null;
  readonly rank: string;
  readonly rankIconUrl?: string;
}

/**
 * API response shape (snake_case from backend)
 */
export interface PlayerApiResponse {
  readonly mmr: number | null;
  readonly rank: string;
  readonly rank_icon_url?: string;
}

/**
 * Game mode options
 */
export type GameMode = "12p" | "24p";

/**
 * Async state for data fetching
 */
export interface AsyncState<T> {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}
