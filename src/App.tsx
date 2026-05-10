import { GameShell } from "@/components/GameShell";
import { useGame } from "@/hooks/useGame";

export default function App() {
  const {
    state,
    pendingBasicIds,
    togglePendingBasicId,
    start,
    runFullTurn,
    reset,
    boardEffects,
  } = useGame();

  return (
    <GameShell
      state={state}
      boardEffects={boardEffects}
      pendingBasicIds={pendingBasicIds}
      onToggleBasicId={togglePendingBasicId}
      onStart={start}
      onNextTurn={runFullTurn}
      onReset={reset}
    />
  );
}
