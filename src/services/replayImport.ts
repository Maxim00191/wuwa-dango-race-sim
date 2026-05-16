import { parseMatchRecordJson } from "@/services/matchReplay";
import type { MatchRecord } from "@/types/replay";

export type ReplayImportResult =
  | { ok: true; record: MatchRecord }
  | { ok: false; reason: "invalid_json" };

export function parseReplayJsonText(json: string): ReplayImportResult {
  try {
    const record = parseMatchRecordJson(json);
    return { ok: true, record };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
