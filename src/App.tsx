import { GameShell } from "@/components/GameShell";
import { useGame } from "@/hooks/useGame";

export default function App() {
  const {
    state,
    rankingState,
    pendingBasicIds,
    togglePendingBasicId,
    start,
    playTurn,
    stepAction,
    instantFullTurn,
    instantSimulateGame,
    reset,
    boardEffects,
    boardCells,
    hoppingEntityIds,
    isAnimating,
    playTurnEnabled,
    autoPlayEnabled,
    setAutoPlayEnabled,
    broadcastPayload,
  } = useGame();

  return (
    <GameShell
      state={state}
      rankingState={rankingState}
      broadcastPayload={broadcastPayload}
      boardCells={boardCells}
      boardEffects={boardEffects}
      hoppingEntityIds={hoppingEntityIds}
      pendingBasicIds={pendingBasicIds}
      onToggleBasicId={togglePendingBasicId}
      onStart={start}
      onPlayTurn={playTurn}
      onStepAction={stepAction}
      onInstantTurn={instantFullTurn}
      onInstantGame={instantSimulateGame}
      onReset={reset}
      isAnimating={isAnimating}
      playTurnEnabled={playTurnEnabled}
      autoPlayEnabled={autoPlayEnabled}
      onAutoPlayEnabledChange={setAutoPlayEnabled}
    />
  );
}
