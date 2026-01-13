import { defaultLang, type Lang } from "./config";
import ptBR from "./locales/pt-BR";
import en from "./locales/en";

const translations = {
  "pt-BR": ptBR,
  en: en,
} as const;

export function useTranslations(lang: Lang = defaultLang) {
  return translations[lang];
}

export function getAlternateLanguage(currentLang: Lang): Lang {
  return currentLang === "pt-BR" ? "en" : "pt-BR";
}

export type Translations = typeof ptBR;
