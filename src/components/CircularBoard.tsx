import { CELL_COUNT } from "@/constants/board";
import { ABBY_ID } from "@/constants/ids";
import type { GameState } from "@/types/game";

type CircularBoardProps = {
  state: GameState;
  boardEffects: Map<number, string | null>;
};

const VIEWBOX_SIZE = 440;
const CENTER = VIEWBOX_SIZE / 2;
const ORBIT_RADIUS = 175;
const CELL_RADIUS = 26;

function polarToCartesian(angleRadians: number, radius: number) {
  return {
    x: CENTER + radius * Math.cos(angleRadians),
    y: CENTER + radius * Math.sin(angleRadians),
  };
}

function tokenFillColor(entityId: string): string {
  if (entityId === ABBY_ID) {
    return "#fb7185";
  }
  const palette = [
    "#38bdf8",
    "#a78bfa",
    "#34d399",
    "#fbbf24",
    "#f472b6",
    "#94a3b8",
  ];
  const hash = entityId
    .split("")
    .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  return palette[hash % palette.length]!;
}

export function CircularBoard({ state, boardEffects }: CircularBoardProps) {
  const cellsArray = Array.from({ length: CELL_COUNT }, (_, index) => index + 1);

  return (
    <div className="flex w-full justify-center">
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="h-[min(92vw,520px)] w-[min(92vw,520px)] text-slate-100"
        role="img"
        aria-label="Circular race board with thirty-two cells"
      >
        <defs>
          <radialGradient id="boardGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_RADIUS + 42}
          fill="url(#boardGlow)"
          stroke="#334155"
          strokeWidth={2}
        />
        {cellsArray.map((cellIndex) => {
          const angle =
            (cellIndex / CELL_COUNT) * Math.PI * 2 - Math.PI / 2;
          const position = polarToCartesian(angle, ORBIT_RADIUS);
          const stackBottomToTop = state.cells.get(cellIndex) ?? [];
          const effectId = boardEffects.get(cellIndex);
          const hasEffect = Boolean(effectId);
          return (
            <g key={cellIndex} transform={`translate(${position.x}, ${position.y})`}>
              <circle
                r={CELL_RADIUS}
                fill="#0f172a"
                stroke={
                  cellIndex === 1 ? "#fbbf24" : hasEffect ? "#c084fc" : "#475569"
                }
                strokeWidth={cellIndex === 1 ? 3 : hasEffect ? 2.4 : 1.5}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                y={-6}
                className="fill-slate-200 text-[11px] font-semibold"
              >
                {cellIndex}
              </text>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                y={10}
                className="fill-slate-400 text-[9px]"
              >
                {stackBottomToTop.length > 0
                  ? `${stackBottomToTop.length}`
                  : ""}
              </text>
              {stackBottomToTop.map((entityId, stackIndex) => {
                const tokenOffset = (stackIndex - (stackBottomToTop.length - 1) / 2) * 7;
                return (
                  <circle
                    key={`${entityId}-${stackIndex}`}
                    r={6}
                    cx={tokenOffset}
                    cy={18}
                    fill={tokenFillColor(entityId)}
                    stroke="#020617"
                    strokeWidth={1}
                  />
                );
              })}
            </g>
          );
        })}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={58}
          fill="#020617"
          stroke="#475569"
          strokeWidth={2}
        />
        <text
          x={CENTER}
          y={CENTER - 8}
          textAnchor="middle"
          className="fill-slate-100 text-[13px] font-semibold"
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
      </svg>
    </div>
  );
}
