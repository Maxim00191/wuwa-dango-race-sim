import type { Attribute } from "@/types/game";

export const ATTRIBUTE_ORDER = [
  "Fusion",
  "Glacio",
  "Aero",
  "Electro",
  "Spectro",
  "Havoc",
] as const satisfies readonly Attribute[];

export const ATTRIBUTE_META: Record<
  Attribute,
  {
    labelKey: string;
    colorHex: string;
  }
> = {
  Fusion: {
    labelKey: "attributes.fusion",
    colorHex: "#f0744e",
  },
  Glacio: {
    labelKey: "attributes.glacio",
    colorHex: "#3c9fe5",
  },
  Aero: {
    labelKey: "attributes.aero",
    colorHex: "#4bdb9e",
  },
  Electro: {
    labelKey: "attributes.electro",
    colorHex: "#ad68f6",
  },
  Spectro: {
    labelKey: "attributes.spectro",
    colorHex: "#f5e26b",
  },
  Havoc: {
    labelKey: "attributes.havoc",
    colorHex: "#981853",
  },
};
