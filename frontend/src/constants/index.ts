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
  OPTIONS: ["24p", "12p"],
} as const;
