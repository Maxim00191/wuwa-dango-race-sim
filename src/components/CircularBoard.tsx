import { memo, useMemo } from "react";
import {
  BroadcastBanner,
  type BroadcastBannerPayload,
} from "@/components/BroadcastBanner";
import { CELL_COUNT } from "@/constants/board";
import { CHARACTER_BY_ID } from "@/services/characters";
import { accentFillHexForDango } from "@/services/dangoColors";
import type { DangoId } from "@/types/game";

type CircularBoardProps = {
  boardCells: Map<number, DangoId[]>;
  boardEffects: Map<number, string | null>;
  broadcastPayload: BroadcastBannerPayload | null;
  hoppingEntityIds: Set<DangoId>;
};

const VIEWBOX_SIZE = 560;
const CENTER = VIEWBOX_SIZE / 2;
const ORBIT_RADIUS = 228;
const CELL_MARKER_RADIUS = 5.5;
const TOKEN_RADIUS = 21;
const TOKEN_BASE_OUTWARD = 26;
const TOTEM_LAYER_STEP_VIEWBOX = 24;

function polarToCartesian(angleRadians: number, radius: number) {
  return {
    x: CENTER + radius * Math.cos(angleRadians),
    y: CENTER + radius * Math.sin(angleRadians),
  };
}

function displayNameForEntity(entityId: DangoId): string {
  const name = CHARACTER_BY_ID[entityId]?.displayName ?? entityId;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : entityId;
}

function splitDisplayNameIntoLines(label: string): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    return [
      words.slice(0, mid).join(" "),
      words.slice(mid).join(" "),
    ];
  }
  const single = words[0] ?? label;
  if (single.length <= 8) {
    return [single];
  }
  const mid = Math.ceil(single.length / 2);
  return [single.slice(0, mid), single.slice(mid)];
}

function fontSizeForTokenLabelLines(lines: string[]): number {
  const longest = Math.max(...lines.map((line) => line.length));
  const twoLines = lines.length === 2;
  if (longest <= 4) {
    return twoLines ? 9.5 : 10.5;
  }
  if (longest <= 6) {
    return twoLines ? 8.5 : 9.5;
  }
  if (longest <= 8) {
    return twoLines ? 7.75 : 8.75;
  }
  return twoLines ? 7 : 8;
}

