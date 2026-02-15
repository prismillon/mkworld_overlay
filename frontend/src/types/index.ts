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

export interface OverlayFieldOption {
  readonly key: OverlayField;
  readonly label: string;
}

export type GameMode = "12p" | "24p" | "both";

export interface AsyncState<T> {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}
