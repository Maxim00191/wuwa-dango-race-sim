import type { LocalizedText } from "@/i18n";

export type CellIndex = number;

export type DangoId = string;

export type LineupGroupId = "A" | "B" | "C";

export type Attribute =
  | "Fusion"
  | "Glacio"
  | "Aero"
  | "Electro"
  | "Spectro"
  | "Havoc";

export type EntitySkillState = {
  sequentialDiceOrdinal?: number;
  hasUsedMidpointLeap?: boolean;
  previousRoll?: number;
  hasMetAbby?: boolean;
  comebackActive?: boolean;
  actLastNextRound?: boolean;
};

export type TravelDirection = "clockwise" | "counterClockwise";

export type RaceMode =
  | "normal"
  | "tournamentPreliminary"
  | "tournamentFinal"
  | "customFinal";

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

export type SkillHookResolution = {
  state: GameState;
  segments?: PlaybackSegment[];
  skillNarrative?: LocalizedText;
};

export type SkillHookHandler = (
  state: GameState,
  context: SkillHookContext
) => SkillHookResolution;

export type PostMovementHookContext = {
  turnIndex: number;
  rollerId: DangoId;
  diceValue: number;
  startCellIndex: CellIndex;
  endCellIndex: CellIndex;
  travelDirection: TravelDirection;
  landingCells: CellIndex[];
};

export type PostMovementHookHandler = (
  state: GameState,
  context: PostMovementHookContext
) => SkillHookResolution;

export type TurnRollPreparationContext = {
  turnIndex: number;
  actorId: DangoId;
  rankedBasicIds: DangoId[];
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>;
  allInitialRollsById: Record<DangoId, number | undefined>;
  allResolvedRollsById: Record<DangoId, number | undefined>;
};

export type TurnRollPreparationResolution = {
  state: GameState;
  planPatches?: Partial<Record<DangoId, Partial<TurnRollPlan>>>;
  skillNarrative?: LocalizedText;
};

export type TurnRollPreparationHookHandler = (
  state: GameState,
  context: TurnRollPreparationContext
) => TurnRollPreparationResolution;

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
  skillNarrative?: LocalizedText;
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
  skillNarrative?: LocalizedText;
};

export type MovementStepHookHandler = (
  state: GameState,
  context: MovementStepHookContext
) => MovementStepHookResult;

export type CharacterSkillHooks = {
  beforeTurn?: SkillHookHandler;
  afterDiceRoll?: SkillHookHandler;
  afterMovement?: PostMovementHookHandler;
  afterMovementResolution?: PostMovementHookHandler;
  afterTurn?: SkillHookHandler;
  afterHalfwayCrossing?: SkillHookHandler;
  afterTurnRolls?: TurnRollPreparationHookHandler;
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

export type CellEffectShift = {
  travelingIds: DangoId[];
  fromCell: CellIndex;
  toCell: CellIndex;
  direction: TravelDirection;
};

export type CellEffectApplication = {
  state: GameState;
  shift?: CellEffectShift;
  message?: LocalizedText;
};

export type CellEffectHandler = (
  state: GameState,
  context: CellEffectTriggerContext
) => CellEffectApplication;

export type CellEffectDefinition = {
  id: string;
  apply: CellEffectHandler;
};

export type ResolvedCellEffect = CellEffectApplication & {
  effectId: string;
};

export type BoardCellDefinition = {
  index: CellIndex;
  effectId: string | null;
};

export type GamePhase = "idle" | "running" | "finished";

export type RaceStartingStack = {
  cellIndex: CellIndex;
  stackBottomToTop: DangoId[];
};

export type RaceSetup = {
  mode: RaceMode;
  label: LocalizedText;
  shortLabel: LocalizedText;
  selectedBasicIds: DangoId[];
  startingStacks: RaceStartingStack[];
};

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
  message: LocalizedText;
};

export type EntityRuntimeState = {
  id: DangoId;
  cellIndex: CellIndex;
  raceDisplacement: number;
  skillState: EntitySkillState;
};

