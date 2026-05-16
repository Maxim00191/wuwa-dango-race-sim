import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import { hasPassedCourseMidpoint } from "@/services/midpoint";
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

type AnchoredDestinyMove = {
  entityId: DangoId;
  fromCell: number;
};

function resolveAnchoredDestinyTeleportScope(
  rankedBasicIds: DangoId[],
  actorId: DangoId
): { aheadIds: DangoId[]; behindIds: DangoId[] } | null {
  const actorRankIndex = rankedBasicIds.indexOf(actorId);
  if (actorRankIndex === -1) {
    return null;
  }
  const aheadIds = rankedBasicIds.slice(0, actorRankIndex);
  const behindIds = rankedBasicIds.slice(actorRankIndex + 1);
  if (!(aheadIds.length > 0 && behindIds.length > 0)) {
    return null;
  }
  return { aheadIds, behindIds };
}

function buildAnchoredDestinyMoves(
  state: GameState,
  teleportIds: DangoId[]
): AnchoredDestinyMove[] | null {
  const moves: AnchoredDestinyMove[] = [];
  for (const entityId of teleportIds) {
    const fromCell = findCellIndexForEntity(state.cells, entityId);
    if (fromCell === null) {
      return null;
    }
    moves.push({ entityId, fromCell });
  }
  return moves;
}

function buildAnchoredDestinyDestinationStack(
  destinationStack: DangoId[],
  actorId: DangoId,
  aheadIds: DangoId[],
  behindIds: DangoId[]
): DangoId[] | null {
  const teleported = new Set<DangoId>([...aheadIds, ...behindIds]);
  const stackWithoutTeleported = destinationStack.filter((id) => !teleported.has(id));
  const actorIndex = stackWithoutTeleported.indexOf(actorId);
  if (actorIndex === -1) {
    return null;
  }
  const rankBestToWorst = [...aheadIds, actorId, ...behindIds];
  const microStackBottomToTop = [...rankBestToWorst].reverse();
  return [
    ...stackWithoutTeleported.slice(0, actorIndex),
    ...microStackBottomToTop,
    ...stackWithoutTeleported.slice(actorIndex + 1),
  ];
}

function resolveIunoAnchoredDestiny(
  state: GameState,
  context: PostMovementHookContext
): SkillHookResolution {
  if (context.rollerId !== context.actingEntityId) {
    return { state };
  }
  const initialEntity = state.entities[context.rollerId];
  if (!initialEntity || initialEntity.skillState.hasUsedAnchoredDestiny) {
    return { state };
  }
  const endDisplacement = context.endRaceDisplacement;
  const scope = hasPassedCourseMidpoint(context)
    ? resolveAnchoredDestinyTeleportScope(
        orderedBasicRacerIdsForLeaderboard(state),
        context.rollerId
      )
    : null;
  if (!scope) {
    return { state };
  }
  const actorEntity = initialEntity;
  const teleportIds = [...scope.aheadIds, ...scope.behindIds];
  const moves = buildAnchoredDestinyMoves(state, teleportIds);
  if (!moves || moves.length === 0) {
    return { state };
  }
  const destinationCellIndex = actorEntity.cellIndex;
  const destinationStack = state.cells.get(destinationCellIndex) ?? [];
  const nextDestinationStack = buildAnchoredDestinyDestinationStack(
    destinationStack,
    context.rollerId,
    scope.aheadIds,
    scope.behindIds
  );
  if (!nextDestinationStack) {
    return { state };
  }
  const nextCells = applyStackTeleportCellsOnly(
    state.cells,
    moves.map((move) => ({
      entityId: move.entityId,
      fromCellIndex: move.fromCell,
    })),
    destinationCellIndex,
    nextDestinationStack
  );
  const anchorDisplacement = endDisplacement;
  const nextEntities = { ...state.entities };
  nextEntities[context.rollerId] = {
    ...actorEntity,
    skillState: {
      ...actorEntity.skillState,
      hasUsedAnchoredDestiny: true,
    },
  };
  for (const move of moves) {
    const moved = nextEntities[move.entityId];
    if (!moved) {
      continue;
    }
    nextEntities[move.entityId] = {
      ...moved,
      cellIndex: destinationCellIndex,
      raceDisplacement: anchorDisplacement,
    };
  }
  return {
    state: {
      ...state,
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
    ...skillTrigger(
      "iuno.anchoredDestiny",
      text("simulation.skills.iunoAnchoredDestiny", {
        actor: characterParam("iuno"),
      })
    ),
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
