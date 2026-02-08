import type { Player, PlayerApiResponse } from "../types";
import { API, CACHE } from "../constants";

interface CacheEntry {
  data: Player;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function transformResponse(response: PlayerApiResponse): Player {
  return {
    mmr: response.mmr,
    rank: response.rank,
    rankIconUrl: response.rank_icon_url,
  };
}

function getCacheKey(name: string, game: string): string {
  return `${name.toLowerCase()}:${game}`;
}

function getFromCache(key: string): Player | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE.TIMEOUT_MS;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: Player): void {
  cache.set(key, { data, timestamp: Date.now() });

  // Cleanup old entries
  const now = Date.now();
  const maxAge = CACHE.TIMEOUT_MS * CACHE.CLEANUP_MULTIPLIER;

  for (const [k, entry] of cache.entries()) {
    if (now - entry.timestamp > maxAge) {
      cache.delete(k);
    }
  }
}

export async function fetchPlayer(name: string, game: string): Promise<Player> {
  const cacheKey = getCacheKey(name, game);
  const cached = getFromCache(cacheKey);

  if (cached) {
    return cached;
  }

  const url = `${API.PLAYER_DETAILS}?name=${encodeURIComponent(name)}&game=${game}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  const json: PlayerApiResponse = await response.json();
  const player = transformResponse(json);

  setCache(cacheKey, player);

  return player;
}
