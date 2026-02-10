import type { ComponentProps } from "react";

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label?: string;
}

export function Checkbox({
  label,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  return (
    <label className={`checkbox ${className}`} htmlFor={id}>
      <input type="checkbox" id={id} className="checkbox__input" {...props} />
      <span className="checkbox__indicator" />
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  );
}
