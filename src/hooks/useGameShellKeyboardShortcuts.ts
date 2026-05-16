import { useEffect } from "react";
import type { GameShellControlDisabledState } from "@/services/gameShellControls";
import type { GameShellSpectate } from "@/types/gameShell";

export type GameShellKeyboardShortcutHandlers = {
  onStartSprint?: () => void;
  onPlayTurn: () => void;
  onStepAction: () => void;
  onInstantGame: () => void;
  onAutoPlayEnabledChange: (nextValue: boolean) => void;
  autoPlayEnabled: boolean;
  spectate?: GameShellSpectate;
};

export function useGameShellKeyboardShortcuts(
  disabled: GameShellControlDisabledState,
  handlers: GameShellKeyboardShortcutHandlers
): void {
  const {
    onStartSprint,
    onPlayTurn,
    onStepAction,
    onInstantGame,
    onAutoPlayEnabledChange,
    autoPlayEnabled,
    spectate,
  } = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardShortcuts(event.target)) {
        return;
      }

      if (event.code === "PageUp" || event.code === "PageDown") {
        if (event.altKey || event.shiftKey || event.metaKey || event.ctrlKey) {
          return;
        }
        event.preventDefault();
        return;
      }

      if (event.code === "Space") {
        if (spectate) {
          if (disabled.autoRunDisabled) {
            return;
          }
          event.preventDefault();
          spectate.onToggleAuto();
          return;
        }
        if (disabled.autoRunDisabled) {
          return;
        }
        event.preventDefault();
        onAutoPlayEnabledChange(!autoPlayEnabled);
        return;
      }

      if (event.code === "ArrowUp" || event.code === "ArrowLeft") {
        if (event.altKey || event.shiftKey || event.metaKey || event.ctrlKey) {
          return;
        }
        if (!spectate?.onHistoryStepBack) {
          return;
        }
        if (!spectate.timelineVisible || spectate.timelineStep <= 0) {
          return;
        }
        event.preventDefault();
        spectate.onHistoryStepBack();
        return;
      }

      if (event.code === "ArrowDown") {
        if (event.altKey || event.shiftKey || event.metaKey || event.ctrlKey) {
          return;
        }
        if (!spectate || disabled.nextTurnDisabled) {
          return;
        }
        event.preventDefault();
        spectate.onStep();
        return;
      }

      if (event.code === "ArrowRight") {
        if (event.ctrlKey) {
          if (disabled.playTurnDisabled) {
            return;
          }
          event.preventDefault();
          if (spectate) {
            spectate.onPlayTurn();
          } else {
            onPlayTurn();
          }
          return;
        }
        if (event.altKey || event.shiftKey || event.metaKey) {
          return;
        }
        if (spectate) {
          if (disabled.nextTurnDisabled) {
            return;
          }
          event.preventDefault();
          spectate.onStep();
          return;
        }
        if (disabled.keyboardEngineStepDisabled) {
          return;
        }
        event.preventDefault();
        onStepAction();
        return;
      }

      if (event.code === "Enter") {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
          return;
        }
        if (!disabled.startSprintDisabled) {
          event.preventDefault();
          onStartSprint?.();
          return;
        }
        if (disabled.instantDisabled) {
          return;
        }
        event.preventDefault();
        onInstantGame();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    autoPlayEnabled,
    disabled,
    onAutoPlayEnabledChange,
    onInstantGame,
    onPlayTurn,
    onStartSprint,
    onStepAction,
    spectate,
  ]);
}

function shouldIgnoreKeyboardShortcuts(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  if (target.closest("button, a[href], [role='button'], [role='link']")) {
    return true;
  }
  return false;
}
