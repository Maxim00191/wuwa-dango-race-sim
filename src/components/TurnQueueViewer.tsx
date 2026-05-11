import { useTranslation } from "@/i18n/LanguageContext";
import {
  accentFillHexForDango,
  contrastingInkHexForFill,
} from "@/services/dangoColors";
import { useListFlipAnimation } from "@/hooks/useListFlipAnimation";
import type { TurnQueuePresentation } from "@/services/turnQueuePresentation";

type TurnQueueViewerProps = {
  presentation: TurnQueuePresentation | null;
};

export function TurnQueueViewer({ presentation }: TurnQueueViewerProps) {
  const { getCharacterName, t } = useTranslation();
  const queueListRef = useListFlipAnimation<HTMLDivElement>(
    presentation?.orderedActorIds.join("\u0001") ?? ""
  );

  if (!presentation || presentation.orderedActorIds.length === 0) {
    return null;
  }

  const {
    orderedActorIds,
    initialDiceByActorId,
    activeRacerIndex,
    state,
  } = presentation;
  const slotCount = orderedActorIds.length;
  const turnResolvedPastQueue = state === "resolved" || activeRacerIndex >= slotCount;
  const showPointerUnderSlot =
    state === "active" && activeRacerIndex < slotCount;

  return (
    <div className="mt-4 w-full min-w-0">
      <p className="mb-2 text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {t("game.queue.title")}
      </p>
      <div className="relative pb-6">
        <div
          ref={queueListRef}
          className="grid min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            gridTemplateColumns: `repeat(${slotCount}, minmax(5.25rem, 1fr))`,
          }}
        >
          {orderedActorIds.map((actorId, queueIndex) => {
            const displayName = getCharacterName(actorId);
            const rollValue = initialDiceByActorId[actorId];
            const rollLabel =
              rollValue === undefined ? "—" : String(rollValue);
            const dimmed = queueIndex < activeRacerIndex || turnResolvedPastQueue;
            const isCurrentSlot =
              state === "active" &&
              !turnResolvedPastQueue &&
              queueIndex === activeRacerIndex;
            const accentHex = accentFillHexForDango(actorId);
            const inkHex = contrastingInkHexForFill(accentHex);
            return (
              <div
                key={actorId}
                data-flip-item={actorId}
                className={`flex min-w-0 flex-col items-center rounded-2xl border px-3 py-2 text-center transition-all duration-300 ease-out ${
                  isCurrentSlot
                    ? "border-slate-300/95 bg-white/85 opacity-100 grayscale-0 shadow-[0_0_22px_rgba(56,189,248,0.35)] ring-2 ring-sky-400/70 dark:border-slate-600/90 dark:bg-slate-950/70"
                    : turnResolvedPastQueue
                      ? "border-slate-200/90 bg-slate-100/70 opacity-75 dark:border-slate-800/80 dark:bg-slate-950/45"
                      : dimmed
                    ? "border-slate-200/90 bg-slate-100/50 opacity-50 grayscale dark:border-slate-800/80 dark:bg-slate-950/40"
                    : "border-slate-300/95 bg-white/85 opacity-100 grayscale-0 dark:border-slate-600/90 dark:bg-slate-950/70"
                }`}
              >
                <span
                  className={`inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${
                    dimmed
                      ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      : ""
                  }`}
                  style={
                    dimmed
                      ? undefined
                      : { backgroundColor: accentHex, color: inkHex }
                  }
                  title={displayName}
                >
                  {displayName}
                </span>
                <span
                  className={`mt-1 font-mono text-lg font-semibold tabular-nums leading-none ${
                    dimmed
                      ? "text-slate-500"
                      : "text-slate-900 dark:text-white"
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
                <div className="flex w-20 items-center gap-1.5 rounded-full bg-sky-400 px-2 py-1 shadow-sm shadow-sky-900/20 dark:shadow-sky-950/30">
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
