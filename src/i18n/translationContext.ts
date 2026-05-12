import { createContext } from "react";
import type {
  AppLanguage,
  TranslatableContent,
  TranslationParams,
} from "@/i18n";

export type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (nextLanguage: AppLanguage) => void;
  t: (key: string, params?: TranslationParams) => string;
  tText: (content: TranslatableContent | null | undefined) => string;
  getCharacterName: (id: string) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);
