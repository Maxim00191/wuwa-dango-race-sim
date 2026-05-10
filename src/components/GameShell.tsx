import { CircularBoard } from "@/components/CircularBoard";
import { CHARACTER_LIST } from "@/services/characters";
import type { GameState } from "@/types/game";

type GameShellProps = {
  state: GameState;
  boardEffects: Map<number, string | null>;
  onStart: () => void;
  onNextTurn: () => void;
  onReset: () => void;
};

export function GameShell({
  state,
  boardEffects,
  onStart,
  onNextTurn,
  onReset,
}: GameShellProps) {
  const startDisabled = state.phase !== "idle";
  const nextTurnDisabled = state.phase !== "running" || Boolean(state.winnerId);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 text-slate-100">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          Circular ladder chase
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Dango Scramble
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
              Thirty-two linked cells, stacking carries, Abby counters the pack,
              and the top dango claims victory when a lap completes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStart}
              disabled={startDisabled}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              Start session
            </button>
            <button
              type="button"
              onClick={onNextTurn}
              disabled={nextTurnDisabled}
              className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              Resolve turn
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:text-white"
            >
              Reset board
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Track overview
              </p>
              <p className="text-lg font-semibold text-white">
                Turn {Math.max(state.turnIndex, 0)}
                {state.phase === "idle"
                  ? " · Ready"
                  : state.phase === "running"
                    ? " · Live"
                    : " · Complete"}
              </p>
            </div>
            {state.winnerId ? (
              <div className="rounded-full bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/40">
                Winner locked in
              </div>
            ) : null}
          </div>
          <CircularBoard state={state} boardEffects={boardEffects} />
          <div className="mt-6 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <LegendSwatch
              label="Finish line"
              description="Cell 1 wraps the lap counter."
              borderClass="border-amber-300"
            />
            <LegendSwatch
              label="Special cells"
              description="Purple rings trigger scripted effects."
              borderClass="border-purple-400"
            />
            <LegendSwatch
              label="Stacks"
              description="Dots show occupants from bottom to top."
              borderClass="border-slate-500"
            />
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/60">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Racers
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {CHARACTER_LIST.map((character) => {
                const runtime = state.entities[character.id];
                const roll = state.lastRollById[character.id];
                return (
                  <li
                    key={character.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {character.displayName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {character.role === "boss"
                          ? "Boss · dice 1-6 · counter-clockwise"
                          : "Basic · dice 1-3 · clockwise"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p className="font-mono text-[13px] text-slate-100">
                        Δ {runtime?.raceDisplacement ?? 0}
                      </p>
                      <p className="text-[11px]">
                        roll {roll ?? "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex max-h-[420px] flex-col rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/60">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Chronicle
              </p>
              <span className="text-[11px] text-slate-500">
                {state.log.length} events
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-200">
              {state.log.length === 0 ? (
                <p className="text-slate-500">
                  Events appear here each time you resolve a turn.
                </p>
              ) : (
                state.log.map((entry, index) => (
                  <p key={`${entry.kind}-${index}`} className="border-b border-slate-800 pb-3 last:border-none">
                    {entry.message}
                  </p>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

type LegendSwatchProps = {
  label: string;
  description: string;
  borderClass: string;
};

function LegendSwatch({ label, description, borderClass }: LegendSwatchProps) {
  return (
    <div className={`rounded-2xl border ${borderClass} bg-slate-950/40 px-4 py-3`}>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}
