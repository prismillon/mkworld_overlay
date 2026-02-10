import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import ReactCountryFlag from "react-country-flag";
import type { Player, OverlayField, GameMode } from "../types";
import { OVERLAY_FIELDS } from "../constants";
import { FitText } from "./fit-text";

interface MmrBadgeProps {
  mmr: number | null;
  rankIconUrl?: string;
  isLoading?: boolean;
  hasError?: boolean;
  /** When set, enables cycling mode through selected extra fields */
  fields?: OverlayField[];
  /** Full player data, needed for cycling mode */
  player?: Player | null;
  /** Current game mode — used to display source label */
  game?: GameMode;
  /** 12p player data for "both" mode */
  player12p?: Player | null;
  /** 12p MMR for "both" mode */
  mmr12p?: number | null;
  /** 12p rank icon for "both" mode */
  rankIconUrl12p?: string;
}

/** Duration each stat is shown before transitioning (ms) */
const CYCLE_DISPLAY_MS = 4_000;
/** Scroll animation duration (seconds) */
const SCROLL_DURATION = 0.8;

interface StatSlide {
  label: string;
  value: string;
  isMmr: boolean;
  field?: OverlayField;
  countryCode?: string;
  inlineLabel?: string;
  colorClass?: string;
  source?: string;
  rankIconUrl?: string;
}

/** Fields that display inline with a short label prefix */
const INLINE_LABELS: Partial<Record<OverlayField, string>> = {
  gainLossLastTen: "Last 10:",
  overallRank: "Rank:",
  averageScore: "Avg:",
  partnerAvg: "P. Avg:",
};

function formatFieldValue(player: Player, field: OverlayField): string {
  let v = player[field];
  if (field === "maxMmr" && (v === undefined || v === null)) {
    v = player.mmr;
  }
  if (v === undefined || v === null) return "N/A";
  if (field === "winRate" && typeof v === "number")
    return `${parseFloat((v * 100).toFixed(1))}%`;
  if (field === "averageScore" && typeof v === "number")
    return String(parseFloat(v.toFixed(2)));
  if (field === "partnerAvg" && typeof v === "number")
    return String(parseFloat(v.toFixed(2)));
  if (field === "gainLossLastTen" && typeof v === "number") {
    return v >= 0 ? `+${v}` : `${v}`;
  }
  if (field === "lastDiff" && typeof v === "number") {
    return v >= 0 ? `+${v}` : `${v}`;
  }
  if (field === "overallRank" && v !== undefined) return `#${v}`;
  return String(v);
}

