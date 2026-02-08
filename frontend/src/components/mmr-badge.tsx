interface MmrBadgeProps {
  mmr: number | null;
  rankIconUrl?: string;
  isLoading?: boolean;
  hasError?: boolean;
}

export function MmrBadge({
  mmr,
  rankIconUrl,
  isLoading,
  hasError,
}: MmrBadgeProps) {
  const displayValue =
    isLoading && mmr === null
      ? "Loading..."
      : hasError && mmr === null
        ? "Error"
        : mmr !== null
          ? Math.round(mmr).toString()
          : "N/A";

  return (
    <div
      className={`mmr-badge ${hasError && mmr === null ? "mmr-badge--error" : ""}`}
    >
      <div className="mmr-badge__content">
        <div
          className={`mmr-badge__value ${isLoading && mmr === null ? "mmr-badge__value--loading" : ""}`}
        >
          {rankIconUrl && (
            <img src={rankIconUrl} alt="Rank" className="mmr-badge__icon" />
          )}
          <span>{displayValue}</span>
        </div>
      </div>
    </div>
  );
}
