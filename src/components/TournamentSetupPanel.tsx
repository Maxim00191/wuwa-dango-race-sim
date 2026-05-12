import { useEffect, useMemo, useState, type DragEvent, type KeyboardEvent } from "react";
import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import { DangoPicker } from "@/components/DangoPicker";
import { useTranslation } from "@/i18n/useTranslation";
import { useListFlipAnimation } from "@/hooks/useListFlipAnimation";
import { CHARACTER_BY_ID } from "@/services/characters";
import { getFinalStartCellIndexForPlacement } from "@/services/raceSetup";
import type { BasicCharacterDefinition, DangoId } from "@/types/game";

type TournamentSetupPanelProps = {
  rosterBasics: BasicCharacterDefinition[];
  selectedBasicIds: DangoId[];
  onSetLineup: (ids: DangoId[]) => void;
  onToggleBasicId: (id: DangoId) => void;
  onClearSelections: () => void;
  finalPlacements: DangoId[];
  preliminaryPlacements: DangoId[] | null;
  onSetFinalPlacements: (placements: DangoId[]) => void;
  onMovePlacement: (fromIndex: number, toIndex: number) => void;
  onStartPreliminary: () => void;
  onStartFinal: () => void;
  onRestorePreliminaryPlacements: () => void;
  onReset: () => void;
  controlsLocked: boolean;
};

function labelForPlacementRole(
  placementIndex: number,
  t: (key: string) => string
): string {
  if (placementIndex === 0) {
    return t("tournament.setup.finals.roles.startLine");
  }
  if (placementIndex % 2 === 1) {
    return t("tournament.setup.finals.roles.topOfStack");
  }
  return t("tournament.setup.finals.roles.bottomOfStack");
}

