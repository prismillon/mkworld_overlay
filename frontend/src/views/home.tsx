import { useState } from "react";
import type { GameMode } from "../types";
import { usePlayer } from "../hooks";
import { SearchForm, PlayerCard, Instructions } from "../components";
import { GAME_MODES } from "../constants";

export function Home() {
  const [playerName, setPlayerName] = useState("");
  const [game, setGame] = useState<GameMode>(GAME_MODES.DEFAULT);
  const [submittedName, setSubmittedName] = useState("");
  const { data, isLoading, error, fetch } = usePlayer();

  const handleSubmit = async () => {
    const name = playerName.trim();
    if (!name) return;

    setSubmittedName(name);
    await fetch(name, game);
  };

  const handleGameChange = async (newGame: GameMode) => {
    setGame(newGame);
    if (submittedName) {
      await fetch(submittedName, newGame);
    }
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <header className="hero__header">
            <h1>MK World MMR Overlay</h1>
          </header>
          <p className="hero__subtitle">
            Mario Kart World MMR overlay for streamers and content creators
          </p>

          <SearchForm
            value={playerName}
            game={game}
            isLoading={isLoading}
            onChange={setPlayerName}
            onGameChange={handleGameChange}
            onSubmit={handleSubmit}
          />

          {error && <div className="error-message">{error}</div>}

          {data && submittedName && (
            <PlayerCard name={submittedName} player={data} game={game} />
          )}
        </div>
      </section>

      <Instructions />

      <footer className="footer">
        <p>© 2025 MK World MMR Overlay - Built for the Mario Kart Community</p>
      </footer>
    </div>
  );
}
