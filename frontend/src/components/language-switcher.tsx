import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "ja", label: "JA" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang =
    LANGUAGES.find((l) => i18n.language?.startsWith(l.code))?.code ?? "en";

  return (
    <div className="language-switcher">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`language-switcher__btn${currentLang === lang.code ? " language-switcher__btn--active" : ""}`}
          onClick={() => i18n.changeLanguage(lang.code)}
          aria-label={`Switch to ${lang.label}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
