import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { CELL_COUNT, FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import {
  scalePlaybackDurationMs,
  usePlaybackSettings,
} from "@/hooks/usePlaybackSettings";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  angleForCellIndex,
  ellipsePointFromAngle,
  getBoardCellEffectVisual,
} from "@/services/boardLayout";
import {
  accentFillHexForDango,
  contrastingInkHexForFill,
} from "@/services/dangoColors";
import type { DangoId } from "@/types/game";

type CircularBoardProps = {
  boardCells: Map<number, DangoId[]>;
  boardEffects: Map<number, string | null>;
  hoppingEntityIds: Set<DangoId>;
};

const TRACK_RING_PAD_X = 6;
const TRACK_RING_PAD_Y = 6;
const CELL_MARKER_RADIUS = 5.5;
const FINISH_CELL_MARKER_RADIUS = 8.25;
const TOKEN_RADIUS = 21;
const TOTEM_LAYER_STEP_VIEWBOX = 24;
const FILTER_SHADOW_BLEED = 10;
const CELL_INDEX_LABEL_BAND =
  FINISH_CELL_MARKER_RADIUS + 7 + 11;
const DANGO_HOP_DURATION_MS = 320;

const MAX_TOTEM_DEPTH_FOR_ORBIT = ACTIVE_BASIC_DANGO_COUNT;

