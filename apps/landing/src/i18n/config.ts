export const languages = {
  "pt-BR": {
    code: "pt-BR",
    name: "Português",
    flag: "🇧🇷",
  },
  en: {
    code: "en",
    name: "English",
    flag: "🇺🇸",
  },
} as const;

export const defaultLang = "pt-BR" as const;
export type Lang = keyof typeof languages;

export function getLangFromUrl(url: URL): Lang {
  const pathname = url.pathname;
  const langPath = pathname.split("/")[1];

  if (langPath === "en") {
    return "en";
  }

  return defaultLang;
}

export function getPathWithLang(path: string, lang: Lang): string {
  if (lang === defaultLang) {
    return path;
  }
  return `/${lang}${path}`;
}
