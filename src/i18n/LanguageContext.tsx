import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CHARACTER_BY_ID } from "@/services/characters";
import {
  LANGUAGE_STORAGE_KEY,
  resolveInitialLanguage,
  translate,
  translateContent,
  type AppLanguage,
  type TranslatableContent,
  type TranslationParams,
} from "@/i18n";
import {
  LanguageContext,
  type LanguageContextValue,
} from "@/i18n/translationContext";

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<AppLanguage>(() =>
    resolveInitialLanguage()
  );

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) =>
      translate(language, key, params),
    [language]
  );

  const tText = useCallback(
    (content: TranslatableContent | null | undefined) =>
      translateContent(language, content),
    [language]
  );

  const getCharacterName = useCallback(
    (id: string) => {
      const key = `characters.${id}`;
      const resolved = translate(language, key);
      if (resolved !== key) {
        return resolved;
      }
      return CHARACTER_BY_ID[id]?.displayName || id;
    },
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, "meta.title");
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      tText,
      getCharacterName,
    }),
    [getCharacterName, language, setLanguage, t, tText]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
