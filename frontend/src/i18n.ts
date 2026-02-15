import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    initImmediate: false,
    detection: {
      order: ["navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