function CircularBoardComponent({
  boardCells,
  boardEffects,
  broadcastPayload,
  hoppingEntityIds,
}: CircularBoardProps) {
  const cellsArray = useMemo(
    () => Array.from({ length: CELL_COUNT }, (_, index) => index + 1),
    []
  );

  const hubLabelVisible = !broadcastPayload;

  return (
    <div className="relative mx-auto flex aspect-square h-[min(85vw,480px)] w-[min(85vw,480px)] justify-center xl:h-[min(58vw,560px)] xl:w-[min(58vw,560px)] 2xl:h-[min(52vw,640px)] 2xl:w-[min(52vw,640px)]">
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="h-full w-full text-slate-100"
        role="img"
        aria-label="Circular race board with thirty-two cells"
      >
        <defs>
          <radialGradient id="boardGlow" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <filter id="tokenShadowStacked" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="3"
              floodColor="#020617"
              floodOpacity="0.62"
            />
          </filter>
        </defs>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_RADIUS + 58}
          fill="url(#boardGlow)"
          stroke="#334155"
          strokeWidth={2}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_RADIUS}
          fill="none"
          stroke="#334155"
          strokeWidth={1.25}
          strokeDasharray="6 10"
          opacity={0.55}
        />
        {cellsArray.map((cellIndex) => {
          const angle = (cellIndex / CELL_COUNT) * Math.PI * 2 - Math.PI / 2;
          const cellCenter = polarToCartesian(angle, ORBIT_RADIUS);
          const outwardX = Math.cos(angle);
          const outwardY = Math.sin(angle);
          const stackBottomToTop = boardCells.get(cellIndex) ?? [];
          const effectId = boardEffects.get(cellIndex);
          const hasEffect = Boolean(effectId);
          const finishAccent = cellIndex === 1;
          return (
            <g key={`cell-${cellIndex}`}>
              <g transform={`translate(${cellCenter.x}, ${cellCenter.y})`}>
                <circle
                  r={CELL_MARKER_RADIUS}
                  fill="#0f172a"
                  stroke={
                    finishAccent ? "#fbbf24" : hasEffect ? "#c084fc" : "#64748b"
                  }
                  strokeWidth={finishAccent ? 2.4 : hasEffect ? 2 : 1.4}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  y={-CELL_MARKER_RADIUS - 7}
                  className="fill-slate-500 pointer-events-none text-[9px] font-semibold tabular-nums"
                >
                  {cellIndex}
                </text>
              </g>
              {stackBottomToTop.map((entityId, stackIndex) => {
                const stackDepth = stackBottomToTop.length - 1;
                const baseX = cellCenter.x + outwardX * TOKEN_BASE_OUTWARD;
                const baseY = cellCenter.y + outwardY * TOKEN_BASE_OUTWARD;
                const liftY = -stackIndex * TOTEM_LAYER_STEP_VIEWBOX;
                const tx = baseX;
                const ty = baseY + liftY;
                const isHopping = hoppingEntityIds.has(entityId);
                const displayName = displayNameForEntity(entityId);
                const nameLines = splitDisplayNameIntoLines(displayName);
                const labelFontSize = fontSizeForTokenLabelLines(nameLines);
                const stackedLift = stackIndex / Math.max(stackDepth, 1);
                return (
                  <g
                    key={`${entityId}-${cellIndex}-${stackIndex}`}
                    transform={`translate(${tx}, ${ty})`}
                    filter="url(#tokenShadowStacked)"
                  >
                    <g
                      className={
                        isHopping ? "origin-center animate-dango-hop" : undefined
                      }
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: "50% 50%",
                      }}
                    >
                      <circle
                        r={TOKEN_RADIUS}
                        fill={accentFillHexForDango(entityId)}
                        stroke="#020617"
                        strokeWidth={2.2}
                        opacity={0.92 + stackedLift * 0.06}
                      />
                      {nameLines.length === 1 ? (
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none fill-slate-950 font-bold tracking-tight"
                          style={{ fontSize: labelFontSize }}
                        >
                          {nameLines[0]}
                        </text>
                      ) : (
                        <text
                          textAnchor="middle"
                          className="pointer-events-none fill-slate-950 font-bold tracking-tight"
                          style={{ fontSize: labelFontSize }}
                        >
                          <tspan x={0} dy="-0.52em">
                            {nameLines[0]}
                          </tspan>
                          <tspan x={0} dy="1.05em">
                            {nameLines[1]}
                          </tspan>
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={52}
          fill="#020617"
          stroke="#475569"
          strokeWidth={2}
        />
        {hubLabelVisible ? (
          <>
            <text
              x={CENTER}
              y={CENTER - 10}
              textAnchor="middle"
              className="fill-slate-100 text-[14px] font-semibold"
            >
              Finish
            </text>
            <text
              x={CENTER}
              y={CENTER + 12}
              textAnchor="middle"
              className="fill-slate-400 text-[11px]"
            >
              Cell 1
            </text>
          </>
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 z-20 m-auto flex items-center justify-center px-3">
        <BroadcastBanner payload={broadcastPayload} />
      </div>
    </div>
  );
}

function serializeCellMap(cells: Map<number, DangoId[]>): string {
  return [...cells.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([cellIndex, stack]) => `${cellIndex}:${stack.join("|")}`)
    .join(";");
}

function broadcastFingerprint(
  payload: BroadcastBannerPayload | null
): string {
  if (!payload) {
    return "";
  }
  return `${payload.variant}\u001f${payload.headline}\u001f${payload.detail ?? ""}\u001f${payload.accentDangoId ?? ""}`;
}

function propsAreEqual(
  previous: CircularBoardProps,
  next: CircularBoardProps
): boolean {
  if (serializeCellMap(previous.boardCells) !== serializeCellMap(next.boardCells)) {
    return false;
  }
  if (broadcastFingerprint(previous.broadcastPayload) !== broadcastFingerprint(next.broadcastPayload)) {
    return false;
  }
  if (previous.boardEffects !== next.boardEffects) {
    return false;
  }
  if (previous.hoppingEntityIds.size !== next.hoppingEntityIds.size) {
    return false;
  }
  for (const id of next.hoppingEntityIds) {
    if (!previous.hoppingEntityIds.has(id)) {
      return false;
    }
  }
  return true;
}

export const CircularBoard = memo(CircularBoardComponent, propsAreEqual);
