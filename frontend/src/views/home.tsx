import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { GameMode } from "../types";
import { usePlayer } from "../hooks";
import {
  SearchForm,
  PlayerCard,
  Instructions,
  LanguageSwitcher,
} from "../components";
import { GAME_MODES } from "../constants";

export function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.onload = () => {
      (window as any).kofiWidgetOverlay?.draw("prsmxd", {
        type: "floating-chat",
        "floating-chat.donateButton.text": "Support me",
        "floating-chat.donateButton.background-color": "#ffffff",
        "floating-chat.donateButton.text-color": "#323842",
      });
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  const howItWorksSteps = t("howItWorks.steps", { returnObjects: true }) as {
    title: string;
    description: string;
  }[];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <header className="hero__header">
            <h1>{t("hero.title")}</h1>
            <LanguageSwitcher />
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
            <h2 className="how-it-works__title">{t("howItWorks.title")}</h2>
            <div className="how-it-works__steps">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="how-it-works__step">
                  <div className="how-it-works__step-number">{i + 1}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Instructions />

      <footer className="footer">
        <p>{t("footer.text")}</p>
      </footer>
    </div>
  );
}
