import { useState } from "react";
import type { GameMode } from "../types";
import { usePlayer } from "../hooks";
import { SearchForm, PlayerCard, Instructions } from "../components";
import { GAME_MODES } from "../constants";

export function Home() {
  const [playerName, setPlayerName] = useState("");
  const [game, setGame] = useState<GameMode>(GAME_MODES.DEFAULT);
  const [submittedName, setSubmittedName] = useState("");
  const primary = usePlayer();
  const secondary = usePlayer();

  const handleSubmit = async () => {
    const name = playerName.trim();
    if (!name) return;

    setSubmittedName(name);
    if (game === "both") {
      await Promise.all([
        primary.fetch(name, "24p"),
        secondary.fetch(name, "12p"),
      ]);
    } else {
      await primary.fetch(name, game);
    }
  };

  const handleGameChange = async (newGame: GameMode) => {
    setGame(newGame);
    if (submittedName) {
      if (newGame === "both") {
        await Promise.all([
          primary.fetch(submittedName, "24p"),
          secondary.fetch(submittedName, "12p"),
        ]);
      } else {
        await primary.fetch(submittedName, newGame);
      }
    }
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <header className="hero__header">
            <h1>MK World MMR Overlay</h1>
          </header>

          <SearchForm
            value={playerName}
            game={game}
            isLoading={primary.isLoading || secondary.isLoading}
            onChange={setPlayerName}
            onGameChange={handleGameChange}
            onSubmit={handleSubmit}
          />

          {(primary.error || secondary.error) && (
            <div className="error-message">
              {primary.error || secondary.error}
            </div>
          )}

          {primary.data && submittedName && (
            <PlayerCard
              name={submittedName}
              player={primary.data}
              game={game}
              player12p={game === "both" ? secondary.data : undefined}
            />
          )}
        </div>
      </section>

      {!primary.data && (
        <section className="how-it-works">
          <div className="how-it-works__content">
            <h2 className="how-it-works__title">How It Works</h2>
            <div className="how-it-works__steps">
              <div className="how-it-works__step">
                <div className="how-it-works__step-number">1</div>
                <h3>Search</h3>
                <p>Enter your MK World player name</p>
              </div>
              <div className="how-it-works__step">
                <div className="how-it-works__step-number">2</div>
                <h3>Customize</h3>
                <p>Pick which stats to show on your overlay</p>
              </div>
              <div className="how-it-works__step">
                <div className="how-it-works__step-number">3</div>
                <h3>Copy URL</h3>
                <p>Add the URL as a Browser Source in OBS</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <Instructions />

      <footer className="footer">
        <p>MK World MMR Overlay</p>
      </footer>
    </div>
  );
}
