import type { ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`input ${className}`} {...props} />;
}
