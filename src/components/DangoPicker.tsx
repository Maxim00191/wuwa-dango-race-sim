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
    <section className="rounded-3xl border border-slate-700 bg-slate-950/50 p-6 shadow-inner shadow-slate-950/80">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Lineup
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            Choose {ACTIVE_BASIC_DANGO_COUNT} dangos for this scramble
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tap to add or remove. Abby always joins as boss once you start.
          </p>
        </div>
        <div
          className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
            remainingSlots === 0
              ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40"
              : "bg-slate-800 text-slate-300 ring-slate-600"
          }`}
        >
          {selectedBasicIds.length} / {ACTIVE_BASIC_DANGO_COUNT} picked
          {remainingSlots > 0 ? ` · ${remainingSlots} left` : ""}
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
                    ? "border border-slate-600 bg-slate-900 text-slate-200 hover:border-slate-400 hover:bg-slate-800"
                    : "cursor-not-allowed border border-transparent bg-slate-900/40 text-slate-600"
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
