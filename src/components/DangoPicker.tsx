import { useMemo } from "react";
import { ATTRIBUTE_META } from "@/constants/attributes";
import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n/LanguageContext";
import { colorWithAlpha } from "@/services/colorUtils";
import { groupCharactersByAttribute } from "@/services/characterGrouping";
import type { BasicCharacterDefinition, DangoId } from "@/types/game";

type DangoPickerProps = {
  rosterBasics: BasicCharacterDefinition[];
  selectedBasicIds: DangoId[];
  onToggleBasicId: (id: DangoId) => void;
  onClearSelections: () => void;
};

export function DangoPicker({
  rosterBasics,
  selectedBasicIds,
  onToggleBasicId,
  onClearSelections,
}: DangoPickerProps) {
  const { getCharacterName, t } = useTranslation();
  const { isDark } = useTheme();
  const selectedSet = new Set(selectedBasicIds);
  const remainingSlots = ACTIVE_BASIC_DANGO_COUNT - selectedBasicIds.length;
  const groupedRoster = useMemo(
    () => groupCharactersByAttribute(rosterBasics),
    [rosterBasics]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-inner shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950/50 dark:shadow-slate-950/80">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t("lineup.heading")}
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t("lineup.title", { count: ACTIVE_BASIC_DANGO_COUNT })}
          </p>
          <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
            {t("lineup.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
              remainingSlots === 0
                ? "bg-emerald-500/15 text-emerald-800 ring-emerald-600/40 dark:text-emerald-200 dark:ring-emerald-500/40"
                : "bg-slate-200 text-slate-700 ring-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
            }`}
          >
            {remainingSlots > 0
              ? t("lineup.statusOpen", {
                  selected: selectedBasicIds.length,
                  total: ACTIVE_BASIC_DANGO_COUNT,
                  remaining: remainingSlots,
                  spots:
                    remainingSlots === 1
                      ? t("lineup.spotsOne")
                      : t("lineup.spotsOther"),
                })
              : t("lineup.statusReady", {
                  selected: selectedBasicIds.length,
                  total: ACTIVE_BASIC_DANGO_COUNT,
                })}
          </div>
          <button
            type="button"
            onClick={onClearSelections}
            disabled={selectedBasicIds.length === 0}
            className="rounded-full border border-red-300 bg-red-100/95 px-4 py-2 text-xs font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-200 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-700 dark:bg-red-900/55 dark:text-red-100 dark:hover:border-red-600 dark:hover:bg-red-800/70"
          >
            {t("lineup.clear")}
          </button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {groupedRoster.map(({ attribute, characters }) => {
          const attributeMeta = ATTRIBUTE_META[attribute];
          return (
            <div
              key={attribute}
              className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/70"
              style={{
                borderTopColor: attributeMeta.colorHex,
                borderTopWidth: "3px",
                backgroundImage: `linear-gradient(180deg, ${colorWithAlpha(
                  attributeMeta.colorHex,
                  isDark ? 0.16 : 0.08
                )} 0%, transparent 42%)`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p
                    className="text-sm font-bold tracking-tight"
                    style={{ color: attributeMeta.colorHex }}
                  >
                    {t(attributeMeta.labelKey)}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    backgroundColor: colorWithAlpha(
                      attributeMeta.colorHex,
                      isDark ? 0.2 : 0.12
                    ),
                    color: attributeMeta.colorHex,
                  }}
                >
                  {characters.length}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {characters.length > 0 ? (
                  characters.map((character) => {
                    const isSelected = selectedSet.has(character.id);
                    const canAdd =
                      !isSelected &&
                      selectedBasicIds.length < ACTIVE_BASIC_DANGO_COUNT;
                    const interactive = isSelected || canAdd;

                    return (
                      <button
                        key={character.id}
                        type="button"
                        disabled={!interactive}
                        onClick={() => onToggleBasicId(character.id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                          interactive
                            ? "hover:-translate-y-0.5 hover:shadow-lg"
                            : "cursor-not-allowed"
                        } ${
                          isSelected
                            ? "text-slate-950 dark:text-slate-50"
                            : canAdd
                              ? "text-slate-800 dark:text-slate-100"
                              : "text-slate-400 dark:text-slate-600"
                        }`}
                        style={{
                          borderColor: isSelected
                            ? colorWithAlpha(attributeMeta.colorHex, 0.72)
                            : canAdd
                              ? colorWithAlpha(attributeMeta.colorHex, 0.24)
                              : "transparent",
                          backgroundColor: isSelected
                            ? colorWithAlpha(
                                attributeMeta.colorHex,
                                isDark ? 0.28 : 0.16
                              )
                            : canAdd
                              ? isDark
                                ? "rgba(15, 23, 42, 0.82)"
                                : "rgba(255, 255, 255, 0.92)"
                              : isDark
                                ? "rgba(15, 23, 42, 0.38)"
                                : "rgba(241, 245, 249, 0.84)",
                          boxShadow: isSelected
                            ? `0 0 0 1px ${colorWithAlpha(
                                attributeMeta.colorHex,
                                isDark ? 0.42 : 0.18
                              )}`
                            : "none",
                        }}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate">
                            {getCharacterName(character.id)}
                          </span>
                          <span
                            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                            style={{
                              backgroundColor: colorWithAlpha(
                                attributeMeta.colorHex,
                                isDark ? 0.2 : 0.12
                              ),
                              color: attributeMeta.colorHex,
                            }}
                          >
                            {isSelected
                              ? t("lineup.selected")
                              : canAdd
                                ? t("lineup.available")
                                : t("lineup.locked")}
                          </span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div
                    className="rounded-2xl border border-dashed px-3 py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
                    style={{
                      borderColor: colorWithAlpha(attributeMeta.colorHex, 0.3),
                      backgroundColor: colorWithAlpha(
                        attributeMeta.colorHex,
                        isDark ? 0.12 : 0.06
                      ),
                    }}
                  >
                    {t("lineup.attributeEmpty")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