export type PlaybackIdleSegment = {
  kind: "idle";
  actorId: DangoId;
  reason: "standby" | "skipNotBottom";
  rollValue?: number;
};

export type PlaybackRollSegment = {
  kind: "roll";
  actorId: DangoId;
  value: number;
};

export type PlaybackSkillSegment = {
  kind: "skill";
  actorId: DangoId;
  message: LocalizedText;
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

export type PlaybackCellEffectSegment = {
  kind: "cellEffect";
  actorId: DangoId;
  effectId: string;
  message: LocalizedText;
};

export type PlaybackVictorySegment = {
  kind: "victory";
  winnerId: DangoId;
};

export type PlaybackSegment =
  | PlaybackIdleSegment
  | PlaybackRollSegment
  | PlaybackSkillSegment
  | PlaybackHopsSegment
  | PlaybackTeleportSegment
  | PlaybackSlideSegment
  | PlaybackCellEffectSegment
  | PlaybackVictorySegment;

export type TurnQueueAttachment = {
  orderedActorIds: DangoId[];
  initialDiceByActorId: Record<DangoId, number | undefined>;
  nextActorIndexAfterPlayback: number;
};

export type TurnPlaybackPlan = {
  turnIndex: number;
  segments: PlaybackSegment[];
  playbackStamp: number;
  sourceCells: Map<CellIndex, DangoId[]>;
  sourceEntities: Record<DangoId, EntityRuntimeState>;
  settledCells?: Map<CellIndex, DangoId[]>;
  settledEntities?: Record<DangoId, EntityRuntimeState>;
  presentationMode: "animated" | "settled";
  showTurnIntroBanner: boolean;
  turnOrderActorIds?: DangoId[];
  turnQueue?: TurnQueueAttachment;
};

export type MovementModifier = {
  sourceId: DangoId;
  delta: number;
  minimumSteps?: number;
};

export type TurnRollPlan = {
  actorId: DangoId;
  diceValue: number;
  initialDiceValue: number;
  movementModifiers?: MovementModifier[];
  entityPatches?: Partial<Record<DangoId, Partial<EntityRuntimeState>>>;
  skillNarrative?: LocalizedText;
};

export type PendingTurnResolution = {
  orderedActorIds: DangoId[];
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>;
  allInitialRollsById: Record<DangoId, number | undefined>;
  allResolvedRollsById: Record<DangoId, number | undefined>;
  nextActorIndex: number;
  openingBannerConsumed: boolean;
};

export type GameState = {
  phase: GamePhase;
  mode: RaceMode | null;
  label: LocalizedText | null;
  shortLabel: LocalizedText | null;
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
  pendingTurn: PendingTurnResolution | null;
  playbackStamp: number;
};

export type DiceRollResult = {
  diceValue: number;
  initialDiceValue?: number;
  entityPatches?: Partial<Record<DangoId, Partial<EntityRuntimeState>>>;
  skillNarrative?: LocalizedText;
};

type CharacterDefinitionBase = {
  id: DangoId;
  displayName: string;
  diceRoll: (state: GameState, ctx: DiceRollContext) => DiceRollResult;
  travelDirection: TravelDirection;
  activateAfterTurnIndex: number;
  skillHooks: CharacterSkillHooks;
};

export type BasicCharacterDefinition = CharacterDefinitionBase & {
  role: "basic";
  attribute: Attribute;
};

export type BossCharacterDefinition = CharacterDefinitionBase & {
  role: "boss";
  attribute: null;
};

export type CharacterDefinition =
  | BasicCharacterDefinition
  | BossCharacterDefinition;

export type GameAction =
  | { type: "INITIALIZE" }
  | { type: "START"; setup: RaceSetup }
  | { type: "STEP_ACTION" }
  | { type: "INSTANT_FULL_TURN" }
  | { type: "INSTANT_SIMULATE_GAME" }
  | { type: "RESET" };
