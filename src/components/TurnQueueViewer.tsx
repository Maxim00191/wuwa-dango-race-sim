import { CHARACTER_BY_ID } from "@/services/characters";
import {
  accentFillHexForDango,
  contrastingInkHexForFill,
} from "@/services/dangoColors";
import type { DangoId, GameState } from "@/types/game";

export type TurnQueuePresentation = {
  orderedActorIds: DangoId[];
  initialDiceByActorId: Record<DangoId, number | undefined>;
  activeRacerIndex: number;
};

export function pickTurnQueuePresentation(
  gameState: GameState,
  isAnimating: boolean
): TurnQueuePresentation | null {
  if (gameState.phase !== "running") {
    return null;
  }
  if (isAnimating && gameState.lastTurnPlayback?.turnQueue) {
    const attachment = gameState.lastTurnPlayback.turnQueue;
    return {
      orderedActorIds: attachment.orderedActorIds,
      initialDiceByActorId: attachment.initialDiceByActorId,
      activeRacerIndex: Math.max(0, attachment.nextActorIndexAfterPlayback - 1),
    };
  }
  if (gameState.pendingTurn) {
    const initialDiceByActorId: Record<DangoId, number | undefined> = {};
    for (const actorId of gameState.pendingTurn.orderedActorIds) {
      initialDiceByActorId[actorId] =
        gameState.pendingTurn.plansByActorId[actorId]?.initialDiceValue;
    }
    return {
      orderedActorIds: gameState.pendingTurn.orderedActorIds,
      initialDiceByActorId,
      activeRacerIndex: gameState.pendingTurn.nextActorIndex,
    };
  }
  return null;
}

type TurnQueueViewerProps = {
  presentation: TurnQueuePresentation | null;
  isAnimating: boolean;
};

export function TurnQueueViewer({
  presentation,
  isAnimating,
}: TurnQueueViewerProps) {
  if (!presentation || presentation.orderedActorIds.length === 0) {
    return null;
  }

  const {
    orderedActorIds,
    initialDiceByActorId,
    activeRacerIndex,
  } = presentation;
  const slotCount = orderedActorIds.length;
  const fullTurnPlaybackRecap =
    isAnimating && activeRacerIndex >= slotCount;
  const turnResolvedPastQueue =
    activeRacerIndex >= slotCount && !fullTurnPlaybackRecap;
  const showPointerUnderSlot = activeRacerIndex < slotCount;

  return (
    <div className="mt-4 w-full min-w-0">
      <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
        Turn order queue
      </p>
      <div className="relative pb-6">
        <div
          className="grid min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            gridTemplateColumns: `repeat(${slotCount}, minmax(5.25rem, 1fr))`,
          }}
        >
          {orderedActorIds.map((actorId, queueIndex) => {
            const character = CHARACTER_BY_ID[actorId];
            const displayName = character?.displayName ?? actorId;
            const rollValue = initialDiceByActorId[actorId];
            const rollLabel =
              rollValue === undefined ? "—" : String(rollValue);
            const dimmed = fullTurnPlaybackRecap
              ? false
              : queueIndex < activeRacerIndex || turnResolvedPastQueue;
            const isCurrentSlot =
              !fullTurnPlaybackRecap &&
              !turnResolvedPastQueue &&
              queueIndex === activeRacerIndex;
            const accentHex = accentFillHexForDango(actorId);
            const inkHex = contrastingInkHexForFill(accentHex);
            return (
              <div
                key={`${actorId}-${queueIndex}`}
                className={`flex min-w-0 flex-col items-center rounded-2xl border px-3 py-2 text-center transition-all duration-300 ease-out ${
                  dimmed
                    ? "border-slate-800/80 bg-slate-950/40 opacity-50 grayscale"
                    : `border-slate-600/90 bg-slate-950/70 opacity-100 grayscale-0 ${
                        isCurrentSlot
                          ? "shadow-[0_0_22px_rgba(56,189,248,0.35)] ring-2 ring-sky-400/70"
                          : ""
                      }`
                }`}
              >
                <span
                  className="inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight"
                  style={{
                    backgroundColor: dimmed ? "#334155" : accentHex,
                    color: dimmed ? "#e2e8f0" : inkHex,
                  }}
                  title={displayName}
                >
                  {displayName}
                </span>
                <span
                  className={`mt-1 font-mono text-lg font-semibold tabular-nums leading-none ${
                    dimmed ? "text-slate-500" : "text-white"
                  }`}
                >
                  {rollLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 overflow-visible">
          {showPointerUnderSlot ? (
            <div
              className="absolute bottom-0 left-0 top-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: `${100 / slotCount}%`,
                transform: `translateX(${activeRacerIndex * 100}%)`,
              }}
            >
              <div className="flex h-full items-end justify-center">
                <div className="flex w-20 items-center gap-1.5 rounded-full bg-sky-400 px-2 py-1 shadow-sm shadow-sky-950/30">
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
