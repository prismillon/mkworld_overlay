import type { OverlayFieldOption } from "../types";

export const API = {
  BASE_URL: "/api",
  PLAYER_DETAILS: "/api/player/details",
} as const;

export const CACHE = {
  TIMEOUT_MS: 30_000,
  CLEANUP_MULTIPLIER: 2,
} as const;

export const OVERLAY = {
  AUTO_REFRESH_MS: 60_000,
} as const;

export const GAME_MODES = {
  DEFAULT: "24p",
  OPTIONS: ["24p", "12p", "both"],
} as const;

/**
 * Toggleable overlay fields.
 * Core (MMR + rank icon) is always shown and not listed here.
 */
export const OVERLAY_FIELDS: OverlayFieldOption[] = [
  { key: "name", label: "Name" },
  { key: "maxMmr", label: "Peak" },
  { key: "overallRank", label: "Overall Rank" },
  { key: "eventsPlayed", label: "Events Played" },
  { key: "winRate", label: "Win Rate" },
  { key: "winLossLastTen", label: "W/L Last 10" },
  { key: "gainLossLastTen", label: "+/- Last 10" },
  { key: "largestGain", label: "Largest Gain" },
  { key: "averageScore", label: "Avg Score" },
  { key: "averageLastTen", label: "Avg Last 10" },
  { key: "partnerAvg", label: "Partner Avg" },
  { key: "lastDiff", label: "Last Diff" },
] as const;
