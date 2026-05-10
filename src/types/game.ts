export type CellIndex = number;

export type DangoId = string;

export type TravelDirection = "clockwise" | "counterClockwise";

export type DiceRollContext = {
  turnIndex: number;
  rollerId: DangoId;
};

export type SkillHookContext = {
  turnIndex: number;
  rollerId: DangoId;
  diceValue: number;
  cellIndex: CellIndex;
};

export type SkillHookHandler = (
  state: GameState,
  context: SkillHookContext
) => GameState;

export type MovementEvaluationContext = {
  turnIndex: number;
  rollerId: DangoId;
  initialDiceValue: number;
  diceValue: number;
  allInitialRolls: number[];
  allInitialRollsById: Record<DangoId, number | undefined>;
  allResolvedRollsById: Record<DangoId, number | undefined>;
};

export type MovementEvaluationResult = {
  diceValue: number;
  entityPatches?: Partial<Record<DangoId, Partial<EntityRuntimeState>>>;
  skillNarrative?: string;
};

export type MovementEvaluationHookHandler = (
  state: GameState,
  context: MovementEvaluationContext
) => MovementEvaluationResult;

export type MovementStepHookContext = {
  turnIndex: number;
  rollerId: DangoId;
  diceValue: number;
  stepNumber: number;
  remainingSteps: number;
  fromCellIndex: CellIndex;
  toCellIndex: CellIndex;
  travelingIds: DangoId[];
  travelDirection: TravelDirection;
  rankedRacerIds: DangoId[];
};

export type MovementStepHookResult = {
  state: GameState;
  segments?: PlaybackSegment[];
  skillNarrative?: string;
};

export type MovementStepHookHandler = (
  state: GameState,
  context: MovementStepHookContext
) => MovementStepHookResult;

export type CharacterSkillHooks = {
  afterDiceRoll?: SkillHookHandler;
  afterMovement?: SkillHookHandler;
  afterHalfwayCrossing?: SkillHookHandler;
  resolveMovement?: MovementEvaluationHookHandler;
  afterMovementStep?: MovementStepHookHandler;
};

export type CellEffectTriggerContext = {
  turnIndex: number;
  moverId: DangoId;
  destinationCellIndex: CellIndex;
  stackBottomToTop: DangoId[];
  moverTravelDirection: TravelDirection;
};

export type CellEffectHandler = (
  state: GameState,
  context: CellEffectTriggerContext
) => GameState;

export type CellEffectDefinition = {
  id: string;
  apply: CellEffectHandler;
};

export type BoardCellDefinition = {
  index: CellIndex;
  effectId: string | null;
};

export type GamePhase = "idle" | "running" | "finished";

export type GameLogEntryKind =
  | "turnHeader"
  | "roll"
  | "skillTrigger"
  | "skipNotBottom"
  | "standby"
  | "move"
  | "merge"
  | "cellEffect"
  | "abbyResetScheduled"
  | "abbyTeleport"
  | "win";

export type GameLogEntry = {
  kind: GameLogEntryKind;
  message: string;
};

export type EntityRuntimeState = {
  id: DangoId;
  cellIndex: CellIndex;
  raceDisplacement: number;
  sequentialDiceOrdinal?: number;
  hasUsedMidpointLeap?: boolean;
};

export type PlaybackIdleSegment = {
  kind: "idle";
  actorId: DangoId;
  reason: "standby" | "skipNotBottom";
};

export type PlaybackHopsSegment = {
  kind: "hops";
  actorId: DangoId;
  travelingIds: DangoId[];
  direction: TravelDirection;
  cellsPath: CellIndex[];
};

export type PlaybackTeleportSegment = {
  kind: "teleport";
  entityIds: DangoId[];
  fromCell: CellIndex;
  toCell: CellIndex;
};

export type PlaybackSlideSegment = {
  kind: "slide";
  travelingIds: DangoId[];
  direction: TravelDirection;
  fromCell: CellIndex;
  toCell: CellIndex;
};

export type PlaybackSegment =
  | PlaybackIdleSegment
  | PlaybackHopsSegment
  | PlaybackTeleportSegment
  | PlaybackSlideSegment;

export type TurnPlaybackPlan = {
  turnIndex: number;
  segments: PlaybackSegment[];
};

export type GameState = {
  phase: GamePhase;
  turnIndex: number;
  cells: Map<CellIndex, DangoId[]>;
  entityOrder: DangoId[];
  entities: Record<DangoId, EntityRuntimeState>;
  activeBasicIds: DangoId[];
  winnerId: DangoId | null;
  abbyPendingTeleportToStart: boolean;
  lastRollById: Record<DangoId, number | undefined>;
  log: GameLogEntry[];
  lastTurnPlayback: TurnPlaybackPlan | null;
};

export type DiceRollResult = {
  diceValue: number;
  initialDiceValue?: number;
  entityPatches?: Partial<Record<DangoId, Partial<EntityRuntimeState>>>;
  skillNarrative?: string;
};

export type CharacterDefinition = {
  id: DangoId;
  displayName: string;
  role: "basic" | "boss";
  diceRoll: (state: GameState, ctx: DiceRollContext) => DiceRollResult;
  travelDirection: TravelDirection;
  activateAfterTurnIndex: number;
  skillHooks: CharacterSkillHooks;
};

export type GameAction =
  | { type: "INITIALIZE" }
  | { type: "START"; selectedBasicIds: DangoId[] }
  | { type: "RUN_FULL_TURN" }
  | { type: "RESET" };
