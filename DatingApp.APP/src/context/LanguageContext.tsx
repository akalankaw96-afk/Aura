"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { KEYS, storage } from "@/lib/storage";
import { TRANSLATIONS, type Language, type Translations } from "@/content/translations";

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isSinhala: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLanguage: () => {},
  t: TRANSLATIONS.en,
  isSinhala: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  useEffect(() => {
    const saved = storage.get(KEYS.language);
    if (saved === "en" || saved === "si") {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    document.documentElement.lang = newLang;
    storage.set(KEYS.language, newLang);
  };

  const currentTranslations = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLanguage,
        t: currentTranslations,
        isSinhala: lang === "si",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