function displayNameForEntity(
  entityId: DangoId,
  getCharacterName: (id: DangoId) => string
): string {
  const name = getCharacterName(entityId);
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
  hoppingEntityIds,
}: CircularBoardProps) {
  const { getCharacterName, t } = useTranslation();
  const { speedMultiplier } = usePlaybackSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportPixels, setViewportPixels] = useState({
    width: 960,
    height: 700,
  });

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const applyRect = (width: number, height: number) => {
      const nextWidth = Math.max(1, Math.round(width));
      const nextHeight = Math.max(1, Math.round(height));
      setViewportPixels((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    };
    const syncFromElement = () => {
      const rect = element.getBoundingClientRect();
      applyRect(rect.width, rect.height);
    };
    syncFromElement();
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      applyRect(width, height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const orbitLayout = useMemo(() => {
    const viewWidth = viewportPixels.width;
    const viewHeight = viewportPixels.height;
    const dangoFootprintWidth = TOKEN_RADIUS * 2;
    const horizontalHalfReserve = dangoFootprintWidth + FILTER_SHADOW_BLEED;
    const totemColumnHeight =
      TOKEN_RADIUS +
      MAX_TOTEM_DEPTH_FOR_ORBIT * TOTEM_LAYER_STEP_VIEWBOX +
      TOKEN_RADIUS;
    const verticalHalfReserve =
      totemColumnHeight + CELL_INDEX_LABEL_BAND + FILTER_SHADOW_BLEED;
    const centerX = viewWidth / 2;
    const centerY = viewHeight / 2;
    const orbitRadiusX = Math.max(
      12,
      viewWidth / 2 - horizontalHalfReserve
    );
    const orbitRadiusY = Math.max(
      12,
      viewHeight / 2 - verticalHalfReserve
    );
    return {
      centerX,
      centerY,
      orbitRadiusX,
      orbitRadiusY,
      viewWidth,
      viewHeight,
    };
  }, [viewportPixels.width, viewportPixels.height]);

  const cellsArray = useMemo(
    () => Array.from({ length: CELL_COUNT }, (_, index) => index + 1),
    []
  );

  const orderedTokenDraws = useMemo(() => {
    type Row = {
      cellIndex: number;
      stackIndex: number;
      stackDepth: number;
      entityId: DangoId;
      tx: number;
      ty: number;
    };
    const rows: Row[] = [];
    const {
      centerX,
      centerY,
      orbitRadiusX,
      orbitRadiusY,
    } = orbitLayout;
    for (const cellIndex of cellsArray) {
      const angle = angleForCellIndex(cellIndex, CELL_COUNT);
      const cellCenter = ellipsePointFromAngle(
        centerX,
        centerY,
        orbitRadiusX,
        orbitRadiusY,
        angle
      );
      const stackBottomToTop = boardCells.get(cellIndex) ?? [];
      const stackDepth = stackBottomToTop.length - 1;
      stackBottomToTop.forEach((entityId, stackIndex) => {
        rows.push({
          cellIndex,
          stackIndex,
          stackDepth,
          entityId,
          tx: cellCenter.x,
          ty:
            cellCenter.y -
            TOKEN_RADIUS -
            stackIndex * TOTEM_LAYER_STEP_VIEWBOX,
        });
      });
    }
    rows.sort((left, right) => {
      if (left.stackIndex !== right.stackIndex) {
        return left.stackIndex - right.stackIndex;
      }
      return left.cellIndex - right.cellIndex;
    });
    return rows;
  }, [boardCells, cellsArray, orbitLayout]);

  const boardMotionStyle = useMemo(
    () =>
      ({
        "--dango-hop-duration": `${scalePlaybackDurationMs(
          DANGO_HOP_DURATION_MS,
          speedMultiplier
        )}ms`,
      }) as CSSProperties,
    [speedMultiplier]
  );

  const {
    centerX,
    centerY,
    orbitRadiusX,
    orbitRadiusY,
    viewWidth,
    viewHeight,
  } = orbitLayout;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-0 overflow-hidden"
      style={boardMotionStyle}
    >
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="h-full w-full text-slate-900 dark:text-slate-100"
        role="img"
        aria-label={t("game.board.ariaLabel")}
      >
        <defs>
          <style>{`
html:not(.dark) #boardGlow stop:nth-child(1) { stop-color: #f8fafc; }
html:not(.dark) #boardGlow stop:nth-child(2) { stop-color: #e2e8f0; }
html:not(.dark) #finishChecker > rect:nth-child(1) { fill: #f8fafc; }
html:not(.dark) #finishChecker > rect:nth-child(2),
html:not(.dark) #finishChecker > rect:nth-child(3) { fill: #64748b; opacity: 0.35; }
html:not(.dark) #finishChecker > rect:nth-child(4),
html:not(.dark) #finishChecker > rect:nth-child(5) { fill: #cbd5e1; }
`}</style>
          <pattern
            id="finishChecker"
            width={10}
            height={10}
            patternUnits="userSpaceOnUse"
          >
            <rect width={10} height={10} fill="#0f172a" />
            <rect width={5} height={5} fill="#e2e8f0" opacity={0.92} />
            <rect x={5} y={5} width={5} height={5} fill="#e2e8f0" opacity={0.92} />
            <rect x={5} width={5} height={5} fill="#1e293b" />
            <rect y={5} width={5} height={5} fill="#1e293b" />
          </pattern>
          <radialGradient id="boardGlow" cx="50%" cy="50%" r="68%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <filter
            id="finishCellGlow"
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation={2.2} result="blur" />
            <feFlood floodColor="#fbbf24" floodOpacity={0.55} result="glowColor" />
            <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tokenShadowGrounded" x="-55%" y="-55%" width="210%" height="210%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation={5.5}
              floodColor="#020617"
              floodOpacity={0.78}
            />
          </filter>
          <filter id="tokenShadowStacked" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy={2.5}
              stdDeviation={2.4}
              floodColor="#020617"
              floodOpacity={0.48}
            />
          </filter>
        </defs>
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={orbitRadiusX + TRACK_RING_PAD_X}
          ry={orbitRadiusY + TRACK_RING_PAD_Y}
          fill="url(#boardGlow)"
          stroke="currentColor"
          strokeWidth={2}
          className="text-slate-300 dark:text-slate-600"
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={orbitRadiusX}
          ry={orbitRadiusY}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeDasharray="6 10"
          opacity={0.55}
          className="text-slate-300 dark:text-slate-600"
        />
        {cellsArray.map((cellIndex) => {
          const angle = angleForCellIndex(cellIndex, CELL_COUNT);
          const cellCenter = ellipsePointFromAngle(
            centerX,
            centerY,
            orbitRadiusX,
            orbitRadiusY,
            angle
          );
          const effectId = boardEffects.get(cellIndex);
          const effectVisual = getBoardCellEffectVisual(effectId);
          const hasEffect = Boolean(effectVisual);
          const finishAccent = cellIndex === FINISH_LINE_CELL_INDEX;
          const markerRadius = finishAccent
            ? FINISH_CELL_MARKER_RADIUS
            : CELL_MARKER_RADIUS;
          return (
            <g key={`cell-${cellIndex}`}>
              <g transform={`translate(${cellCenter.x}, ${cellCenter.y})`}>
                <circle
                  r={markerRadius}
                  fill={
                    finishAccent
                      ? "url(#finishChecker)"
                      : effectVisual?.fill ?? undefined
                  }
                  stroke={
                    finishAccent
                      ? "#fbbf24"
                      : effectVisual?.stroke ?? undefined
                  }
                  strokeWidth={finishAccent ? 3 : hasEffect ? 2 : 1.4}
                  filter={finishAccent ? "url(#finishCellGlow)" : undefined}
                  className={
                    finishAccent
                      ? undefined
                      : hasEffect
                        ? undefined
                        : "fill-slate-100 stroke-slate-400 dark:fill-[#0f172a] dark:stroke-[#64748b]"
                  }
                />
                {effectVisual && !finishAccent ? (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none text-[7px] font-black"
                    fill={effectVisual.stroke}
                  >
                    {effectVisual.symbol}
                  </text>
                ) : null}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  y={-markerRadius - 7}
                  className={`pointer-events-none text-[9px] font-semibold tabular-nums ${
                    finishAccent
                      ? "fill-amber-700 dark:fill-amber-100"
                      : "fill-slate-600 dark:fill-slate-500"
                  }`}
                >
                  {cellIndex}
                </text>
              </g>
            </g>
          );
        })}
        {orderedTokenDraws.map(
          ({
            cellIndex,
            stackIndex,
            stackDepth,
            entityId,
            tx,
            ty,
          }) => {
            const isHopping = hoppingEntityIds.has(entityId);
            const displayName = displayNameForEntity(entityId, getCharacterName);
            const accentFill = accentFillHexForDango(entityId);
            const labelFill = contrastingInkHexForFill(accentFill);
            const nameLines = splitDisplayNameIntoLines(displayName);
            const labelFontSize = fontSizeForTokenLabelLines(nameLines);
            const stackedLift = stackIndex / Math.max(stackDepth, 1);
            const tokenFilter =
              stackIndex === 0
                ? "url(#tokenShadowGrounded)"
                : "url(#tokenShadowStacked)";
            return (
              <g
                key={`${entityId}-${cellIndex}-${stackIndex}`}
                transform={`translate(${tx}, ${ty})`}
                filter={tokenFilter}
              >
                <g
                  className={
                    isHopping ? "origin-center animate-dango-hop" : undefined
                  }
                  style={{
                    animationDuration: "var(--dango-hop-duration)",
                    transformBox: "fill-box",
                    transformOrigin: "50% 50%",
                  }}
                >
                  <circle
                    r={TOKEN_RADIUS}
                    fill={accentFill}
                    strokeWidth={2.2}
                    opacity={0.92 + stackedLift * 0.06}
                    className="stroke-slate-600/85 dark:stroke-slate-300/55"
                  />
                  {nameLines.length === 1 ? (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none font-bold tracking-tight"
                      fill={labelFill}
                      style={{ fontSize: labelFontSize }}
                    >
                      {nameLines[0]}
                    </text>
                  ) : (
                    <text
                      textAnchor="middle"
                      className="pointer-events-none font-bold tracking-tight"
                      fill={labelFill}
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
          }
        )}
      </svg>
    </div>
  );
}

function serializeCellMap(cells: Map<number, DangoId[]>): string {
  return [...cells.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([cellIndex, stack]) => `${cellIndex}:${stack.join("|")}`)
    .join(";");
}

function propsAreEqual(
  previous: CircularBoardProps,
  next: CircularBoardProps
): boolean {
  if (serializeCellMap(previous.boardCells) !== serializeCellMap(next.boardCells)) {
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
