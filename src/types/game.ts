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

export type SkillHookName =
  | "afterDiceRoll"
  | "afterMovement"
  | "afterHalfwayCrossing";

export type SkillHookHandler = (
  state: GameState,
  context: SkillHookContext
) => GameState;

export type CharacterSkillHooks = Partial<
  Record<SkillHookName, SkillHookHandler>
>;

export type CharacterDefinition = {
  id: DangoId;
  displayName: string;
  role: "basic" | "boss";
  diceRoll: (ctx: DiceRollContext) => number;
  travelDirection: TravelDirection;
  activateAfterTurnIndex: number;
  skillHooks: CharacterSkillHooks;
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
  raceDisplacement: number;
};

export type GameState = {
  phase: GamePhase;
  turnIndex: number;
  cells: Map<CellIndex, DangoId[]>;
  entityOrder: DangoId[];
  entities: Record<DangoId, EntityRuntimeState>;
  winnerId: DangoId | null;
  abbyPendingTeleportToStart: boolean;
  lastRollById: Record<DangoId, number | undefined>;
  log: GameLogEntry[];
};

export type GameAction =
  | { type: "INITIALIZE" }
  | { type: "START" }
  | { type: "RUN_FULL_TURN" }
  | { type: "RESET" };
