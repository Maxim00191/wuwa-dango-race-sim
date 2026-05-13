import type { LocalizedText } from "@/i18n";
import type {
  DangoId,
  EntityRuntimeState,
  GamePhase,
  PendingTurnResolution,
  RaceMode,
  RaceSetup,
} from "@/types/game";

export type MatchRecordSchemaVersion = 1;

export type BoardEffectAssignmentJson = {
  cellIndex: number;
  effectId: string | null;
};

export type MatchGameFrameJson = {
  phase: GamePhase;
  mode: RaceMode | null;
  label: LocalizedText | null;
  shortLabel: LocalizedText | null;
  turnIndex: number;
  entityOrder: DangoId[];
  activeBasicIds: DangoId[];
  winnerId: DangoId | null;
  abbyPendingTeleportToStart: boolean;
  lastRollById: Record<string, number | undefined>;
  actLastNextRoundOrderCounter: number;
  entities: Record<string, EntityRuntimeState>;
  cells: Record<string, DangoId[]>;
  pendingTurn: PendingTurnResolution | null;
};

export type MatchRecord = {
  schemaVersion: MatchRecordSchemaVersion;
  setup: RaceSetup;
  board: BoardEffectAssignmentJson[];
  frames: MatchGameFrameJson[];
};