function placementsEqual(left: DangoId[], right: DangoId[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

function reorderPlacements(
  placements: DangoId[],
  fromIndex: number,
  insertionIndex: number
): DangoId[] {
  const normalizedTargetIndex =
    fromIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;
  if (normalizedTargetIndex === fromIndex) {
    return placements;
  }
  const next = [...placements];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return placements;
  }
  next.splice(normalizedTargetIndex, 0, moved);
  return next;
}

export function TournamentSetupPanel({
  rosterBasics,
  selectedBasicIds,
  onSetLineup,
  onToggleBasicId,
  onClearSelections,
  finalPlacements,
  preliminaryPlacements,
  onSetFinalPlacements,
  onMovePlacement,
  onStartPreliminary,
  onStartFinal,
  onRestorePreliminaryPlacements,
  onReset,
  controlsLocked,
}: TournamentSetupPanelProps) {
  const { getCharacterName, t } = useTranslation();
  const lineupComplete = selectedBasicIds.length === ACTIVE_BASIC_DANGO_COUNT;
  const canRestorePreliminary =
    preliminaryPlacements !== null &&
    preliminaryPlacements.some(
      (basicId, index) => basicId !== finalPlacements[index]
    );
  const [draggedPlacementId, setDraggedPlacementId] = useState<DangoId | null>(null);
  const [previewPlacements, setPreviewPlacements] = useState<DangoId[] | null>(null);
  const renderedPlacements = previewPlacements ?? finalPlacements;
  const previewOrderKey = useMemo(
    () => renderedPlacements.join("\u0001"),
    [renderedPlacements]
  );
  const placementListRef = useListFlipAnimation<HTMLDivElement>(previewOrderKey);

  useEffect(() => {
    setDraggedPlacementId(null);
    setPreviewPlacements(null);
  }, [controlsLocked, finalPlacements]);

  const clearDragState = () => {
    setDraggedPlacementId(null);
    setPreviewPlacements(null);
  };

  const commitPreviewPlacements = () => {
    if (!previewPlacements || placementsEqual(previewPlacements, finalPlacements)) {
      clearDragState();
      return;
    }
    onSetFinalPlacements(previewPlacements);
    clearDragState();
  };

  const updatePreviewPlacements = (insertionIndex: number) => {
    if (controlsLocked || draggedPlacementId === null) {
      return;
    }
    setPreviewPlacements((current) => {
      const basePlacements = current ?? finalPlacements;
      const fromIndex = basePlacements.indexOf(draggedPlacementId);
      if (fromIndex === -1) {
        return basePlacements;
      }
      return reorderPlacements(basePlacements, fromIndex, insertionIndex);
    });
  };

  const handlePlacementDragStart = (
    event: DragEvent<HTMLDivElement>,
    basicId: DangoId
  ) => {
    if (controlsLocked) {
      return;
    }
    setDraggedPlacementId(basicId);
    setPreviewPlacements(finalPlacements);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", basicId);
  };

  const handlePlacementDragOver = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    if (controlsLocked || draggedPlacementId === null) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    const insertAfter = event.clientY > bounds.top + bounds.height / 2;
    updatePreviewPlacements(
      Math.min(index + (insertAfter ? 1 : 0), renderedPlacements.length)
    );
  };

  const handlePlacementDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handlePlacementKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    if (controlsLocked) {
      return;
    }
    if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault();
      onMovePlacement(index, index - 1);
    }
    if (
      event.key === "ArrowDown" &&
      index < finalPlacements.length - 1
    ) {
      event.preventDefault();
      onMovePlacement(index, index + 1);
    }
  };

  return (
    <div className="space-y-6">
      <DangoPicker
        rosterBasics={rosterBasics}
        selectedBasicIds={selectedBasicIds}
        onSetLineup={onSetLineup}
        onToggleBasicId={onToggleBasicId}
        onClearSelections={onClearSelections}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950/55 dark:shadow-slate-950/50">
          <div className="space-y-2">
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t("tournament.setup.preliminary.eyebrow")}
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {t("tournament.setup.preliminary.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("tournament.setup.preliminary.description")}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStartPreliminary}
              disabled={!lineupComplete || controlsLocked}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/35 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            >
              {t("tournament.setup.preliminary.start")}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-600"
            >
              {t("tournament.setup.preliminary.reset")}
            </button>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            {preliminaryPlacements ? (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900 dark:text-slate-50">
                  {t("tournament.setup.preliminary.lockedTitle")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {preliminaryPlacements.map((basicId, index) => (
                    <span
                      key={`prelim-${basicId}`}
                      className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-100"
                    >
                      #{index + 1} {getCharacterName(basicId)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p>
                {t("tournament.setup.preliminary.empty")}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950/55 dark:shadow-slate-950/50">
          <div className="space-y-2">
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t("tournament.setup.finals.eyebrow")}
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {t("tournament.setup.finals.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("tournament.setup.finals.description")}
            </p>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-violet-300 bg-violet-50/70 px-4 py-3 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
            {t("tournament.setup.finals.helper")}
          </div>
          <div
            ref={placementListRef}
            className="mt-4 space-y-2"
            role="list"
            aria-label={t("tournament.setup.finals.ariaLabel")}
          >
            {renderedPlacements.map((basicId, index) => {
              const character = CHARACTER_BY_ID[basicId];
              const startCell = getFinalStartCellIndexForPlacement(index);
              const isDragged = draggedPlacementId === basicId;
              return (
                <div
                  key={`final-${basicId}`}
                  data-flip-item={basicId}
                >
                  <div
                    role="listitem"
                    tabIndex={controlsLocked ? -1 : 0}
                    draggable={!controlsLocked}
                    onKeyDown={(event) => handlePlacementKeyDown(event, index)}
                    onDragStart={(event) =>
                      handlePlacementDragStart(event, basicId)
                    }
                    onDragOver={(event) => handlePlacementDragOver(event, index)}
                    onDrop={handlePlacementDrop}
                    onDragEnd={commitPreviewPlacements}
                    className={`flex cursor-grab flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-violet-400/70 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 ${
                      isDragged
                        ? "border-violet-400 bg-violet-100/80 opacity-65 shadow-lg shadow-violet-900/10 dark:border-violet-500 dark:bg-violet-950/60"
                        : "border-slate-200 bg-slate-50/90 shadow-sm shadow-slate-900/5 hover:border-violet-300 hover:bg-violet-50/80 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-violet-700 dark:hover:bg-violet-950/35"
                    } ${controlsLocked ? "cursor-not-allowed opacity-75" : ""}`}
                    aria-label={t("tournament.setup.finals.placementAria", {
                      placement: index + 1,
                      name: getCharacterName(character?.id ?? basicId),
                    })}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                        #{index + 1} {getCharacterName(character?.id ?? basicId)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("common.cells.label", { cell: startCell })} ·{" "}
                        {labelForPlacementRole(index, t)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-violet-300 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:border-violet-700 dark:bg-slate-950/70 dark:text-violet-200">
                        {t("common.actions.drag")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStartFinal}
              disabled={!lineupComplete || controlsLocked}
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-900/35 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            >
              {t("tournament.setup.finals.start")}
            </button>
            {preliminaryPlacements ? (
              <button
                type="button"
                onClick={onRestorePreliminaryPlacements}
                disabled={!canRestorePreliminary}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-100"
              >
                {t("tournament.setup.finals.restore")}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
