import { GameShellGameDiary } from "@/components/gameShell/GameShellGameDiary";
import { GameShellRankingList } from "@/components/gameShell/GameShellRankingList";
import type { DangoId, GameState } from "@/types/game";

type GameShellSidebarProps = {
  state: GameState;
  rankingState: GameState;
  idleParticipantIds: DangoId[];
};

export function GameShellSidebar({
  state,
  rankingState,
  idleParticipantIds,
}: GameShellSidebarProps) {
  return (
    <aside className="grid min-w-0 gap-5 md:grid-cols-2 lg:flex lg:flex-col lg:gap-6 xl:min-w-[18rem]">
      <GameShellRankingList
        state={state}
        rankingState={rankingState}
        idleParticipantIds={idleParticipantIds}
      />
      <GameShellGameDiary state={state} />
    </aside>
  );
}
