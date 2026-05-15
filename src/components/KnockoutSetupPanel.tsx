import { DangoPicker } from "@/components/DangoPicker";
import {
  getKnockoutLineupGroupDefinition,
  type KnockoutGroupKey,
} from "@/constants/knockoutGroups";
import type { KnockoutTournamentProgress } from "@/hooks/useKnockoutTournament";
import { useTranslation } from "@/i18n/useTranslation";
import { KNOCKOUT_PHASE_SEQUENCE } from "@/services/knockout/bracket";
import type { BasicCharacterDefinition, DangoId } from "@/types/game";

type KnockoutSetupPanelProps = {
  rosterBasics: BasicCharacterDefinition[];
  groupAIds: DangoId[];
  groupBIds: DangoId[];
  onSetGroupLineup: (group: KnockoutGroupKey, ids: DangoId[]) => void;
  onToggleGroupBasicId: (group: KnockoutGroupKey, id: DangoId) => void;
  onClearGroupSelections: (group: KnockoutGroupKey) => void;
  progress: KnockoutTournamentProgress;
  lineupsReady: boolean;
  isComplete: boolean;
  onStartTournament: () => void;
  onAdvanceTournament: () => void;
  onReset: () => void;
  controlsLocked: boolean;
};

type KnockoutGroupPickerSectionProps = {
  group: KnockoutGroupKey;
  rosterBasics: BasicCharacterDefinition[];
  selectedBasicIds: DangoId[];
  otherLineupBasicIds: DangoId[];
  onSetGroupLineup: (group: KnockoutGroupKey, ids: DangoId[]) => void;
  onToggleGroupBasicId: (group: KnockoutGroupKey, id: DangoId) => void;
  onClearGroupSelections: (group: KnockoutGroupKey) => void;
};

function KnockoutGroupPickerSection({
  group,
  rosterBasics,
  selectedBasicIds,
  otherLineupBasicIds,
  onSetGroupLineup,
  onToggleGroupBasicId,
  onClearGroupSelections,
}: KnockoutGroupPickerSectionProps) {
  const { t } = useTranslation();
  const groupDefinition = getKnockoutLineupGroupDefinition(group);
  const eyebrowClassName =
    group === "groupA"
      ? "text-amber-600 dark:text-amber-300"
      : "text-sky-600 dark:text-sky-300";
  const eyebrowKey =
    group === "groupA"
      ? "knockout.setup.groupA.eyebrow"
      : "knockout.setup.groupB.eyebrow";
  const titleKey =
    group === "groupA"
      ? "knockout.setup.groupA.title"
      : "knockout.setup.groupB.title";

  return (
    <section className="space-y-3">
      <GroupSectionHeader
        eyebrowKey={eyebrowKey}
        titleKey={titleKey}
        eyebrowClassName={eyebrowClassName}
        t={t}
      />
      <DangoPicker
        rosterBasics={rosterBasics}
        selectedBasicIds={selectedBasicIds}
        otherLineupBasicIds={otherLineupBasicIds}
        lineupGroupDefinitions={[groupDefinition]}
        onSetLineup={(ids) => onSetGroupLineup(group, ids)}
        onToggleBasicId={(id) => onToggleGroupBasicId(group, id)}
        onClearSelections={() => onClearGroupSelections(group)}
      />
    </section>
  );
}

function GroupSectionHeader({
  eyebrowKey,
  titleKey,
  eyebrowClassName,
  t,
}: {
  eyebrowKey: string;
  titleKey: string;
  eyebrowClassName: string;
  t: (key: string) => string;
}) {
  return (
    <div>
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${eyebrowClassName}`}
      >
        {t(eyebrowKey)}
      </p>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
        {t(titleKey)}
      </h3>
    </div>
  );
}

export function KnockoutSetupPanel({
  rosterBasics,
  groupAIds,
  groupBIds,
  onSetGroupLineup,
  onToggleGroupBasicId,
  onClearGroupSelections,
  progress,
  lineupsReady,
  isComplete,
  onStartTournament,
  onAdvanceTournament,
  onReset,
  controlsLocked,
}: KnockoutSetupPanelProps) {
  const { getCharacterName, t } = useTranslation();
  const disabled = controlsLocked || !lineupsReady;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <KnockoutGroupPickerSection
          group="groupA"
          rosterBasics={rosterBasics}
          selectedBasicIds={groupAIds}
          otherLineupBasicIds={groupBIds}
          onSetGroupLineup={onSetGroupLineup}
          onToggleGroupBasicId={onToggleGroupBasicId}
          onClearGroupSelections={onClearGroupSelections}
        />
        <KnockoutGroupPickerSection
          group="groupB"
          rosterBasics={rosterBasics}
          selectedBasicIds={groupBIds}
          otherLineupBasicIds={groupAIds}
          onSetGroupLineup={onSetGroupLineup}
          onToggleGroupBasicId={onToggleGroupBasicId}
          onClearGroupSelections={onClearGroupSelections}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("knockout.setup.progress.eyebrow")}
        </p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {KNOCKOUT_PHASE_SEQUENCE.map((phase) => {
            const completed = progress.completedPhases.includes(phase);
            const active = progress.currentPhase === phase;
            return (
              <li
                key={phase}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  completed
                    ? "border-emerald-400/60 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100"
                    : active
                      ? "border-amber-400/70 bg-amber-50 text-amber-950 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-100"
                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
                }`}
              >
                {t(`knockout.phases.${phase}`)}
              </li>
            );
          })}
        </ol>
        {isComplete && progress.championBasicId ? (
          <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {t("knockout.setup.progress.champion", {
              name: getCharacterName(progress.championBasicId),
            })}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onStartTournament}
          disabled={disabled}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {t("knockout.setup.actions.start")}
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onAdvanceTournament}
          disabled={disabled || isComplete || progress.nextPhase === null}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {progress.nextPhase
            ? t("knockout.setup.actions.advance", {
                phase: t(`knockout.phases.${progress.nextPhase}`),
              })
            : t("knockout.setup.actions.advanceIdle")}
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onReset}
          disabled={controlsLocked}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:text-slate-200"
        >
          {t("knockout.setup.actions.reset")}
        </button>
      </div>
    </div>
  );
}
