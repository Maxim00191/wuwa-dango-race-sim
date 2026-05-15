import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { buildStepLandingCells } from "@/services/circular";
import { appendLog } from "@/services/engine/state/mutations";
import { applySkillHooksAfterAffectedMovement } from "@/services/engine/movement/postMovementHooks";
import { buildPostMovementHookContext } from "@/services/engine/movement/postMovementHooks";
import { resolveMovementStabilization } from "@/services/engine/movement/stabilization/resolveMovementStabilization";
import { applySkillHookAfterMovementResolution } from "@/services/engine/skills/hooks/afterMovementResolution";
import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import type {
  DangoId,
  GameState,
  PlaybackSegment,
  TravelDirection,
} from "@/types/game";

export function resolvePostMovementPhase(
  state: GameState,
  movementStartState: GameState,
  actingEntityId: DangoId,
  diceValue: number,
  travelDirection: TravelDirection,
  boardEffectByCellIndex: Map<number, string | null>,
  finalLandingCellIndex: number | null,
  finalLandingPreviousStackBottomToTop: DangoId[],
  telemetry?: HeadlessRaceTelemetryCollector
): { state: GameState; segments: PlaybackSegment[] } {
  const segments: PlaybackSegment[] = [];
  const landingCells = buildStepLandingCells(
    movementStartState.entities[actingEntityId]?.cellIndex ?? FINISH_LINE_CELL_INDEX,
    diceValue,
    travelDirection
  );
  const stabilizedOutcome = resolveMovementStabilization(
    state,
    actingEntityId,
    state.turnIndex,
    diceValue,
    travelDirection,
    boardEffectByCellIndex,
    finalLandingCellIndex,
    finalLandingPreviousStackBottomToTop,
    telemetry
  );
  let nextState = stabilizedOutcome.state;
  segments.push(...stabilizedOutcome.segments);
  const affectedMovementOutcome = applySkillHooksAfterAffectedMovement(
    nextState,
    movementStartState,
    actingEntityId,
    {
      turnIndex: movementStartState.turnIndex,
      diceValue,
      travelDirection,
      landingCells,
      actingEntityId,
    }
  );
  nextState = affectedMovementOutcome.state;
  segments.push(...affectedMovementOutcome.segments);
  const postMovementContext = buildPostMovementHookContext(
    movementStartState,
    nextState,
    actingEntityId,
    {
      turnIndex: movementStartState.turnIndex,
      diceValue,
      travelDirection,
      landingCells,
      actingEntityId,
    },
    false
  );
  if (!postMovementContext) {
    return { state: nextState, segments };
  }
  const resolutionOutcome = applySkillHookAfterMovementResolution(
    nextState,
    postMovementContext
  );
  nextState = resolutionOutcome.state;
  segments.push(...resolutionOutcome.segments);
  if (resolutionOutcome.skillNarrative) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: resolutionOutcome.skillNarrative,
    });
  }
  return { state: nextState, segments };
}
