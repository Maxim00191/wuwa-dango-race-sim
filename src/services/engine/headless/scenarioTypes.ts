import type { DangoId } from "@/types/game";
import type { RaceSetup } from "@/types/game";

export type HeadlessSimulationScenario =
  | {
      kind: "singleRace";
      setup: RaceSetup;
    }
  | {
      kind: "tournament";
      selectedBasicIds: DangoId[];
    };

export type HeadlessSimulationOptions = {
  captureReplay?: boolean;
  seed?: number;
};
