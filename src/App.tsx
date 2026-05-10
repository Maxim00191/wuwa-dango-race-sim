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
    boardCells,
    hoppingEntityIds,
    isAnimating,
    autoPlayEnabled,
    setAutoPlayEnabled,
    broadcastPayload,
  } = useGame();

  return (
    <GameShell
      state={state}
      broadcastPayload={broadcastPayload}
      boardCells={boardCells}
      boardEffects={boardEffects}
      hoppingEntityIds={hoppingEntityIds}
      pendingBasicIds={pendingBasicIds}
      onToggleBasicId={togglePendingBasicId}
      onStart={start}
      onNextTurn={runFullTurn}
      onReset={reset}
      isAnimating={isAnimating}
      autoPlayEnabled={autoPlayEnabled}
      onAutoPlayEnabledChange={setAutoPlayEnabled}
    />
  );
}
