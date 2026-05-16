import { useNavigationWorkspace } from "@/app/contexts/workspaceContexts";
import { AnalysisWorkspace } from "@/app/workspaces/AnalysisWorkspace";
import { KnockoutWorkspace } from "@/app/workspaces/KnockoutWorkspace";
import { NormalWorkspace } from "@/app/workspaces/NormalWorkspace";
import { TournamentWorkspace } from "@/app/workspaces/TournamentWorkspace";

export function WorkspaceContent() {
  const { workspaceView } = useNavigationWorkspace();

  switch (workspaceView) {
    case "normal":
      return <NormalWorkspace />;
    case "knockout":
      return <KnockoutWorkspace />;
    case "tournament":
      return <TournamentWorkspace />;
    case "analysis":
      return <AnalysisWorkspace />;
  }
}
