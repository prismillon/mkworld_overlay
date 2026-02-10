import { useRef, useLayoutEffect, useState, type ReactNode } from "react";

interface FitTextProps {
  /** The content to render — will be scaled to fit its parent */
  children: ReactNode;
  /** Extra class names on the wrapper span */
  className?: string;
  /**
   * Minimum scale factor before we give up and clip.
   * Default: 0.35 (35 % of original size)
   */
  minScale?: number;
  /**
   * Safety margin multiplied against the computed ratio so that visual
   * overflow from text-shadow, letter-spacing, etc. doesn't clip.
   * 0.92 means the text will fill ~92 % of the available width.
   * Default: 0.92
   */
  padding?: number;
  /**
   * Also constrain by height (useful for stacked label + value layouts).
   * Default: false
   */
  fitHeight?: boolean;
}

/**
 * Renders `children` at their natural size, then measures whether they fit
 * the parent container. A uniform `transform: scale()` is applied so the
 * text fills as much space as possible (minus a small safety margin for
 * visual effects like text-shadow and letter-spacing).
 *
 * When `fitHeight` is true, both width and height are considered and the
 * smaller ratio wins.
 */
export function FitText({
  children,
  className,
  minScale = 0.35,
  padding = 0.92,
  fitHeight = false,
}: FitTextProps) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // Reset scale so we measure at natural size
    setScale(1);

    const measure = () => {
      const containerWidth = outer.clientWidth;
      const contentWidth = inner.scrollWidth;

      if (containerWidth > 0 && contentWidth > 0) {
        let ratio = containerWidth / contentWidth;

        if (fitHeight) {
          const containerHeight = outer.clientHeight;
          const contentHeight = inner.scrollHeight;
          if (containerHeight > 0 && contentHeight > 0) {
            ratio = Math.min(ratio, containerHeight / contentHeight);
          }
        }

        setScale(Math.max(ratio * padding, minScale));
      } else {
        setScale(1);
      }
    };

    // Use rAF to measure after DOM paint
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [children, minScale, padding, fitHeight]);

  return (
    <span ref={outerRef} className={`fit-text ${className ?? ""}`}>
      <span
        ref={innerRef}
        className="fit-text__inner"
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        }}
      >
        {children}
      </span>
    </span>
  );
}
