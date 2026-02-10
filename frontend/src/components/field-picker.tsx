import type { OverlayField } from "../types";
import { OVERLAY_FIELDS } from "../constants";
import { Checkbox } from "./ui";

interface FieldPickerProps {
  selected: OverlayField[];
  onChange: (fields: OverlayField[]) => void;
}

export function FieldPicker({ selected, onChange }: FieldPickerProps) {
  const toggle = (key: OverlayField) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="field-picker">
      <h3 className="field-picker__title">Extra options</h3>
      <div className="field-picker__grid">
        {OVERLAY_FIELDS.map((field) => (
          <label key={field.key} className="field-picker__item">
            <Checkbox
              checked={selected.includes(field.key)}
              onChange={() => toggle(field.key)}
            />
            <span className="field-picker__item-label">{field.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
