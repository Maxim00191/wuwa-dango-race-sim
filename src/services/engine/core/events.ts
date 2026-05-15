import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import type {
  DangoId,
  GameState,
  PlaybackSegment,
  SkillHookContext,
  TravelDirection,
  TurnRollPlan,
} from "@/types/game";

export type EngineEventMap = {
  "round:start": {
    state: GameState;
    orderedActorIds: DangoId[];
    openingSegments: PlaybackSegment[];
  };
  "round:end": {
    state: GameState;
    orderedActorIds: DangoId[];
    closingSegments: PlaybackSegment[];
  };
  "skill:before-turn": {
    state: GameState;
    context: SkillHookContext;
    segments: PlaybackSegment[];
    turnRollPlan: TurnRollPlan;
    turnRollPlanPatch?: Partial<TurnRollPlan>;
  };
  "skill:after-dice": {
    state: GameState;
    context: SkillHookContext;
    segments: PlaybackSegment[];
  };
  "skill:after-turn": {
    state: GameState;
    context: SkillHookContext;
    segments: PlaybackSegment[];
  };
  "skill:after-turn-rolls": {
    state: GameState;
    context: {
      actorId: DangoId;
      rankedBasicIds: DangoId[];
      plansByActorId: Record<DangoId, TurnRollPlan | undefined>;
      allInitialRollsById: Record<DangoId, number | undefined>;
      allResolvedRollsById: Record<DangoId, number | undefined>;
    };
    openingSegments: PlaybackSegment[];
    planPatches?: Partial<Record<DangoId, Partial<TurnRollPlan>>>;
  };
  "movement:completed": {
    state: GameState;
    movementStartState: GameState;
    actingEntityId: DangoId;
    diceValue: number;
    travelDirection: TravelDirection;
    boardEffectByCellIndex: Map<number, string | null>;
    finalLandingCellIndex: number | null;
    finalLandingPreviousStackBottomToTop: DangoId[];
    segments: PlaybackSegment[];
    telemetry?: HeadlessRaceTelemetryCollector;
  };
};

export type EngineEventType = keyof EngineEventMap;

type EngineEventHandler<K extends EngineEventType> = (
  payload: EngineEventMap[K]
) => EngineEventMap[K] | void;

export type EngineEventBusErrorHandler = (
  error: unknown,
  eventType: EngineEventType
) => void;

type HandlerBucketEntry = {
  priority: number;
  handler: (
    payload: EngineEventMap[EngineEventType]
  ) => EngineEventMap[EngineEventType] | void;
};

export class EngineEventBus {
  private readonly handlers = new Map<EngineEventType, HandlerBucketEntry[]>();
  private readonly onSubscriberError?: EngineEventBusErrorHandler;

  constructor(onSubscriberError?: EngineEventBusErrorHandler) {
    this.onSubscriberError = onSubscriberError;
  }

  subscribe<K extends EngineEventType>(
    type: K,
    handler: EngineEventHandler<K>,
    priority = 0
  ): () => void {
    const bucket = this.handlers.get(type) ?? [];
    const wrapped = handler as HandlerBucketEntry["handler"];
    const entry: HandlerBucketEntry = { priority, handler: wrapped };
    bucket.push(entry);
    bucket.sort((left, right) => left.priority - right.priority);
    this.handlers.set(type, bucket);
    return () => {
      const current = this.handlers.get(type) ?? [];
      this.handlers.set(
        type,
        current.filter((candidate) => candidate !== entry)
      );
    };
  }

  publish<K extends EngineEventType>(
    type: K,
    payload: EngineEventMap[K]
  ): EngineEventMap[K] {
    const bucket = this.handlers.get(type);
    if (!bucket || bucket.length === 0) {
      return payload;
    }
    let currentPayload: EngineEventMap[EngineEventType] = payload;
    for (const { handler } of bucket) {
      try {
        const nextPayload = handler(currentPayload);
        if (nextPayload !== undefined) {
          currentPayload = nextPayload;
        }
      } catch (error) {
        if (this.onSubscriberError) {
          this.onSubscriberError(error, type);
        } else {
          console.error(`Engine event subscriber failed [${type}]`, error);
        }
      }
    }
    return currentPayload as EngineEventMap[K];
  }
}

export function createEngineEventBus(
  onSubscriberError?: EngineEventBusErrorHandler
): EngineEventBus {
  return new EngineEventBus(onSubscriberError);
}
