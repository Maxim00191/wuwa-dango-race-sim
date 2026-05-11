import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import type { CharacterDefinition, DangoId } from "@/types/game";

type DangoPickerProps = {
  rosterBasics: CharacterDefinition[];
  selectedBasicIds: DangoId[];
  onToggleBasicId: (id: DangoId) => void;
};

export function DangoPicker({
  rosterBasics,
  selectedBasicIds,
  onToggleBasicId,
}: DangoPickerProps) {
  const selectedSet = new Set(selectedBasicIds);
  const remainingSlots = ACTIVE_BASIC_DANGO_COUNT - selectedBasicIds.length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-inner shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950/50 dark:shadow-slate-950/80">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Who's running
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Pick {ACTIVE_BASIC_DANGO_COUNT} dangos you want cheering on
          </p>
          <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
            Tap faces to invite them in or out—Abby hops in as boss when you
            start.
          </p>
        </div>
        <div
          className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
            remainingSlots === 0
              ? "bg-emerald-500/15 text-emerald-800 ring-emerald-600/40 dark:text-emerald-200 dark:ring-emerald-500/40"
              : "bg-slate-200 text-slate-700 ring-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
          }`}
        >
          {selectedBasicIds.length} / {ACTIVE_BASIC_DANGO_COUNT} ready
          {remainingSlots > 0 ? ` · ${remainingSlots} spot${remainingSlots === 1 ? "" : "s"} open` : ""}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {rosterBasics.map((character) => {
          const isSelected = selectedSet.has(character.id);
          const canAdd =
            !isSelected && selectedBasicIds.length < ACTIVE_BASIC_DANGO_COUNT;
          const interactive = isSelected || canAdd;
          return (
            <button
              key={character.id}
              type="button"
              disabled={!interactive}
              onClick={() => onToggleBasicId(character.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isSelected
                  ? "bg-sky-600 text-white ring-2 ring-sky-400/60 hover:bg-sky-500"
                  : canAdd
                    ? "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    : "cursor-not-allowed border border-transparent bg-slate-100/80 text-slate-400 dark:bg-slate-900/40 dark:text-slate-600"
              }`}
            >
              {character.displayName}
            </button>
          );
        })}
      </div>
    </section>
  );
}
