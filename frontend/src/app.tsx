import type { GameMode } from "./types";
import { Overlay, Home } from "./views";
import { GAME_MODES } from "./constants";

function getUrlParams(): { name: string | null; game: GameMode } {
  const params = new URLSearchParams(window.location.search);
  const game = params.get("game") === "12p" ? "12p" : GAME_MODES.DEFAULT;
  return { name: params.get("name"), game };
}

export default function App() {
  const { name, game } = getUrlParams();

  if (name) {
    return <Overlay playerName={name} game={game} />;
  }

  return <Home />;
}
