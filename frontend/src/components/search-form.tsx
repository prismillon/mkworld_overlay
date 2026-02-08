import type { SubmitEvent } from "react";
import type { GameMode } from "../types";
import { Button, Input } from "./ui";
import { GAME_MODES } from "../constants";

interface SearchFormProps {
  value: string;
  game: GameMode;
  isLoading: boolean;
  onChange: (value: string) => void;
  onGameChange: (game: GameMode) => void;
  onSubmit: () => void;
}

export function SearchForm({
  value,
  game,
  isLoading,
  onChange,
  onGameChange,
  onSubmit,
}: SearchFormProps) {
  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim()) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-form__input-group">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter player name..."
          className="search-form__input"
        />
        <Button
          type="submit"
          disabled={!value.trim()}
          isLoading={isLoading}
          className="search-form__button"
        >
          Get MMR
        </Button>
      </div>
      <div className="search-form__game-toggle">
        {GAME_MODES.OPTIONS.map((mode) => (
          <label key={mode} className="search-form__toggle-option">
            <input
              type="radio"
              name="game"
              value={mode}
              checked={game === mode}
              onChange={() => onGameChange(mode as GameMode)}
            />
            <span>{mode}</span>
          </label>
        ))}
      </div>
    </form>
  );
}
