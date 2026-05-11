import {
  memo,
  useMemo,
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
  ellipseOutwardUnitAtAngle,
  ellipsePointFromAngle,
  ellipseTangentUnitAtAngle,
  getBoardCellEffectVisual,
  type BoardCellEffectVisual,
} from "@/services/boardLayout";
import {
  accentFillHexForDango,
  useSafeDangoColors,
} from "@/services/dangoColors";
import type { DangoId } from "@/types/game";

type CircularBoardProps = {
  boardCells: Map<number, DangoId[]>;
  boardEffects: Map<number, string | null>;
  hoppingEntityIds: Set<DangoId>;
};

type CellGeometry = {
  cellIndex: number;
  angle: number;
  center: { x: number; y: number };
  outward: { x: number; y: number };
  tangent: { x: number; y: number };
  effectVisual: BoardCellEffectVisual | null;
  isFinish: boolean;
  markerRadius: number;
  labelX: number;
  labelY: number;
  depthProgress: number;
};

const CELL_MARKER_RADIUS = 6;
const FINISH_CELL_MARKER_RADIUS = 8.5;
const TOKEN_RADIUS = 21;
const TOTEM_LAYER_STEP_VIEWBOX = 24;
const FILTER_SHADOW_BLEED = 10;
const DANGO_HOP_DURATION_MS = 320;
const BOARD_VIEWBOX_WIDTH = 960;
const BOARD_VIEWBOX_HEIGHT = 700;
const MAX_STACK_DEPTH_FOR_LAYOUT = ACTIVE_BASIC_DANGO_COUNT + 1;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ellipseArcPath(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  startAngle: number,
  endAngle: number
): string {
  const start = ellipsePointFromAngle(
    centerX,
    centerY,
    radiusX,
    radiusY,
    startAngle
  );
  const end = ellipsePointFromAngle(
    centerX,
    centerY,
    radiusX,
    radiusY,
    endAngle
  );
  const fullTurn = Math.PI * 2;
  const normalizedSweep =
    ((endAngle - startAngle) % fullTurn + fullTurn) % fullTurn;
  const largeArcFlag = normalizedSweep > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radiusX} ${radiusY} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function CircularBoardComponent({
  boardCells,
  boardEffects,
  hoppingEntityIds,
}: CircularBoardProps) {
  const { getCharacterName, t } = useTranslation();
  const getSafeDangoColors = useSafeDangoColors();
  const { speedMultiplier } = usePlaybackSettings();

  const orbitLayout = useMemo(() => {
    const viewWidth = BOARD_VIEWBOX_WIDTH;
    const viewHeight = BOARD_VIEWBOX_HEIGHT;
    const trackWidth = clamp(
      Math.min(viewWidth, viewHeight) * 0.115,
      46,
      62
    );
    const laneHalfWidth = trackWidth / 2;
    const topTokenLift =
      Math.max(0, MAX_STACK_DEPTH_FOR_LAYOUT - 1) * TOTEM_LAYER_STEP_VIEWBOX;
    const sidePadding =
      Math.max(TOKEN_RADIUS, laneHalfWidth) + FILTER_SHADOW_BLEED + 24;
    const topPadding =
      TOKEN_RADIUS * 2 + topTokenLift + FILTER_SHADOW_BLEED + 18;
    const bottomPadding =
      Math.max(TOKEN_RADIUS, laneHalfWidth) + FILTER_SHADOW_BLEED + 28;
    const centerX = viewWidth / 2;
    const orbitRadiusX = Math.max(52, viewWidth / 2 - sidePadding);
    const orbitRadiusY = Math.max(
      36,
      (viewHeight - topPadding - bottomPadding) / 2
    );
    const centerY = topPadding + orbitRadiusY;
    const outerTrackRadiusX = orbitRadiusX + laneHalfWidth;
    const outerTrackRadiusY = orbitRadiusY + laneHalfWidth;
    const innerTrackRadiusX = Math.max(18, orbitRadiusX - laneHalfWidth);
    const innerTrackRadiusY = Math.max(18, orbitRadiusY - laneHalfWidth);
    const arenaRadiusX = Math.max(16, innerTrackRadiusX - 18);
    const arenaRadiusY = Math.max(16, innerTrackRadiusY - 16);
    const labelInset = laneHalfWidth + 24;
    const finishAngle = angleForCellIndex(FINISH_LINE_CELL_INDEX, CELL_COUNT);
    const finishInnerPoint = ellipsePointFromAngle(
      centerX,
      centerY,
      innerTrackRadiusX + 3,
      innerTrackRadiusY + 3,
      finishAngle
    );
    const finishOuterPoint = ellipsePointFromAngle(
      centerX,
      centerY,
      outerTrackRadiusX - 3,
      outerTrackRadiusY - 3,
      finishAngle
    );
    return {
      centerX,
      centerY,
      orbitRadiusX,
      orbitRadiusY,
      outerTrackRadiusX,
      outerTrackRadiusY,
      innerTrackRadiusX,
      innerTrackRadiusY,
      arenaRadiusX,
      arenaRadiusY,
      trackWidth,
      labelInset,
      finishInnerPoint,
      finishOuterPoint,
      viewWidth,
      viewHeight,
    };
  }, []);

  const cellsArray = useMemo(
    () => Array.from({ length: CELL_COUNT }, (_, index) => index + 1),
    []
  );

  const cellGeometry = useMemo<CellGeometry[]>(() => {
    const {
      centerX,
      centerY,
      orbitRadiusX,
      orbitRadiusY,
      labelInset,
    } = orbitLayout;
    return cellsArray.map((cellIndex) => {
      const angle = angleForCellIndex(cellIndex, CELL_COUNT);
      const center = ellipsePointFromAngle(
        centerX,
        centerY,
        orbitRadiusX,
        orbitRadiusY,
        angle
      );
      const outward = ellipseOutwardUnitAtAngle(
        orbitRadiusX,
        orbitRadiusY,
        angle
      );
      const tangent = ellipseTangentUnitAtAngle(
        orbitRadiusX,
        orbitRadiusY,
        angle
      );
      const labelX = center.x - outward.x * labelInset;
      const labelY = center.y - outward.y * labelInset;
      const depthProgress = clamp(
        orbitRadiusY === 0
          ? 0.5
          : (center.y - (centerY - orbitRadiusY)) / (orbitRadiusY * 2),
        0,
        1
      );
      const effectVisual = getBoardCellEffectVisual(boardEffects.get(cellIndex));
      const isFinish = cellIndex === FINISH_LINE_CELL_INDEX;
      return {
        cellIndex,
        angle,
        center,
        outward,
        tangent,
        effectVisual,
        isFinish,
        markerRadius: isFinish
          ? FINISH_CELL_MARKER_RADIUS
          : CELL_MARKER_RADIUS,
        labelX,
        labelY,
        depthProgress,
      };
    });
  }, [boardEffects, cellsArray, orbitLayout]);

  const orderedTokenDraws = useMemo(() => {
    type Row = {
      cellIndex: number;
      stackIndex: number;
      stackDepth: number;
      entityId: DangoId;
      tx: number;
      ty: number;
      depthProgress: number;
      tokenScale: number;
    };
    const rows: Row[] = [];
    for (const cell of cellGeometry) {
      const stackBottomToTop = boardCells.get(cell.cellIndex) ?? [];
      const stackDepth = stackBottomToTop.length - 1;
      const tokenScale = 0.88 + cell.depthProgress * 0.16;
      stackBottomToTop.forEach((entityId, stackIndex) => {
        rows.push({
          cellIndex: cell.cellIndex,
          stackIndex,
          stackDepth,
          entityId,
          tx: cell.center.x,
          ty:
            cell.center.y -
            TOKEN_RADIUS -
            stackIndex * TOTEM_LAYER_STEP_VIEWBOX,
          depthProgress: cell.depthProgress,
          tokenScale,
        });
      });
    }
    rows.sort((left, right) => {
      if (left.ty !== right.ty) {
        return left.ty - right.ty;
      }
      if (left.stackIndex !== right.stackIndex) {
        return left.stackIndex - right.stackIndex;
      }
      return left.cellIndex - right.cellIndex;
    });
    return rows;
  }, [boardCells, cellGeometry]);

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
    outerTrackRadiusX,
    outerTrackRadiusY,
    innerTrackRadiusX,
    innerTrackRadiusY,
    arenaRadiusX,
    arenaRadiusY,
    trackWidth,
    finishInnerPoint,
    finishOuterPoint,
    viewWidth,
    viewHeight,
  } = orbitLayout;

  const topLaneArc = ellipseArcPath(
    centerX,
    centerY,
    orbitRadiusX,
    orbitRadiusY,
    -Math.PI * 0.82,
    -Math.PI * 0.18
  );
  const bottomLaneArc = ellipseArcPath(
    centerX,
    centerY,
    orbitRadiusX,
    orbitRadiusY,
    Math.PI * 0.12,
    Math.PI * 0.88
  );
  const medallionWidth = Math.min(arenaRadiusX * 0.86, 250);
  const medallionHeight = Math.min(arenaRadiusY * 0.9, 176);
  const medallionCoreRadius = Math.min(medallionWidth, medallionHeight) * 0.18;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full overflow-hidden text-slate-900 dark:text-slate-100"
      style={boardMotionStyle}
      role="img"
      aria-label={t("game.board.ariaLabel")}
    >
      <defs>
        <style>{`
html:not(.dark) #trackSurfaceGradient stop:nth-child(1) { stop-color: #ffffff; stop-opacity: 0.94; }
html:not(.dark) #trackSurfaceGradient stop:nth-child(2) { stop-color: #e2e8f0; stop-opacity: 0.98; }
html:not(.dark) #trackSurfaceGradient stop:nth-child(3) { stop-color: #cbd5e1; stop-opacity: 0.96; }
html:not(.dark) #laneRibbonGradient stop:nth-child(1) { stop-color: #ffffff; stop-opacity: 0.42; }
html:not(.dark) #laneRibbonGradient stop:nth-child(2) { stop-color: #cbd5e1; stop-opacity: 0.14; }
html:not(.dark) #arenaCoreGradient stop:nth-child(1) { stop-color: #ffffff; stop-opacity: 0.95; }
html:not(.dark) #arenaCoreGradient stop:nth-child(2) { stop-color: #e2e8f0; stop-opacity: 0.86; }
html:not(.dark) #arenaCoreGradient stop:nth-child(3) { stop-color: #cbd5e1; stop-opacity: 0.72; }
html:not(.dark) #arenaMotifGradient stop:nth-child(1) { stop-color: #94a3b8; stop-opacity: 0.92; }
html:not(.dark) #arenaMotifGradient stop:nth-child(2) { stop-color: #e2e8f0; stop-opacity: 0.58; }
html:not(.dark) #finishChecker > rect:nth-child(1) { fill: #f8fafc; }
html:not(.dark) #finishChecker > rect:nth-child(2),
html:not(.dark) #finishChecker > rect:nth-child(3) { fill: #64748b; opacity: 0.4; }
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
        <linearGradient id="trackSurfaceGradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.94" />
          <stop offset="58%" stopColor="#1e293b" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="laneRibbonGradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="arenaCoreGradient" cx="50%" cy="45%" r="72%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.94" />
          <stop offset="65%" stopColor="#0f172a" stopOpacity="0.84" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.76" />
        </radialGradient>
        <linearGradient id="arenaMotifGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.15" />
        </linearGradient>
        <filter
          id="finishCellGlow"
          x="-80%"
          y="-80%"
          width="260%"
          height="260%"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation={2.2} result="blur" />
          <feFlood floodColor="#fbbf24" floodOpacity={0.5} result="glowColor" />
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
            floodOpacity={0.72}
          />
        </filter>
        <filter id="tokenShadowStacked" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="2.5"
            stdDeviation={2.4}
            floodColor="#020617"
            floodOpacity={0.42}
          />
        </filter>
      </defs>

      <g aria-hidden="true">
        <ellipse
          cx={centerX}
          cy={centerY + trackWidth * 0.22}
          rx={outerTrackRadiusX + 18}
          ry={outerTrackRadiusY + 22}
          fill="#020617"
          opacity={0.12}
        />
      </g>

      <g>
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={outerTrackRadiusX}
          ry={outerTrackRadiusY}
          fill="url(#trackSurfaceGradient)"
          stroke="currentColor"
          strokeWidth={1.4}
          className="text-slate-200 dark:text-slate-700"
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={orbitRadiusX}
          ry={orbitRadiusY}
          fill="none"
          stroke="url(#laneRibbonGradient)"
          strokeWidth={trackWidth - 10}
          opacity={0.7}
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={innerTrackRadiusX}
          ry={innerTrackRadiusY}
          fill="url(#arenaCoreGradient)"
          stroke="currentColor"
          strokeWidth={1.2}
          className="text-slate-300 dark:text-slate-700"
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={outerTrackRadiusX}
          ry={outerTrackRadiusY}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          opacity={0.45}
          className="text-white dark:text-slate-300"
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={innerTrackRadiusX}
          ry={innerTrackRadiusY}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          opacity={0.35}
          className="text-white dark:text-slate-300"
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={orbitRadiusX}
          ry={orbitRadiusY}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeDasharray={`${Math.max(8, trackWidth * 0.28)} ${Math.max(10, trackWidth * 0.24)}`}
          opacity={0.5}
          className="text-white dark:text-slate-200"
        />
        <path
          d={topLaneArc}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.18}
          className="text-white dark:text-slate-100"
        />
        <path
          d={bottomLaneArc}
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.12}
          className="text-slate-900 dark:text-black"
        />
      </g>

      <g aria-hidden="true">
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={arenaRadiusX}
          ry={arenaRadiusY}
          fill="none"
          stroke="url(#arenaMotifGradient)"
          strokeWidth={1.5}
          opacity={0.88}
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={arenaRadiusX * 0.68}
          ry={arenaRadiusY * 0.68}
          fill="none"
          stroke="url(#arenaMotifGradient)"
          strokeWidth={1.2}
          opacity={0.72}
        />
        <g transform={`translate(${centerX}, ${centerY})`}>
          <rect
            x={-medallionWidth / 2}
            y={-medallionWidth / 2}
            width={medallionWidth}
            height={medallionWidth}
            rx={28}
            fill="none"
            stroke="url(#arenaMotifGradient)"
            strokeWidth={2}
            opacity={0.72}
            transform="rotate(45)"
          />
          <ellipse
            rx={medallionWidth * 0.46}
            ry={medallionHeight * 0.48}
            fill="none"
            stroke="url(#arenaMotifGradient)"
            strokeWidth={1.8}
            opacity={0.88}
          />
          <circle
            r={medallionCoreRadius}
            fill="currentColor"
            opacity={0.12}
            className="text-white dark:text-slate-100"
          />
          {[
            [0, -medallionHeight * 0.42],
            [medallionWidth * 0.38, 0],
            [0, medallionHeight * 0.42],
            [-medallionWidth * 0.38, 0],
          ].map(([x, y], index) => (
            <circle
              key={`motif-node-${index}`}
              cx={x}
              cy={y}
              r={6}
              fill="currentColor"
              opacity={0.18}
              className="text-white dark:text-slate-100"
            />
          ))}
        </g>
      </g>

      <g>
        <line
          x1={finishInnerPoint.x}
          y1={finishInnerPoint.y}
          x2={finishOuterPoint.x}
          y2={finishOuterPoint.y}
          stroke="#fbbf24"
          strokeWidth={16}
          strokeLinecap="round"
          opacity={0.28}
        />
        <line
          x1={finishInnerPoint.x}
          y1={finishInnerPoint.y}
          x2={finishOuterPoint.x}
          y2={finishOuterPoint.y}
          stroke="url(#finishChecker)"
          strokeWidth={10}
          strokeLinecap="round"
        />
      </g>

      <g>
        {cellGeometry.map((cell) => {
          const tangentAngleDegrees =
            (Math.atan2(cell.tangent.y, cell.tangent.x) * 180) / Math.PI;
          const markerHaloOpacity = 0.08 + cell.depthProgress * 0.09;
          const hasEffect = Boolean(cell.effectVisual);
          return (
            <g key={`cell-${cell.cellIndex}`}>
              <text
                x={cell.labelX}
                y={cell.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className={`pointer-events-none text-[10px] font-semibold tabular-nums ${
                  cell.isFinish
                    ? "fill-amber-700 dark:fill-amber-100"
                    : "fill-slate-600 dark:fill-slate-400"
                }`}
              >
                {cell.cellIndex}
              </text>
              <g transform={`translate(${cell.center.x}, ${cell.center.y})`}>
                <ellipse
                  rx={cell.markerRadius + 10}
                  ry={cell.markerRadius + 5}
                  fill="currentColor"
                  opacity={markerHaloOpacity}
                  className="text-white dark:text-slate-100"
                  transform={`rotate(${tangentAngleDegrees})`}
                />
                <circle
                  r={cell.markerRadius}
                  fill={
                    cell.isFinish
                      ? "url(#finishChecker)"
                      : cell.effectVisual?.fill ?? undefined
                  }
                  stroke={
                    cell.isFinish
                      ? "#fbbf24"
                      : cell.effectVisual?.stroke ?? undefined
                  }
                  strokeWidth={cell.isFinish ? 3 : hasEffect ? 2.2 : 1.6}
                  filter={cell.isFinish ? "url(#finishCellGlow)" : undefined}
                  className={
                    cell.isFinish
                      ? undefined
                      : hasEffect
                        ? undefined
                        : "fill-slate-50 stroke-slate-500 dark:fill-[#0f172a] dark:stroke-[#64748b]"
                  }
                />
                {cell.effectVisual && !cell.isFinish ? (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none text-[7px] font-black"
                    fill={cell.effectVisual.stroke}
                  >
                    {cell.effectVisual.symbol}
                  </text>
                ) : null}
              </g>
            </g>
          );
        })}
      </g>

      <g>
        {orderedTokenDraws.map(
          ({
            cellIndex,
            stackIndex,
            stackDepth,
            entityId,
            tx,
            ty,
            depthProgress,
            tokenScale,
          }) => {
            const isHopping = hoppingEntityIds.has(entityId);
            const displayName = displayNameForEntity(entityId, getCharacterName);
            const accentFill = accentFillHexForDango(entityId);
            const {
              baseInkHex,
              uiOutlineHex,
              uiOutlineSoftHex,
            } = getSafeDangoColors(entityId);
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
                transform={`translate(${tx}, ${ty}) scale(${tokenScale})`}
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
                  <ellipse
                    cx={0}
                    cy={TOKEN_RADIUS * 0.96}
                    rx={TOKEN_RADIUS * 0.88}
                    ry={TOKEN_RADIUS * 0.32}
                    fill="#020617"
                    opacity={0.16 + depthProgress * 0.08}
                  />
                  <circle
                    r={TOKEN_RADIUS + 3.4}
                    fill="none"
                    stroke={uiOutlineSoftHex}
                    strokeWidth={6}
                    opacity={0.62 + depthProgress * 0.22}
                  />
                  <circle
                    r={TOKEN_RADIUS}
                    fill={accentFill}
                    stroke={uiOutlineHex}
                    strokeWidth={2.4}
                    opacity={0.94 + stackedLift * 0.04}
                  />
                  <circle
                    cx={-5.5}
                    cy={-8}
                    r={TOKEN_RADIUS * 0.34}
                    fill="#ffffff"
                    opacity={0.1 + depthProgress * 0.08}
                  />
                  {nameLines.length === 1 ? (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none font-bold tracking-tight"
                      fill={baseInkHex}
                      style={{ fontSize: labelFontSize }}
                    >
                      {nameLines[0]}
                    </text>
                  ) : (
                    <text
                      textAnchor="middle"
                      className="pointer-events-none font-bold tracking-tight"
                      fill={baseInkHex}
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
      </g>
    </svg>
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
