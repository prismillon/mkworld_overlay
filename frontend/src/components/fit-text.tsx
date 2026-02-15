import { useRef, useLayoutEffect, useState, type ReactNode } from "react";

interface FitTextProps {
  children: ReactNode;
  className?: string;
  minScale?: number;
  padding?: number;
  fitHeight?: boolean;
}

export function FitText({
  children,
  className,
  minScale = 0.35,
  padding = 0.92,
  fitHeight = false,
}: FitTextProps) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    inner.style.transform = "none";

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

        const s = Math.min(Math.max(ratio * padding, minScale), 1);
        setScale(s);
        inner.style.transform = s !== 1 ? `scale(${s})` : "none";
      } else {
        setScale(1);
        inner.style.transform = "none";
      }
    };

    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [children, minScale, padding, fitHeight]);

  return (
    <span ref={outerRef} className={`fit-text ${className ?? ""}`}>
      <span
        ref={innerRef}
        className="fit-text__inner"
        style={{
          visibility: scale === null ? "hidden" : "visible",
          transform:
            scale !== null && scale !== 1 ? `scale(${scale})` : undefined,
        }}
      >
        {children}
      </span>
    </span>
  );
}