function fieldLabel(key: OverlayField): string {
  return OVERLAY_FIELDS.find((f) => f.key === key)?.label ?? key;
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
  const displayValue =
    isLoading && mmr === null
      ? "Loading..."
      : hasError && mmr === null
        ? "Error"
        : mmr !== null
          ? Math.round(mmr).toString()
          : "N/A";

  const isBoth = game === "both";
  /** Label shown for the current game mode source */
  const sourceLabel =
    game === "12p" ? "[12p]" : game === "both" ? undefined : "[24p]";

  // --- cycling mode ---
  // Enable cycling when extra fields (excluding lastDiff) are selected, OR when "both" mode is active
  const lastDiffSelected = !!(fields && fields.includes("lastDiff"));
  const cycleFields = fields?.filter((f) => f !== "lastDiff");
  const hasExtraFields = !!(cycleFields && cycleFields.length > 0);
  const cyclingEnabled =
    !!(hasExtraFields && player) || !!(isBoth && player && player12p);

  function buildSlidesForPlayer(
    p: Player,
    pMmr: number | null,
    src: string,
    pRankIconUrl?: string,
  ): StatSlide[] {
    const mmrSlide: StatSlide = {
      label: "MMR",
      value: pMmr !== null ? Math.round(pMmr).toString() : "N/A",
      isMmr: true,
      source: src,
      rankIconUrl: pRankIconUrl,
    };
    const extras: StatSlide[] = (cycleFields ?? []).map((f) => {
      const raw = p[f];
      let colorClass: string | undefined;
      if (f === "gainLossLastTen" && typeof raw === "number") {
        colorClass = raw >= 0 ? "gain-positive" : "gain-negative";
      }
      return {
        label: fieldLabel(f),
        value: formatFieldValue(p, f),
        isMmr: false,
        field: f,
        countryCode: f === "name" ? p.countryCode : undefined,
        inlineLabel: INLINE_LABELS[f],
        colorClass,
        source: src,
      };
    });
    return [mmrSlide, ...extras];
  }

  const slides: StatSlide[] = useMemo(() => {
    if (!cyclingEnabled || !player) return [];

    if (isBoth && player12p) {
      if (hasExtraFields) {
        const slides24p = buildSlidesForPlayer(
          player,
          mmr,
          "[24p]",
          rankIconUrl,
        );
        const slides12p = buildSlidesForPlayer(
          player12p,
          mmr12p ?? null,
          "[12p]",
          rankIconUrl12p,
        );
        return [...slides24p, ...slides12p];
      }
      // Both mode, MMR-only: just cycle the two MMR slides
      return [
        {
          label: "MMR",
          value: mmr !== null ? Math.round(mmr).toString() : "N/A",
          isMmr: true,
          source: "[24p]",
          rankIconUrl,
        },
        {
          label: "MMR",
          value: mmr12p != null ? Math.round(mmr12p).toString() : "N/A",
          isMmr: true,
          source: "[12p]",
          rankIconUrl: rankIconUrl12p,
        },
      ];
    }

    const src = game === "12p" ? "[12p]" : "[24p]";
    return buildSlidesForPlayer(player, mmr, src, rankIconUrl);
  }, [
    cyclingEnabled,
    player,
    mmr,
    fields,
    isBoth,
    player12p,
    mmr12p,
    game,
    rankIconUrl,
    rankIconUrl12p,
    hasExtraFields,
  ]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!cyclingEnabled || slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, CYCLE_DISPLAY_MS);

    return () => clearInterval(timer);
  }, [cyclingEnabled, slides.length]);

  // Reset index when slides change
  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  // --- Compute lastDiff display value for simple & cycling modes ---
  function formatLastDiff(
    p: Player | null | undefined,
  ): { value: string; colorClass: string } | null {
    if (!lastDiffSelected || !p) return null;
    const raw = p.lastDiff;
    if (raw === undefined || raw === null) return null;
    const value =
      typeof raw === "number" ? (raw >= 0 ? `+${raw}` : `${raw}`) : String(raw);
    const colorClass =
      typeof raw === "number"
        ? raw >= 0
          ? "gain-positive"
          : "gain-negative"
        : "";
    return { value, colorClass };
  }

  // --- simple mode (no extra fields, single game mode) ---
  if (!cyclingEnabled) {
    const lastDiff = formatLastDiff(player);
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
            <span className="mmr-badge__digits">{displayValue}</span>
            {sourceLabel && (
              <div className="mmr-badge__source-col">
                <span className="mmr-badge__source-label">{sourceLabel}</span>
                {lastDiff && (
                  <span
                    className={`mmr-badge__last-diff ${lastDiff.colorClass}`}
                  >
                    {lastDiff.value}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- cycling mode rendering ---
  const current = slides[activeIndex] ?? slides[0];
  const currentRankIcon = current?.rankIconUrl ?? rankIconUrl;

  return (
    <div className="mmr-badge mmr-badge--cycling">
      <div className="mmr-badge__content">
        {/* Fixed rank icon on the left */}
        <div className="mmr-badge__fixed-icon">
          {isBoth ? (
            <AnimatePresence mode="popLayout">
              {currentRankIcon && (
                <motion.img
                  key={currentRankIcon}
                  src={currentRankIcon}
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
        </div>

        {/* Cycling text area — positioned over the text region */}
        <div className="mmr-badge__cycle-text">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeIndex}
              initial={{ y: -60, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: 60, opacity: 0, filter: "blur(4px)" }}
              transition={{
                duration: SCROLL_DURATION,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mmr-badge__cycle-slide"
            >
              {current.isMmr ? (
                <span className="mmr-badge__cycle-value">{current.value}</span>
              ) : current.field === "name" ? (
                <FitText className="mmr-badge__cycle-value mmr-badge__cycle-value--extra mmr-badge__cycle-name">
                  {current.value}
                  {current.countryCode && (
                    <ReactCountryFlag
                      countryCode={current.countryCode}
                      svg
                      className="mmr-badge__flag"
                    />
                  )}
                </FitText>
              ) : current.inlineLabel ? (
                <FitText className="mmr-badge__cycle-value mmr-badge__cycle-value--extra mmr-badge__cycle-inline">
                  <span className="mmr-badge__cycle-inline-label">
                    {current.inlineLabel}
                  </span>{" "}
                  <span className={current.colorClass ?? ""}>
                    {current.value}
                  </span>
                </FitText>
              ) : (
                <FitText
                  className="mmr-badge__cycle-value mmr-badge__cycle-value--extra"
                  fitHeight
                  padding={0.75}
                >
                  <div className="mmr-badge__cycle-stat">
                    <span className="mmr-badge__cycle-label">
                      {current.label}
                    </span>
                    <span
                      className={`mmr-badge__cycle-stat-value ${current.colorClass ?? ""}`}
                    >
                      {current.value}
                    </span>
                  </div>
                </FitText>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Source label — fixed on the right, mirrors the rank icon */}
        <div className="mmr-badge__fixed-source">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={current.source}
              className="mmr-badge__source-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {current.source}
            </motion.span>
          </AnimatePresence>

          {/* Last diff shown below source label, only on MMR slides */}
          <AnimatePresence mode="wait">
            {lastDiffSelected &&
              current.isMmr &&
              (() => {
                const diffPlayer =
                  isBoth && current.source === "[12p]" ? player12p : player;
                const diff = formatLastDiff(diffPlayer);
                if (!diff) return null;
                return (
                  <motion.span
                    key={`diff-${current.source}`}
                    className={`mmr-badge__last-diff ${diff.colorClass}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {diff.value}
                  </motion.span>
                );
              })()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
