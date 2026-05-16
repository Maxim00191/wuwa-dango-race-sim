import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  WORKSPACE_NAV_BUTTON_CLASSNAME,
  WORKSPACE_NAV_INACTIVE_CLASSNAME,
  WORKSPACE_NAV_ITEMS,
  type WorkspaceView,
} from "@/config/workspaceViews";
import { useTranslation } from "@/i18n/useTranslation";

export type { WorkspaceView } from "@/config/workspaceViews";

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
          <span className="hidden shrink-0 text-slate-400 dark:text-slate-600 md:inline">
            ·
          </span>
          <span className="hidden min-w-0 truncate text-xs font-medium text-slate-500 dark:text-slate-400 md:inline md:text-sm">
            {t("nav.tagline")}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <div className="min-w-0 max-w-[min(100%,calc(100vw-9.5rem))] flex-1 overflow-x-auto overflow-y-visible overscroll-x-contain sm:max-w-none sm:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="ml-auto grid w-max min-w-0 grid-cols-4 gap-0.5 rounded-full border border-slate-200 bg-slate-100/90 p-0.5 shadow-inner shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/50 sm:gap-1 sm:p-1">
              {WORKSPACE_NAV_ITEMS.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectView(item.id)}
                    className={`${WORKSPACE_NAV_BUTTON_CLASSNAME} ${
                      isActive
                        ? item.activeClassName
                        : WORKSPACE_NAV_INACTIVE_CLASSNAME
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
          <LanguageSwitcher />
          <ThemeToggle isDark={isDarkTheme} onToggle={onToggleTheme} />
        </div>
      </div>
    </nav>
  );
}
