import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  isLoading?: boolean;
};

export function Button({
  children,
  isLoading,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
