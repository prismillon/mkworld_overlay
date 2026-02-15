import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import ReactCountryFlag from "react-country-flag";
import type { Player, OverlayField, GameMode } from "../types";
import { FitText } from "./fit-text";

interface MmrBadgeProps {
  mmr: number | null;
  rankIconUrl?: string;
  isLoading?: boolean;
  hasError?: boolean;
  fields?: OverlayField[];
  player?: Player | null;
  game?: GameMode;
  player12p?: Player | null;
  mmr12p?: number | null;
  rankIconUrl12p?: string;
}

const CYCLE_MS = 4_000;
const SCROLL_DURATION = 0.8;

interface Slide {
  key: string;
  label?: string;
  value: string;
  extra?: boolean;
  colorClass?: string;
  countryCode?: string;
  source?: string;
  rankIconUrl?: string;
  lastDiff?: string;
  lastDiffColor?: string;
}

function formatField(player: Player, field: OverlayField): string {
  let v = player[field];
  if (field === "maxMmr" && v == null) v = player.mmr;
  if (v == null) return "N/A";

  if (typeof v === "number") {
    switch (field) {
      case "winRate":
        return `${parseFloat((v * 100).toFixed(1))}%`;
      case "averageScore":
      case "partnerAvg":
      case "averageLastTen":
        return String(parseFloat(v.toFixed(2)));
      case "gainLossLastTen":
      case "lastDiff":
        return v >= 0 ? `+${v}` : `${v}`;
      case "overallRank":
        return `#${v}`;
    }
  }
  if (field === "overallRank") return `#${v}`;
  return String(v);
}

const FIELD_LABELS: Record<OverlayField, string> = {
  name: "Name",
  maxMmr: "Peak",
  overallRank: "Rank",
  eventsPlayed: "Events",
  winRate: "Win Rate",
  winLossLastTen: "W/L (10)",
  gainLossLastTen: "+/- (10)",
  largestGain: "Lg. Gain",
  averageScore: "Avg",
  averageLastTen: "Avg (10)",
  partnerAvg: "P. Avg",
  lastDiff: "Last Diff",
};

function fieldLabel(key: OverlayField): string {
  return FIELD_LABELS[key] ?? key;
}

function diffColor(v: number): string {
  return v >= 0 ? "gain-positive" : "gain-negative";
}

function buildSlides(
  p: Player,
  pMmr: number | null,
  src: string,
  pRankIcon?: string,
  cycleFields: OverlayField[] = [],
  showLastDiff = false,
): Slide[] {
  const mmrValue = pMmr != null ? Math.round(pMmr).toString() : "N/A";
  const diff =
    showLastDiff && typeof p.lastDiff === "number" ? p.lastDiff : null;

  const mmrSlide: Slide = {
    key: `mmr-${src}`,
    value: mmrValue,
    source: src,
    rankIconUrl: pRankIcon,
    lastDiff: diff != null ? (diff >= 0 ? `+${diff}` : `${diff}`) : undefined,
    lastDiffColor: diff != null ? diffColor(diff) : undefined,
  };

  const extras: Slide[] = cycleFields.map((f) => {
    const raw = p[f];
    return {
      key: `${f}-${src}`,
      label: f === "name" ? undefined : fieldLabel(f),
      value: formatField(p, f),
      extra: true,
      colorClass:
        (f === "gainLossLastTen" || f === "lastDiff") && typeof raw === "number"
          ? diffColor(raw)
          : undefined,
      countryCode: f === "name" ? p.countryCode : undefined,
      source: src,
      rankIconUrl: pRankIcon,
    };
  });

  return [mmrSlide, ...extras];
}

