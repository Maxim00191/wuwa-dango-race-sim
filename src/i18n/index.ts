import { enDictionary } from "@/i18n/dictionaries/en";
import { zhCnDictionary } from "@/i18n/dictionaries/zh-CN";
import type {
  AppLanguage,
  CharacterParam,
  DirectionParam,
  LocalizedParam,
  LocalizedText,
  TranslatableContent,
  TranslationDictionary,
  TranslationParams,
} from "@/i18n/types";
import { isLocalizedText } from "@/i18n/types";

export * from "@/i18n/types";

export const LANGUAGE_STORAGE_KEY = "wuwa-dango-race-sim-language";

export const DEFAULT_LANGUAGE: AppLanguage = "zh-CN";

const dictionaries: Record<AppLanguage, TranslationDictionary> = {
  en: enDictionary,
  "zh-CN": zhCnDictionary,
};

function isDictionaryBranch(
  value: string | TranslationDictionary | undefined
): value is TranslationDictionary {
  return Boolean(value) && typeof value === "object";
}

function resolveDictionaryValue(
  dictionary: TranslationDictionary,
  key: string
): string | null {
  const segments = key.split(".");
  let current: string | TranslationDictionary | undefined = dictionary;
  for (const segment of segments) {
    if (!isDictionaryBranch(current)) {
      return null;
    }
    current = current[segment];
  }
  return typeof current === "string" ? current : null;
}

export function isAppLanguage(value: string): value is AppLanguage {
  return value === "en" || value === "zh-CN";
}

export function detectBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const candidate = navigator.language?.trim().toLowerCase();
  if (!candidate) {
    return DEFAULT_LANGUAGE;
  }
  if (candidate.startsWith("zh")) {
    return "zh-CN";
  }
  if (candidate.startsWith("en")) {
    return "en";
  }
  return DEFAULT_LANGUAGE;
}

export function readStoredLanguage(): AppLanguage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored && isAppLanguage(stored) ? stored : null;
}

export function resolveInitialLanguage(): AppLanguage {
  return readStoredLanguage() ?? detectBrowserLanguage();
}

function resolveParam(
  language: AppLanguage,
  param: LocalizedParam
): string {
  if (typeof param === "string" || typeof param === "number") {
    return String(param);
  }
  if ((param as CharacterParam).type === "character") {
    const characterId = (param as CharacterParam).id;
    return translate(language, `characters.${characterId}`);
  }
  const direction = (param as DirectionParam).value;
  return translate(language, `common.directions.${direction}`);
}

function interpolate(
  template: string,
  language: AppLanguage,
  params?: TranslationParams
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_match, token) => {
    const value = params[token];
    if (value === undefined) {
      return `{${token}}`;
    }
    return resolveParam(language, value);
  });
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: TranslationParams
): string {
  const dictionary = dictionaries[language];
  const template =
    resolveDictionaryValue(dictionary, key) ??
    resolveDictionaryValue(dictionaries[DEFAULT_LANGUAGE], key) ??
    key;
  return interpolate(template, language, params);
}

export function translateContent(
  language: AppLanguage,
  content: TranslatableContent | null | undefined
): string {
  if (!content) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  return translate(language, content.key, content.params);
}

export function ensureLocalizedText(
  content: LocalizedText | string
): LocalizedText {
  return isLocalizedText(content) ? content : { key: content };
}
