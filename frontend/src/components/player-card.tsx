import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Player, GameMode, OverlayField } from "../types";
import { useClipboard } from "../hooks";
import { Button, Card, CardHeader, CardContent, CardFooter } from "./ui";
import { MmrBadge } from "./mmr-badge";
import { FieldPicker } from "./field-picker";

interface PlayerCardProps {
  name: string;
  player: Player;
  game: GameMode;
  player12p?: Player | null;
}

export function PlayerCard({ name, player, game, player12p }: PlayerCardProps) {
  const { t } = useTranslation();
  const { copied, copy } = useClipboard();
  const [fields, setFields] = useState<OverlayField[]>([]);

  const handleCopy = () => {
    const baseUrl = `${window.location.origin}/`;
    const params = new URLSearchParams({ name });
    if (game === "12p") params.set("game", "12p");
    if (game === "both") params.set("game", "both");

    if (fields.length > 0) {
      params.set("fields", fields.join(","));
    }

    copy(`${baseUrl}?${params}`);
  };

  return (
    <Card className="player-card">
      <CardHeader>
        <MmrBadge
          mmr={player.mmr}
          rankIconUrl={player.rankIconUrl}
          fields={fields}
          player={player}
          game={game}
          player12p={game === "both" ? player12p : undefined}
          mmr12p={game === "both" ? (player12p?.mmr ?? null) : undefined}
          rankIconUrl12p={game === "both" ? player12p?.rankIconUrl : undefined}
        />
      </CardHeader>

      <CardContent>
        <FieldPicker selected={fields} onChange={setFields} />
      </CardContent>

      <CardFooter>
        <Button onClick={handleCopy} className="player-card__copy-btn">
          {copied ? t("playerCard.copied") : t("playerCard.copy")}
        </Button>
      </CardFooter>
    </Card>
  );
}
