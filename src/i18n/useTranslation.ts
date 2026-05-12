import { useContext } from "react";
import type { LocalizedText } from "@/i18n";
import { LanguageContext } from "@/i18n/translationContext";

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
