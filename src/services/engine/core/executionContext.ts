import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import {
  createEngineEventBus,
  type EngineEventBus,
  type EngineEventBusErrorHandler,
} from "@/services/engine/core/events";
import { registerEngineModules } from "@/services/engine/registerModules";

export type EngineExecutionContext = {
  boardEffectByCellIndex: Map<number, string | null>;
  telemetry?: HeadlessRaceTelemetryCollector;
  bus: EngineEventBus;
};

export function createEngineExecutionContext(
  boardEffectByCellIndex: Map<number, string | null>,
  options: {
    telemetry?: HeadlessRaceTelemetryCollector;
    onSubscriberError?: EngineEventBusErrorHandler;
  } = {}
): EngineExecutionContext {
  const executionContext: EngineExecutionContext = {
    boardEffectByCellIndex,
    telemetry: options.telemetry,
    bus: createEngineEventBus(
      options.onSubscriberError ??
        ((error, eventType) => {
          console.error(`Engine event subscriber failed [${eventType}]`, error);
        })
    ),
  };
  registerEngineModules(executionContext);
  return executionContext;
}
