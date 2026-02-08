import type { Player, GameMode } from "../types";
import { useClipboard } from "../hooks";
import { Button } from "./ui";
import { MmrBadge } from "./mmr-badge";

interface PlayerCardProps {
  name: string;
  player: Player;
  game: GameMode;
}

export function PlayerCard({ name, player, game }: PlayerCardProps) {
  const { copied, copy } = useClipboard();

  const handleCopy = () => {
    const baseUrl = `${window.location.origin}/`;
    const params = new URLSearchParams({ name });
    if (game === "12p") params.set("game", "12p");

    copy(`${baseUrl}?${params}`);
  };

  return (
    <div className="player-card">
      <div className="player-card__header">
        <div className="player-card__info">
          <h3 className="player-card__name">{name}</h3>
          <MmrBadge mmr={player.mmr} rankIconUrl={player.rankIconUrl} />
        </div>
        <div className="player-card__actions">
          <Button onClick={handleCopy} className="btn--secondary">
            {copied ? "Copied!" : "Copy Overlay URL"}
          </Button>
        </div>
      </div>
    </div>
  );
}
