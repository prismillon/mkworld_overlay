import { useEffect, useCallback } from "react";
import type { GameMode, OverlayField } from "../types";
import { usePlayer, useInterval } from "../hooks";
import { MmrBadge } from "../components";
import { OVERLAY } from "../constants";

interface OverlayProps {
  playerName: string;
  game: GameMode;
  fields: OverlayField[];
}

export function Overlay({ playerName, game, fields: _fields }: OverlayProps) {
  const primary = usePlayer();
  const secondary = usePlayer();

  const isBoth = game === "both";

  const refresh = useCallback(() => {
    if (isBoth) {
      primary.fetch(playerName, "24p");
      secondary.fetch(playerName, "12p");
    } else {
      primary.fetch(playerName, game);
    }
  }, [primary.fetch, secondary.fetch, playerName, game, isBoth]);

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
        mmr={primary.data?.mmr ?? null}
        rankIconUrl={primary.data?.rankIconUrl}
        isLoading={primary.isLoading}
        hasError={!!primary.error}
        fields={_fields}
        player={primary.data}
        game={game}
        player12p={isBoth ? secondary.data : undefined}
        mmr12p={isBoth ? (secondary.data?.mmr ?? null) : undefined}
        rankIconUrl12p={isBoth ? secondary.data?.rankIconUrl : undefined}
      />
    </div>
  );
}
