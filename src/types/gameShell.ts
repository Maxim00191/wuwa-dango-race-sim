import type { ReactNode } from "react";
import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";

export type GameShellSpectate = {
  replayFileActive: boolean;
  timelineVisible: boolean;
  timelineStep: number;
  timelineMax: number;
  onScrub: (step: number) => void;
  scrubAria: string;
  turnSummaryText: string;
  replayToolbar: ReactNode;
  onStep: () => void;
  onPlayTurn: () => void;
  onToggleAuto: () => void;
  autoActive: boolean;
  replayBannersEnabled: boolean;
  replayBannerPayload: BroadcastBannerPayload | null;
  onToggleReplayBanners: () => void;
  playTurnBusy?: boolean;
  stepDisabled: boolean;
  playTurnDisabled: boolean;
  autoRunDisabled: boolean;
  onHistoryStepBack?: () => void;
};
