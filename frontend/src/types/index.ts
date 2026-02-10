/**
 * Player data returned from the API
 */
export interface Player {
  readonly name: string;
  readonly countryCode?: string;
  readonly countryName?: string;
  readonly mmr: number | null;
  readonly maxMmr: number | null;
  readonly overallRank?: number;
  readonly eventsPlayed: number;
  readonly winRate?: number;
  readonly winLossLastTen?: string;
  readonly gainLossLastTen?: number;
  readonly largestGain?: number;
  readonly averageScore?: number;
  readonly averageLastTen?: number;
  readonly rank: string;
  readonly rankIconUrl?: string;
  readonly partnerAvg?: number;
  readonly lastDiff?: number;
}

/**
 * Overlay field keys that can be toggled on/off.
 * Core fields (mmr + rank) are always shown and not toggleable.
 */
export type OverlayField =
  | "name"
  | "maxMmr"
  | "overallRank"
  | "eventsPlayed"
  | "winRate"
  | "winLossLastTen"
  | "gainLossLastTen"
  | "largestGain"
  | "averageScore"
  | "averageLastTen"
  | "partnerAvg"
  | "lastDiff";

/**
 * Metadata for an overlay field option
 */
export interface OverlayFieldOption {
  readonly key: OverlayField;
  readonly label: string;
}

/**
 * Game mode options
 */
export type GameMode = "12p" | "24p" | "both";

/**
 * Async state for data fetching
 */
export interface AsyncState<T> {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}
