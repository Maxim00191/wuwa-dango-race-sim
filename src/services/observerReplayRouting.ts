import type { SimulationWorkspaceView } from "@/config/workspaceViews";
import { parseReplayJsonText } from "@/services/replayImport";

export type { SimulationWorkspaceView };

export type ObserverReplayWorkspaceSlice = {
  flushPlayback: () => void;
  readReplayFromJsonText: (json: string) => void;
};

export type RouteObserverReplayImportInput = {
  json: string;
  analysisReturnView: SimulationWorkspaceView;
  normal: ObserverReplayWorkspaceSlice;
  knockout: ObserverReplayWorkspaceSlice;
  tournament: ObserverReplayWorkspaceSlice;
  setWorkspaceView: (view: SimulationWorkspaceView) => void;
};

export function routeObserverReplayImport(
  input: RouteObserverReplayImportInput
): { ok: true } | { ok: false; reason: "invalid_json" } {
  const parsed = parseReplayJsonText(input.json);
  if (!parsed.ok) {
    return { ok: false, reason: "invalid_json" };
  }

  const target = resolveObserverReplayTarget(input);
  target.flushPlayback();
  target.readReplayFromJsonText(input.json);
  input.setWorkspaceView(target.returnView);
  return { ok: true };
}

function resolveObserverReplayTarget(
  input: RouteObserverReplayImportInput
): ObserverReplayWorkspaceSlice & { returnView: SimulationWorkspaceView } {
  if (input.analysisReturnView === "normal") {
    return { returnView: "normal", ...input.normal };
  }
  if (input.analysisReturnView === "knockout") {
    return { returnView: "knockout", ...input.knockout };
  }
  return { returnView: "tournament", ...input.tournament };
}
