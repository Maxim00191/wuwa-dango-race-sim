import { useTranslation } from "@/i18n/useTranslation";
import type { GameState } from "@/types/game";

type GameShellGameDiaryProps = {
  state: GameState;
};

export function GameShellGameDiary({ state }: GameShellGameDiaryProps) {
  const { t, tText } = useTranslation();

  return (
    <section className="flex max-h-[18rem] min-h-[14rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-xl dark:shadow-slate-950/60 sm:rounded-3xl sm:p-6 lg:h-[260px] xl:p-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {t("game.diary.title")}
        </p>
        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-500">
          {state.log.length === 1
            ? t("common.notes.one", { count: state.log.length })
            : t("common.notes.other", { count: state.log.length })}
        </span>
      </div>
      <div className="app-scrollbar flex-1 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {state.log.length === 0 ? (
          <p className="font-normal text-slate-500 dark:text-slate-500">
            {t("game.diary.empty")}
          </p>
        ) : (
          state.log.map((entry, index) => (
            <p
              key={`${entry.kind}-${index}`}
              className="border-b border-slate-200 pb-3 font-normal text-slate-600 last:border-none dark:border-slate-800 dark:text-slate-400"
            >
              {tText(entry.message)}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
