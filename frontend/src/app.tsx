import type { GameMode, OverlayField } from "./types";
import { Overlay, Home } from "./views";
import { GAME_MODES, OVERLAY_FIELDS } from "./constants";

function getUrlParams(): {
  name: string | null;
  game: GameMode;
  fields: OverlayField[];
} {
  const params = new URLSearchParams(window.location.search);
  const gameParam = params.get("game");
  const game: GameMode =
    gameParam === "12p"
      ? "12p"
      : gameParam === "both"
        ? "both"
        : GAME_MODES.DEFAULT;

  const validKeys = new Set<string>(OVERLAY_FIELDS.map((f) => f.key));
  const fieldsParam = params.get("fields");
  const fields = fieldsParam
    ? (fieldsParam.split(",").filter((k) => validKeys.has(k)) as OverlayField[])
    : [];

  return { name: params.get("name"), game, fields };
}

export default function App() {
  const { name, game, fields } = getUrlParams();

  if (name) {
    return <Overlay playerName={name} game={game} fields={fields} />;
  }

  return <Home />;
}
