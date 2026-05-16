import { useMemo } from "react";
import { CHARACTER_BY_ID } from "@/services/characters";
import { useSafeDangoColors } from "@/services/dangoColors";
import { orderedRacerIdsForLeaderboard } from "@/services/racerRanking";
import { useListFlipAnimation } from "@/hooks/useListFlipAnimation";
import { useTranslation } from "@/i18n/useTranslation";
import type { DangoId, GameState } from "@/types/game";

type GameShellRankingListProps = {
  state: GameState;
  rankingState: GameState;
  idleParticipantIds: DangoId[];
};

export function GameShellRankingList({
  state,
  rankingState,
  idleParticipantIds,
}: GameShellRankingListProps) {
  const { getCharacterName, t } = useTranslation();
  const getSafeDangoColors = useSafeDangoColors();
  const racerParticipantIds = useMemo(() => {
    if (state.phase === "idle") {
      return idleParticipantIds;
    }
    return orderedRacerIdsForLeaderboard(rankingState);
  }, [idleParticipantIds, rankingState, state.phase]);
  const racerOrderFlipKey = racerParticipantIds.join("\u0001");
  const rankListRef = useListFlipAnimation<HTMLUListElement>(racerOrderFlipKey);
  const rankVisible = state.phase === "running" || state.phase === "finished";

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-xl dark:shadow-slate-950/60 sm:rounded-3xl sm:p-6 xl:p-8">
      <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {t("game.racers.title")}
      </p>
      <ul
        ref={rankListRef}
        className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200"
      >
        {racerParticipantIds.map((participantId, leaderboardIndex) => {
          const character = CHARACTER_BY_ID[participantId];
          if (!character) {
            return null;
          }
          const runtime = rankingState.entities[character.id];
          const roll = state.lastRollById[character.id];
          const {
            baseHex,
            baseInkHex,
            chartHex,
            uiOutlineHex,
            uiOutlineSoftHex,
          } = getSafeDangoColors(participantId);
          return (
            <li
              key={character.id}
              data-flip-item={character.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 border-l-4 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"
              style={{ borderLeftColor: chartHex }}
            >
              <div className="flex items-start gap-3">
                {rankVisible ? (
                  <span
                    className="mt-0.5 inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-semibold ring-1 ring-slate-900/15 dark:ring-black/20"
                    style={{
                      backgroundColor: baseHex,
                      color: baseInkHex,
                      boxShadow: `0 0 0 1px ${uiOutlineHex}, 0 0 0 4px ${uiOutlineSoftHex}`,
                    }}
                  >
                    #{leaderboardIndex + 1}
                  </span>
                ) : null}
                <div>
                  <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {getCharacterName(character.id)}
                  </p>
                  <p className="text-xs font-normal text-slate-500 dark:text-slate-500">
                    {character.role === "boss"
                      ? t("game.racers.bossRole")
                      : t("game.racers.basicRole")}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p className="font-mono text-[13px] font-normal text-slate-500 dark:text-slate-400">
                  ● {runtime?.raceDisplacement ?? 0}
                </p>
                <p className="text-[11px] font-normal text-slate-500 dark:text-slate-500">
                  {t("game.racers.dice", { value: roll ?? "—" })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
