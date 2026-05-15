export type AppLanguage = "en" | "zh-CN";

export type LocalizedDirection = "clockwise" | "counterClockwise";

export type CharacterParam = {
  type: "character";
  id: string;
};

export type DirectionParam = {
  type: "direction";
  value: LocalizedDirection;
};

export type LexiconParam = {
  type: "lexicon";
  key: string;
};

export type LocalizedParam =
  | string
  | number
  | CharacterParam
  | DirectionParam
  | LexiconParam;

export type TranslationParams = Record<string, LocalizedParam>;

export type LocalizedText = {
  key: string;
  params?: TranslationParams;
};

export type TranslatableContent = LocalizedText | string;

export type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

export function text(
  key: string,
  params?: TranslationParams
): LocalizedText {
  return params ? { key, params } : { key };
}

export function characterParam(id: string): CharacterParam {
  return {
    type: "character",
    id,
  };
}

export function directionParam(
  value: LocalizedDirection
): DirectionParam {
  return {
    type: "direction",
    value,
  };
}

export function lexiconParam(key: string): LexiconParam {
  return {
    type: "lexicon",
    key,
  };
}

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object") {
    return false;
  }
  return typeof (value as LocalizedText).key === "string";
}
