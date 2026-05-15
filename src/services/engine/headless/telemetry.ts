import { ABBY_ID } from "@/constants/ids";
import { findCellIndexForEntity } from "@/services/stateCells";
import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import type { DangoId, GameState } from "@/types/game";
import type {
  CellEffectAnalyticsKey,
  HeadlessRaceBasicMetrics,
  OneTimeSkillKey,
  StackRoleKey,
} from "@/types/monteCarlo";
import type { RaceSetup } from "@/types/game";

export type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";

type OneTimeSkillFlagDefinition = {
  actorId: DangoId;
  skillKey: OneTimeSkillKey;
  isActivated: (state: GameState) => boolean;
};

const ONE_TIME_SKILL_FLAG_DEFINITIONS: OneTimeSkillFlagDefinition[] = [
  {
    actorId: "aemeath",
    skillKey: "aemeathMidpointLeap",
    isActivated: (state) => Boolean(state.entities.aemeath?.skillState.hasUsedMidpointLeap),
  },
  {
    actorId: "iuno",
    skillKey: "iunoAnchoredDestiny",
    isActivated: (state) =>
      Boolean(state.entities.iuno?.skillState.hasUsedAnchoredDestiny),
  },
  {
    actorId: "hiyuki",
    skillKey: "hiyukiMetAbby",
    isActivated: (state) => Boolean(state.entities.hiyuki?.skillState.hasMetAbby),
  },
  {
    actorId: "cartethyia",
    skillKey: "cartethyiaComebackAwaken",
    isActivated: (state) =>
      Boolean(state.entities.cartethyia?.skillState.comebackActive),
  },
];

export function createHeadlessRoleObservationCounts(): HeadlessRaceBasicMetrics["roleObservationCounts"] {
  return {
    solo: 0,
    driver: 0,
    passenger: 0,
    crown: 0,
  };
}

export function createHeadlessCellEffectCounts(): HeadlessRaceBasicMetrics["cellEffectTriggerCounts"] {
  return {
    propulsionDevice: 0,
    hindranceDevice: 0,
    timeRift: 0,
  };
}

export function createHeadlessRaceTelemetryCollector(
  setup: RaceSetup
): HeadlessRaceTelemetryCollector {
  return {
    basicMetricsById: Object.fromEntries(
      setup.selectedBasicIds.map((basicId) => [
        basicId,
        {
          startingDisplacement: setup.startingDisplacementById[basicId] ?? 0,
          ownTurnProgress: 0,
          passiveProgress: 0,
          carriedProgress: 0,
          activeTurnCount: 0,
          passengerRideTurnCount: 0,
          roleObservationCounts: createHeadlessRoleObservationCounts(),
          cellEffectTriggerCounts: createHeadlessCellEffectCounts(),
          oneTimeSkillActivationTurnBySkillKey: {},
        },
      ])
    ),
  };
}

export function getBasicStackRole(state: GameState, basicId: DangoId): StackRoleKey | null {
  const cellIndex = findCellIndexForEntity(state.cells, basicId);
  if (cellIndex === null) {
    return null;
  }
  const stack = state.cells.get(cellIndex);
  if (!stack) {
    return null;
  }
  const actorIndex = stack.indexOf(basicId);
  if (actorIndex === -1) {
    return null;
  }
  if (stack.length === 1) {
    return "solo";
  }
  if (actorIndex === 0) {
    return "driver";
  }
  if (actorIndex === stack.length - 1) {
    return "crown";
  }
  return "passenger";
}

export function recordHeadlessRoleObservations(
  state: GameState,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  for (const basicId of Object.keys(telemetry.basicMetricsById)) {
    const metrics = telemetry.basicMetricsById[basicId];
    if (!metrics) {
      continue;
    }
    const role = getBasicStackRole(state, basicId);
    if (!role) {
      continue;
    }
    metrics.roleObservationCounts[role] += 1;
  }
}

export function recordHeadlessActiveTurn(
  actorId: DangoId,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  const metrics = telemetry.basicMetricsById[actorId];
  if (!metrics) {
    return;
  }
  metrics.activeTurnCount += 1;
}

export function recordHeadlessCarriedMovementStep(
  actorId: DangoId,
  travelingIds: DangoId[],
  telemetry: HeadlessRaceTelemetryCollector,
  carriedBasicIds: Set<DangoId>
): void {
  for (const travelingId of travelingIds) {
    if (travelingId === actorId || travelingId === ABBY_ID) {
      continue;
    }
    const metrics = telemetry.basicMetricsById[travelingId];
    if (!metrics) {
      continue;
    }
    metrics.carriedProgress += 1;
    carriedBasicIds.add(travelingId);
  }
}

export function recordHeadlessPassengerRideTurns(
  basicIds: Iterable<DangoId>,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  for (const basicId of basicIds) {
    const metrics = telemetry.basicMetricsById[basicId];
    if (!metrics) {
      continue;
    }
    metrics.passengerRideTurnCount += 1;
  }
}

export function buildPlacementIndexByBasicId(placements: DangoId[]): Record<string, number> {
  return Object.fromEntries(
    placements.map((basicId, placementIndex) => [basicId, placementIndex])
  );
}

export function recordHeadlessTurnProgress(
  previousState: GameState,
  nextState: GameState,
  actorId: DangoId,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  for (const [basicId, metrics] of Object.entries(telemetry.basicMetricsById)) {
    const previousDisplacement =
      previousState.entities[basicId]?.raceDisplacement ?? 0;
    const nextDisplacement = nextState.entities[basicId]?.raceDisplacement ?? 0;
    const gainedProgress = nextDisplacement - previousDisplacement;
    if (gainedProgress <= 0) {
      continue;
    }
    if (basicId === actorId) {
      metrics.ownTurnProgress += gainedProgress;
      continue;
    }
    metrics.passiveProgress += gainedProgress;
  }
}

export function recordHeadlessCellEffectTrigger(
  telemetry: HeadlessRaceTelemetryCollector,
  actorId: DangoId,
  effectId: CellEffectAnalyticsKey
): void {
  const metrics = telemetry.basicMetricsById[actorId];
  if (!metrics) {
    return;
  }
  metrics.cellEffectTriggerCounts[effectId] += 1;
}

export function captureHeadlessSkillActivations(
  previousState: GameState,
  nextState: GameState,
  telemetry: HeadlessRaceTelemetryCollector,
  turnIndex: number
): void {
  for (const definition of ONE_TIME_SKILL_FLAG_DEFINITIONS) {
    const metrics = telemetry.basicMetricsById[definition.actorId];
    if (!metrics) {
      continue;
    }
    if (metrics.oneTimeSkillActivationTurnBySkillKey[definition.skillKey] !== undefined) {
      continue;
    }
    if (!definition.isActivated(nextState) || definition.isActivated(previousState)) {
      continue;
    }
    metrics.oneTimeSkillActivationTurnBySkillKey[definition.skillKey] = turnIndex;
  }
}