export function MmrBadge({
  mmr,
  rankIconUrl,
  isLoading,
  hasError,
  fields,
  player,
  game,
  player12p,
  mmr12p,
  rankIconUrl12p,
}: MmrBadgeProps) {
  const isBoth = game === "both";
  const showLastDiff = !!fields?.includes("lastDiff");
  const cycleFields = useMemo(
    () => fields?.filter((f) => f !== "lastDiff") ?? [],
    [fields],
  );

  const slides = useMemo(() => {
    if (!player) return [];

    if (isBoth && player12p) {
      const slides24p = buildSlides(
        player,
        mmr,
        "24p",
        rankIconUrl,
        cycleFields,
        showLastDiff,
      );
      const slides12p = buildSlides(
        player12p,
        mmr12p ?? null,
        "12p",
        rankIconUrl12p,
        cycleFields.filter((f) => f !== "name"),
        showLastDiff,
      );
      return [...slides24p, ...slides12p];
    }

    const src = game === "12p" ? "12p" : "24p";
    return buildSlides(
      player,
      mmr,
      src,
      rankIconUrl,
      cycleFields,
      showLastDiff,
    );
  }, [
    player,
    mmr,
    isBoth,
    player12p,
    mmr12p,
    game,
    rankIconUrl,
    rankIconUrl12p,
    cycleFields,
    showLastDiff,
  ]);

  const cycling = slides.length > 1;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!cycling) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % slides.length),
      CYCLE_MS,
    );
    return () => clearInterval(t);
  }, [cycling, slides.length]);

  useEffect(() => setIdx(0), [slides.length]);

  const staticValue =
    isLoading && mmr === null
      ? "Loading..."
      : hasError && mmr === null
        ? "Error"
        : mmr != null
          ? Math.round(mmr).toString()
          : "N/A";

  const current = cycling ? (slides[idx] ?? slides[0]) : null;
  const icon = current?.rankIconUrl ?? rankIconUrl;
  const sourceLabel = cycling
    ? current?.source
    : game === "12p"
      ? "12p"
      : game === "both"
        ? undefined
        : "24p";

  return (
    <div
      className={`mmr-badge ${hasError && mmr === null ? "mmr-badge--error" : ""}`}
    >
      <div className="mmr-badge__row">
        {cycling && isBoth ? (
          <AnimatePresence mode="popLayout">
            {icon && (
              <motion.img
                key={icon}
                src={icon}
                alt="Rank"
                className="mmr-badge__icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>
        ) : (
          rankIconUrl && (
            <img src={rankIconUrl} alt="Rank" className="mmr-badge__icon" />
          )
        )}

        <div
          className={`mmr-badge__value ${cycling ? "mmr-badge__value--cycling" : ""}`}
        >
          {cycling && current ? (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={idx}
                className="mmr-badge__slide"
                initial={{ y: -60, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: 60, opacity: 0, filter: "blur(4px)" }}
                transition={{
                  duration: SCROLL_DURATION,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {current.extra ? (
                  <FitText className="mmr-badge__slide-fit">
                    {current.label && (
                      <span className="mmr-badge__label">{current.label}:</span>
                    )}
                    <span
                      className={`mmr-badge__text mmr-badge__text--extra ${current.colorClass ?? ""}`}
                    >
                      {current.value}
                      {current.countryCode && " "}
                      {current.countryCode && (
                        <ReactCountryFlag
                          countryCode={current.countryCode}
                          svg
                          className="mmr-badge__flag"
                        />
                      )}
                    </span>
                  </FitText>
                ) : (
                  <span className="mmr-badge__text">{current.value}</span>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <span className="mmr-badge__text">{staticValue}</span>
          )}
        </div>

        {(sourceLabel || (current?.lastDiff && showLastDiff)) && (
          <div className="mmr-badge__source">
            {sourceLabel &&
              (cycling ? (
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={sourceLabel}
                    className="mmr-badge__source-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {sourceLabel}
                  </motion.span>
                </AnimatePresence>
              ) : (
                <span className="mmr-badge__source-text">{sourceLabel}</span>
              ))}
            {showLastDiff && cycling && current?.lastDiff && (
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={`diff-${current.key}`}
                  className={`mmr-badge__diff ${current.lastDiffColor ?? ""}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {current.lastDiff}
                </motion.span>
              </AnimatePresence>
            )}
            {showLastDiff &&
              !cycling &&
              player &&
              typeof player.lastDiff === "number" && (
                <span
                  className={`mmr-badge__diff ${diffColor(player.lastDiff)}`}
                >
                  {player.lastDiff >= 0
                    ? `+${player.lastDiff}`
                    : player.lastDiff}
                </span>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
