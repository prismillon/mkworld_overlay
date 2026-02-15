import { useTranslation } from "react-i18next";
import type { OverlayField } from "../types";
import { OVERLAY_FIELDS } from "../constants";
import { Checkbox } from "./ui";

interface FieldPickerProps {
  selected: OverlayField[];
  onChange: (fields: OverlayField[]) => void;
}

export function FieldPicker({ selected, onChange }: FieldPickerProps) {
  const { t } = useTranslation();

  const toggle = (key: OverlayField) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="field-picker">
      <h3 className="field-picker__title">{t("fields.title")}</h3>
      <div className="field-picker__grid">
        {OVERLAY_FIELDS.map((key) => (
          <label key={key} className="field-picker__item">
            <Checkbox
              checked={selected.includes(key)}
              onChange={() => toggle(key)}
            />
            <span className="field-picker__item-label">
              {t(`fields.${key}`)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
