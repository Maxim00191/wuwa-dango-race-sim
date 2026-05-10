import { GameShell } from "@/components/GameShell";
import { useGame } from "@/hooks/useGame";

export default function App() {
  const { state, start, runFullTurn, reset, boardEffects } = useGame();

  return (
    <GameShell
      state={state}
      boardEffects={boardEffects}
      onStart={start}
      onNextTurn={runFullTurn}
      onReset={reset}
    />
  );
}
