import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/i18n/useTranslation";

export type WorkspaceView = "normal" | "tournament" | "knockout" | "analysis";

type AppNavigationProps = {
  activeView: WorkspaceView;
  onSelectView: (nextView: WorkspaceView) => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
};

export function AppNavigation({
  activeView,
  onSelectView,
  isDarkTheme,
  onToggleTheme,
}: AppNavigationProps) {
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/85">
      <div className="mx-auto flex w-full max-w-[1920px] flex-nowrap items-center justify-between gap-2 px-2 py-2 sm:gap-3 sm:px-4 md:px-8 lg:px-12 xl:px-14 2xl:px-24">
        <div className="flex min-w-0 max-w-[min(100%,14rem)] shrink items-center gap-1.5 sm:max-w-none sm:gap-2 md:max-w-[min(100%,22rem)] lg:max-w-none">
          <span className="truncate text-xs font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-sm">
            {t("nav.brand")}
          </span>
          <span className="hidden shrink-0 text-slate-400 dark:text-slate-600 md:inline">·</span>
          <span className="hidden min-w-0 truncate text-xs font-medium text-slate-500 dark:text-slate-400 md:inline md:text-sm">
            {t("nav.tagline")}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <div className="min-w-0 max-w-[min(100%,calc(100vw-9.5rem))] flex-1 overflow-x-auto overflow-y-visible overscroll-x-contain sm:max-w-none sm:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="ml-auto grid w-max min-w-0 grid-cols-4 gap-0.5 rounded-full border border-slate-200 bg-slate-100/90 p-0.5 shadow-inner shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/50 sm:gap-1 sm:p-1">
              <button
                type="button"
                onClick={() => onSelectView("normal")}
                className={`min-h-9 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold leading-tight transition sm:min-h-10 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm ${
                  activeView === "normal"
                    ? "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-900/30 sm:shadow-lg"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {t("nav.views.normal")}
              </button>
              <button
                type="button"
                onClick={() => onSelectView("tournament")}
                className={`min-h-9 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold leading-tight transition sm:min-h-10 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm ${
                  activeView === "tournament"
                    ? "bg-violet-500 text-violet-950 shadow-md shadow-violet-900/30 sm:shadow-lg"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {t("nav.views.tournament")}
              </button>
              <button
                type="button"
                onClick={() => onSelectView("knockout")}
                className={`min-h-9 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold leading-tight transition sm:min-h-10 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm ${
                  activeView === "knockout"
                    ? "bg-amber-500 text-amber-950 shadow-md shadow-amber-900/30 sm:shadow-lg"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {t("nav.views.knockout")}
              </button>
              <button
                type="button"
                onClick={() => onSelectView("analysis")}
                className={`min-h-9 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold leading-tight transition sm:min-h-10 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm ${
                  activeView === "analysis"
                    ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-900/30 sm:shadow-lg"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {t("nav.views.analysis")}
              </button>
            </div>
          </div>
          <LanguageSwitcher />
          <ThemeToggle isDark={isDarkTheme} onToggle={onToggleTheme} />
        </div>
      </div>
    </nav>
  );
}
