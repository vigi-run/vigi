import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import enUS from "./locales/en-US";
import ptBR from "./locales/pt-BR";

// Available languages configuration
export const AVAILABLE_LANGUAGES = ["en-US", "pt-BR"];

// Initial resources
const resources = {
  "en-US": { translation: enUS },
  "pt-BR": { translation: ptBR },
};

// Initialize i18n with basic configuration
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt-BR", // Default to Portuguese if detection fails
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
