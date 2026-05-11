import {
  createContext,
  useCallback,
  useContext,
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
  type LocalizedText,
  type TranslatableContent,
  type TranslationParams,
} from "@/i18n";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (nextLanguage: AppLanguage) => void;
  t: (key: string, params?: TranslationParams) => string;
  tText: (content: TranslatableContent | null | undefined) => string;
  getCharacterName: (id: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

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

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return context;
}

export function useLocalizedText(
  content: LocalizedText | string | null | undefined
): string {
  const { tText } = useTranslation();
  return tText(content);
}
