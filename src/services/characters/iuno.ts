import { characterParam, text, type LocalizedText } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import { hasCrossedMidpoint } from "@/services/midpoint";
import { orderedBasicRacerIdsForLeaderboard } from "@/services/racerRanking";
import {
  applyStackTeleportCellsOnly,
  findCellIndexForEntity,
} from "@/services/stateCells";
import type {
  CharacterDefinition,
  DangoId,
  GameState,
  PostMovementHookContext,
  SkillHookResolution,
} from "@/types/game";

type AnchoredDestinyTargets = {
  aheadId?: DangoId;
  behindId?: DangoId;
};

function resolveTeleportOrder(
  rankedRacerIds: DangoId[],
  actorId: DangoId
): AnchoredDestinyTargets | null {
  const actorRankIndex = rankedRacerIds.indexOf(actorId);
  if (actorRankIndex === -1) {
    return null;
  }
  const aheadId =
    actorRankIndex > 0 ? rankedRacerIds[actorRankIndex - 1] : undefined;
  const behindId =
    actorRankIndex < rankedRacerIds.length - 1
      ? rankedRacerIds[actorRankIndex + 1]
      : undefined;
  if (!aheadId && !behindId) {
    return null;
  }
  return { aheadId, behindId };
}

function resolveAnchoredDestinyNarrative(
  targets: AnchoredDestinyTargets
): LocalizedText | undefined {
  if (targets.aheadId && targets.behindId) {
    return text("simulation.skills.iunoAnchoredDestiny", {
      actor: characterParam("iuno"),
      aheadTarget: characterParam(targets.aheadId),
      behindTarget: characterParam(targets.behindId),
    });
  }
  if (targets.aheadId) {
    return text("simulation.skills.iunoAnchoredDestinyAhead", {
      actor: characterParam("iuno"),
      target: characterParam(targets.aheadId),
    });
  }
  if (targets.behindId) {
    return text("simulation.skills.iunoAnchoredDestinyBehind", {
      actor: characterParam("iuno"),
      target: characterParam(targets.behindId),
    });
  }
  return undefined;
}

type AnchoredDestinyMove = {
  entityId: DangoId;
  fromCell: number;
};

function resolveAnchoredDestinyMoves(
  state: GameState,
  targets: AnchoredDestinyTargets
): {
  moves: AnchoredDestinyMove[];
  resolvedTargets: AnchoredDestinyTargets;
} {
  const moves: AnchoredDestinyMove[] = [];
  const resolvedTargets: AnchoredDestinyTargets = {};
  if (targets.behindId) {
    const fromCell = findCellIndexForEntity(state.cells, targets.behindId);
    if (fromCell !== null) {
      moves.push({ entityId: targets.behindId, fromCell });
      resolvedTargets.behindId = targets.behindId;
    }
  }
  if (targets.aheadId) {
    const fromCell = findCellIndexForEntity(state.cells, targets.aheadId);
    if (fromCell !== null) {
      moves.push({ entityId: targets.aheadId, fromCell });
      resolvedTargets.aheadId = targets.aheadId;
    }
  }
  return { moves, resolvedTargets };
}

function buildAnchoredDestinyDestinationStack(
  destinationStack: DangoId[],
  actorId: DangoId,
  targets: AnchoredDestinyTargets
): DangoId[] | null {
  const stackWithoutTargets = destinationStack.filter(
    (id) => id !== targets.behindId && id !== targets.aheadId
  );
  const actorIndex = stackWithoutTargets.indexOf(actorId);
  if (actorIndex === -1) {
    return null;
  }
  const microStack: DangoId[] = [];
  if (targets.behindId) {
    microStack.push(targets.behindId);
  }
  microStack.push(actorId);
  if (targets.aheadId) {
    microStack.push(targets.aheadId);
  }
  return [
    ...stackWithoutTargets.slice(0, actorIndex),
    ...microStack,
    ...stackWithoutTargets.slice(actorIndex + 1),
  ];
}

function resolveIunoAnchoredDestiny(
  state: GameState,
  context: PostMovementHookContext
): SkillHookResolution {
  const entity = state.entities[context.rollerId];
  if (
    !entity ||
    entity.skillState.hasUsedAnchoredDestiny ||
    !hasCrossedMidpoint(context)
  ) {
    return { state };
  }
  const destinationCellIndex = entity.cellIndex;
  const spentState: GameState = {
    ...state,
    entities: {
      ...state.entities,
      [context.rollerId]: {
        ...entity,
        skillState: {
          ...entity.skillState,
          hasUsedAnchoredDestiny: true,
        },
      },
    },
  };
  const targets = resolveTeleportOrder(
    orderedBasicRacerIdsForLeaderboard(state),
    context.rollerId
  );
  if (!targets) {
    return { state: spentState };
  }
  const { moves, resolvedTargets } = resolveAnchoredDestinyMoves(spentState, targets);
  if (moves.length === 0) {
    return { state: spentState };
  }
  const destinationStack = spentState.cells.get(destinationCellIndex) ?? [];
  const nextDestinationStack = buildAnchoredDestinyDestinationStack(
    destinationStack,
    context.rollerId,
    resolvedTargets
  );
  if (!nextDestinationStack) {
    return { state: spentState };
  }
  const nextCells = applyStackTeleportCellsOnly(
    spentState.cells,
    moves.map((move) => ({
      entityId: move.entityId,
      fromCellIndex: move.fromCell,
    })),
    destinationCellIndex,
    nextDestinationStack
  );
  const nextEntities = { ...spentState.entities };
  for (const move of moves) {
    nextEntities[move.entityId] = {
      ...nextEntities[move.entityId]!,
      cellIndex: destinationCellIndex,
    };
  }
  return {
    state: {
      ...spentState,
      cells: nextCells,
      entities: nextEntities,
    },
    segments: [
      {
        kind: "stackTeleport",
        actorId: context.rollerId,
        moves,
        toCell: destinationCellIndex,
        stackBottomToTop: nextDestinationStack,
      },
    ],
    skillNarrative: resolveAnchoredDestinyNarrative(resolvedTargets),
  };
}

export const iunoCharacter: CharacterDefinition = {
  id: "iuno",
  displayName: "Iuno",
  role: "basic",
  attribute: "Aero",
  diceRoll: rollStandardBasicDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    afterMovement: resolveIunoAnchoredDestiny,
  },
};
