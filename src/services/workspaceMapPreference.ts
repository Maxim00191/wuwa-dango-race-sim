import type { WorkspaceView } from "@/config/workspaceViews";
import {
  DEFAULT_MAP_ID,
  KNOCKOUT_MAP_ID,
  type MapId,
} from "@/constants/maps";

const PREFERRED_MAP_ID_BY_WORKSPACE_VIEW: Record<WorkspaceView, MapId> = {
  normal: DEFAULT_MAP_ID,
  tournament: DEFAULT_MAP_ID,
  knockout: KNOCKOUT_MAP_ID,
  analysis: DEFAULT_MAP_ID,
};

export function preferredMapIdForWorkspaceView(view: WorkspaceView): MapId {
  return PREFERRED_MAP_ID_BY_WORKSPACE_VIEW[view];
}
