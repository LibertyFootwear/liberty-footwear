"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { translations, detectLang, type Lang, type T } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lf_lang", l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as T }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
