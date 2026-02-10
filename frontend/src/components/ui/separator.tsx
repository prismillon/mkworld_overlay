import type { ComponentProps } from "react";

export function Separator({ className = "", ...props }: ComponentProps<"hr">) {
  return <hr className={`separator ${className}`} {...props} />;
}
