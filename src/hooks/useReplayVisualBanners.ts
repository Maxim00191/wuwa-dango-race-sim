import { useCallback, useEffect, useRef, useState } from "react";
import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";
import { ABBY_ID } from "@/constants/ids";
import { characterParam, text } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import { scalePlaybackDurationMs } from "@/hooks/playbackSettings";
import { usePlaybackSettings } from "@/hooks/usePlaybackSettings";
import {
  formatTurnOrderArrowLine,
  formatTurnOrderFromActorIds,
} from "@/narration/formatTurnOrderArrowLine";
import type { DangoId, PlaybackSegment } from "@/types/game";
import type { ReplayFrameVisualEvents } from "@/types/replay";

const BANNER_READ_MS = 1450;
const SKILL_BANNER_READ_MS = 1850;
const TURN_OPEN_HOLD_MS = 1750;
const VICTORY_HOLD_MS = 3400;
const IDLE_BANNER_MS = 1300;
const TELEPORT_BANNER_MS = 1400;
const EFFECT_BANNER_MS = 1400;

type QueuedReplayBanner = {
  payload: BroadcastBannerPayload;
  holdMs: number;
};

function delayMilliseconds(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function accentDangoIdForTurnIntro(
  segments: PlaybackSegment[]
): DangoId | undefined {
  for (const segment of segments) {
    if (segment.kind === "teleport") {
      return ABBY_ID;
    }
    if (segment.kind === "stackTeleport") {
      return segment.actorId;
    }
    if (segment.kind === "stackPromote") {
      return segment.entityIds[segment.entityIds.length - 1];
    }
    if (
      segment.kind === "idle" ||
      segment.kind === "roll" ||
      segment.kind === "skill" ||
      segment.kind === "hops" ||
      segment.kind === "cellEffect"
    ) {
      return segment.actorId;
    }
    if (segment.kind === "slide") {
      const stack = segment.travelingIds;
      return stack.length > 0 ? stack[stack.length - 1]! : undefined;
    }
  }
  return undefined;
}

function queuedBannerFromSegment(
  segment: PlaybackSegment
): QueuedReplayBanner | null {
  if (segment.kind === "idle") {
    if (segment.reason === "standby") {
      return {
        payload: {
          variant: "idle",
          headline: text("banner.idle.standbyHeadline", {
            actor: characterParam(segment.actorId),
          }),
          detail: text("banner.idle.standbyDetail"),
          accentDangoId: segment.actorId,
        },
        holdMs: IDLE_BANNER_MS,
      };
    }
    return {
      payload: {
        variant: "idle",
        headline: text("banner.idle.blockedHeadline", {
          actor: characterParam(segment.actorId),
        }),
        detail:
          segment.rollValue !== undefined
            ? text("banner.idle.blockedDetailWithRoll", {
                value: segment.rollValue,
              })
            : text("banner.idle.blockedDetail"),
        accentDangoId: segment.actorId,
      },
      holdMs: IDLE_BANNER_MS,
    };
  }
  if (segment.kind === "roll") {
    return {
      payload: {
        variant: "roll",
        headline: text("banner.roll.headline", {
          actor: characterParam(segment.actorId),
          value: segment.value,
        }),
        detail: text("banner.roll.detail"),
        accentDangoId: segment.actorId,
      },
      holdMs: BANNER_READ_MS,
    };
  }
  if (segment.kind === "skill") {
    return {
      payload: {
        variant: "skill",
        headline: segment.message,
        detail: text("banner.skill.detail"),
        accentDangoId: segment.actorId,
      },
      holdMs: SKILL_BANNER_READ_MS,
    };
  }
  if (segment.kind === "teleport" || segment.kind === "stackTeleport") {
    const accentDangoId =
      segment.kind === "teleport"
        ? segment.entityIds[segment.entityIds.length - 1]
        : segment.actorId;
    return {
      payload: {
        variant: "teleport",
        headline:
          accentDangoId === ABBY_ID
            ? text("banner.teleport.abbyHeadline")
            : text("banner.teleport.stackHeadline", {
                actor: characterParam(accentDangoId ?? ABBY_ID),
              }),
        detail:
          accentDangoId === ABBY_ID
            ? text("banner.teleport.abbyDetail")
            : text("banner.teleport.stackDetail"),
        accentDangoId,
      },
      holdMs: TELEPORT_BANNER_MS,
    };
  }
  if (segment.kind === "cellEffect") {
    return {
      payload: {
        variant: "effect",
        headline: text(`banner.effect.${segment.effectId}.headline`),
        detail: segment.message,
        accentDangoId: segment.actorId,
      },
      holdMs: EFFECT_BANNER_MS,
    };
  }
  if (segment.kind === "victory") {
    return {
      payload: {
        variant: "victory",
        headline: text("banner.victory.headline", {
          winner: characterParam(segment.winnerId),
        }),
        detail: text("banner.victory.detail"),
        accentDangoId: segment.winnerId,
      },
      holdMs: VICTORY_HOLD_MS,
    };
  }
  return null;
}

export function useReplayVisualBanners() {
  const { getCharacterName, t } = useTranslation();
  const { speedMultiplier } = usePlaybackSettings();
  const helpersRef = useRef({ getCharacterName, t });
  const speedMultiplierRef = useRef(speedMultiplier);
  const generationRef = useRef(0);
  const [enabled, setEnabled] = useState(true);
  const [payload, setPayload] = useState<BroadcastBannerPayload | null>(null);

  useEffect(() => {
    helpersRef.current = { getCharacterName, t };
  }, [getCharacterName, t]);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const clear = useCallback(() => {
    generationRef.current += 1;
    setPayload(null);
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled((value) => {
      const nextValue = !value;
      if (!nextValue) {
        generationRef.current += 1;
        setPayload(null);
      }
      return nextValue;
    });
  }, []);

  const playFrameVisualEvents = useCallback(
    (events: ReplayFrameVisualEvents | null | undefined) => {
      generationRef.current += 1;
      setPayload(null);
      if (!enabled || !events) {
        return;
      }
      const queued: QueuedReplayBanner[] = [];
      const orderLine =
        events.turnOrderActorIds && events.turnOrderActorIds.length > 0
          ? formatTurnOrderFromActorIds(
              events.turnOrderActorIds,
              helpersRef.current.getCharacterName
            )
          : formatTurnOrderArrowLine(
              events.segments,
              helpersRef.current.getCharacterName,
              helpersRef.current.t("banner.bonusSlide")
            );
      if (events.showTurnIntroBanner) {
        queued.push({
          payload: {
            variant: "turn",
            headline: text("banner.turn.headline", {
              turn: events.turnIndex,
            }),
            detail: orderLine,
            accentDangoId: accentDangoIdForTurnIntro(events.segments),
          },
          holdMs: TURN_OPEN_HOLD_MS,
        });
      }
      for (const segment of events.segments) {
        const banner = queuedBannerFromSegment(segment);
        if (banner) {
          queued.push(banner);
        }
      }
      if (queued.length === 0) {
        return;
      }
      const generation = generationRef.current;
      void (async () => {
        for (const banner of queued) {
          if (generation !== generationRef.current) {
            return;
          }
          setPayload(banner.payload);
          await delayMilliseconds(
            scalePlaybackDurationMs(banner.holdMs, speedMultiplierRef.current)
          );
          if (generation !== generationRef.current) {
            return;
          }
          setPayload(null);
        }
      })();
    },
    [enabled]
  );

  return {
    enabled,
    payload,
    clear,
    toggleEnabled,
    playFrameVisualEvents,
  };
}
