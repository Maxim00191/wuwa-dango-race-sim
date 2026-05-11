import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/i18n/LanguageContext";

export type WorkspaceView = "normal" | "tournament" | "analysis";

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
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t("nav.brand")}
          </span>
          <span className="hidden text-slate-400 dark:text-slate-600 sm:inline">·</span>
          <span className="hidden truncate text-sm font-medium text-slate-500 dark:text-slate-400 sm:inline">
            {t("nav.tagline")}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="flex shrink-0 gap-1 rounded-full border border-slate-200 bg-slate-100/90 p-1 shadow-inner shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/50">
            <button
              type="button"
              onClick={() => onSelectView("normal")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeView === "normal"
                  ? "bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-900/30"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {t("nav.views.normal")}
            </button>
            <button
              type="button"
              onClick={() => onSelectView("tournament")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeView === "tournament"
                  ? "bg-violet-500 text-violet-950 shadow-lg shadow-violet-900/30"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {t("nav.views.tournament")}
            </button>
            <button
              type="button"
              onClick={() => onSelectView("analysis")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeView === "analysis"
                  ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-900/30"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {t("nav.views.analysis")}
            </button>
          </div>
          <LanguageSwitcher />
          <ThemeToggle isDark={isDarkTheme} onToggle={onToggleTheme} />
        </div>
      </div>
    </nav>
  );
}
