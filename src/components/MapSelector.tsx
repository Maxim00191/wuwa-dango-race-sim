import { MAP_IDS, MAP_PRESETS, type MapId } from "@/constants/maps";
import { useTranslation } from "@/i18n/useTranslation";

type MapSelectorProps = {
  selectedMapId: MapId | null;
  onSelectMapId: (mapId: MapId) => void;
  disabled?: boolean;
};

function formatTileList(tiles: readonly number[]): string {
  return tiles.join(", ");
}

export function MapSelector({
  selectedMapId,
  onSelectMapId,
  disabled = false,
}: MapSelectorProps) {
  const { t } = useTranslation();

  return (
    <section className="w-full rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800/90 dark:bg-slate-900/60 dark:shadow-slate-950/40 sm:p-5">
      <header className="mb-4 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
          {t("mapSelection.eyebrow")}
        </p>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("mapSelection.title")}
        </h2>
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t("mapSelection.description")}
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MAP_IDS.map((mapId) => {
          const config = MAP_PRESETS[mapId];
          const selected = mapId === selectedMapId;
          return (
            <button
              key={mapId}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onSelectMapId(mapId)}
              className={`group relative flex flex-col gap-1 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-55 dark:focus-visible:ring-offset-slate-950 ${
                selected
                  ? "border-violet-400/80 bg-violet-50/90 shadow-md shadow-violet-900/10 ring-1 ring-violet-300/60 dark:border-violet-500/70 dark:bg-violet-950/35 dark:ring-violet-700/50"
                  : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700 dark:hover:bg-slate-950/80"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                      {t(`mapSelection.presets.${mapId}.eyebrow`)}
                    </p>
                    <div className="relative">
                      <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-64 origin-bottom-left scale-95 opacity-0 transition-all group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/50">
                          <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {t(`mapSelection.presets.${mapId}.description`)}
                          </p>
                          <dl className="grid gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-400">
                            <DeviceRow
                              label={t("game.board.legend.propulsion.label")}
                              tiles={config.propulsionDeviceTiles}
                              tone="emerald"
                            />
                            <DeviceRow
                              label={t("game.board.legend.hindrance.label")}
                              tiles={config.hindranceDeviceTiles}
                              tone="rose"
                            />
                            <DeviceRow
                              label={t("game.board.legend.rift.label")}
                              tiles={config.timeRiftTiles}
                              tone="violet"
                            />
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-50">
                    {t(`mapSelection.presets.${mapId}.label`)}
                  </p>
                </div>
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                    selected
                      ? "bg-violet-500 text-violet-950 dark:bg-violet-400"
                      : "border border-slate-300/80 bg-white text-transparent dark:border-slate-700 dark:bg-slate-900"
                  }`}
                  aria-hidden
                >
                  <CheckGlyph />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DeviceRow({
  label,
  tiles,
  tone,
}: {
  label: string;
  tiles: readonly number[];
  tone: "emerald" | "rose" | "violet";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "rose"
        ? "text-rose-700 dark:text-rose-300"
        : "text-violet-700 dark:text-violet-300";

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className={`font-semibold ${toneClass}`}>{label}</dt>
      <dd className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
        {formatTileList(tiles)}
      </dd>
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="h-3 w-3"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}
