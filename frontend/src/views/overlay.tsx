import { useEffect, useCallback } from "react";
import type { GameMode } from "../types";
import { usePlayer, useInterval } from "../hooks";
import { MmrBadge } from "../components";
import { OVERLAY } from "../constants";

interface OverlayProps {
  playerName: string;
  game: GameMode;
}

export function Overlay({ playerName, game }: OverlayProps) {
  const { data, isLoading, error, fetch } = usePlayer();

  const refresh = useCallback(() => {
    fetch(playerName, game);
  }, [fetch, playerName, game]);

  useEffect(() => {
    refresh();
    document.body.style.background = "transparent";
    return () => {
      document.body.style.background = "";
    };
  }, [refresh]);

  useInterval(refresh, OVERLAY.AUTO_REFRESH_MS);

  return (
    <div className="overlay">
      <MmrBadge
        mmr={data?.mmr ?? null}
        rankIconUrl={data?.rankIconUrl}
        isLoading={isLoading}
        hasError={!!error}
      />
    </div>
  );
}
